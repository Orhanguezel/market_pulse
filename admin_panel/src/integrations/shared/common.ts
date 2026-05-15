// =============================================================
// FILE: src/integrations/shared/common.ts
// =============================================================

export type OffsetLimit = {
  limit?: number;
  offset?: number;
};

export type ApiOk = { ok: true };

export const text = (v: unknown): string =>
  typeof v === 'string' ? v : v == null ? '' : String(v);

export const nonEmpty = (v: unknown): string => {
  const s = text(v).trim();
  return s ? s : '';
};

export type SortOrder = 'asc' | 'desc';
export type BoolLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | null | undefined | unknown;

export const safeJsonLd = (raw: string): object | null => {
  const s = (raw || '').trim();
  if (!s) return null;
  try {
    return JSON.parse(s) as object;
  } catch {
    return null;
  }
};

export const toStr = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return v == null ? '' : String(v);
};

export type ImgSrc = string | any; // Next Image: string | StaticImport (StaticImageData)

export function normSrc(v: unknown): string {
  const s = trimStr(v);
  if (!s) return '';
  // parseMediaUrl boş dönerse string'i aynen kullan (absolute url vb. için)
  return parseMediaUrl(s) || s;
}

/**
 * Local toBool: BoolLike union'una %100 uyumlu.
 * BoolLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | null | undefined
 */
export function toBool(v: BoolLike, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (v == null) return fallback;

  const s = toStr(v).trim().toLowerCase();
  if (s === '1' || s === 'true') return true;
  if (s === '0' || s === 'false') return false;

  return fallback;
}

export const clamp = (n: number, min = 1, max = 200): number => Math.max(min, Math.min(max, n));

export const isPlainObject = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);

export const toTrimStr = (v: unknown): string => toStr(v).trim();

export const toNum = (v: unknown, d = 0): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : d;
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : d;
};

export const pickFirst = (src: Record<string, unknown>, keys: readonly string[]): unknown => {
  for (const k of keys) {
    const v = src[k];
    if (v != null) return v;
  }
  return undefined;
};

export const pickStr = (
  src: Record<string, unknown>,
  keys: readonly string[],
  fallback = '',
): string => {
  const v = pickFirst(src, keys);
  const s = toTrimStr(v);
  return s ? s : fallback;
};

export const pickOptStr = (
  src: Record<string, unknown>,
  keys: readonly string[],
): string | null => {
  const v = pickFirst(src, keys);
  const s = toTrimStr(v);
  return s ? s : null;
};

export const pickIsoOrNull = (
  src: Record<string, unknown>,
  keys: readonly string[],
): string | null => {
  const s = pickOptStr(src, keys);
  return s ? s : null;
};

export const toNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function safeText(v: unknown, fb = ''): string {
  const s = String(v ?? '').trim();
  return s ? s : fb;
}

export function isRemoteUrl(v: string): boolean {
  const s = v.trim();
  return s.startsWith('http://') || s.startsWith('https://');
}

/* -------------------- shared query param types -------------------- */

export type QueryParamPrimitive = string | number | boolean;
export type QueryParamValue = QueryParamPrimitive | QueryParamPrimitive[];
export type QueryParams = Record<string, QueryParamValue>;

/* -------------------- core value types -------------------- */

export type ValueType = 'string' | 'number' | 'boolean' | 'json';

export type JsonLike = string | number | boolean | null | { [k: string]: JsonLike } | JsonLike[];

export type JsonObject = Record<string, unknown>;

/** Genel satır tipi (object) */
export type UnknownRow = Record<string, unknown>;

