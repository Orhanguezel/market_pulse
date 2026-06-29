import { scrape, type FairExhibitorData, type FairExhibitorDetailData } from '../_shared/scraper.client';

const MESSE_API_BASE = 'https://api.messefrankfurt.com/service/esb_api';
const MESSE_EVENT_ID = 'AUTOMECHANIKA';
const MESSE_DEFAULT_HALLS = ['3.0', '3.1', '4.0'];
const MESSE_DETAIL_BASE = 'https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.detail.html';

export interface RawExhibitor {
  name:         string;
  website?:     string;
  country?:     string;
  city?:        string;
  address?:     string;
  phone?:       string;
  email?:       string;
  hall?:        string;
  detail_url?:  string;
  booth_number?: string;
  description?: string;
  product_groups?: string[];
  brands?: string[];
  target_markets?: string[];
  trade_audience?: string[];
}

interface MesseHit {
  exhibitor?: {
    id?: string;
    rewriteId?: string;
    name?: string;
    homepage?: string;
    shortDescription?: string | null;
    address?: {
      street?: string | null;
      zip?: string | null;
      city?: string | null;
      tel?: string | null;
      email?: string | null;
      country?: { id?: string; iso3?: string; label?: string } | null;
    } | null;
    exhibition?: {
      id?: string;
      exhibitionHall?: Array<{
        id?: string;
        name?: string;
        stand?: Array<{ name?: string | null }> | null;
      }> | null;
    } | null;
    description?: { text?: string | null } | null;
    keyWords?: string[] | null;
    tag?: string[] | null;
    products?: {
      products?: Array<{ name?: string | null }> | null;
    } | null;
  };
}

interface MesseSearchResponse {
  success?: boolean;
  message?: string | null;
  result?: {
    hits?: MesseHit[];
    metaData?: {
      hitsTotal?: number;
      hitsPerPage?: number;
      currentPage?: number;
    };
  };
}

export function isMesseFrankfurtUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('messefrankfurt.com');
  } catch {
    return false;
  }
}

export function isInformaVisitWidgetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.startsWith('visit.') && parsed.pathname.includes('/widget/event/');
  } catch {
    return false;
  }
}

function cleanHtmlText(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim() || undefined;
}

function cleanRichText(value: string | null | undefined): string | undefined {
  const cleaned = cleanHtmlText(value);
  if (!cleaned) return undefined;
  return cleaned
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || undefined;
}

function normalizeWebsite(value: string | null | undefined): string | undefined {
  const cleaned = cleanHtmlText(value);
  if (!cleaned) return undefined;
  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
}

function firstBooth(halls: NonNullable<NonNullable<MesseHit['exhibitor']>['exhibition']>['exhibitionHall']): string | undefined {
  for (const hall of halls ?? []) {
    const stand = hall.stand?.find(s => cleanHtmlText(s.name));
    if (stand?.name && (hall.name || hall.id)) return `${hall.name ?? hall.id} ${stand.name}`.trim();
  }
  const hall = halls?.[0];
  return hall?.name ?? hall?.id ?? undefined;
}

