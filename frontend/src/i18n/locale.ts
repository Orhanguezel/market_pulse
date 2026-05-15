// =============================================================
// FILE: src/i18n/locale.ts  (DYNAMIC via META endpoints) - PROVIDER SAFE
// FIX: avoid "useInsertionEffect must not schedule updates"
//      by using useSyncExternalStore instead of setState in location listeners
// FIX: Replace per-component raw fetch() with RTK Query hooks to
//      deduplicate app-locales / default-locale across all components.
//      Previously each component instance fired 2 separate fetch() calls,
//      causing 20+ duplicate requests → 429 rate-limit errors.
// =============================================================
'use client';

import { useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { FALLBACK_LOCALE, normLocaleTag, normalizeLocales, resolveDefaultLocale } from '@/integrations/shared';
import {
  useGetAppLocalesPublicQuery,
  useGetDefaultLocalePublicQuery,
} from '@/integrations/rtk/hooks';

type AppLocaleMeta = {
  code?: unknown;
  label?: unknown;
  is_default?: unknown;
  is_active?: unknown;
};

function readLocaleFromPath(pathname: string): string {
  const p = String(pathname || '/').trim();
  const seg = p.replace(/^\/+/, '').split('/')[0] || '';
  return normLocaleTag(seg);
}

function readLocaleFromCookie(): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return m ? normLocaleTag(decodeURIComponent(m[1])) : '';
}

function readLocaleFromQuery(): string {
  if (typeof window === 'undefined') return '';
  try {
    const usp = new URLSearchParams(window.location.search || '');
    return normLocaleTag(usp.get('__lc'));
  } catch {
    return '';
  }
}

function computeActiveLocales(meta: any[] | undefined): string[] {
  const fb = normLocaleTag(FALLBACK_LOCALE) || 'tr';
  const normalized = normalizeLocales(meta);
  return normalized.length ? normalized : [fb];
}



export function useResolvedLocale(explicitLocale?: string | null): string {
  // ✅ Next.js route param — SSR'da da doğru locale verir (hydration fix)
  const params = useParams();
  const routeLocale = typeof params?.locale === 'string' ? normLocaleTag(params.locale) : '';

  // ✅ usePathname() — Next.js App Router native, no history patching needed
  const pathname = usePathname() ?? '/';

  // ✅ RTK Query: tüm component'ler aynı cache'i paylaşır, duplicate istek yok
  const { data: appLocalesData } = useGetAppLocalesPublicQuery();
  const { data: defaultLocaleData } = useGetDefaultLocalePublicQuery();

  const appLocalesMeta = useMemo<AppLocaleMeta[] | null>(() => {
    if (!appLocalesData || !Array.isArray(appLocalesData)) return null;
    return appLocalesData.length ? (appLocalesData as AppLocaleMeta[]) : null;
  }, [appLocalesData]);

  const defaultLocaleMeta = useMemo<string | null>(() => {
    if (defaultLocaleData == null) return null;
    if (typeof defaultLocaleData === 'string') return normLocaleTag(defaultLocaleData) || null;
    return null;
  }, [defaultLocaleData]);

  return useMemo(() => {
    // pathname dependency is needed to re-evaluate query/cookie rules on navigation
    void pathname;

    const activeLocales = computeActiveLocales((appLocalesMeta || []) as any);
    const activeSet = new Set(activeLocales.map(normLocaleTag));

    // 0) EXPLICIT LOCALE (highest priority - SSR-passed locale from layout)
    // This ensures server and client use the same locale during hydration
    const fromExplicit = normLocaleTag(explicitLocale);
    if (fromExplicit && (!appLocalesMeta || activeSet.has(fromExplicit))) return fromExplicit;

    // 1) ROUTE PARAM (Next.js [locale] — SSR + client, hydration-safe)
    // SSR'da appLocalesMeta henüz yüklenmemiş olabilir → route param'a koşulsuz güven
    if (routeLocale && (!appLocalesMeta || activeSet.has(routeLocale))) return routeLocale;

    // 2) PATH PREFIX (client-side navigation fallback)
    const fromPath = readLocaleFromPath(pathname);
    if (fromPath && activeSet.has(fromPath)) return fromPath;

    // 3) __lc query (rewrite source)
    const fromQuery = readLocaleFromQuery();
    if (fromQuery && activeSet.has(fromQuery)) return fromQuery;

    // 4) cookie
    const fromCookie = readLocaleFromCookie();
    if (fromCookie && activeSet.has(fromCookie)) return fromCookie;

    // 5) DB default (validated against app_locales)
    const candDefault =
      resolveDefaultLocale(defaultLocaleMeta, appLocalesMeta) || normLocaleTag(defaultLocaleMeta);
    if (candDefault && activeSet.has(normLocaleTag(candDefault))) return normLocaleTag(candDefault);

    // 6) first active
    const firstActive = normLocaleTag(activeLocales[0]);
    if (firstActive) return firstActive;

    return normLocaleTag(FALLBACK_LOCALE) || 'tr';
  }, [routeLocale, pathname, explicitLocale, appLocalesMeta, defaultLocaleMeta]);
}
