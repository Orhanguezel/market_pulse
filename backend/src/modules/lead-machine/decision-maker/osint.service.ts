import { env } from '@/core/env';
import { scrape, type LeadPageData } from '../_shared/scraper.client';
import { searchDecisionMakers, domainFromWebsite, type DecisionMaker } from './apollo-people';

export type DecisionMakerConfidence = 'A' | 'B' | 'C';

export type DecisionMakerEvidence = {
  source: 'linkedin_serp' | 'apollo' | 'website_osint' | 'none';
  source_url: string | null;
  company_linkedin_url?: string | null;
  social_url?: string | null;
  google_operator?: string | null;
  raw_title?: string | null;
};

export type ResolvedDecisionMaker = {
  name: string | null;
  title: string | null;
  linkedin_url: string | null;
  confidence: DecisionMakerConfidence;
  evidence: DecisionMakerEvidence;
};

export type CompanyLookupInput = {
  company: string;
  city?: string | null;
  country?: string | null;
  website?: string | null;
  googleMapsUrl?: string | null;
  titles?: string[];
};

const TITLE_A = [
  'founder', 'co-founder', 'owner', 'ceo', 'chief executive', 'general manager',
  'managing director', 'kurucu', 'sahip', 'genel müdür', 'genel mudur',
];

const TITLE_B = [
  'operations', 'operation', 'purchasing', 'procurement', 'buyer', 'category',
  'business development', 'franchise', 'manager', 'director', 'satınalma',
  'satin alma', 'operasyon', 'müdür', 'mudur', 'yönetici', 'yonetici',
];

const DEFAULT_SERP_TITLES = ['Founder', 'Owner', 'CEO', 'General Manager', 'Kurucu', 'Genel Müdür'];
// Performans: senkron find'da firma başına az sayfa (timeout önleme). Serper asıl yol.
const WEBSITE_PATHS = ['', '/hakkimizda', '/about'];
const LINKEDIN_IN_RE = /https?:\/\/(?:[\w-]+\.)?linkedin\.com\/in\/[^\s"'<>?#)]+/ig;
const LINKEDIN_COMPANY_RE = /https?:\/\/(?:[\w-]+\.)?linkedin\.com\/company\/[^\s"'<>?#)]+/ig;
const URL_RE = /https?:\/\/[^\s"'<>]+/ig;
const NAME_RE = /\b([A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}){1,2})\b/g;

function normalizeSpace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function stripTitlePrefix(name: string, label: string) {
  const escaped = label.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  return normalizeSpace(name.replace(new RegExp(`^${escaped}\\s+`, 'i'), ''));
}

function titleConfidence(title: string | null, source: DecisionMakerEvidence['source']): DecisionMakerConfidence {
  const haystack = (title ?? '').toLowerCase();
  if (TITLE_A.some((item) => haystack.includes(item))) return 'A';
  if (TITLE_B.some((item) => haystack.includes(item))) return source === 'linkedin_serp' ? 'A' : 'B';
  return source === 'linkedin_serp' ? 'A' : source === 'website_osint' ? 'B' : 'C';
}

function linkedinNameFromUrl(url: string): string | null {
  try {
    const slug = new URL(url).pathname.split('/').filter(Boolean)[1] ?? '';
    const cleaned = decodeURIComponent(slug)
      .replace(/[-_]+/g, ' ')
      .replace(/\b\d+\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned || cleaned.length < 5) return null;
    return cleaned.split(' ').slice(0, 3).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  } catch {
    return null;
  }
}

function buildGoogleOperators(input: CompanyLookupInput, titles = input.titles ?? DEFAULT_SERP_TITLES): string[] {
  const city = input.city ? ` "${input.city}"` : '';
  const country = input.country ? ` "${input.country}"` : '';
  return titles.slice(0, 6).map((title) => `site:linkedin.com/in "${title}" "${input.company}"${city || country}`);
}

export function buildLinkedinSearchHints(input: CompanyLookupInput): string[] {
  return buildGoogleOperators(input);
}

function firstMatch(text: string, re: RegExp): string | null {
  const match = text.match(re);
  return match?.[0]?.replace(/[),.;]+$/, '') ?? null;
}

function extractTitleNear(text: string, linkedinUrl: string, titles: string[]): string | null {
  const idx = text.indexOf(linkedinUrl);
  const window = idx >= 0 ? text.slice(Math.max(0, idx - 280), idx + 500) : text.slice(0, 1000);
  const candidates = [...titles, ...DEFAULT_SERP_TITLES, ...TITLE_A, ...TITLE_B]
    .sort((a, b) => b.length - a.length);
  return candidates.find((title) => window.toLowerCase().includes(title.toLowerCase())) ?? null;
}

type SerperOrganic = { title?: string; link?: string; snippet?: string };

/** Serper.dev Google SERP API (doğrudan Google scrape yerine — güvenilir). */
async function serperSearch(query: string, country?: string | null): Promise<SerperOrganic[]> {
  if (!env.SERPER_API_KEY) return [];
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': env.SERPER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: query,
        gl: (country || 'tr').toLowerCase().slice(0, 2),
        hl: 'tr',
        num: 10,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { organic?: SerperOrganic[] };
    return data.organic ?? [];
  } catch {
    return [];
  }
}