function hitToRawExhibitor(hit: MesseHit): RawExhibitor | null {
  const exhibitor = hit.exhibitor;
  const rewriteId = cleanHtmlText(exhibitor?.rewriteId);
  const name = cleanHtmlText(exhibitor?.name);
  if (!rewriteId || !name) return null;
  const address = exhibitor?.address;
  const halls = exhibitor?.exhibition?.exhibitionHall ?? [];
  const detailUrl = `${MESSE_DETAIL_BASE}/${rewriteId}.html`;
  const addressText = [
    cleanHtmlText(address?.street),
    cleanHtmlText(address?.zip),
    cleanHtmlText(address?.city),
    cleanHtmlText(address?.country?.label),
  ].filter(Boolean).join(', ') || undefined;
  const longDescription = cleanHtmlText(exhibitor?.description?.text);
  const shortDescription = cleanHtmlText(exhibitor?.shortDescription);
  const keywords = (exhibitor?.keyWords ?? [])
    .map((kw) => cleanHtmlText(kw))
    .filter((kw): kw is string => Boolean(kw));
  const productNames = (exhibitor?.products?.products ?? [])
    .map((p) => cleanHtmlText(p?.name))
    .filter((n): n is string => Boolean(n));
  const tags = (exhibitor?.tag ?? [])
    .map((t) => cleanHtmlText(t))
    .filter((t): t is string => Boolean(t));
  return {
    name,
    website: normalizeWebsite(exhibitor?.homepage),
    country: cleanHtmlText(address?.country?.iso3 ?? address?.country?.id ?? address?.country?.label),
    city: cleanHtmlText(address?.city),
    address: addressText,
    phone: cleanHtmlText(address?.tel),
    email: cleanHtmlText(address?.email),
    hall: halls[0]?.name ?? halls[0]?.id ?? undefined,
    detail_url: detailUrl,
    booth_number: firstBooth(halls),
    description: longDescription || shortDescription,
    product_groups: [...keywords, ...productNames],
    brands: tags,
  };
}

async function fetchMessePage(params: { page: number; pageSize: number; hall?: string }): Promise<MesseSearchResponse> {
  const apiKey = process.env.MESSE_FRANKFURT_API_KEY;
  if (!apiKey) throw new Error('MESSE_FRANKFURT_API_KEY_NOT_CONFIGURED');

  const url = new URL(`${MESSE_API_BASE}/exhibitor-service/api/2.1/public/exhibitor/search`);
  url.searchParams.set('language', 'en-GB');
  url.searchParams.set('q', '');
  url.searchParams.set('orderBy', 'name');
  url.searchParams.set('pageNumber', String(params.page));
  url.searchParams.set('pageSize', String(params.pageSize));
  url.searchParams.set('orSearchFallback', 'false');
  url.searchParams.set('showJumpLabels', 'false');
  url.searchParams.set('findEventVariable', MESSE_EVENT_ID);
  if (params.hall) url.searchParams.set('location', params.hall);
  const res = await fetch(url, {
    headers: { apikey: apiKey },
  });
  if (!res.ok) throw new Error(`MESSE_API_FAILED_${res.status}`);
  return res.json() as Promise<MesseSearchResponse>;
}

async function scrapeMesseFrankfurtExhibitorList(opts?: {
  halls?: string[];
  pageSize?: number;
  maxPages?: number;
  maxExhibitors?: number;
}): Promise<RawExhibitor[]> {
  const halls = opts?.halls?.length ? opts.halls : MESSE_DEFAULT_HALLS;
  const pageSize = opts?.pageSize ?? 100;
  const maxPages = opts?.maxPages ?? 120;
  const seen = new Set<string>();
  const exhibitors: RawExhibitor[] = [];

  for (const hall of halls) {
    let page = 1;
    while (page <= maxPages) {
      const data = await fetchMessePage({ page, pageSize, hall: hall === 'all' ? undefined : hall });
      if (!data.success) throw new Error(`MESSE_API_ERROR: ${data.message ?? 'unknown'}`);
      const hits = data.result?.hits ?? [];
      for (const hit of hits) {
        const exhibitor = hitToRawExhibitor(hit);
        if (!exhibitor?.detail_url || seen.has(exhibitor.detail_url)) continue;
        seen.add(exhibitor.detail_url);
        exhibitors.push(exhibitor);
        if (opts?.maxExhibitors && exhibitors.length >= opts.maxExhibitors) return exhibitors;
      }
      const total = data.result?.metaData?.hitsTotal ?? 0;
      if (hits.length === 0 || page * pageSize >= total) break;
      page += 1;
    }
  }

  return exhibitors;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? cleanHtmlText(value) : undefined;
}

