import { scrape, type FairExhibitorData, type FairExhibitorDetailData } from '../_shared/scraper.client';

const MESSE_API_BASE = 'https://api.messefrankfurt.com/service/esb_api';
const MESSE_PUBLIC_API_KEY = 'LXnMWcYQhipLAS7rImEzmZ3CkrU033FMha9cwVSngG4vbufTsAOCQQ==';
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

function isMesseFrankfurtUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('messefrankfurt.com');
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
    description: cleanHtmlText(exhibitor?.shortDescription),
  };
}

async function fetchMessePage(params: { page: number; pageSize: number; hall?: string }): Promise<MesseSearchResponse> {
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
    headers: { apikey: process.env.MESSE_FRANKFURT_API_KEY || MESSE_PUBLIC_API_KEY },
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

export async function scrapeOfficialExhibitorList(
  fairUrl: string,
  opts?: { halls?: string[]; maxPages?: number; maxExhibitors?: number },
): Promise<RawExhibitor[]> {
  if (isMesseFrankfurtUrl(fairUrl)) {
    return scrapeMesseFrankfurtExhibitorList(opts);
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
