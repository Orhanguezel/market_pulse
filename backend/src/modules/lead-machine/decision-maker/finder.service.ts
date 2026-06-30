import { getGoogleMapsKey } from '@/modules/siteSettings';
import { resolveDecisionMaker, sourceUrlFor } from './osint.service';

// Karar verici unvanları (A = doğrudan, B = yönetici)
const TITLES_A = ['founder', 'co-founder', 'owner', 'ceo', 'general manager', 'managing director', 'genel müdür', 'kurucu', 'sahip'];
const TITLES_B = ['operations', 'purchasing', 'business development', 'franchise', 'manager', 'director', 'satınalma', 'operasyon', 'müdür'];
export const DEFAULT_TITLES = [
  'Founder', 'Co-Founder', 'Owner', 'CEO', 'General Manager', 'Managing Director',
  'Operations Manager', 'Purchasing Manager', 'Business Development Manager', 'Franchise Manager',
];

// Fitness/wellness sektör preset'leri. Apollo'daki deneyim: "wellness",
// "personal training" ve benzeri genis terimler ana fitness aramasini
// medikal/spa/supplement tarafina dagitiyor; bu yuzden alt preset'ler ayri.
export const SECTOR_PRESETS: Record<string, string[]> = {
  fitness: ['fitness center', 'gym', 'spor salonu', 'fitness club', 'pilates studio', 'reformer pilates studio'],
  pilates: ['pilates studio', 'reformer pilates studio', 'reformer', 'pilates'],
  wellness: ['wellness center', 'wellness studio', 'healthy living center'],
  boutique: ['personal training studio', 'boutique fitness', 'yoga studio'],
};

export const DEFAULT_EXCLUDE_KEYWORDS = [
  'supplement',
  'nutrition',
  'medikal',
  'medical',
  'fizyoterapi',
  'physiotherapy',
  'termal',
  'hotel',
  'spa hotel',
  'cosmetics',
  'e-commerce',
  'software',
  'app',
  'university',
  'association',
];

// İhracat/B2B alıcı firma karar verici unvanları (LinkedIn ile B2B müşteri bulma iddiası)
export const EXPORT_B2B_TITLES = [
  'Purchasing Manager', 'Procurement Manager', 'Import Manager', 'Supply Chain Manager',
  'Category Manager', 'Buyer', 'Head of Procurement', 'Foreign Trade Manager',
  'General Manager', 'Business Development Manager', 'Owner', 'Founder',
];

export type SearchHints = {
  google_operators: string[];
  linkedin_people_search_url: string;
  sales_navigator_note: string;
};

/** Yarı-manuel OSINT asistanı: Google operatörleri + LinkedIn arama URL'i (scrape YOK, operatör çalıştırır). */
export function buildSearchHints(company: string, country?: string | null, titles: string[] = EXPORT_B2B_TITLES, city?: string | null): SearchHints {
  const c = country || '';
  const location = city || c;
  const ops = titles.slice(0, 5).map((t) => `site:linkedin.com/in "${t}" "${company}"${location ? ` "${location}"` : ''}`);
  if (c && city) ops.push(`site:linkedin.com/in "${titles[0]}" "${company}" "${city}" "${c}"`);
  return {
    google_operators: ops,
    linkedin_people_search_url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${company} ${titles[0]}`)}`,
    sales_navigator_note: 'Sales Navigator: şirket adı + unvan filtresi ile aday listesi oluşturun, ardından doğrulayın.',
  };
}

export type DecisionMakerReviewStatus = 'pending' | 'verified' | 'rejected' | 'manual_review';

export type DecisionMakerRow = {
  id?: string;
  company_name: string;
  city: string;
  business_type: string;
  decision_maker_name: string | null;
  title: string | null;
  linkedin_profile_url: string | null;
  company_website: string | null;
  social_url: string | null;
  source_url: string | null;
  fit_note: string;
  confidence_score: 'A' | 'B' | 'C';
  review_status?: DecisionMakerReviewStatus;
  last_verified_at: string;
};

export type CompanyQualityStatus = 'qualified' | 'possible' | 'manual_review' | 'excluded';

