// =============================================================
// FILE: src/i18n/locale.ts  (DYNAMIC via META endpoints) - PROVIDER SAFE
// =============================================================
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FALLBACK_LOCALE } from './config';
import { normLocaleTag } from './localeUtils';
import { ensureLocationEventsPatched } from './locationEvents';
import {
  computeActiveLocales,
  normalizeAppLocalesMeta,
  normalizeDefaultLocaleValue,
  type AppLocaleMeta,
} from './app-locales-meta';

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

function getApiBase(): string {
  const raw =
    (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim() || (process.env.API_BASE_URL || '').trim();
  return raw.replace(/\/+$/, '');
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: 'omit', cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function useResolvedLocale(explicitLocale?: string | null): string {
  // pathname sadece SPA değişimini tetiklemek için tutuluyor
  const [pathname, setPathname] = useState<string>('/');

  const [appLocalesMeta, setAppLocalesMeta] = useState<AppLocaleMeta[] | null>(null);
  const [defaultLocaleMeta, setDefaultLocaleMeta] = useState<string | null>(null);

  const didFetchRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    ensureLocationEventsPatched();

    const read = () => setPathname(window.location.pathname || '/');

    read();

    window.addEventListener('locationchange', read);
    window.addEventListener('popstate', read);
    window.addEventListener('hashchange', read);

    return () => {
      window.removeEventListener('locationchange', read);
      window.removeEventListener('popstate', read);
      window.removeEventListener('hashchange', read);
    };
  }, []);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    const base = getApiBase();
    if (!base) return;

    (async () => {
      const [appLocalesRaw, defaultLocaleRaw] = await Promise.all([
        fetchJson<any>(`${base}/site_settings/app-locales`),
        fetchJson<any>(`${base}/site_settings/default-locale`),
      ]);

      const appArr = normalizeAppLocalesMeta(appLocalesRaw);
      const def = normalizeDefaultLocaleValue(defaultLocaleRaw);

      setAppLocalesMeta(appArr.length ? appArr : null);
      setDefaultLocaleMeta(def || null);
    })();
  }, []);

  return useMemo(() => {
    const activeLocales = computeActiveLocales((appLocalesMeta || []) as AppLocaleMeta[], FALLBACK_LOCALE);
    const activeSet = new Set(activeLocales.map(normLocaleTag));

    // ✅ 1) __lc query: rewrite’ın tek kaynağı
    const fromQuery = readLocaleFromQuery();
    if (fromQuery && activeSet.has(fromQuery)) return fromQuery;

    // ✅ 2) cookie
    const fromCookie = readLocaleFromCookie();
    if (fromCookie && activeSet.has(fromCookie)) return fromCookie;

    // ✅ 3) explicit
    const fromExplicit = normLocaleTag(explicitLocale);
    if (fromExplicit && activeSet.has(fromExplicit)) return fromExplicit;

    // ✅ 4) DB default
    const candDefault = normLocaleTag(defaultLocaleMeta);
    if (candDefault && activeSet.has(candDefault)) return candDefault;

    // ✅ 5) first active
    const firstActive = normLocaleTag(activeLocales[0]);
    if (firstActive) return firstActive;

    // ✅ 6) fallback
    return normLocaleTag(FALLBACK_LOCALE) || 'tr';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, explicitLocale, appLocalesMeta, defaultLocaleMeta]);
}