/** Organic başlık: "Ad Soyad - Unvan - Şirket | LinkedIn" → {name, title}. */
function parseSerpPerson(title: string): { name: string | null; title: string | null } {
  const cleaned = normalizeSpace(title.replace(/\s*[|·-]\s*LinkedIn.*$/i, '').replace(/\s*\|\s*LinkedIn.*$/i, ''));
  const parts = cleaned.split(/\s+[-–—|]\s+/).map((p) => p.trim()).filter(Boolean);
  const name = parts[0] || null;
  const titlePart = parts[1] || null;
  // İsim makul mü? (2-3 kelime, kurumsal kelime değil)
  if (!name || name.split(/\s+/).length < 2 || /fitness|pilates|studio|gym|center|wellness|spa|linkedin/i.test(name)) {
    return { name: null, title: titlePart };
  }
  return { name, title: titlePart };
}

/** Firma adı sonuçla eşleşiyor mu (yanlış kişi engeli) — anlamlı tokenlardan biri geçmeli. */
function companyMatches(company: string, hay: string): boolean {
  const tokens = company.toLowerCase().split(/[^a-zçğıöşü0-9]+/i)
    .filter((t) => t.length >= 4 && !/fitness|pilates|studio|gym|center|wellness|spa|club|sport|spor|reformer|personal|training/.test(t));
  if (!tokens.length) return true; // ayırt edici token yoksa eşleşme zorlama
  const h = hay.toLowerCase();
  return tokens.some((t) => h.includes(t));
}

function isDecisionTitle(title: string | null): boolean {
  const t = (title ?? '').toLowerCase();
  return [...TITLE_A, ...TITLE_B].some((k) => t.includes(k));
}

async function resolveLinkedinFromGoogle(input: CompanyLookupInput): Promise<ResolvedDecisionMaker | null> {
  if (!env.SERPER_API_KEY) return null;
  const cityToken = input.city ? ` "${input.city}"` : '';
  const titleList = (input.titles ?? DEFAULT_SERP_TITLES).slice(0, 3);
  // Önce unvan-özel (hassas), sonra firma-adı (geniş — sadece karar-verici unvanlıysa kabul).
  const ops: Array<{ q: string; broad: boolean }> = [
    ...titleList.map((t) => ({ q: `site:linkedin.com/in "${t}" "${input.company}"${cityToken}`, broad: false })),
    { q: `site:linkedin.com/in "${input.company}"${cityToken}`, broad: true },
  ];
  for (const op of ops) {
    const organics = await serperSearch(op.q, input.country);
    for (const item of organics) {
      const link = item.link ?? '';
      if (!/linkedin\.com\/in\//i.test(link)) continue;
      const hay = `${item.title ?? ''} ${item.snippet ?? ''}`;
      if (!companyMatches(input.company, hay)) continue;
      const parsed = parseSerpPerson(item.title ?? '');
      const title = parsed.title ?? extractTitleNear(hay, link, titleList);
      // Geniş operatörde: yalnız gerçek karar verici unvanı kabul (junior çalışan eleme).
      if (op.broad && !isDecisionTitle(title)) continue;
      const name = parsed.name ?? linkedinNameFromUrl(link);
      if (!name) continue;
      return {
        name,
        title,
        linkedin_url: link.replace(/[),.;]+$/, ''),
        confidence: titleConfidence(title, 'linkedin_serp'),
        evidence: {
          source: 'linkedin_serp',
          source_url: link,
          google_operator: op.q,
          company_linkedin_url: firstMatch(organics.map((o) => o.link ?? '').join('\n'), LINKEDIN_COMPANY_RE),
          raw_title: item.title ?? null,
        },
      };
    }
  }
  return null;
}

function socialFromLeadPage(data: Partial<LeadPageData>): string | null {
  const socials = Array.isArray(data.social_profiles) ? data.social_profiles : [];
  return socials.find((item) => /linkedin/i.test(item.platform))?.url
    ?? socials.find((item) => /instagram|facebook|youtube/i.test(item.platform))?.url
    ?? null;
}