export type CompanyPoolRow = {
  id?: string;
  company_name: string;
  city: string;
  business_type: string;
  website: string | null;
  phone: string | null;
  google_maps_url: string | null;
  address: string | null;
  quality_score: number;
  quality_status: CompanyQualityStatus;
  exclude_reason: string | null;
  source: 'google_places';
  last_verified_at: string;
};

type Place = { name: string; website: string | null; phone: string | null; mapsUri: string | null; address: string | null };

async function placesSearch(query: string, regionCode: string, limit: number): Promise<Place[]> {
  const apiKey = await getGoogleMapsKey();
  if (!apiKey) return [];
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: query, regionCode, languageCode: 'tr', maxResultCount: Math.min(limit, 20) }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    places?: Array<{ displayName?: { text?: string }; websiteUri?: string; nationalPhoneNumber?: string; googleMapsUri?: string; formattedAddress?: string }>;
  };
  return (data.places ?? [])
    .map((p) => ({
      name: p.displayName?.text ?? '',
      website: p.websiteUri ?? null,
      phone: p.nationalPhoneNumber ?? null,
      mapsUri: p.googleMapsUri ?? null,
      address: p.formattedAddress ?? null,
    }))
    .filter((p) => p.name);
}

function scoreTitle(title: string | null): 'A' | 'B' | null {
  if (!title) return null;
  const t = title.toLowerCase();
  if (TITLES_A.some((k) => t.includes(k))) return 'A';
  if (TITLES_B.some((k) => t.includes(k))) return 'B';
  return 'B';
}

export type FinderParams = {
  sector?: string;
  businessTypes?: string[];
  cities: string[];
  country?: string;
  titles?: string[];
  excludeKeywords?: string[];
  apolloFallback?: boolean;
  perCityLimit?: number;
  targetCount?: number;
};

