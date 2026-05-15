// =============================================================
// FILE: src/i18n/server.ts  (DYNAMIC DEFAULT FROM DB via META endpoints)
// =============================================================
import 'server-only';

import { cache } from 'react';
import { headers, cookies } from 'next/headers';

import { normLocaleTag, pickFromAcceptLanguage, pickFromCookie } from './localeUtils';

const API = (process.env.API_BASE_URL || '').trim();

// Hard fallback only if DB/API not reachable or empty
export const DEFAULT_LOCALE_FALLBACK = 'tr';

export type JsonLike = null | boolean | number | string | JsonLike[] | { [k: string]: JsonLike };

export type AppLocaleMeta = {
  code: string;
  label?: string;
  is_default?: boolean;
  is_active?: boolean;
};

export type SiteSettingRow = {
  key: string;
  value: JsonLike;
  locale?: string;
};

async function fetchJson<T>(path: string, opts?: { revalidate?: number }): Promise<T | null> {
  if (!API) return null;

  try {
    const base = API.replace(/\/+$/, '');
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

    const res = await fetch(url, {
      next: { revalidate: opts?.revalidate ?? 600 },
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function computeActiveLocales(meta: AppLocaleMeta[] | null | undefined): {
  activeLocales: string[];
  preferredDefault: string | null; // from is_default
} {
  const def = DEFAULT_LOCALE_FALLBACK;
  const arr = Array.isArray(meta) ? meta : [];

  const active = arr
    .filter((x) => x && x.is_active !== false)
    .map((x) => normLocaleTag(x.code))
    .filter(Boolean) as string[];

  const uniq = Array.from(new Set(active));

  const preferredDefault =
    arr.find((x) => x?.is_default === true && x?.is_active !== false)?.code ?? null;

  return {
    activeLocales: uniq.length ? uniq : [def],
    preferredDefault: preferredDefault ? normLocaleTag(preferredDefault) : null,
  };
}

/**
 * DB: /site_settings/app-locales => active locales
 */
export async function fetchActiveLocales(): Promise<string[]> {
  const def = DEFAULT_LOCALE_FALLBACK;
  if (!API) return [def];

  const meta = await fetchJson<AppLocaleMeta[]>('/site_settings/app-locales', { revalidate: 600 });
  const parsed = computeActiveLocales(meta);
  return parsed.activeLocales.length ? parsed.activeLocales : [def];
}

/**
 * ✅ Dynamic default locale (DB):
 * Priority:
 *  1) /site_settings/default-locale (if in activeLocales)
 *  2) /site_settings/app-locales[].is_default=true (active)
 *  3) app-locales[0]
 *  4) fallback "de"
 */
export const getDefaultLocale = cache(async (): Promise<string> => {
  const def = DEFAULT_LOCALE_FALLBACK;
  if (!API) return def;

  const [meta, defaultMeta] = await Promise.all([
    fetchJson<AppLocaleMeta[]>('/site_settings/app-locales', { revalidate: 600 }),
    fetchJson<string | null>('/site_settings/default-locale', { revalidate: 600 }),
  ]);

  const parsed = computeActiveLocales(meta);
  const active = parsed.activeLocales;
  const activeSet = new Set(active.map(normLocaleTag));

  const fromDefaultEndpoint = normLocaleTag(defaultMeta);
  if (fromDefaultEndpoint && activeSet.has(fromDefaultEndpoint)) return fromDefaultEndpoint;

  const fromAppIsDefault = normLocaleTag(parsed.preferredDefault);
  if (fromAppIsDefault && activeSet.has(fromAppIsDefault)) return fromAppIsDefault;

  const first = normLocaleTag(active?.[0]);
  return (first && activeSet.has(first) ? first : def) || def;
});

/**
 * ✅ Single request i18n context:
 * - activeLocales (META)
 * - defaultLocale (META + validation)
 * - detectedLocale (cookie > accept-language > defaultLocale)
 */
export const getServerI18nContext = cache(async () => {
  const h = await headers();
  const c = await cookies();

  const activeLocales = await fetchActiveLocales();
  const defaultLocale = await getDefaultLocale();

  const cookieLocale = c.get('NEXT_LOCALE')?.value;
  const fromCookie = pickFromCookie(cookieLocale, activeLocales);

  const detectedLocale =
    fromCookie ?? pickFromAcceptLanguage(h.get('accept-language'), activeLocales) ?? defaultLocale;

  return { activeLocales, defaultLocale, detectedLocale };
});

/**
 * ✅ Single setting fetcher (key + locale) — serverMetadata.ts bunu kullanıyor.
 * Endpoint varsayımı:
 *   GET /site_settings/by-key?key=seo&locale=tr
 */
export async function fetchSetting(
  key: string,
  locale: string,
  opts?: { revalidate?: number },
): Promise<SiteSettingRow | null> {
  const k = String(key || '').trim();
  const l = normLocaleTag(locale);
  if (!k) return null;

  const qs = `key=${encodeURIComponent(k)}&locale=${encodeURIComponent(
    l || DEFAULT_LOCALE_FALLBACK,
  )}`;
  const row = await fetchJson<SiteSettingRow | { data: SiteSettingRow }>(
    `/site_settings/by-key?${qs}`,
    {
      revalidate: opts?.revalidate ?? 600,
    },
  );

  if (!row) return null;
  if (typeof row === 'object' && row && 'data' in (row as any)) return (row as any).data ?? null;
  return row as SiteSettingRow;
}