/** unknown → object daraltma */
export function isUnknownRow(v: unknown): v is UnknownRow {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** unknown → object (array dahil değil) */
export function isObject(v: unknown): v is UnknownRow {
  return typeof v === 'object' && v !== null;
}

/** Object üzerinde güvenli property okuma (key string) */
export function getProp(obj: unknown, key: string): unknown {
  if (!isUnknownRow(obj)) return undefined;
  return obj[key];
}

/** String property okuma (trim’li) */
export function getStringProp(obj: unknown, key: string): string | undefined {
  const v = getProp(obj, key);
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

/** Number property okuma */
export function getNumberProp(obj: unknown, key: string): number | undefined {
  const v = getProp(obj, key);
  return typeof v === 'number' ? v : undefined;
}

/** Boolean property okuma */
export function getBoolProp(obj: unknown, key: string): boolean | undefined {
  const v = getProp(obj, key);
  return typeof v === 'boolean' ? v : undefined;
}

export function jsonLikeToBoolLike(v: JsonLike | undefined): BoolLike {
  // BoolLike union: boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | null | undefined
  if (v === null || typeof v === 'undefined') return v;

  if (typeof v === 'boolean') return v;
  if (v === 0 || v === 1) return v;

  if (typeof v === 'number') return v !== 0 ? 1 : 0;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1') return 'true';
    if (s === 'false' || s === '0') return 'false';

    // common aliases -> BoolLike
    if (['yes', 'y', 'on', 'enabled', 'active'].includes(s)) return 'true';
    if (['no', 'n', 'off', 'disabled', 'inactive'].includes(s)) return 'false';

    return undefined;
  }

  return undefined;
}

export function toHtml(v: JsonLike | undefined, fallbackHtml: string): string {
  return typeof v === 'string' && v.trim() ? v : fallbackHtml;
}

export function isValidEmail(email: string): boolean {
  const s = email.trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/**
 * unknown -> BoolLike daraltma
 * (common.ts'deki BoolLike union'una %100 uyumlu)
 */
export const asBoolLike = (v: unknown): BoolLike => {
  if (v === null || typeof v === 'undefined') return v; // null | undefined
  if (typeof v === 'boolean') return v;
  if (v === 0 || v === 1) return v;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '0' || s === '1' || s === 'true' || s === 'false') return s as BoolLike;
  }

  return undefined;
};

export const trimStr = (v: unknown): string => toStr(v).trim();

export const nullify = (v: unknown): string | null => {
  const s = trimStr(v);
  return s ? s : null;
};

export function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * unknown -> string[] | null
 * - array => string[]
 * - string => JSON array parse OR csv split
 */
export function toStrArrayOrNull(v: unknown): string[] | null {
  if (v == null) return null;

  if (Array.isArray(v)) {
    const out = v.map((x) => trimStr(x)).filter(Boolean);
    return out.length ? out : null;
  }

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;

    // JSON array
    try {
      const parsed: unknown = JSON.parse(s);
      if (Array.isArray(parsed)) {
        const out = parsed.map((x) => trimStr(x)).filter(Boolean);
        return out.length ? out : null;
      }
    } catch {
      // ignore
    }

    // CSV fallback
    const out = s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    return out.length ? out : null;
  }

  return null;
}

