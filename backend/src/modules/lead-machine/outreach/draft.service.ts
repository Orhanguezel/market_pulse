import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import { askBestAvailable } from '../_shared/ai.client';
import { getCandidate } from '../_shared/db';
import { listCandidateEnrichment } from '../enrichment/enrichment.service';

type OutreachLanguage = 'EN' | 'DE' | 'TR';

const SUBJECTS: Record<OutreachLanguage, string> = {
  EN: 'Automechanika Frankfurt - 10 min meeting? - Avrasya / ProMats',
  DE: 'Automechanika Frankfurt - 10 Min Termin? - Avrasya / ProMats',
  TR: 'Automechanika Frankfurt - 10 dk randevu? - Avrasya / ProMats',
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function pickLanguage(country: string | null): OutreachLanguage {
  const c = String(country ?? '').toUpperCase();
  if (['DE', 'DEU', 'AT', 'AUT', 'CH', 'CHE'].includes(c)) return 'DE';
  if (['TR', 'TUR'].includes(c)) return 'TR';
  return 'EN';
}

function targetCountry(country: string | null, language: OutreachLanguage): string {
  const c = String(country ?? '').toUpperCase();
  if (language === 'DE') return c === 'AT' || c === 'AUT' ? 'Österreich' : c === 'CH' || c === 'CHE' ? 'Schweiz' : 'Deutschland';
  if (language === 'TR') return c === 'PL' || c === 'POL' ? 'Polonya' : c === 'DE' || c === 'DEU' ? 'Almanya' : country ?? 'hedef';
  if (c === 'DE' || c === 'DEU') return 'Germany';
  if (c === 'PL' || c === 'POL') return 'Poland';
  return country ?? 'your market';
}

function fallbackParagraph(language: OutreachLanguage, country: string) {
  if (language === 'DE') {
    return `Wir haben Ihr Aftermarket-Programm für den ${country}-Markt gesehen und sehen klare Überschneidungen zu unserer Floor-Mat-Linie.`;
  }
  if (language === 'TR') {
    return `${country} pazarındaki aftermarket programınızı inceledik; paspas serimizle net bir örtüşme görüyoruz.`;
  }
  return `We've seen your aftermarket programme covering the ${country} market and noticed a clear product-range overlap with our floor mat line.`;
}

function composeBody(language: OutreachLanguage, recipient: string | null, paragraph: string, calendlyLink: string, senderName: string) {
  if (language === 'DE') {
    return `Sehr geehrte ${recipient || 'Damen und Herren'},

${paragraph}

Wir sind Avrasya / ProMats, ein türkischer Hersteller von Auto-Fußmatten mit Lieferungen in über 30 Märkte. Vom 8. bis 12. September stehen wir auf der Automechanika Frankfurt - Halle 3.1, Stand D11.

Hätten Sie 10 Minuten für einen Termin vor Ort?

Kalender: ${calendlyLink}

Mit freundlichen Grüßen,
${senderName}
Avrasya / ProMats | www.promats.com.tr`;
  }
  if (language === 'TR') {
    return `Merhabalar,

${paragraph}

Biz Avrasya / ProMats olarak Türkiye'de oto paspası üretiyoruz, 30+ ülkeye sevkiyat yapıyoruz. 8-12 Eylül arası Automechanika Frankfurt'tayız - Hall 3.1, Stand D11.

10 dakikalık bir görüşme için müsait olur musunuz?

Takvim: ${calendlyLink}

Saygılarımla,
${senderName}
Avrasya / ProMats | www.promats.com.tr`;
  }
  return `Dear ${recipient || 'Sirs'},

${paragraph}

We're Avrasya / ProMats, a Turkish floor mat manufacturer exporting to 30+ markets. We'll be at Automechanika Frankfurt September 8-12, Hall 3.1, Booth D11.

Would you have 10 minutes for an on-site meeting?

Calendar: ${calendlyLink}

Best regards,
${senderName}
Avrasya / ProMats | www.promats.com.tr`;
}

export async function generateOutreachEmail(candidateId: string, opts?: {
  calendlyLink?: string;
  senderName?: string;
}) {
  const candidate = await getCandidate(candidateId);
  if (!candidate) throw new Error('CANDIDATE_NOT_FOUND');

  const raw = asRecord(candidate.raw_data);
  const exhibitor = asRecord(raw.exhibitor);
  const fairInfo = asRecord(raw.fair_info);
  const analysis = asRecord(raw.analysis);
  const match = asRecord(raw.match);
  const enrichmentRows = await listCandidateEnrichment(candidateId);
  const latestEnrichment = asRecord(enrichmentRows[0]);
  const decisionMaker = asRecord(latestEnrichment.decision_maker);

  const language = pickLanguage(candidate.country);
  const country = targetCountry(candidate.country, language);
  const productGroups = asStringArray(exhibitor.product_groups);
  const brands = asStringArray(exhibitor.brands);
  const salesChannels = asStringArray(match.sales_channels ?? analysis.sales_channels);
  const firmTypeHints = asStringArray(analysis.firm_type_hints);
  const productKeywords = asStringArray(analysis.product_keywords);
  const segment = salesChannels.some((s) => /amazon|ebay|kaufland|e-?com|marketplace/i.test(s))
    ? 'ecom_seller'
    : 'distributor';

  const prompt = `You are writing a single-sentence opening for a cold outreach email from Avrasya / ProMats, a Turkish floor mat manufacturer, to a European company attending or relevant to Automechanika Frankfurt 2026.

Output ONE sentence (15-25 words max) that references a specific fact from the prospect data when available. Never invent facts. Match the email language exactly: EN, DE, or TR. Tone: respectful, factual, not salesy. Output only the sentence.

Language: ${language}
Segment: ${segment}
Target country: ${country}

Prospect company:
  Name: ${candidate.name}
  Website: ${candidate.website ?? ''}
  Country: ${candidate.country ?? ''}
  Fair booth: ${String(fairInfo.booth_number ?? '')}
  Product groups: ${productGroups.join(', ')}
  Brands carried: ${brands.join(', ')}
  Sales channels detected: ${salesChannels.join(', ')}

Website analysis:
  - Has B2B signals: ${String(analysis.has_b2b_signals ?? '')}
  - Has China import signals: ${String(analysis.has_china_signals ?? '')}
  - Has private label hints: ${String(analysis.has_private_label ?? '')}
  - Firm type hints: ${firmTypeHints.join(', ')}
  - Product keywords: ${productKeywords.slice(0, 20).join(', ')}

AI summary:
  ${candidate.ai_summary ?? exhibitor.description ?? ''}`;

  const paragraphRaw = (await askBestAvailable(prompt, 'gpt-4o-mini')).trim();
  const paragraph = paragraphRaw
    .replace(/^["']|["']$/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 500)
    || fallbackParagraph(language, country);

  const recipient = typeof decisionMaker.name === 'string' && decisionMaker.name.trim() ? decisionMaker.name.trim() : null;
  const subject = SUBJECTS[language];
  const body = composeBody(
    language,
    recipient,
    paragraph,
    opts?.calendlyLink || '{calendly_link}',
    opts?.senderName || '{gonderici_ad_soyad}',
  );

  const tenantKey = await getActiveTenantKey();
  const id = randomUUID();
  await pool.execute(
    'INSERT INTO lead_outreach_drafts (id, tenant_key, candidate_id, subject, body, ai_model) VALUES (?, ?, ?, ?, ?, ?)',
    [id, tenantKey, candidateId, subject.slice(0, 300), body, 'gpt-4o-mini'],
  );
  return { id, candidateId, subject, body };
}