function stringArrayFromUnknown(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === 'string') return [item];
        const record = asRecord(item);
        return [record?.name, record?.label, record?.title]
          .filter((v): v is string => typeof v === 'string');
      })
      .map((item) => cleanRichText(item))
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === 'string') {
    return value.split(/[,;|]/)
      .map((item) => cleanRichText(item))
      .filter((item): item is string => Boolean(item));
  }
  return [];
}

const SWAPCARD_PRODUCT_HINTS: Array<[RegExp, string]> = [
  [/\b(seed|seeds|tohum|tohumculuk|fide)\b/i, 'Seeds'],
  [/\b(greenhouse|sera)\b/i, 'Greenhouse'],
  [/\b(irrigation|sulama)\b/i, 'Irrigation'],
  [/\b(fertilizer|fertiliser|gübre|gubre|nutritional|nutrition)\b/i, 'Plant nutrition'],
  [/\b(crop protection|pest|disease|pesticide|bitki koruma)\b/i, 'Crop protection'],
  [/\b(biological|bio-?stimulant|biyolojik|biostimulant)\b/i, 'Biological products'],
  [/\b(hydroponic|hidroponik)\b/i, 'Hydroponics'],
  [/\b(soil|toprak)\b/i, 'Soil products'],
  [/\b(water|su arıtma|su aritma|reverse osmosis|ters osmoz)\b/i, 'Water technologies'],
  [/\b(agronutrition|agronutritional|agronutrici[oó]n)\b/i, 'Agronutrition'],
];

function inferSwapcardProductGroups(text: string | undefined): string[] {
  if (!text) return [];
  return SWAPCARD_PRODUCT_HINTS
    .filter(([pattern]) => pattern.test(text))
    .map(([, label]) => label);
}

function extractNextDataJson(html: string): unknown | null {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function firstNestedString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
    const nested = asRecord(record[key]);
    if (nested) {
      const nestedValue = firstNestedString(nested, ['name', 'label', 'value', 'text']);
      if (nestedValue) return nestedValue;
    }
  }
  return undefined;
}

function swapcardBooth(exhibitor: Record<string, unknown>): string | undefined {
  for (const [key, value] of Object.entries(exhibitor)) {
    const eventData = asRecord(value);
    if (!eventData) continue;
    const booth = firstNestedString(eventData, ['booth', 'stand', 'standNumber']);
    if (booth && (key.startsWith('withEvent(') || key.toLowerCase().includes('event'))) return booth;
  }
  return firstNestedString(exhibitor, ['booth', 'stand', 'standNumber']);
}

function swapcardWebsite(exhibitor: Record<string, unknown>): string | undefined {
  const direct = firstNestedString(exhibitor, ['websiteUrl', 'website', 'url']);
  if (direct) return normalizeWebsite(direct);
  for (const key of ['links', 'socialLinks', 'contactInfo']) {
    const value = exhibitor[key];
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      const record = asRecord(item);
      const url = firstNestedString(record ?? {}, ['url', 'href', 'website']);
      if (url && /https?:\/\/|www\./i.test(url) && !/facebook|instagram|linkedin|twitter|x\.com/i.test(url)) {
        return normalizeWebsite(url);
      }
    }
  }
  return undefined;
}

function swapcardExhibitorToRaw(exhibitor: Record<string, unknown>, fairUrl: string): RawExhibitor | null {
  const name = firstNestedString(exhibitor, ['name', 'companyName']);
  if (!name) return null;
  const id = asString(exhibitor._id) ?? asString(exhibitor.id);
  const description = cleanRichText(asString(exhibitor.htmlDescription) ?? asString(exhibitor.description));
  const productGroups = [
    ...stringArrayFromUnknown(exhibitor.categories),
    ...stringArrayFromUnknown(exhibitor.productCategories),
    ...stringArrayFromUnknown(exhibitor.products),
    ...stringArrayFromUnknown(exhibitor.tags),
    ...inferSwapcardProductGroups(`${name} ${description ?? ''}`),
  ];

  return {
    name,
    website: swapcardWebsite(exhibitor),
    country: firstNestedString(exhibitor, ['country', 'countryName']),
    city: firstNestedString(exhibitor, ['city']),
    address: firstNestedString(exhibitor, ['address']),
    phone: firstNestedString(exhibitor, ['phone', 'phoneNumber']),
    email: firstNestedString(exhibitor, ['email']),
    detail_url: id ? `${fairUrl.split('#')[0]}#${encodeURIComponent(id)}` : fairUrl,
    booth_number: swapcardBooth(exhibitor),
    description,
    product_groups: [...new Set(productGroups)],
  };
}