/** list meta total extractor */
export function extractTotal(res: unknown): number | null {
  if (!isObject(res)) return null;
  const raw =
    (res as Record<string, unknown>).total ??
    (res as Record<string, unknown>).count ??
    (res as Record<string, unknown>).total_count;

  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

type UnknownRecord = Record<string, unknown>;

export function extractArray(
  res: unknown,
  keys: readonly string[] = ['data', 'items', 'rows', 'result', 'replies', 'tickets'],
): unknown[] {
  if (Array.isArray(res)) return res;
  if (isObject(res)) {
    for (const k of keys) {
      const v = (res as UnknownRecord)[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

export function safeParseJson<T>(raw: unknown): T | null {
  const s = nonEmpty(raw);
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

// -------------------- text helpers (SEO excerpts etc.) --------------------

/** HTML -> plain text (safe) */
export function stripHtmlToText(s: string): string {
  return (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Text truncate with ellipsis */
export function truncateText(s: string, n: number): string {
  if (!s) return s;
  return s.length > n ? s.slice(0, Math.max(0, n - 1)) + '…' : s;
}

/** UI tarafında güvenli trim'li string */
export const uiText = (v: unknown): string => trimStr(v);

/** UUID v4-like validation (case-insensitive, 8-4-4-4-12) */
export const isUuidLike = (v: unknown): boolean => {
  const s = typeof v === 'string' ? v.trim() : String(v ?? '').trim();
  if (!s) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
};

/** unknown -> JSON parse (object/array), yoksa null */
export const tryParseJsonVal = <T = unknown>(val: unknown): T | null => {
  if (val == null) return null;
  if (typeof val === 'object') return val as T;

  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return null;

    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));
    if (!looksJson) return null;

    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }

  return null;
};

/** SiteSetting JSON value'larından array parse (string ise JSON, değilse null) */
export const parseJsonArray = <T = unknown>(val: unknown): T[] => {
  const arr = tryParseJsonVal<T[]>(val);
  return Array.isArray(arr) ? arr : [];
};

/** SiteSetting JSON value'larından object parse */
export const parseJsonObject = (val: unknown): Record<string, unknown> => {
  const obj = tryParseJsonVal<Record<string, unknown>>(val);
  return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
};

// -------------------- Header domain types --------------------

export type HeaderMenuItem = {
  title?: string;
  path?: string;
  pageKey?: string;
  type?: 'link' | 'dropdown';
  itemsKey?: string;
};

export type HeaderDropdownItem = { title?: string; path?: string; pageKey?: string };

export type HeaderSocialItem = { url?: string; icon?: string; alt?: string };

// -------------------- Header normalizers --------------------

/** header_menu -> normalized MenuItem[] */
export function normalizeHeaderMenu(val: unknown): Array<{
  title: string;
  path: string;
  pageKey: string;
  type: 'link' | 'dropdown';
  itemsKey: string;
}> {
  const arr = parseJsonArray<HeaderMenuItem>(val);
  if (!arr.length) return [];

  return arr
    .map((x) => ({
      title: uiText(x?.title),
      path: uiText(x?.path),
      pageKey: uiText(x?.pageKey),
      type: (x?.type === 'dropdown' ? 'dropdown' : 'link') as 'link' | 'dropdown',
      itemsKey: uiText(x?.itemsKey),
    }))
    .filter((x) => !!x.title);
}

/** dropdown itemsKey setting -> normalized dropdown items */
export function normalizeHeaderDropdownItems(val: unknown): Array<{ title: string; path: string }> {
  const arr = parseJsonArray<HeaderDropdownItem>(val);
  if (!arr.length) return [];

  return arr
    .map((x) => ({
      title: uiText(x?.title) || uiText(x?.pageKey),
      path: uiText(x?.path),
    }))
    .filter((x) => !!x.title && !!x.path);
}

/** social_links -> normalized social items */
export function normalizeHeaderSocialLinks(
  val: unknown,
): Array<{ url: string; icon: string; alt: string }> {
  const arr = parseJsonArray<HeaderSocialItem>(val);
  if (!arr.length) return [];

  return arr
    .map((x) => ({
      url: uiText(x?.url),
      icon: uiText(x?.icon),
      alt: uiText(x?.alt) || 'Social',
    }))
    .filter((x) => !!x.url && !!x.icon);
}

/** ui_hero içinden cta_href (string) okuma */
export function pickHeaderCtaHrefFromUiHero(val: unknown): string {
  const obj = parseJsonObject(val);
  return uiText(obj?.cta_href);
}

/** Menu içindeki dropdown itemsKey'leri unique + maxN */
export function pickDropdownKeys(
  menu: Array<{ type: 'link' | 'dropdown'; itemsKey: string }>,
  maxN = 8,
): string[] {
  const keys = Array.from(
    new Set(
      menu
        .filter((x) => x.type === 'dropdown' && uiText(x.itemsKey))
        .map((x) => uiText(x.itemsKey))
        .filter(Boolean),
    ),
  );
  return keys.slice(0, maxN);
}

export type MediaValue = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

export type StaticImageLike = { src?: string; width?: number; height?: number } | unknown;

/** string mi + http(s) mi */
export const isHttpUrl = (s: string): boolean => /^https?:\/\//i.test((s || '').trim());

/** JSON string gibi mi görünüyor */
export const isJsonishString = (v: unknown): boolean => {
  if (typeof v !== 'string') return false;
  const t = v.trim();
  return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
};

/**
 * site_settings media value -> {url,width,height,alt}
 * Accepts:
 * - object: { url, width, height, alt } or { src, w, h } or { image_url, image }
 * - string: plain url OR json-string
 */
export function parseSiteLogoMedia(val: unknown): MediaValue {
  if (val == null) return { url: '' };

  // already parsed object
  if (isObject(val)) {
    const obj = val as Record<string, unknown>;

    const url = pickStr(obj, ['url', 'src', 'image_url', 'image'], '');
    const alt = pickStr(obj, ['alt'], '');

    const widthRaw = pickFirst(obj, ['width', 'w']);
    const heightRaw = pickFirst(obj, ['height', 'h']);

    const width = typeof widthRaw === 'number' && Number.isFinite(widthRaw) ? widthRaw : undefined;
    const height =
      typeof heightRaw === 'number' && Number.isFinite(heightRaw) ? heightRaw : undefined;

    return {
      url: trimStr(url),
      ...(width ? { width } : null),
      ...(height ? { height } : null),
      ...(alt ? { alt: trimStr(alt) } : null),
    };
  }

  // string: plain url OR json-string
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return { url: '' };

    if (!isJsonishString(s)) return { url: s };

    const parsed = safeParseJson<Record<string, unknown>>(s);
    if (parsed && typeof parsed === 'object') {
      const url = pickStr(parsed, ['url', 'src', 'image_url', 'image'], '');
      const alt = pickStr(parsed, ['alt'], '');

      const widthRaw = pickFirst(parsed, ['width', 'w']);
      const heightRaw = pickFirst(parsed, ['height', 'h']);

      const width =
        typeof widthRaw === 'number' && Number.isFinite(widthRaw) ? widthRaw : undefined;
      const height =
        typeof heightRaw === 'number' && Number.isFinite(heightRaw) ? heightRaw : undefined;

      return {
        url: trimStr(url),
        ...(width ? { width } : null),
        ...(height ? { height } : null),
        ...(alt ? { alt: trimStr(alt) } : null),
      };
    }

    // parse fail => treat as plain url
    return { url: s };
  }

  return { url: '' };
}

/**
 * SSR-safe Next/Image unoptimized decision:
 * - src string ise URL hostname bakılır
 * - localhost / 127.0.0.1 image URL’lerinde optimizer bypass edilir
 */
export function shouldBypassNextImageOptimizer(src: unknown): boolean {
  if (typeof src !== 'string') return false;
  const s = src.trim();
  if (!isHttpUrl(s)) return false;

  try {
    const u = new URL(s);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/** className merge (no inline styles). */
export const cx = (...parts: Array<string | undefined | null | false>): string | undefined => {
  const out = parts
    .map((x) => trimStr(x))
    .filter(Boolean)
    .join(' ');
  return out ? out : undefined;
};

export function toAbsoluteUrlOrNull(base: string, maybeUrl: unknown): string | null {
  const raw = trimStr(maybeUrl);
  if (!raw) return null;

  if (isHttpUrl(raw)) return raw;

  const b = trimStr(base).replace(/\/+$/, '');
  if (!b) return null;

  const p = raw.startsWith('/') ? raw : `/${raw}`;
  return `${b}${p}`;
}

/**
 * strict helper: empty/invalid ise throw
 * (Layout/SEO strict mod için)
 */
export function toAbsoluteUrlStrict(
  base: string,
  maybeUrl: unknown,
  errMsg = '[SEO] Expected non-empty url',
): string {
  const out = toAbsoluteUrlOrNull(base, maybeUrl);
  if (!out) throw new Error(errMsg);
  return out;
}

// -------------------- media helpers (generic) --------------------

/**
 * unknown -> image url string (best effort)
 * Accepts:
 * - string url
 * - string json: {"url": "..."} or {"src": "..."} etc.
 * - object: {url/src/image_url/image}
 * - array: first parsable entry
 */
export function parseMediaUrl(val: unknown): string {
  if (val == null) return '';

  // array => first usable
  if (Array.isArray(val)) {
    for (const it of val) {
      const u = parseMediaUrl(it);
      if (u) return u;
    }
    return '';
  }

  // object => pick keys
  if (isObject(val) && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;
    const u = pickStr(obj, ['url', 'src', 'image_url', 'image'], '');
    return trimStr(u);
  }

  // string => url OR json-string
  if (typeof val === 'string') {
    const s = trimStr(val);
    if (!s) return '';

    // plain url (absolute or relative)
    if (isHttpUrl(s) || s.startsWith('/')) return s;

    // json-string
    if (isJsonishString(s)) {
      const parsed = safeParseJson<Record<string, unknown>>(s);
      if (parsed && typeof parsed === 'object') {
        const u = pickStr(parsed, ['url', 'src', 'image_url', 'image'], '');
        return trimStr(u);
      }
    }

    return '';
  }

  return '';
}

/** number safe */
export const toNumSafe = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

/** Utility type to add locale field to query params */
export type WithLocale<T> = T & { locale?: string | null };

/** Re-export cleanParams from helpers */
export { cleanParams } from '@/integrations/shared/utils/helpers';
