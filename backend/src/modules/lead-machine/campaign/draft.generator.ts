// =============================================================
// FILE: backend/src/modules/lead-machine/campaign/draft.generator.ts
// Port of scripts/generate-outreach-drafts.py — bulk creates outreach
// drafts for APPROVE_FAVORITE + APPROVE_DIRECT candidates of a campaign.
// Multi-tenant: every text element comes from outreach_campaigns row.
// =============================================================
import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { getCampaign, type OutreachCampaign } from './campaign.repository';

const AUTO_APPROVE_ACTIONS = ['APPROVE_FAVORITE', 'APPROVE_DIRECT'] as const;
type SupportedLang = 'EN' | 'DE' | 'TR';

function asCountryLangMap(value: unknown): Record<string, string> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, string>;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
    } catch { /* ignore */ }
  }
  return {};
}

function pickLanguage(campaign: OutreachCampaign, country: string | null): SupportedLang {
  const map = asCountryLangMap(campaign.country_to_lang);
  const code = (country ?? '').toUpperCase();
  const fromMap = map[code];
  const candidate = (fromMap || campaign.default_lang || 'EN').toUpperCase();
  return (['EN', 'DE', 'TR'] as const).includes(candidate as SupportedLang)
    ? (candidate as SupportedLang)
    : 'EN';
}

function guessFirstName(email: string | null): string | null {
  if (!email) return null;
  const local = (email.split('@')[0] || '').toLowerCase();
  const m = local.match(/^([a-z]+)\.[a-z]+$/);
  if (!m) return null;
  const word = m[1];
  return word.charAt(0).toUpperCase() + word.slice(1);
}

const PERSONALIZATION_FALLBACK: Record<SupportedLang, Record<string, string>> = {
  EN: {
    DE: "We've seen your aftermarket programme covering the German market and noticed a clear product-range overlap with our line.",
    PL: "We've noted your aftermarket activity in the Polish market and see a clear category overlap with our line.",
    NL: "Your Netherlands-based aftermarket operation aligns with our distribution focus across the Benelux.",
    FR: "Your aftermarket coverage in the French market overlaps clearly with our product line.",
    DEFAULT: "We've reviewed your aftermarket coverage and see a clear product-range overlap with our line.",
  },
  DE: {
    DE: 'Wir haben Ihr Aftermarket-Programm für den deutschen Markt gesehen und sehen klare Überschneidungen zu unserer Linie.',
    AT: 'Ihr Aftermarket-Engagement im österreichischen Markt zeigt klare Berührungspunkte zu unserer Linie.',
    DEFAULT: 'Wir haben Ihr Aftermarket-Programm gesehen und sehen klare Berührungspunkte zu unserer Linie.',
  },
  TR: {
    DEFAULT: 'Aftermarket programınızı inceledik; ürün serimizle net bir örtüşme görüyoruz.',
  },
};

function personalization(lang: SupportedLang, country: string): string {
  const langMap = PERSONALIZATION_FALLBACK[lang] ?? PERSONALIZATION_FALLBACK.EN;
  return langMap[country.toUpperCase()] || langMap.DEFAULT || PERSONALIZATION_FALLBACK.EN.DEFAULT;
}

function getSubject(campaign: OutreachCampaign, lang: SupportedLang): string {
  const fair = [campaign.fair_name, campaign.fair_edition].filter(Boolean).join(' ');
  if (lang === 'DE') return `${fair} - 10 Min Termin? - ${campaign.brand_name}`;
  if (lang === 'TR') return `${fair} - 10 dk randevu? - ${campaign.brand_name}`;
  return `${fair} - 10 min meeting? - ${campaign.brand_name}`;
}

function getSignature(campaign: OutreachCampaign): string {
  const sender = campaign.sender_label || campaign.brand_name;
  const contact = [
    campaign.sender_website,
    campaign.sender_email,
    campaign.sender_phone,
  ].filter((s): s is string => Boolean(s && String(s).trim()));
  return `${sender}\n${contact.join('  |  ')}`;
}

