// =============================================================
// FILE: src/integrations/shared/local.ts
// Shared Localization Utilities
// =============================================================

export const FALLBACK_LOCALE = 'tr'; // Default fallback if config missing

/** RTL set sabit olabilir (bu bir “dil listesi yönetimi” değil, yazım yönü bilgisidir) */
export const KNOWN_RTL = new Set([
  "ar", "fa", "he", "ur", "ckb", "ps", "sd", "ug", "yi", "dv",
]);

export const isRTL = (l: string) => KNOWN_RTL.has(String(l || "").toLowerCase());

export function normLocaleTag(x: unknown): string {
  return String(x || '')
    .toLowerCase()
    .trim()
    .replace('_', '-')
    .split('-')[0]
    .trim();
}

/** order-preserving dedupe */
export function uniqKeepOrder(locales: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of locales) {
    const n = normLocaleTag(l);
    if (!n) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function tryParseJson(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  const s = raw.trim();
  if (!s) return raw;

  if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
    try {
      return JSON.parse(s);
    } catch {
      return raw;
    }
  }

  return raw;
}

type AppLocaleObj = {
  code?: unknown;
  label?: unknown;
  is_default?: unknown;
  is_active?: unknown;
};

export function normalizeLocales(raw: unknown): string[] {
  let v: any = tryParseJson(raw);

  // legacy wrapper
  if (v && typeof v === 'object' && !Array.isArray(v) && Array.isArray(v.locales)) {
    v = v.locales;
  }

  const arr: any[] = Array.isArray(v) ? v : [];

  const actives: string[] = [];
  const defaults: string[] = [];

  for (const item of arr) {
    if (typeof item === 'string') {
      const code = normLocaleTag(item);
      if (code) actives.push(code);
      continue;
    }

    if (item && typeof item === 'object') {
      const obj = item as AppLocaleObj;
      const code = normLocaleTag(obj.code);
      if (!code) continue;

      const isActive = obj.is_active === undefined ? true : Boolean(obj.is_active);
      if (!isActive) continue;

      actives.push(code);

      const isDefault = Boolean(obj.is_default);
      if (isDefault) defaults.push(code);
    }
  }

  const activeUniq = uniqKeepOrder(actives);
  if (!activeUniq.length) return [];

  const defaultUniq = uniqKeepOrder(defaults).filter((d) => activeUniq.includes(d));
  if (!defaultUniq.length) return activeUniq;

  const d = defaultUniq[0]!;
  return [d, ...activeUniq.filter((x) => x !== d)];
}

export function resolveDefaultLocale(
  defaultLocaleValue: unknown,
  appLocalesValue: unknown,
): string {
  const active = normalizeLocales(appLocalesValue);
  const activeSet = new Set(active.map(normLocaleTag));

  const cand = normLocaleTag(defaultLocaleValue);
  if (cand && activeSet.has(cand)) return cand;

  return normLocaleTag(active[0]) || '';
}

export function pickFromAcceptLanguage(accept: string | null, active: string[]): string {
  const activeClean = uniqKeepOrder(active);
  if (!activeClean.length) return '';

  const a = (accept || '').toLowerCase();
  if (!a) return activeClean[0] || '';

  const prefs = a
    .split(',')
    .map((part) => part.trim().split(';')[0]?.trim())
    .filter(Boolean)
    .map((tag) => normLocaleTag(tag))
    .filter(Boolean);

  for (const p of prefs) {
    if (activeClean.includes(p)) return p;
  }

  return activeClean[0] || '';
}

export function pickFromCookie(cookieLocale: string | undefined, active: string[]): string | null {
  const c = normLocaleTag(cookieLocale);
  if (!c) return null;

  const activeClean = uniqKeepOrder(active);
  return activeClean.includes(c) ? c : null;
}

// ----------------------------------------------------------------------
// URL Utilities (formerly url.ts)
// ----------------------------------------------------------------------

export type RuntimeLocale = string;

function toShortLocale(v: unknown): string {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();
}

