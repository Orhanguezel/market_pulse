import type { Metadata } from 'next';

import { safeText } from '@/integrations/shared';

// =============================================================
// FILE: src/seo/seo.types.ts
// FINAL — SiteSettings tabanlı SEO + Analytics tipleri
// - seo_local_business desteği var
// - NEW: SeoPage.ogType (website|article) optional
// =============================================================

export type SeoDefaults = {
  canonicalBase: string; // https://example.com
  siteName: string; // "GZL Temizlik"
  ogLocale?: string; // "tr_TR"
  author?: string;
  themeColor?: string; // "#0f172a"
  twitterCard?: 'summary' | 'summary_large_image';
  robots?: string;
  googlebot?: string;

  // RootLayout html lang
  htmlLang?: string; // "tr"
};

export type SeoAppIcons = {
  appleTouchIcon?: string;
  favicon32?: string;
  favicon16?: string;
};

export type SeoPage = {
  title?: string;
  description?: string;
  keywords?: string;

  ogImage?: string; // "/og/home.jpg" veya absolute
  ogType?: 'website' | 'article'; // ✅ optional override

  noindex?: boolean;
  canonicalPath?: string; // "/contact-us" gibi override

  titleTemplate?: string; // "{{title}} | SiteName"
  descriptionTemplate?: string;
  keywordsTemplate?: string;
};

export type AnalyticsConfig = {
  gaId?: string;
  gtmId?: string;
  metaPixelId?: string;
};

export type LocalBusinessJsonLd = Record<string, unknown>;

export type SeoAll = {
  defaults: SeoDefaults;
  icons?: SeoAppIcons;
  sameAs?: string[];
  pages?: Record<string, SeoPage>;
  localBusiness?: LocalBusinessJsonLd;
};

// ---------------------------
// Strings / parsing
// ---------------------------

export function asText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') {
    const s = v.trim();
    return s ? s : null;
  }
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return null;
}

export function requireText(v: unknown, keyName: string): string {
  const t = asText(v);
  if (!t) throw new Error(`[SEO] Missing or empty required setting: ${keyName}`);
  return t;
}

export function normalizeSlug(raw: unknown): string {
  return Array.isArray(raw) ? safeText(raw[0]) : safeText(raw);
}

export function tryParse(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (!s) return v;

  if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
    try {
      return JSON.parse(s);
    } catch {
      return v;
    }
  }

  if (s === 'true') return true;
  if (s === 'false') return false;

  if (!Number.isNaN(Number(s)) && s !== '') return Number(s);
  return v;
}

export function safeObj<T extends object>(v: unknown): T | null {
  const x = tryParse(v);
  if (x && typeof x === 'object' && !Array.isArray(x)) return x as T;
  return null;
}

// ---------------------------
// SEO content helpers
// ---------------------------

export type SeoContentInput = {
  title?: unknown;
  meta_title?: unknown;
  meta_description?: unknown;
  description?: unknown;
  keywords?: unknown;

  og_image?: unknown;
  image_effective_url?: unknown;
  image_url?: unknown;

  canonical_path?: unknown;
  noindex?: unknown;
  og_type?: unknown;
};

export type SeoImagePick = {
  image_effective_url: string | null;
  image_url: string | null;
  og_image: string | null;
};

export function pickSeoImages(j: Record<string, unknown>): SeoImagePick {
  const image_effective_url =
    asText(j.image_effective_url) ||
    asText(j.featured_image_effective_url) ||
    asText(j.og_image) ||
    asText(j.featured_image) ||
    null;

  const image_url = asText(j.image_url) || asText(j.featured_image) || null;

  const og_image = asText(j.og_image) || image_effective_url || image_url || null;

  return { image_effective_url, image_url, og_image };
}

function toBoolLoose(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (!s) return undefined;
    if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
  }
  return undefined;
}

