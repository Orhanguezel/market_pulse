// =============================================================
// FILE: src/i18n/switchLocale.ts
// – Locale switcher (URL-prefix based) (DYNAMIC)
//  - ALWAYS "/{locale}/..." (matches app router: src/app/[locale]/...)
//  - activeLocales verilirse strip işlemi strict olur
// =============================================================

'use client';

import { localizePath, normLocaleTag, type RuntimeLocale } from '@/integrations/shared';

function safeAsPath(asPath?: string) {
  const v = String(asPath || '/').trim();
  return v.startsWith('/') ? v : `/${v}`;
}

function splitAsPath(asPath: string) {
  const s = String(asPath || '/');
  const [pathAndQuery, hash = ''] = s.split('#');
  const [pathname = '/', query = ''] = pathAndQuery.split('?');
  return {
    pathname: pathname || '/',
    query: query ? `?${query}` : '',
    hash: hash ? `#${hash}` : '',
  };
}

/**
 * ✅ Always "/{locale}/..." kuralı:
 * - App Router yapısı `src/app/[locale]/...` olduğu için prefix zorunlu.
 * - activeLocales verilirse strip işlemi strict olur.
 */
export async function switchLocale(
  router: { push: (url: string, opts?: any) => void; refresh?: () => void },
  currentPath: string,
  next: RuntimeLocale,
  activeLocales?: string[],
) {
  const asPath = safeAsPath(currentPath);
  const { pathname, query, hash } = splitAsPath(asPath);

  const nextLoc = normLocaleTag(next) || 'de';
  const actives = Array.isArray(activeLocales) ? activeLocales : [];
  const defaultLocale = normLocaleTag(actives[0]) || 'de';

  const finalTarget = localizePath(nextLoc, `${pathname}${query}${hash}`, actives, {
    defaultLocale,
  });

  if (finalTarget === asPath) return;

  // Cookie yaz (Next.js i18n / kendi boot mantığın için faydalı)
  try {
    const secure =
      typeof window !== 'undefined' && window.location && window.location.protocol === 'https:'
        ? '; secure'
        : '';
    document.cookie = `NEXT_LOCALE=${encodeURIComponent(nextLoc)}; path=/; max-age=31536000; samesite=lax${secure}`;
  } catch {
    // ignore
  }

  // App Router navigation (soft)
  await router.push(finalTarget, { scroll: false });

  // ✅ Ensure locale-dependent client data refetches
  // (RTK queries / UI strings / etc.), especially when only search/hash changes.
  try {
    router.refresh?.();
  } catch {
    // ignore
  }
}
