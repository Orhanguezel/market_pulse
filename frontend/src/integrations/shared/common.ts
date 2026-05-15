// =============================================================
// FILE: src/integrations/db/types/common.ts
// =============================================================

/** Genel satır tipi */
export type UnknownRow = Record<string, unknown>;

export type BoolLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false';

export type SortDirection = 'asc' | 'desc';

export function safeStr(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

export function titleFromSlug(slug: unknown, fallback: string): string {
  const s = safeStr(slug);
  if (!s) return fallback;

  const lastSegment = s
    .split('/')
    .map((x) => x.trim())
    .filter(Boolean)
    .pop();

  if (!lastSegment) return fallback;

  let decoded = lastSegment;
  try {
    decoded = decodeURIComponent(lastSegment);
  } catch {
    // ignore decode errors
  }

  const words = decoded
    .replace(/[_\s]+/g, '-')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return words || fallback;
}

export const downgradeH1ToH2 = (rawHtml: string) =>
  String(rawHtml || '')
    .replace(/<h1(\s|>)/gi, '<h2$1')
    .replace(/<\/h1>/gi, '</h2>');

export function safeJson<T>(v: any, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === 'object') return v as T;
  if (typeof v !== 'string') return fallback;

  const s = v.trim();
  if (!s) return fallback;

  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}



export function extractHtmlFromAny(page: any): string {
  if (!page) return '';

  const ch = safeStr(page?.content_html);
  if (ch) return ch;

  const c = page?.content ?? page?.content_json ?? page?.contentJson;
  if (!c) return '';

  if (typeof c === 'object') return safeStr((c as any)?.html);

  if (typeof c === 'string') {
    const s = c.trim();
    if (!s) return '';

    if (s.startsWith('{') || s.startsWith('[')) {
      const obj = safeJson<any>(s, null);
      const h = safeStr(obj?.html);
      if (h) return h;
    }
    return s;
  }

  return '';
}

export function isRemoteUrl(src: unknown): src is string {
  if (typeof src !== 'string') return false;
  return /^https?:\/\//i.test(src) || /^\/\//.test(src) || /^\/uploads\//i.test(src);
}

/* ------------------------------------------------------------------
 * RTK Endpoint helpers (ortak kullanım)
 * ------------------------------------------------------------------ */

/** Undefined/null/empty değerleri atan param temizleyici */
export function cleanParams(
  params?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && Number.isNaN(v)))
      continue;
    if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') out[k] = v;
    else out[k] = String(v);
  }
  return Object.keys(out).length ? out : undefined;
}

/** Locale varsa x-locale + Accept-Language header'larını oluştur */
export function makeLocaleHeaders(locale?: string | null) {
  return locale ? { 'x-locale': locale, 'Accept-Language': locale } : undefined;
}

/** x-total-count response header'ından toplam değeri çıkar */
export function parseTotalFromHeaders(
  headers: { get: (name: string) => string | null } | undefined,
  fallbackLength: number,
): number {
  const raw = headers?.get('x-total-count') ?? headers?.get('X-Total-Count');
  if (!raw) return fallbackLength;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallbackLength;
}

/** RTK meta'dan x-total-count çıkar */
export type RtkMetaWithHeaders = {
  response?: {
    headers?: { get: (name: string) => string | null };
  };
};

/** Raw API cevabını array'e normalize et (items wrapper desteği) */
export function normalizeArrayResponse<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const anyRaw = raw as any;
  if (anyRaw && Array.isArray(anyRaw.items)) return anyRaw.items as T[];
  return [];
}

/** Locale ekleyen generic wrapper type */
export type WithLocale<T> = T & { locale?: string | null };

/** Unknown değeri boolean'a çevir (1, '1', 'true', 'yes' → true) */
export function toBool(v: unknown): boolean {
  if (v === true || v === false) return v;
  const s = String(v ?? '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

/** RTK Query: stable config – otomatik refetch kapalı */
export const stableQueryOptions = {
  refetchOnFocus: false as const,
  refetchOnReconnect: false as const,
  refetchOnMountOrArgChange: false as const,
};