export function buildSeoPageFromMeta(input: SeoContentInput): SeoPage | null {
  const title = asText(input.meta_title) || asText(input.title) || undefined;
  const description = asText(input.meta_description) || asText(input.description) || undefined;
  const keywords = asText(input.keywords) || undefined;

  const ogImage =
    asText(input.og_image) ||
    asText(input.image_effective_url) ||
    asText(input.image_url) ||
    undefined;

  const canonicalPath = asText(input.canonical_path) || undefined;
  const noindex = toBoolLoose(input.noindex);
  const ogTypeRaw = asText(input.og_type);
  const ogType = ogTypeRaw === 'article' || ogTypeRaw === 'website' ? ogTypeRaw : undefined;

  if (
    !title &&
    !description &&
    !keywords &&
    !ogImage &&
    !canonicalPath &&
    typeof noindex === 'undefined' &&
    !ogType
  ) {
    return null;
  }

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(keywords ? { keywords } : {}),
    ...(ogImage ? { ogImage } : {}),
    ...(canonicalPath ? { canonicalPath } : {}),
    ...(typeof noindex === 'boolean' ? { noindex } : {}),
    ...(ogType ? { ogType } : {}),
  };
}

export function mergeSeoPage(base?: SeoPage | null, override?: SeoPage | null): SeoPage | null {
  if (!base && !override) return null;
  const a = base || {};
  const b = override || {};

  return {
    ...(a.title ? { title: a.title } : {}),
    ...(a.description ? { description: a.description } : {}),
    ...(a.keywords ? { keywords: a.keywords } : {}),
    ...(a.ogImage ? { ogImage: a.ogImage } : {}),
    ...(a.ogType ? { ogType: a.ogType } : {}),
    ...(a.canonicalPath ? { canonicalPath: a.canonicalPath } : {}),
    ...(typeof a.noindex === 'boolean' ? { noindex: a.noindex } : {}),
    ...(a.titleTemplate ? { titleTemplate: a.titleTemplate } : {}),
    ...(a.descriptionTemplate ? { descriptionTemplate: a.descriptionTemplate } : {}),
    ...(a.keywordsTemplate ? { keywordsTemplate: a.keywordsTemplate } : {}),

    ...(b.title ? { title: b.title } : {}),
    ...(b.description ? { description: b.description } : {}),
    ...(b.keywords ? { keywords: b.keywords } : {}),
    ...(b.ogImage ? { ogImage: b.ogImage } : {}),
    ...(b.ogType ? { ogType: b.ogType } : {}),
    ...(b.canonicalPath ? { canonicalPath: b.canonicalPath } : {}),
    ...(typeof b.noindex === 'boolean' ? { noindex: b.noindex } : {}),
    ...(b.titleTemplate ? { titleTemplate: b.titleTemplate } : {}),
    ...(b.descriptionTemplate ? { descriptionTemplate: b.descriptionTemplate } : {}),
    ...(b.keywordsTemplate ? { keywordsTemplate: b.keywordsTemplate } : {}),
  };
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

// ---------------------------
// URL helpers
// ---------------------------

export function trimSlash(x: string) {
  return String(x || '').replace(/\/+$/, '');
}

export function ensureLeadingSlash(x: string) {
  const s = String(x || '');
  return s.startsWith('/') ? s : `/${s}`;
}

export function joinUrl(base: string, path: string): string {
  const b = trimSlash(base);
  const p = ensureLeadingSlash(path);
  return `${b}${p}`;
}

export function isAbsUrl(x: string): boolean {
  return /^https?:\/\//i.test(String(x || '').trim());
}

export function toAbsUrl(canonicalBase: string, maybeRel?: string | null): string | undefined {
  const s = String(maybeRel ?? '').trim();
  if (!s) return undefined;
  return isAbsUrl(s) ? s : joinUrl(canonicalBase, s);
}

export function joinApi(baseUrl: string, path: string): string {
  return joinUrl(trimSlash(baseUrl), ensureLeadingSlash(path));
}

// ---------------------------
// Client/server site base helpers (optional usage)
// ---------------------------

const stripTrailingSlash = (u: string) =>
  String(u || '')
    .trim()
    .replace(/\/+$/, '');

const normalizeLocalhostOrigin = (origin: string): string => {
  const o = stripTrailingSlash(origin);
  if (/^https?:\/\/localhost:\d+$/i.test(o)) return o.replace(/:\d+$/i, '');
  return o;
};

export function siteUrlBase(): string {
  const envUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || '');
  if (envUrl) return normalizeLocalhostOrigin(envUrl);

  if (typeof window !== 'undefined') {
    return normalizeLocalhostOrigin(stripTrailingSlash(window.location.origin));
  }

  return 'http://localhost';
}

