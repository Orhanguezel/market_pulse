import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/core/env';

// ─── Scraper-Service Response Types ──────────────────────────────────────────

export interface ScrapeResponse {
  success:     boolean;
  url:         string;
  profile:     string | null;
  final_url:   string | null;
  status_code: number | null;
  cache_hit:   boolean;
  duration_ms: number;
  data:        Record<string, unknown>;
  html:        string | null;
  text:        string | null;
  error:       string | null;
}

/** Google Maps place (from /api/v1/places/google-maps) */
export interface Place {
  name:            string | null;
  address:         string | null;
  website:         string | null;
  phone:           string | null;
  place_type:      string | null;
  opens_at:        string | null;
  introduction:    string | null;
  reviews_count:   number | null;
  reviews_average: number | null;
  place_url:       string | null;
  coordinates:     { lat: number; lng: number } | null;
}

export interface GoogleMapsResponse {
  success:     boolean;
  query:       string;
  total_found: number;
  duration_ms: number;
  cache_hit:   boolean;
  places:      Place[];
  error:       string | null;
}

export interface JobCreateResponse {
  job_id:   string;
  status:   'queued' | 'running' | 'done' | 'failed';
  poll_url: string;
}

export interface JobStatusResponse {
  job_id:     string;
  status:     'queued' | 'running' | 'done' | 'failed';
  type:       string;
  created_at: string | null;
  updated_at: string | null;
  result:     unknown;
  error:      string | null;
}

// ─── Profile-specific data shapes ────────────────────────────────────────────

export interface LeadPageData {
  profile:         'lead-page';
  url:             string;
  final_url:       string;
  title:           string | null;
  description:     string | null;
  text_content:    string;
  has_b2b_signals:  boolean;
  has_china_signals: boolean;
  has_private_label: boolean;
  contact_emails:  string[];
  contact_phones:  string[];
  social_profiles: { platform: string; url: string }[];
  firm_type_hints: string[];
  product_keywords: string[];
}

export interface CompetitorPageData {
  profile:       'competitor-page';
  url:           string;
  final_url:     string;
  title:         string | null;
  description:   string | null;
  prices:        { text: string; context: string; currency_hint: string }[];
  products:      { name: string; price: string | null; url: string | null }[];
  campaigns:     string[];
  content_hash:  string;
  changed_fields: string[];
}

export interface DirectoryListingData {
  profile:    'directory-listing';
  url:        string;
  final_url:  string;
  count:      number;
  companies:  {
    name:        string;
    website:     string | null;
    description: string | null;
    email:       string | null;
    phone:       string | null;
    source_url:  string;
  }[];
}

export interface FairExhibitorData {
  profile:     'fair-exhibitor';
  url:         string;
  final_url:   string;
  count:       number;
  exhibitors:  {
    name:         string;
    website:      string | null;
    description:  string | null;
    email:        string | null;
    phone:        string | null;
    source_url:   string;
    detail_url?:  string | null;
    booth_number: string | null;
  }[];
}

export interface FairExhibitorDetailData {
  profile:          'fair-exhibitor-detail';
  url:              string;
  final_url:        string;
  name:             string | null;
  hall:             string | null;
  booth:            string | null;
  country:          string | null;
  city:             string | null;
  address:          string | null;
  website:          string | null;
  phone:            string | null;
  email:            string | null;
  product_groups:   string[];
  brands:           string[];
  target_markets:   string[];
  description:      string | null;
  trade_audience:   string[];
}

// ─── Profile union ────────────────────────────────────────────────────────────

export type ScrapeProfile =
  | 'geo-page'
  | 'geo-robots'
  | 'lead-page'
  | 'website-analysis'
  | 'directory-listing'
  | 'fair-exhibitor'
  | 'fair-exhibitor-detail'
  | 'competitor-page'
  | 'marketplace-store';