function buildBody(
  campaign: OutreachCampaign,
  lang: SupportedLang,
  country: string,
  firstName: string | null,
): string {
  const salutation = lang === 'DE'
    ? (firstName ? `Sehr geehrte/r ${firstName},` : 'Sehr geehrte Damen und Herren,')
    : lang === 'TR'
      ? (firstName ? `Merhabalar ${firstName},` : 'Merhabalar,')
      : (firstName ? `Dear ${firstName},` : 'Dear Sirs,');

  const product = (lang === 'DE' && campaign.product_de) || (lang === 'TR' && campaign.product_tr) || campaign.product_en || '';
  const fair = campaign.fair_name || '';
  const fairFull = campaign.fair_edition ? `${fair} ${campaign.fair_edition}`.trim() : fair;
  const dates = (lang === 'DE' && campaign.fair_dates_de) || (lang === 'TR' && campaign.fair_dates_tr) || campaign.fair_dates_en || '';
  const hall = campaign.fair_hall || '';
  const booth = campaign.fair_booth || '';
  const location = hall && booth ? `Hall ${hall}, Booth ${booth}` : (booth || hall || 'our booth');
  const calendly = campaign.calendly_link || campaign.calendly_placeholder || '[Calendly link]';
  const brand = campaign.brand_name || 'Our team';
  const intro = personalization(lang, country);
  const signature = getSignature(campaign);

  if (lang === 'DE') {
    return [
      salutation,
      '',
      intro,
      '',
      `Wir sind ${brand}, ein ${product}. Vom ${dates} stehen wir auf der ${fairFull} - ${location}.`,
      '',
      'Hätten Sie 10 Minuten für einen Termin vor Ort?',
      '',
      `Kalender: ${calendly}`,
      '',
      'Mit freundlichen Grüßen,',
      signature,
    ].join('\n');
  }
  if (lang === 'TR') {
    return [
      salutation,
      '',
      intro,
      '',
      `Biz ${brand} olarak ${product}. ${dates} arası ${fairFull}'tayız — ${location}.`,
      '',
      '10 dakikalık bir görüşme için müsait olur musunuz?',
      '',
      `Takvim: ${calendly}`,
      '',
      'Saygılarımla,',
      signature,
    ].join('\n');
  }
  return [
    salutation,
    '',
    intro,
    '',
    `We're ${brand}, a ${product}. We'll be at ${fairFull} ${dates}, ${location}.`,
    '',
    'Would you have 10 minutes for an on-site meeting?',
    '',
    `Calendar: ${calendly}`,
    '',
    'Best regards,',
    signature,
  ].join('\n');
}

export interface GenerateDraftsResult {
  campaign_id: string;
  campaign_slug: string;
  approved_count: number;
  draft_count: number;
  skipped_existing: number;
  candidates_without_email: number;
}

export async function generateDraftsForCampaign(campaignId: string): Promise<GenerateDraftsResult> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error('CAMPAIGN_NOT_FOUND');

  const placeholders = AUTO_APPROVE_ACTIONS.map(() => '?').join(',');
  const params: unknown[] = [...AUTO_APPROVE_ACTIONS];

  let icpFilter = '';
  if (campaign.icp_id) {
    icpFilter = 'AND icp_id = ?';
    params.unshift(campaign.icp_id);
  }

  const sql = `
    SELECT id, name, email, country
      FROM lead_candidates
     WHERE channel = 'trade_fair'
       AND status IN ('pending','approved','favorite')
       AND email IS NOT NULL AND email <> ''
       ${icpFilter}
       AND JSON_UNQUOTE(JSON_EXTRACT(raw_data, '$.recommendation.action')) IN (${placeholders})
  `;
  const [rows] = await pool.execute(sql, params as never[]);
  const candidates = rows as Array<{ id: string; name: string; email: string | null; country: string | null }>;

  let approved = 0;
  let drafted = 0;
  let skipped = 0;
  let noEmail = 0;

  for (const c of candidates) {
    if (!c.email) {
      noEmail += 1;
      continue;
    }

    const [existing] = await pool.execute(
      'SELECT id FROM lead_outreach_drafts WHERE candidate_id = ? AND campaign_id = ? LIMIT 1',
      [c.id, campaign.id],
    );
    if ((existing as unknown[]).length > 0) {
      skipped += 1;
      continue;
    }

    await pool.execute(
      'UPDATE lead_candidates SET status = ?, reviewed_at = NOW() WHERE id = ?',
      ['approved', c.id],
    );
    approved += 1;

    const lang = pickLanguage(campaign, c.country);
    const firstName = guessFirstName(c.email);
    const subject = getSubject(campaign, lang).slice(0, 300);
    const body = buildBody(campaign, lang, c.country || '', firstName);

    await pool.execute(
      'INSERT INTO lead_outreach_drafts (id, candidate_id, campaign_id, subject, body, ai_model, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [randomUUID(), c.id, campaign.id, subject, body, 'template-v1', 'draft'],
    );
    drafted += 1;
  }

  return {
    campaign_id: campaign.id,
    campaign_slug: campaign.slug,
    approved_count: approved,
    draft_count: drafted,
    skipped_existing: skipped,
    candidates_without_email: noEmail,
  };
}
