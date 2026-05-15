// =============================================================
// FILE: src/i18n/server.ts  (DYNAMIC DEFAULT FROM DB via META endpoints)
// =============================================================
import 'server-only';

import { cache } from 'react';
import { headers, cookies } from 'next/headers';

import {
  FALLBACK_LOCALE,
  normLocaleTag,
  normalizeLocales,
  resolveDefaultLocale,
  pickFromAcceptLanguage,
  pickFromCookie,
} from '@/integrations/shared';

import { getServerApiBase } from './apiBase.server';

const API = getServerApiBase();

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

function computeActiveLocales(meta: AppLocaleMeta[] | null | undefined): string[] {
  const def = FALLBACK_LOCALE;
  const out = normalizeLocales(meta);
  return out.length ? out : [def];
}

/**
 * DB: /site_settings/app-locales => active locales
 */
export async function fetchActiveLocales(): Promise<string[]> {
  const def = FALLBACK_LOCALE;
  if (!API) return [def];

  const meta = await fetchJson<AppLocaleMeta[]>('/site_settings/app-locales', { revalidate: 600 });
  const active = computeActiveLocales(meta);
  return active.length ? active : [def];
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
  const def = FALLBACK_LOCALE;
  if (!API) return def;

  const [meta, defaultMeta] = await Promise.all([
    fetchJson<AppLocaleMeta[]>('/site_settings/app-locales', { revalidate: 600 }),
    fetchJson<string | null>('/site_settings/default-locale', { revalidate: 600 }),
  ]);

  const active = computeActiveLocales(meta);
  const resolved = resolveDefaultLocale(defaultMeta, meta);
  return normLocaleTag(resolved) || normLocaleTag(active[0]) || def;
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
 * Endpoint:
 *   GET /site_settings/:key?locale=tr
 */
export async function fetchSetting(
  key: string,
  locale: string,
  opts?: { revalidate?: number },
): Promise<SiteSettingRow | null> {
  const k = String(key || '').trim();
  const l = normLocaleTag(locale);
  if (!k) return null;

  const loc = l || FALLBACK_LOCALE;

  // Preferred public route: GET /site_settings/:key?locale=de
  const row =
    (await fetchJson<SiteSettingRow | { data: SiteSettingRow }>(
      `/site_settings/${encodeURIComponent(k)}?locale=${encodeURIComponent(loc)}`,
      { revalidate: opts?.revalidate ?? 600 },
    )) ??
    // Legacy compatibility: GET /site_settings/by-key?key=seo&locale=de
    (await fetchJson<SiteSettingRow | { data: SiteSettingRow }>(
      `/site_settings/by-key?key=${encodeURIComponent(k)}&locale=${encodeURIComponent(loc)}`,
      { revalidate: opts?.revalidate ?? 600 },
    ));

  if (!row) return null;
  if (typeof row === 'object' && row && 'data' in (row as any)) return (row as any).data ?? null;
  return row as SiteSettingRow;
}
