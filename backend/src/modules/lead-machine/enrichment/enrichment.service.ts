import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { env } from '@/core/env';
import { getCandidate } from '../_shared/db';
import { scrape, type LeadPageData } from '../_shared/scraper.client';

function domainFromUrl(url: string | null) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] ?? '';
  }
}

// Candidate sub-pages we try in addition to the homepage. Order matters: pages
// listed earlier are preferred when picking a decision-maker name.
const CONTACT_PATHS = [
  '/impressum', '/imprint', '/legal-notice', '/mentions-legales',
  '/contact', '/kontakt', '/contact-us', '/contacto',
  '/about', '/about-us', '/uber-uns', '/ueber-uns', '/qui-sommes-nous',
  '/team', '/management', '/leadership', '/company',
];

// Labels that typically appear before a decision-maker name on contact /
// impressum / about pages, in multiple languages.
const DECISION_MAKER_LABELS = [
  // German Impressum
  'Geschäftsführer', 'Geschaeftsfuehrer', 'Geschäftsführerin', 'Geschäftsführung',
  'Inhaber', 'Inhaberin', 'Vorstand', 'Vertretungsberechtigter',
  // English
  'CEO', 'Owner', 'Managing Director', 'Founder', 'President',
  'Co-Founder', 'Director', 'General Manager', 'Head of', 'Purchasing Manager',
  'Procurement Manager', 'Category Manager',
  // French
  'Gérant', 'Directeur général', 'PDG', 'Président',
  // Spanish / Italian
  'Director', 'Gerente', 'Amministratore', 'Titolare',
  // Polish
  'Prezes', 'Właściciel', 'Dyrektor',
  // Turkish
  'Genel Müdür', 'Sahibi', 'Kurucu', 'Yönetim Kurulu Başkanı',
];

const NAME_REGEX_FRAGMENT = "([A-ZÄÖÜÇĞİÖŞÜÁÉÍÓÚÑŁŚŻŹŃĆĄĘ][\\p{L}\\-']{1,30}(?:\\s+[A-ZÄÖÜÇĞİÖŞÜÁÉÍÓÚÑŁŚŻŹŃĆĄĘ][\\p{L}\\-']{1,30}){1,3})";

function buildLabelRegex(): RegExp {
  const labels = DECISION_MAKER_LABELS
    .map((l) => l.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&'))
    .join('|');
  // <Label> : <Name>   OR   <Name> , <Label>
  return new RegExp(
    `(?:(?:${labels})[\\s:\\-–—]+${NAME_REGEX_FRAGMENT})|(?:${NAME_REGEX_FRAGMENT}\\s*[,\\(\\-]\\s*(?:${labels}))`,
    'gu',
  );
}

interface DecisionMakerCandidate {
  name: string;
  title: string | null;
  source_url: string;
}

function extractDecisionMakersFromText(text: string, sourceUrl: string): DecisionMakerCandidate[] {
  if (!text) return [];
  const results: DecisionMakerCandidate[] = [];
  const regex = buildLabelRegex();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    // The regex has two alternatives, so the name lives in group 1 or 2.
    const fullMatch = match[0];
    const name = (match[1] || match[2] || '').trim();
    if (!name) continue;
    if (name.split(/\s+/).length < 2) continue;
    // Best-effort title extraction: look at the matched chunk for any label
    const titleHit = DECISION_MAKER_LABELS.find((l) => fullMatch.toLowerCase().includes(l.toLowerCase()));
    results.push({ name, title: titleHit ?? null, source_url: sourceUrl });
    if (results.length >= 6) break;
  }
  return results;
}

function rankEmail(email: string): number {
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  if (/^[a-z]+\.[a-z]+$/.test(local)) return 5;         // firstname.lastname
  if (/^[a-z]\.[a-z]+$/.test(local)) return 4;          // f.lastname
  if (/^[a-z]+_[a-z]+$/.test(local)) return 4;          // firstname_lastname
  if (['purchasing', 'einkauf', 'procurement'].some((g) => local.includes(g))) return 3;
  if (['info', 'sales', 'office', 'contact', 'kontakt'].some((g) => local.includes(g))) return 1;
  if (/^[a-z]+$/.test(local) && local.length > 2) return 2; // single firstname
  return 0;
}

function pickBestEmail(emails: string[]): string | null {
  if (!emails.length) return null;
  const sorted = [...new Set(emails.map((e) => e.toLowerCase()))]
    .filter((e) => /@/.test(e) && !/no-?reply|do-?not-?reply|abuse@|postmaster@|webmaster@/i.test(e))
    .sort((a, b) => rankEmail(b) - rankEmail(a));
  return sorted[0] ?? null;
}

interface DeepScrapeResult {
  emails: string[];
  phones: string[];
  decisionMakers: DecisionMakerCandidate[];
  pages_visited: string[];
  pages_failed: string[];
}