function splitPath(asPath: string) {
  const s = String(asPath || '/');
  const [pathAndQuery, hash = ''] = s.split('#');
  const [pathname = '/', query = ''] = pathAndQuery.split('?');
  return {
    pathname: pathname || '/',
    query: query ? `?${query}` : '',
    hash: hash ? `#${hash}` : '',
  };
}

function buildActiveSet(activeLocales?: string[]) {
  return new Set((activeLocales || []).map((x) => toShortLocale(x)).filter(Boolean));
}

function looksLikeLocale(seg: string): boolean {
  const s = toShortLocale(seg);
  return /^[a-z]{2}$/.test(s) || /^[a-z]{3}$/.test(s);
}

/**
 * Strips "/{locale}" prefix from a pathname.
 * - If activeLocales provided: strips only if prefix exists in activeLocales (strict).
 * - Else: strips if first segment looks like locale (heuristic).
 */
export function stripLocalePrefix(pathname: string, activeLocales?: string[]): string {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const seg = p.replace(/^\/+/, '').split('/')[0] || '';
  const cand = toShortLocale(seg);
  if (!cand) return p;

  const activeSet = buildActiveSet(activeLocales);

  const shouldStrip =
    activeSet.size > 0 ? activeSet.has(cand) : looksLikeLocale(cand);

  if (!shouldStrip) return p;

  const rest = p.replace(new RegExp(`^/${seg}(?=/|$)`), '');
  return rest ? (rest.startsWith('/') ? rest : `/${rest}`) : '/';
}

export type LocalizePathOptions = {
  defaultLocale?: string;
};

/**
 * Localizes a path using URL-prefix routing ALWAYS:
 *   /{locale}/...
 * Removes existing locale prefix first.
 */
export function localizePath(
  locale: RuntimeLocale,
  asPath: string,
  activeLocales?: string[],
  opts?: LocalizePathOptions,
): string {
  const { pathname, query, hash } = splitPath(asPath);

  const clean = stripLocalePrefix(pathname, activeLocales);
  const base = clean === '/' ? '' : clean;

  const target = toShortLocale(locale);
  const def = toShortLocale(opts?.defaultLocale) || toShortLocale(activeLocales?.[0]) || 'de';

  const lc = target || def;

  // ✅ ALWAYS prefix locale
  const path = `/${lc}${base || ''}` || `/${lc}`;

  return `${path}${query}${hash}`;
}

// ----------------------------------------------------------------------
// UI Text Utilities (formerly uiText.ts)
// ----------------------------------------------------------------------

export function isValidUiText(value: unknown, key: string): boolean {
  const v = String(value ?? '').trim();
  if (!v) return false;

  // Missing durumda bazı helper’lar key'i aynen döndürür
  if (v === key) return false;

  // ui_xxx gibi key formatını direkt reject et
  if (/^ui_[a-z0-9_]+$/i.test(v)) return false;

  // "[key]" / "{{key}}" gibi placeholder dönebilir
  const normalized = v.replace(/\s+/g, '');
  if (normalized === `[${key}]`) return false;
  if (normalized === `{{${key}}}`) return false;

  return true;
}

// ----------------------------------------------------------------------
// Object / Data Utilities (Generic)
// ----------------------------------------------------------------------

// "a.b.c": "val" -> {a:{b:{c:"val"}}}
export function undot(flat: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    if (!key.includes(".")) { out[key] = value; continue; }
    const parts = key.split(".");
    let cur: Record<string, unknown> = out;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      if (i === parts.length - 1) cur[p] = value;
      else {
        cur[p] = (cur[p] as Record<string, unknown>) ?? {};
        cur = cur[p] as Record<string, unknown>;
      }
    }
  }
  return out;
}


// ----------------------------------------------------------------------
// SEO / URL Helpers (formerly seo/helpers.ts)
// ----------------------------------------------------------------------

export const DEFAULT_LOCALE_PREFIXLESS = false;

