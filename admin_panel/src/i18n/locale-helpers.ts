// =============================================================
// FILE: src/i18n/locale-helpers.ts  (UPDATED)
// =============================================================

export { KNOWN_RTL } from './config';

export const SITE_NAME = (process.env.NEXT_PUBLIC_SITE_NAME || process.env.NEXT_PUBLIC_APP_NAME || 'Admin Panel').trim();

// ✅ test uyumu: localhost default port’suz
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost').replace(
  /\/+$/,
  '',
);

export const isRTL = (l: string) =>
  new Set(['ar', 'fa', 'he', 'ur', 'ckb', 'ps', 'sd', 'ug', 'yi', 'dv']).has(
    String(l || '').toLowerCase(),
  );

/**
 * <link rel="alternate" hreflang="..."> map’i
 * Not: Alternates’ı artık src/seo/alternates.ts DB’den üretiyor.
 * Bu helper sadece geriye dönük uyumluluk için duruyor.
 */
export function languageAlternates(defaultLocale: string) {
  const map: Record<string, string> = {};
  map['x-default'] = `/${defaultLocale}/`;
  return map;
}
