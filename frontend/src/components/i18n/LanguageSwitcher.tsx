// =============================================================
// FILE: src/components/i18n/LanguageSwitcher.tsx
// =============================================================
'use client';

import React, { useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import { useActiveLocales, switchLocale } from '@/i18n';
import { normLocaleTag } from '@/integrations/shared';

function firstPathSeg(asPath?: string): string {
  const p = String(asPath || '/').trim();
  const seg = p.replace(/^\/+/, '').split(/[/?#]/)[0] || '';
  return normLocaleTag(seg);
}

/**
 * ✅ Default locale prefixless uyumlu current locale resolver:
 * - Eğer path’in ilk segmenti activeLocales içinde ise => o locale
 * - Değilse => defaultLocale (activeLocales[0])
 */
function resolveCurrentLocaleFromPath(asPath: string, activeLocales: string[]): string {
  const actives = (activeLocales || []).map(normLocaleTag).filter(Boolean);
  const activeSet = new Set(actives);

  const def = normLocaleTag(actives[0]) || 'de';
  const seg = firstPathSeg(asPath);

  if (seg && activeSet.has(seg)) return seg;
  return def;
}

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const asPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  const { locales, isLoading } = useActiveLocales();

  const activeLocales = useMemo(
    () => (locales || []).map(normLocaleTag).filter(Boolean),
    [locales],
  );

  const current = useMemo(() => {
    return resolveCurrentLocaleFromPath(asPath || '/', activeLocales);
  }, [asPath, activeLocales]);

  if (isLoading) return null;
  if (!activeLocales.length) return null;

  return (
    <nav aria-label="Language switcher">
      <ul className="list-inline m-0">
        {activeLocales.map((l) => {
          const code = normLocaleTag(l);
          const isCurrent = !!code && code === current;

          return (
            <li key={code} className="list-inline-item">
              <button
                type="button"
                onClick={() => switchLocale(router, asPath, code, activeLocales)}
                className="bg-transparent border-0 p-0 cursor-pointer"
                aria-current={isCurrent ? 'true' : undefined}
                aria-label={`Switch language to ${code.toUpperCase()}`}
              >
                {code.toUpperCase()}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