export function stripTrailingSlash(u: string) {
  return String(u || '')
    .trim()
    .replace(/\/+$/, '');
}

export function normalizeLocalhostOrigin(origin: string): string {
  const o = stripTrailingSlash(origin);
  if (/^https?:\/\/localhost:\d+$/i.test(o)) return o.replace(/:\d+$/i, '');
  if (/^https?:\/\/127\.0\.0\.1:\d+$/i.test(o)) return o.replace(/:\d+$/i, '');
  return o;
}

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function asStr(x: unknown): string | null {
  return typeof x === 'string' && x.trim() ? x.trim() : null;
}

export function asBool(x: unknown): boolean | null {
  return typeof x === 'boolean' ? x : null;
}

export function asObj(x: unknown): Record<string, any> | null {
  return x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, any>) : null;
}

export function asStrArr(x: unknown): string[] {
  if (!x) return [];
  if (Array.isArray(x)) {
    return x
      .map((v) => String(v))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const s = asStr(x);
  return s ? [s] : [];
}

export function normLocaleShort(l: unknown, fallback = FALLBACK_LOCALE): string {
  const v = String(l || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
  const short = (v.split('-')[0] || '').trim();
  const fb = String(fallback || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0];
  return short || fb || FALLBACK_LOCALE;
}

/** Path normalizasyonu: başında / olsun; kök dışı ise sonda / olmasın */
export function normPath(pathname?: string): string {
  let p = (pathname ?? '/').trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

export function absUrlJoin(baseUrl: string, pathOrUrl: string): string {
  const base = normalizeLocalhostOrigin(stripTrailingSlash(baseUrl || ''));
  const v = String(pathOrUrl || '').trim();
  if (!v) return base || 'http://localhost';
  if (/^https?:\/\//i.test(v)) return normalizeLocalhostOrigin(v);
  const p = v.startsWith('/') ? v : `/${v}`;
  return `${base}${p}`;
}

/** Site'nin temel URL'si (NEXT_PUBLIC_SITE_URL veya tarayıcı origin) */
export function siteUrlBase(): string {
  const envUrl = stripTrailingSlash(String(process.env.NEXT_PUBLIC_SITE_URL || '').trim());
  if (envUrl) return normalizeLocalhostOrigin(envUrl);

  if (typeof window !== 'undefined' && window?.location?.origin) {
    return normalizeLocalhostOrigin(stripTrailingSlash(window.location.origin));
  }

  return 'http://localhost';
}

/** Verilen path'i tam URL'e çevirir. Zaten http(s) ise dokunmaz. */
export function absoluteUrl(pathOrUrl: string): string {
  const base = siteUrlBase();
  return absUrlJoin(base, pathOrUrl);
}

/**
 * "/{locale}/..." path üretimi
 * - App Router: ALWAYS prefix locale (no prefixless default).
 * - pathname: locale-prefixsiz path: "/" veya "/blog"
 */
export function localizedPath(locale: string, pathname: string, defaultLocale: string): string {
  const def = normLocaleShort(defaultLocale, FALLBACK_LOCALE);
  const loc = normLocaleShort(locale, def);
  const p = normPath(pathname);

  if (DEFAULT_LOCALE_PREFIXLESS && loc === def) return p;

  if (p === '/') return `/${loc}`;
  return `/${loc}${p}`;
}

/** "/x?y#z" -> "/x" */
export function stripHashQuery(asPath: string): string {
  const [pathOnly] = String(asPath || '/').split('#');
  const [pathname] = pathOnly.split('?');
  return pathname || '/';
}

/** Compact object (remove null/undefined/empty string/empty array/empty object) */
export function compact<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj || {})) {
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

// Basit derin merge
export function mergeDeep<T extends Record<string, unknown>>(target: T, src: T): T {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      // @ts-expect-error generic assign
      target[k] = mergeDeep((target[k] as T) ?? ({} as T), v as T);
    } else {
      // @ts-expect-error generic assign
      target[k] = v;
    }
  }
  return target;
}
