// =============================================================
// FILE: src/i18n/switchLocale.ts
// guezelwebdesign – Locale switcher (URL-prefix based) (DYNAMIC)
//  - Default locale prefixless destekli
//  - activeLocales verilirse strip işlemi strict olur
// =============================================================

'use client';

import type { NextRouter } from 'next/router';
import { stripLocalePrefix, type RuntimeLocale } from './url';
import { normLocaleTag } from './localeUtils';

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
 * ✅ Default locale prefixless kuralı:
 * - default => "/product"
 * - others  => "/en/product"
 *
 * defaultLocale belirlemek için:
 * - activeLocales[0] (useActiveLocales zaten default’u başa alıyor)
 */
export async function switchLocale(
  router: NextRouter,
  next: RuntimeLocale,
  activeLocales?: string[],
) {
  const asPath = safeAsPath(router.asPath);
  const { pathname, query, hash } = splitAsPath(asPath);

  const nextLoc = normLocaleTag(next) || 'tr';
  const actives = Array.isArray(activeLocales) ? activeLocales : [];
  const defaultLocale = normLocaleTag(actives[0]) || 'tr';

  // Mevcut path’i locale prefix’ten arındır (strict: activeLocales varsa)
  const cleanPath = stripLocalePrefix(pathname, actives);
  const base = cleanPath === '/' ? '' : cleanPath;

  // ✅ target üret
  const target =
    nextLoc === defaultLocale
      ? `${base || '/'}${query}${hash}` // prefixless
      : `/${nextLoc}${base}${query}${hash}`;

  // normalize: "/" garantisi
  const finalTarget = target.startsWith('/') ? target : `/${target}`;

  if (finalTarget === asPath) return;

  // Cookie yaz (Next.js i18n / kendi boot mantığın için faydalı)
  try {
    document.cookie = `NEXT_LOCALE=${encodeURIComponent(nextLoc)}; path=/; max-age=31536000`;
  } catch {
    // ignore
  }

  await router.push(finalTarget, finalTarget, { scroll: false });
}