export function absoluteUrl(pathOrUrl: string): string {
  const base = siteUrlBase();
  const v = String(pathOrUrl || '').trim();
  if (!v) return base;
  if (/^https?:\/\//i.test(v)) return v;
  return joinUrl(base, v);
}

// ---------------------------
// JSON helpers
// ---------------------------

export function compact<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;

    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      continue;
    }

    out[key] = value;
  }

  return out as T;
}

export function stripContext<T extends Record<string, unknown>>(x: T): T {
  const copy = { ...x } as any;
  delete copy['@context'];
  return copy as T;
}

// ---------------------------
// Fetch helpers
// ---------------------------

export async function fetchJsonNoStore(url: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) return null;

  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function apiBaseStrict(): string {
  const base = trimSlash(
    (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE ||
      process.env.API_BASE_URL ||
      '/api'
    ).toString(),
  );

  if (!base) throw new Error('[SEO] Missing API base env (NEXT_PUBLIC_API_URL / API_BASE_URL)');
  return base;
}

function extractRows(payload: unknown): Array<Record<string, any>> {
  if (Array.isArray(payload)) return payload as any;
  if (isRecord(payload) && Array.isArray((payload as any).data)) return (payload as any).data;
  return [];
}

function rowKey(r: any): string {
  const k = r?.key ?? r?.setting_key ?? r?.name;
  return typeof k === 'string' ? k : '';
}

function rowValue(r: any): unknown {
  if (isRecord(r) && 'value' in r) return (r as any).value;
  return r;
}

// ---------------------------
// Locale resolution
// - IMPORTANT: do NOT force "de" except absolute last resort
// ---------------------------

type LocaleResolveInput = {
  routeLocale?: string | null;
  allowed?: string[];
};

function normLocale(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : '';
}

function envDefaultLocale(): string {
  return (
    normLocale(process.env.NEXT_PUBLIC_DEFAULT_LOCALE) ||
    normLocale(process.env.DEFAULT_LOCALE) ||
    ''
  );
}

async function resolveRequestLocale(input?: LocaleResolveInput): Promise<string> {
  const allowed = (input?.allowed?.length ? input.allowed : ['tr', 'en', 'de']).map((x) =>
    normLocale(x),
  );
  const ALLOWED = new Set(allowed);

  const fromRoute = normLocale(input?.routeLocale);
  if (fromRoute && ALLOWED.has(fromRoute)) return fromRoute;

  // client: can't read next/headers
  if (typeof window !== 'undefined') {
    const env = envDefaultLocale();
    if (env && ALLOWED.has(env)) return env;
    // absolute last resort
    return allowed[0] || 'de';
  }

  const { cookies, headers } = await import('next/headers');

  const c = await cookies();
  const fromCookie =
    normLocale(c.get('NEXT_LOCALE')?.value) ||
    normLocale(c.get('locale')?.value) ||
    normLocale(c.get('i18n_locale')?.value);

  if (fromCookie && ALLOWED.has(fromCookie)) return fromCookie;

  const h = await headers();
  const al = String(h.get('accept-language') || '');
  const first = (al.split(',')[0] || '').trim();
  const code = normLocale(first.split(';')[0]?.split('-')[0]);
  if (code && ALLOWED.has(code)) return code;

  const env = envDefaultLocale();
  if (env && ALLOWED.has(env)) return env;

  // absolute last resort
  return allowed[0] || 'de';
}

// ---------------------------
// DB compatibility layer (ALIASES + VIRTUAL KEYS)
// ---------------------------

