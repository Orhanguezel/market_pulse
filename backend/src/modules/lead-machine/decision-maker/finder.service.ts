import { getGoogleMapsKey } from '@/modules/siteSettings';
import { searchDecisionMakers, domainFromWebsite, type DecisionMaker } from './apollo-people';

// Karar verici unvanları (A = doğrudan, B = yönetici)
const TITLES_A = ['founder', 'co-founder', 'owner', 'ceo', 'general manager', 'managing director', 'genel müdür', 'kurucu', 'sahip'];
const TITLES_B = ['operations', 'purchasing', 'business development', 'franchise', 'manager', 'director', 'satınalma', 'operasyon', 'müdür'];
export const DEFAULT_TITLES = [
  'Founder', 'Co-Founder', 'Owner', 'CEO', 'General Manager', 'Managing Director',
  'Operations Manager', 'Purchasing Manager', 'Business Development Manager', 'Franchise Manager',
];

// Fitness/wellness sektör preset'i
export const SECTOR_PRESETS: Record<string, string[]> = {
  fitness: ['fitness center', 'gym', 'wellness center', 'pilates studio', 'reformer pilates studio', 'personal training studio'],
};

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
export function buildSearchHints(company: string, country?: string | null, titles: string[] = EXPORT_B2B_TITLES): SearchHints {
  const c = country || '';
  const ops = titles.slice(0, 5).map((t) => `site:linkedin.com/in "${t}" "${company}"`);
  if (c) ops.push(`site:linkedin.com/in "${titles[0]}" "${company}" "${c}"`);
  return {
    google_operators: ops,
    linkedin_people_search_url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${company} ${titles[0]}`)}`,
    sales_navigator_note: 'Sales Navigator: şirket adı + unvan filtresi ile aday listesi oluşturun, ardından doğrulayın.',
  };
}

export type DecisionMakerRow = {
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
  last_verified_at: string;
};

type Place = { name: string; website: string | null; phone: string | null; mapsUri: string | null };

async function placesSearch(query: string, regionCode: string, limit: number): Promise<Place[]> {
  const apiKey = await getGoogleMapsKey();
  if (!apiKey) return [];
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri',
    },
    body: JSON.stringify({ textQuery: query, regionCode, languageCode: 'tr', maxResultCount: Math.min(limit, 20) }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    places?: Array<{ displayName?: { text?: string }; websiteUri?: string; nationalPhoneNumber?: string; googleMapsUri?: string }>;
  };
  return (data.places ?? [])
    .map((p) => ({ name: p.displayName?.text ?? '', website: p.websiteUri ?? null, phone: p.nationalPhoneNumber ?? null, mapsUri: p.googleMapsUri ?? null }))
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
  perCityLimit?: number;
  targetCount?: number;
};

export async function runDecisionMakerFinder(params: FinderParams): Promise<{ rows: DecisionMakerRow[]; stats: { companies: number; withDecisionMaker: number } }> {
  const country = (params.country || 'TR').toUpperCase();
  const businessTypes = params.businessTypes?.length
    ? params.businessTypes
    : SECTOR_PRESETS[params.sector || 'fitness'] || SECTOR_PRESETS.fitness;
  const titles = params.titles?.length ? params.titles : DEFAULT_TITLES;
  const perCityLimit = Math.min(params.perCityLimit ?? 5, 10);
  const targetCount = Math.min(params.targetCount ?? 50, 200);
  const now = new Date().toISOString().slice(0, 10);

  const rows: DecisionMakerRow[] = [];
  const seen = new Set<string>();
  let companies = 0;
  let withDM = 0;

  outer:
  for (const city of params.cities) {
    for (const type of businessTypes) {
      const places = await placesSearch(`${type} ${city}`, country, perCityLimit);
      for (const place of places) {
        const compKey = `${place.name}|${city}`.toLowerCase();
        if (seen.has(compKey)) continue;
        seen.add(compKey);
        companies++;

        const domain = domainFromWebsite(place.website);
        let dms: DecisionMaker[] = [];
        if (domain) dms = await searchDecisionMakers(domain, titles, 3);

        if (dms.length === 0) {
          // İşletme doğrulandı ama kişi yok → C
          rows.push({
            company_name: place.name, city, business_type: type,
            decision_maker_name: null, title: null, linkedin_profile_url: null,
            company_website: place.website, social_url: null, source_url: place.mapsUri,
            fit_note: 'İşletme doğrulandı; karar verici bulunamadı (manuel araştırma önerilir).',
            confidence_score: 'C', last_verified_at: now,
          });
        } else {
          for (const dm of dms) {
            const conf = scoreTitle(dm.title) ?? 'B';
            withDM++;
            rows.push({
              company_name: place.name, city, business_type: type,
              decision_maker_name: dm.name, title: dm.title, linkedin_profile_url: dm.linkedin_url,
              company_website: place.website, social_url: null, source_url: place.mapsUri,
              fit_note: conf === 'A' ? 'Doğrudan karar verici.' : 'Muhtemel yönetici/karar verici.',
              confidence_score: conf, last_verified_at: now,
            });
          }
        }
        if (rows.length >= targetCount) break outer;
      }
    }
  }

  // A > B > C sırala
  const order = { A: 0, B: 1, C: 2 };
  rows.sort((a, b) => order[a.confidence_score] - order[b.confidence_score]);
  return { rows: rows.slice(0, targetCount), stats: { companies, withDecisionMaker: withDM } };
}
