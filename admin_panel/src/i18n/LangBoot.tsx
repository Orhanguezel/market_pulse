// =============================================================
// FILE: src/i18n/LangBoot.tsx  (DYNAMIC via META endpoints)
// =============================================================
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/router';

import HtmlLangSync from './HtmlLangSync';
import { KNOWN_RTL } from './config';
import { FALLBACK_LOCALE } from './config';
import { normLocaleTag } from './localeUtils';
import { computeActiveLocales } from './app-locales-meta';
import { useGetAppLocalesAdminQuery, useGetDefaultLocaleAdminQuery } from '@/integrations/hooks';

function readLocaleFromPath(asPath?: string): string {
  const p = String(asPath || '/').trim();
  const seg = p.replace(/^\/+/, '').split('/')[0] || '';
  return normLocaleTag(seg);
}

export default function LangBoot() {
  const router = useRouter();

  const { data: appLocalesMeta } = useGetAppLocalesAdminQuery();
  const { data: defaultLocaleMeta } = useGetDefaultLocaleAdminQuery();

  const activeLocales = useMemo(
    () => computeActiveLocales(appLocalesMeta as any, FALLBACK_LOCALE),
    [appLocalesMeta],
  );

  const runtimeDefault = useMemo(() => {
    const activeSet = new Set(activeLocales.map(normLocaleTag));

    const cand = normLocaleTag(defaultLocaleMeta);
    if (cand && activeSet.has(cand)) return cand;

    const first = normLocaleTag(activeLocales[0]);
    if (first) return first;

    return normLocaleTag(FALLBACK_LOCALE) || 'tr';
  }, [defaultLocaleMeta, activeLocales]);

  const resolved = useMemo(() => {
    const fromPath = readLocaleFromPath(router.asPath);
    const activeSet = new Set(activeLocales.map(normLocaleTag));

    // ✅ active değilse path’i asla lang diye basma
    const lang = fromPath && activeSet.has(fromPath) ? fromPath : runtimeDefault;
    const dir = KNOWN_RTL.has(lang) ? 'rtl' : 'ltr';

    return { lang, dir };
  }, [router.asPath, activeLocales, runtimeDefault]);

  return <HtmlLangSync lang={resolved.lang} dir={resolved.dir as 'ltr' | 'rtl'} />;
}