function isExcludedCompany(place: Place, excludeKeywords: string[]): boolean {
  const haystack = `${place.name} ${place.website ?? ''}`.toLowerCase();
  return excludeKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function firstExcludedKeyword(place: Place, excludeKeywords: string[]): string | null {
  const haystack = `${place.name} ${place.website ?? ''} ${place.address ?? ''}`.toLowerCase();
  return excludeKeywords.find((keyword) => haystack.includes(keyword.toLowerCase())) ?? null;
}

function scoreCompany(place: Place, city: string, type: string, excludeKeywords: string[], now: string): CompanyPoolRow {
  const haystack = `${place.name} ${place.website ?? ''} ${place.address ?? ''}`.toLowerCase();
  const positiveSignals = ['fitness', 'gym', 'spor salonu', 'pilates', 'reformer', 'wellness', 'yoga', 'club'];
  const matchedPositive = positiveSignals.filter((signal) => haystack.includes(signal) || type.toLowerCase().includes(signal));
  const excludedKeyword = firstExcludedKeyword(place, excludeKeywords);
  let score = 35;
  score += Math.min(matchedPositive.length, 3) * 15;
  if (place.website) score += 10;
  if (place.phone) score += 8;
  if (place.mapsUri) score += 7;
  if (place.address) score += 5;
  if (excludedKeyword) score -= 45;
  score = Math.max(0, Math.min(100, score));
  const quality_status: CompanyQualityStatus = excludedKeyword
    ? 'excluded'
    : score >= 70
      ? 'qualified'
      : score >= 50
        ? 'possible'
        : 'manual_review';
  return {
    company_name: place.name,
    city,
    business_type: type,
    website: place.website,
    phone: place.phone,
    google_maps_url: place.mapsUri,
    address: place.address,
    quality_score: score,
    quality_status,
    exclude_reason: excludedKeyword ? `Excluded keyword: ${excludedKeyword}` : null,
    source: 'google_places',
    last_verified_at: now,
  };
}

export async function buildCompanyPool(params: FinderParams): Promise<{ rows: CompanyPoolRow[]; stats: { total: number; qualified: number; possible: number; manualReview: number; excluded: number } }> {
  const country = (params.country || 'TR').toUpperCase();
  const businessTypes = params.businessTypes?.length
    ? params.businessTypes
    : SECTOR_PRESETS[params.sector || 'fitness'] || SECTOR_PRESETS.fitness;
  const excludeKeywords = params.excludeKeywords?.length ? params.excludeKeywords : DEFAULT_EXCLUDE_KEYWORDS;
  const perCityLimit = Math.min(params.perCityLimit ?? 5, 10);
  const targetCount = Math.min(params.targetCount ?? 50, 200);
  const now = new Date().toISOString().slice(0, 10);
  const seen = new Set<string>();
  const rows: CompanyPoolRow[] = [];
  const maxCompanies = Math.min(Math.max(targetCount * 2, targetCount), 400);

  outer:
  for (const city of params.cities) {
    for (const type of businessTypes) {
      const places = await placesSearch(`${type} ${city}`, country, perCityLimit);
      for (const place of places) {
        const compKey = `${place.name}|${city}`.toLowerCase();
        if (seen.has(compKey)) continue;
        seen.add(compKey);
        rows.push(scoreCompany(place, city, type, excludeKeywords, now));
        if (rows.length >= maxCompanies) break outer;
      }
    }
  }

  rows.sort((a, b) => {
    const statusOrder: Record<CompanyQualityStatus, number> = { qualified: 0, possible: 1, manual_review: 2, excluded: 3 };
    return statusOrder[a.quality_status] - statusOrder[b.quality_status] || b.quality_score - a.quality_score;
  });

  return {
    rows,
    stats: {
      total: rows.length,
      qualified: rows.filter((row) => row.quality_status === 'qualified').length,
      possible: rows.filter((row) => row.quality_status === 'possible').length,
      manualReview: rows.filter((row) => row.quality_status === 'manual_review').length,
      excluded: rows.filter((row) => row.quality_status === 'excluded').length,
    },
  };
}

export async function runDecisionMakerFinder(params: FinderParams): Promise<{ rows: DecisionMakerRow[]; companyPool: CompanyPoolRow[]; stats: { companies: number; withDecisionMaker: number } }> {
  const country = (params.country || 'TR').toUpperCase();
  const titles = params.titles?.length ? params.titles : DEFAULT_TITLES;
  const targetCount = Math.min(params.targetCount ?? 50, 200);
  const now = new Date().toISOString().slice(0, 10);

  // 1) İşletme havuzu (Places) — hızlı sıralı topla, dedup + sınırla.
  const companyPoolResult = await buildCompanyPool(params);
  const queue = companyPoolResult.rows
    .filter((row) => row.quality_status === 'qualified' || row.quality_status === 'possible')
    .slice(0, targetCount);

  // 2) Karar verici çözümü — PARALEL (concurrency); website OSINT atlanır (Serper+Apollo hızlı, timeout önleme).
  const rows: DecisionMakerRow[] = [];
  let withDM = 0;
  const CONCURRENCY = 6;
  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    const batch = queue.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(async (q) => {
      const lookup = { company: q.company_name, city: q.city, country, website: q.website, googleMapsUrl: q.google_maps_url, titles };
      const resolved = await resolveDecisionMaker(lookup, { skipWebsite: true, allowApollo: params.apolloFallback === true });
      return { q, resolved, lookup };
    }));
    for (const { q, resolved, lookup } of results) {
      if (resolved.name || resolved.linkedin_url) withDM++;
      rows.push({
        company_name: q.company_name, city: q.city, business_type: q.business_type,
        decision_maker_name: resolved.name, title: resolved.title, linkedin_profile_url: resolved.linkedin_url,
        company_website: q.website,
        social_url: resolved.evidence.social_url ?? resolved.evidence.company_linkedin_url ?? null,
        source_url: sourceUrlFor(lookup, resolved),
        fit_note: resolved.confidence === 'A'
          ? 'LinkedIn/karar verici eşleşmesi güçlü.'
          : resolved.confidence === 'B'
            ? 'Karar verici adayı bulundu.'
            : 'İşletme doğrulandı; karar verici bulunamadı (manuel araştırma önerilir).',
        confidence_score: resolved.confidence,
        last_verified_at: now,
      });
    }
  }

  // A > B > C sırala
  const order = { A: 0, B: 1, C: 2 };
  rows.sort((a, b) => order[a.confidence_score] - order[b.confidence_score]);
  return { rows: rows.slice(0, targetCount), companyPool: companyPoolResult.rows, stats: { companies: queue.length, withDecisionMaker: withDM } };
}