// Callers expect these keys (from your frontend SEO code):
// analytics_ga_id, analytics_gtm_id, analytics_meta_pixel_id
// seo_defaults, seo_app_icons, seo_social_same_as, seo_amp_google_client_id_api
const KEY_ALIASES: Record<string, string> = {
  analytics_ga_id: 'ga4_measurement_id',
  analytics_gtm_id: 'gtm_container_id',
  analytics_meta_pixel_id: 'meta_pixel_id', // if you don't have it, it stays optional
  seo_amp_google_client_id_api: 'google_client_id',
  // NOTE: seo_defaults and seo_app_icons are VIRTUAL (built below)
  // NOTE: seo_social_same_as is VIRTUAL (built below)
};

// Some keys are global-only in your DB (locale='*')
// We fetch ONLY these with '*' (per-key), NOT "seo merge".
const GLOBAL_ONLY_KEYS = new Set<string>([
  'public_base_url',
  'ga4_measurement_id',
  'gtm_container_id',
  'meta_pixel_id',
  'google_client_id',
  'site_favicon',
  'site_apple_touch_icon',
  'site_app_icon_512',
  'site_og_default_image',
]);

// Prefer locale value, but allow fallback to '*' if only global exists
const LOCAL_OR_GLOBAL_KEYS = new Set<string>([
  'seo_defaults',
  'seo_app_icons',
  'seo_social_same_as',
]);

// Treat these as optional so missing keys don't crash your pages.
function isOptionalKey(k: string): boolean {
  if (k.startsWith('seo_pages_')) return true;
  if (k.startsWith('analytics_')) return true;
  if (k === 'seo_local_business') return true;
  if (k === 'seo_social_same_as') return true;
  if (k === 'seo_amp_google_client_id_api') return true;
  return false;
}