export type ScrapeMode = 'fast' | 'stealthy' | 'dynamic';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function baseUrl(): string {
  return env.SCRAPER_SERVICE_URL.replace(/\/$/, '');
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (env.SCRAPER_SERVICE_API_KEY) h['authorization'] = `Bearer ${env.SCRAPER_SERVICE_API_KEY}`;
  return h;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SCRAPER_SERVICE_ERROR_${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`SCRAPER_SERVICE_ERROR_${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Sync URL scraping. mode: 'fast' → curl-cffi, 'stealthy' → Playwright stealth */
export function scrape(
  url: string,
  opts?: {
    mode?:        ScrapeMode;
    profile?:     ScrapeProfile;
    selectors?:   Record<string, string>;
    return_html?: boolean;
    return_text?: boolean;
    options?:     Record<string, unknown>;
  },
): Promise<ScrapeResponse> {
  return post<ScrapeResponse>('/api/v1/scrape', {
    url,
    mode:        opts?.mode      ?? 'fast',
    profile:     opts?.profile   ?? null,
    selectors:   opts?.selectors ?? {},
    return_html: opts?.return_html ?? false,
    return_text: opts?.return_text ?? true,
    options:     opts?.options   ?? {},
  });
}

/** Google Maps search — sync, max 10 results. For >10 use searchGoogleMapsAsync. */
export function searchGoogleMaps(
  query: string,
  opts?: { total?: number; language?: string; region?: string },
): Promise<GoogleMapsResponse> {
  return post<GoogleMapsResponse>('/api/v1/places/google-maps', {
    query,
    total:    Math.min(opts?.total ?? 5, 10),
    language: opts?.language ?? 'en',
    region:   opts?.region   ?? null,
  });
}

/** Start an async job on scraper-service (arq queue). */
export function startJob(
  type: 'scrape' | 'places-google-maps' | 'spider',
  payload: unknown,
  callbackUrl?: string,
  callbackSecret?: string,
): Promise<JobCreateResponse> {
  return post<JobCreateResponse>('/api/v1/jobs', {
    type,
    payload,
    callback_url:    callbackUrl    ?? null,
    callback_secret: callbackSecret ?? null,
  });
}

/** Poll job status. */
export function getJob(jobId: string): Promise<JobStatusResponse> {
  return get<JobStatusResponse>(`/api/v1/jobs/${encodeURIComponent(jobId)}`);
}

/** Async Google Maps for >10 results. */
export function searchGoogleMapsAsync(
  query: string,
  total: number,
  callbackUrl: string,
  callbackSecret: string,
  opts?: { language?: string; region?: string },
): Promise<JobCreateResponse> {
  return startJob(
    'places-google-maps',
    { query, total, language: opts?.language ?? 'en', region: opts?.region ?? null },
    callbackUrl,
    callbackSecret,
  );
}

/**
 * Spider job — start_url'den iç linkleri takip ederek profile ile tarar.
 * max_pages: ≤50, follow_patterns: regex listesi (boşsa tüm iç linkler)
 */
export function startSpiderJob(
  startUrl: string,
  opts: {
    max_pages?:      number;
    profile?:        ScrapeProfile;
    follow_patterns?: string[];
    callbackUrl?:    string;
    callbackSecret?: string;
  } = {},
): Promise<JobCreateResponse> {
  return startJob(
    'spider',
    {
      start_url:       startUrl,
      max_pages:       opts.max_pages       ?? 20,
      profile:         opts.profile         ?? 'lead-page',
      follow_patterns: opts.follow_patterns ?? [],
    },
    opts.callbackUrl,
    opts.callbackSecret,
  );
}

/**
 * Webhook imza doğrulama.
 * Header: X-Scraper-Signature: sha256=<hex>
 * secret: job başlatırken gönderilen callback_secret
 */
export function verifyScraperWebhook(
  rawBodyBuffer: Buffer,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!secret) return true;
  if (!signature) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(rawBodyBuffer).digest('hex')}`;
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** @deprecated verifyScraperWebhook kullan */
export const verifyWebhookSignature = (rawBody: string, sig?: string, secret?: string) =>
  verifyScraperWebhook(Buffer.from(rawBody), sig, secret ?? env.SCRAPER_CALLBACK_SECRET);