async function deepScrapeContactInfo(websiteUrl: string): Promise<DeepScrapeResult> {
  const out: DeepScrapeResult = { emails: [], phones: [], decisionMakers: [], pages_visited: [], pages_failed: [] };
  const baseUrl = websiteUrl.replace(/\/+$/, '');
  const seen = new Set<string>();

  const urls = [baseUrl, ...CONTACT_PATHS.map((p) => baseUrl + p)];

  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      const res = await scrape(url, { profile: 'lead-page', return_text: true });
      if (!res.success || !res.data) {
        out.pages_failed.push(url);
        continue;
      }
      const data = res.data as unknown as LeadPageData;
      out.pages_visited.push(res.final_url || url);
      if (data.contact_emails?.length) out.emails.push(...data.contact_emails);
      if (data.contact_phones?.length) out.phones.push(...data.contact_phones);
      if (data.text_content) {
        const found = extractDecisionMakersFromText(data.text_content, res.final_url || url);
        out.decisionMakers.push(...found);
      }
    } catch {
      out.pages_failed.push(url);
    }
    if (out.decisionMakers.length >= 3 && out.emails.length >= 2) break;
  }

  out.emails = [...new Set(out.emails.map((e) => e.toLowerCase()))];
  out.phones = [...new Set(out.phones)];
  return out;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function firstString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const found = value.find((item) => typeof item === 'string' && item.trim());
    return typeof found === 'string' ? found.trim() : null;
  }
  return null;
}

function normalizeApolloDecisionMaker(payload: unknown) {
  const data = asRecord(payload);
  const person = asRecord(data.person ?? data.contact ?? data);
  const phoneNumbers = Array.isArray(person.phone_numbers) ? person.phone_numbers : [];
  const phoneRow = asRecord(phoneNumbers[0]);
  const firstName = firstString(person.first_name);
  const lastName = firstString(person.last_name);
  const joinedName = [firstName, lastName].filter(Boolean).join(' ');
  const fullName = firstString(person.name) ?? (joinedName || null);
  return {
    name: fullName,
    title: firstString(person.title ?? person.headline),
    email: firstString(person.email ?? person.email_address),
    linkedin_url: firstString(person.linkedin_url),
    phone: firstString(person.phone ?? person.sanitized_phone ?? phoneRow.sanitized_number ?? phoneRow.raw_number),
    raw: payload,
  };
}

export async function enrichCandidate(candidateId: string) {
  const candidate = await getCandidate(candidateId);
  if (!candidate) throw new Error('CANDIDATE_NOT_FOUND');
  const domain = domainFromUrl(candidate.website);
  let decisionMaker: unknown = null;
  let sourceVendor = 'scraped';

  if (env.APOLLO_API_KEY && domain) {
    const res = await fetch('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.APOLLO_API_KEY },
      body: JSON.stringify({ domain, title: 'Owner CEO Purchasing Manager Category Manager Import Manager' }),
    });
    if (res.ok) {
      decisionMaker = normalizeApolloDecisionMaker(await res.json() as unknown);
      sourceVendor = 'apollo';
    }
  }

  if (!decisionMaker && candidate.website) {
    try {
      const deep = await deepScrapeContactInfo(candidate.website);
      const bestEmail = pickBestEmail(deep.emails);
      const topPerson = deep.decisionMakers[0] ?? null;
      decisionMaker = {
        name: topPerson?.name ?? null,
        title: topPerson?.title ?? null,
        email: bestEmail,
        phone: deep.phones[0] ?? null,
        linkedin_url: null,
        evidence: {
          pages_visited: deep.pages_visited,
          pages_failed: deep.pages_failed,
          email_candidates: deep.emails.slice(0, 8),
          name_candidates: deep.decisionMakers.slice(0, 4),
        },
      };
      sourceVendor = topPerson ? 'scraped-deep' : 'scraped';
    } catch {
      decisionMaker = null;
    }
  }

  const id = randomUUID();
  await pool.execute(
    `INSERT INTO lead_enrichment (id, candidate_id, decision_maker, source_vendor)
     VALUES (?, ?, ?, ?)`,
    [id, candidateId, JSON.stringify(decisionMaker), sourceVendor],
  );
  return { id, candidateId, decisionMaker, sourceVendor };
}

export async function listCandidateEnrichment(candidateId: string) {
  const [rows] = await pool.execute(
    'SELECT * FROM lead_enrichment WHERE candidate_id = ? ORDER BY enriched_at DESC LIMIT 10',
    [candidateId],
  );
  return (rows as Array<Record<string, unknown>>).map((row) => {
    const decisionMaker = row.decision_maker;
    const painPoints = row.pain_points;
    const growthSignals = row.growth_signals;
    return {
      ...row,
      decision_maker: typeof decisionMaker === 'string' ? JSON.parse(decisionMaker) : decisionMaker,
      pain_points: typeof painPoints === 'string' ? JSON.parse(painPoints) : painPoints,
      growth_signals: typeof growthSignals === 'string' ? JSON.parse(growthSignals) : growthSignals,
    };
  });
}