function collectSwapcardExhibitors(root: unknown, fairUrl: string): RawExhibitor[] {
  const result: RawExhibitor[] = [];
  const seenObjects = new Set<object>();
  const seenKeys = new Set<string>();

  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (seenObjects.has(value)) return;
    seenObjects.add(value);
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const record = value as Record<string, unknown>;
    if (record.__typename === 'Core_Exhibitor' && typeof record.name === 'string') {
      const exhibitor = swapcardExhibitorToRaw(record, fairUrl);
      const key = exhibitor?.detail_url ?? exhibitor?.name;
      if (exhibitor && key && !seenKeys.has(key)) {
        seenKeys.add(key);
        result.push(exhibitor);
      }
    }
    Object.values(record).forEach(visit);
  };

  visit(root);
  return result;
}

async function scrapeInformaVisitWidget(fairUrl: string, opts?: { maxExhibitors?: number }): Promise<RawExhibitor[]> {
  const res = await fetch(fairUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent': 'MarketPulseLeadMachine/1.0',
    },
  });
  if (!res.ok) throw new Error(`INFORMA_WIDGET_FAILED_${res.status}`);
  const html = await res.text();
  const nextData = extractNextDataJson(html);
  if (!nextData) return [];
  const exhibitors = collectSwapcardExhibitors(nextData, fairUrl);
  return opts?.maxExhibitors ? exhibitors.slice(0, opts.maxExhibitors) : exhibitors;
}

export async function scrapeOfficialExhibitorList(
  fairUrl: string,
  opts?: { halls?: string[]; maxPages?: number; maxExhibitors?: number },
): Promise<RawExhibitor[]> {
  if (isMesseFrankfurtUrl(fairUrl)) {
    return scrapeMesseFrankfurtExhibitorList(opts);
  }
  if (isInformaVisitWidgetUrl(fairUrl)) {
    return scrapeInformaVisitWidget(fairUrl, opts);
  }
  const result = await scrape(fairUrl, {
    profile:     'fair-exhibitor',
    return_html: true,
    return_text: true,
    mode:        'stealthy',
  });
  const data = result.data as unknown as FairExhibitorData;
  return (data.exhibitors ?? []).map(e => ({
    name:         e.name,
    website:      e.website ?? undefined,
    detail_url:   e.detail_url ?? e.source_url ?? undefined,
    country:      undefined,
    booth_number: e.booth_number ?? undefined,
    description:  e.description ?? undefined,
  }));
}

export async function scrapeExhibitorDetail(detailUrl: string): Promise<RawExhibitor> {
  const result = await scrape(detailUrl, {
    profile:     'fair-exhibitor-detail',
    return_html: true,
    return_text: true,
    mode:        'stealthy',
  });
  const data = result.data as unknown as FairExhibitorDetailData;
  return {
    name:           data.name ?? '',
    website:        data.website ?? undefined,
    country:        data.country ?? undefined,
    city:           data.city ?? undefined,
    address:        data.address ?? undefined,
    phone:          data.phone ?? undefined,
    email:          data.email ?? undefined,
    hall:           data.hall ?? undefined,
    booth_number:   data.booth ?? undefined,
    detail_url:     data.final_url ?? detailUrl,
    description:    data.description ?? undefined,
    product_groups: data.product_groups ?? [],
    brands:         data.brands ?? [],
    target_markets: data.target_markets ?? [],
    trade_audience: data.trade_audience ?? [],
  };
}