function extractWebsitePerson(text: string, sourceUrl: string): ResolvedDecisionMaker | null {
  const labels = [...TITLE_A, ...TITLE_B].sort((a, b) => b.length - a.length);
  const lower = text.toLowerCase();
  for (const label of labels) {
    const index = lower.indexOf(label.toLowerCase());
    if (index < 0) continue;
    const window = text.slice(Math.max(0, index - 160), index + 220);
    const names = [...window.matchAll(NAME_RE)]
      .map((match) => stripTitlePrefix(normalizeSpace(match[1] ?? ''), label))
      // Kalite kapısı: unvan ön-eki sıyrıldıktan sonra tek kelime kalan isimler (ör. "Mehmet") kabul edilmez.
      .filter((name) => name.split(/\s+/).filter(Boolean).length >= 2)
      .filter((name) => !/fitness|pilates|studio|center|salon|club|training|hakkımızda|iletisim|iletişim/i.test(name));
    if (!names.length) continue;
    return {
      name: names[0],
      title: label,
      linkedin_url: null,
      confidence: titleConfidence(label, 'website_osint'),
      evidence: { source: 'website_osint', source_url: sourceUrl, raw_title: label },
    };
  }
  return null;
}

async function resolveFromWebsite(input: CompanyLookupInput): Promise<ResolvedDecisionMaker | null> {
  if (!input.website) return null;
  const base = input.website.replace(/\/+$/, '');
  let socialUrl: string | null = null;
  for (const path of WEBSITE_PATHS) {
    const url = path ? `${base}${path}` : base;
    try {
      const res = await scrape(url, { mode: 'fast', profile: 'lead-page', return_text: true });
      const data = (res.data ?? {}) as Partial<LeadPageData>;
      socialUrl ||= socialFromLeadPage(data);
      const text = typeof data.text_content === 'string' ? data.text_content : res.text ?? '';
      const found = extractWebsitePerson(text, res.final_url ?? url);
      if (found) {
        found.evidence.social_url = socialUrl;
        return found;
      }
    } catch {
      // best-effort fallback
    }
  }
  return socialUrl
    ? { name: null, title: null, linkedin_url: null, confidence: 'C', evidence: { source: 'none', source_url: input.googleMapsUrl ?? input.website ?? null, social_url: socialUrl } }
    : null;
}

async function resolveFromApollo(input: CompanyLookupInput): Promise<ResolvedDecisionMaker | null> {
  if (!env.APOLLO_DECISION_MAKER_ENABLED) return null;
  const domain = domainFromWebsite(input.website);
  if (!domain) return null;
  const rows: DecisionMaker[] = await searchDecisionMakers(domain, input.titles ?? DEFAULT_SERP_TITLES, 3);
  // Apollo TR KOBİ'de zayıf + LinkedIn'siz tek-isim çöp üretiyor → SADECE LinkedIn'li + 2+ kelime isim kabul.
  const best = rows.find((row) => row.linkedin_url && row.name && row.name.trim().split(/\s+/).length >= 2);
  if (!best) return null;
  return {
    name: best.name,
    title: best.title,
    linkedin_url: best.linkedin_url,
    confidence: titleConfidence(best.title, 'apollo'),
    evidence: { source: 'apollo', source_url: best.linkedin_url, raw_title: best.title },
  };
}

export async function resolveDecisionMaker(
  input: CompanyLookupInput,
  opts?: { skipWebsite?: boolean; allowApollo?: boolean },
): Promise<ResolvedDecisionMaker> {
  const linkedin = await resolveLinkedinFromGoogle(input);
  if (linkedin?.linkedin_url) return linkedin;

  // Website OSINT yavaş (scraper). Senkron find'da atlanır; batch enrich'te çalışır.
  const website = opts?.skipWebsite ? null : await resolveFromWebsite(input);
  if (website?.name) return website;

  const apollo = opts?.allowApollo ? await resolveFromApollo(input) : null;
  if (apollo?.name) return apollo;

  if (website) return website;
  return {
    name: null,
    title: null,
    linkedin_url: null,
    confidence: 'C',
    evidence: { source: 'none', source_url: input.googleMapsUrl ?? input.website ?? null },
  };
}

export function sourceUrlFor(input: CompanyLookupInput, resolved: ResolvedDecisionMaker) {
  return [
    resolved.linkedin_url,
    input.googleMapsUrl,
    resolved.evidence.company_linkedin_url,
    resolved.evidence.source_url,
  ].filter(Boolean).join(' | ') || null;
}
