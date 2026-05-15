// =============================================================
// FILE: src/seo/serverUi.ts
// Server-only helpers to read UI sections (site_settings ui_*) for SEO metadata
// =============================================================
import 'server-only';

import { cache } from 'react';

import { fetchSetting, getDefaultLocale, type JsonLike } from '@/i18n/server';
import { FALLBACK_LOCALE, isValidUiText, safeStr, normLocaleShort } from '@/integrations/shared';

function parseUiObject(v: JsonLike): Record<string, unknown> {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return {};
    try {
      const j = JSON.parse(s);
      if (j && typeof j === 'object' && !Array.isArray(j)) return j as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  return {};
}

export const fetchUiSectionObject = cache(
  async (key: string, locale: string): Promise<Record<string, unknown>> => {
    const k = safeStr(key);
    if (!k) return {};

    const defaultLocale = await getDefaultLocale();
    const loc = normLocaleShort(locale, defaultLocale);

    const tryLocales = [loc, '*', defaultLocale, FALLBACK_LOCALE].filter(Boolean);
    for (const l of tryLocales) {
      const row = await fetchSetting(k, l, { revalidate: 600 });
      if (row?.value == null) continue;
      const obj = parseUiObject(row.value as any);
      if (Object.keys(obj).length) return obj;
    }

    return {};
  },
);

export function readUiText(ui: Record<string, unknown>, key: string, fallback = ''): string {
  const k = safeStr(key);
  const raw = safeStr((ui as any)?.[k]);
  if (isValidUiText(raw, k)) return raw;

  const fb = safeStr(fallback);
  return fb || '';
}