async function fetchSiteSettingsLocaleRaw(
  keys: string[],
  locale: string,
): Promise<Record<string, unknown>> {
  if (!keys.length) return {};

  const url =
    `${apiBaseStrict()}/site_settings` +
    `?keys=${encodeURIComponent(keys.join(','))}` +
    `&limit=${keys.length}` +
    `&locale=${encodeURIComponent(locale)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`[SEO] site_settings fetch failed (${res.status}) locale='${locale}': ${url}`);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(`[SEO] site_settings invalid JSON response (locale='${locale}')`);
  }

  const rows = extractRows(json);

  const map: Record<string, unknown> = {};
  for (const r of rows) {
    const k = rowKey(r);
    if (!k) continue;
    map[k] = rowValue(r);
  }
  return map;
}

function pickMediaUrl(v: unknown): string | null {
  // supports JSON {url:...} or plain string
  const o = safeObj<{ url?: unknown }>(v);
  if (o) {
    const u = asText(o.url);
    return u ? u : null;
  }
  const s = asText(v);
  return s ? s : null;
}

function buildSeoAppIconsFromSiteMedia(globalMap: Record<string, unknown>): SeoAppIcons | null {
  const apple = pickMediaUrl(globalMap['site_apple_touch_icon']);
  const fav = pickMediaUrl(globalMap['site_favicon']);

  // minimal required set for your seo.server.ts checks
  const icons: SeoAppIcons = {
    ...(apple ? { appleTouchIcon: apple } : {}),
    ...(fav ? { favicon32: fav, favicon16: fav } : {}),
  };

  const hasAny = Boolean(icons.appleTouchIcon || icons.favicon32 || icons.favicon16);
  return hasAny ? icons : null;
}

function buildSeoDefaults(
  globalMap: Record<string, unknown>,
  localMap: Record<string, unknown>,
): Record<string, unknown> | null {
  const canonicalBase = asText(globalMap['public_base_url']);
  const siteName = asText(localMap['site_title']) || asText(localMap['company_brand']); // company_brand is JSON; asText may null

  // if company_brand is JSON, try shortName/name
  const brandObj = safeObj<any>(localMap['company_brand']);
  const brandName =
    siteName ||
    asText(brandObj?.shortName) ||
    asText(brandObj?.name) ||
    asText(localMap['site_title']);

  if (!canonicalBase || !brandName) return null;

  // optionally enrich from site_meta_default / seo / site_seo if present
  const metaObj = safeObj<any>(localMap['site_meta_default']);
  const seoObj = safeObj<any>(localMap['seo']) || safeObj<any>(localMap['site_seo']);

  return compact({
    canonicalBase: trimSlash(canonicalBase),
    siteName: brandName,
    // optional
    titleTemplate: asText(seoObj?.title_template) || asText(seoObj?.titleTemplate) || undefined,
    defaultDescription: asText(seoObj?.description) || asText(metaObj?.description) || undefined,
    defaultTitle: asText(seoObj?.title_default) || asText(metaObj?.title) || undefined,
    robots: seoObj?.robots ?? undefined,
  });
}

function buildSameAsFromSocials(localMap: Record<string, unknown>): string[] | null {
  const socials = safeObj<any>(localMap['socials']);
  if (!socials) return null;

  const vals: string[] = [];
  for (const v of Object.values(socials)) {
    const s = asText(v);
    if (s && /^https?:\/\//i.test(s)) vals.push(s);
  }
  return vals.length ? vals : null;
}

// ---------------------------
// PUBLIC API: fetchSiteSettingsStrict (DB compatible)
// ---------------------------

/**
 * fetchSiteSettingsStrict:
 * - resolves locale (route/cookie/header/env)
 * - fetches requested keys from that locale
 * - for GLOBAL_ONLY_KEYS fetches from locale='*' (per-key) because DB stores them only globally
 * - applies aliases (analytics_ga_id -> ga4_measurement_id etc.)
 * - builds virtual keys: seo_defaults, seo_app_icons, seo_social_same_as
 * - strict only for NON-optional keys
 */
export async function fetchSiteSettingsStrict(
  keys: string[],
  opts?: { routeLocale?: string | null; allowedLocales?: string[] },
): Promise<Record<string, unknown>> {
  if (!keys.length) return {};

  const locale = await resolveRequestLocale({
    routeLocale: opts?.routeLocale ?? null,
    allowed: opts?.allowedLocales ?? ['tr', 'en', 'de'],
  });

  // 1) Split keys into: virtual, normal (with alias), and figure global/local fetch lists
  const requested = Array.from(new Set(keys));

  const wantsSeoDefaults = requested.includes('seo_defaults');
  const wantsSeoAppIcons = requested.includes('seo_app_icons');
  const wantsSameAs = requested.includes('seo_social_same_as');

  // Keys we will actually fetch from DB
  const actualLocal: string[] = [];
  const actualGlobal: string[] = [];

  const pushActual = (actualKey: string, requestedKey?: string) => {
    const prefersBoth = LOCAL_OR_GLOBAL_KEYS.has(requestedKey || actualKey);
    if (prefersBoth) {
      actualLocal.push(actualKey);
      actualGlobal.push(actualKey);
      return;
    }
    if (GLOBAL_ONLY_KEYS.has(actualKey)) actualGlobal.push(actualKey);
    else actualLocal.push(actualKey);
  };

  for (const k of requested) {
    const actual = KEY_ALIASES[k] ?? k;
    pushActual(actual, k);
  }

  // Virtual builders need these underlying keys:
  if (wantsSeoDefaults) {
    pushActual('public_base_url'); // global
    pushActual('site_title'); // local
    pushActual('company_brand'); // local (optional enrich)
    pushActual('site_meta_default'); // local (optional enrich)
    pushActual('seo'); // local (optional enrich)
    pushActual('site_seo'); // local (optional enrich)
  }

  if (wantsSeoAppIcons) {
    pushActual('site_apple_touch_icon'); // global
    pushActual('site_favicon'); // global
  }

  if (wantsSameAs) {
    pushActual('socials'); // local
  }

  const uniqLocal = Array.from(new Set(actualLocal));
  const uniqGlobal = Array.from(new Set(actualGlobal));

  // 2) Fetch
  const [localMap, globalMap] = await Promise.all([
    fetchSiteSettingsLocaleRaw(uniqLocal, locale),
    fetchSiteSettingsLocaleRaw(uniqGlobal, '*'),
  ]);

  // 3) Build output map with requested keys (reverse alias)
  const out: Record<string, unknown> = {};

  for (const k of requested) {
    if (k === 'seo_defaults' || k === 'seo_app_icons' || k === 'seo_social_same_as') continue;

    const actual = KEY_ALIASES[k] ?? k;

    if (LOCAL_OR_GLOBAL_KEYS.has(k)) {
      if (localMap[actual] !== undefined) out[k] = localMap[actual];
      else if (globalMap[actual] !== undefined) out[k] = globalMap[actual];
      continue;
    }

    const src = GLOBAL_ONLY_KEYS.has(actual) ? globalMap : localMap;
    if (src[actual] !== undefined) out[k] = src[actual];
  }

  // 4) Virtual keys
  if (wantsSeoAppIcons && out['seo_app_icons'] === undefined) {
    const icons = buildSeoAppIconsFromSiteMedia(globalMap);
    if (icons) out['seo_app_icons'] = icons;
  }

  if (wantsSeoDefaults && out['seo_defaults'] === undefined) {
    const defaults = buildSeoDefaults(globalMap, localMap);
    if (defaults) out['seo_defaults'] = defaults;
  }

  if (wantsSameAs && out['seo_social_same_as'] === undefined) {
    const sameAs = buildSameAsFromSocials(localMap);
    if (sameAs) out['seo_social_same_as'] = sameAs;
  }

  // 5) Strict check (only for non-optional)
  const missing = requested.filter((k) => out[k] === undefined && !isOptionalKey(k));

  if (missing.length) {
    // better diagnostic with locale + notes
    throw new Error(
      `[SEO] Missing REQUIRED site_settings keys for locale='${locale}': ${missing.join(', ')}`,
    );
  }

  return out;
}

// ---------------------------
// Metadata helpers
// ---------------------------

export function applyTemplate(tpl: string, vars: Record<string, string>): string {
  return String(tpl || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}

export function asKeywords(v?: string | null): string | undefined {
  const s = String(v ?? '').trim();
  return s ? s : undefined;
}

export function buildRobots(
  pageNoindex: boolean,
  defaultsRobots?: string | null,
): Metadata['robots'] | undefined {
  if (pageNoindex) return { index: false, follow: false };

  const raw = String(defaultsRobots ?? '').trim();
  if (!raw) return undefined;

  const s = raw.toLowerCase().replace(/\s+/g, '');
  const noindex = s.includes('noindex');
  const nofollow = s.includes('nofollow');

  return { index: !noindex, follow: !nofollow };
}

export function buildIconsFromSeo(seoIcons?: SeoAppIcons | null): Metadata['icons'] | undefined {
  const appleTouchIcon = String(seoIcons?.appleTouchIcon ?? '').trim();
  const favicon32 = String(seoIcons?.favicon32 ?? '').trim();
  const favicon16 = String(seoIcons?.favicon16 ?? '').trim();

  const apple = appleTouchIcon ? [{ url: appleTouchIcon }] : undefined;

  const icon: Array<{ url: string; sizes?: string }> = [];
  if (favicon32) icon.push({ url: favicon32, sizes: '32x32' });
  if (favicon16) icon.push({ url: favicon16, sizes: '16x16' });

  if (!apple && icon.length === 0) return undefined;
  return { ...(apple ? { apple } : {}), ...(icon.length ? { icon } : {}) };
}

export function safeJsonLdStringify(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export type ProjectSeoPick = {
  title?: string | null;
  slug?: string | null;

  meta_title?: string | null;
  meta_description?: string | null;

  image_effective_url?: string | null;
  image_url?: string | null;
};

export type ServiceSeoPick = {
  name?: string | null;
  slug?: string | null;

  meta_title?: string | null;
  meta_description?: string | null;

  image_effective_url?: string | null;
  image_url?: string | null;
};

export function rowsToMap(payload: unknown): Record<string, unknown> {
  const rows = Array.isArray(payload)
    ? (payload as Array<Record<string, any>>)
    : Array.isArray((payload as any)?.data)
      ? ((payload as any).data as Array<Record<string, any>>)
      : [];

  const map: Record<string, unknown> = {};
  for (const r of rows) {
    const key =
      typeof r?.key === 'string' ? r.key : typeof r?.setting_key === 'string' ? r.setting_key : '';
    if (!key) continue;
    map[key] = r?.value ?? r;
  }
  return map;
}
