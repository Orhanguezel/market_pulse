// =============================================================
// FILE: src/types/common.ts  (DYNAMIC)
// =============================================================

export type SupportedLocale = string;

/** Çok dilli alan: locale -> text */
export type TranslatedLabel = Record<string, string>;
export type StrictTranslatedLabel = Record<string, string>;

export function norm(v: unknown): string {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
}

/**
 * Display-only (best-effort) label map.
 * Bu liste karar mekanizması değildir; DB’den gelen label varsa onu kullanın.
 */
const DISPLAY_LABELS: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
};

/**
 * Display-only date format hints (opsiyonel).
 * Bilinmeyen locale => ISO benzeri güvenli format.
 */
const DISPLAY_DATE_FORMATS: Record<string, string> = {
  tr: 'dd.MM.yyyy',
  de: 'dd.MM.yyyy',
  en: 'yyyy-MM-dd',
};

/**
 * Intl locale mapping (best-effort).
 * Bilinmeyen locale: önce full tag'ı dene (örn "pt-br"),
 * yoksa kısa tag üstünden üret (örn "pt"),
 * yine yoksa "en-US".
 */
const DISPLAY_INTL_MAP: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
};

export function getLanguageLabel(locale: SupportedLocale, fallback = 'English'): string {
  const lFull = norm(locale);
  const l = lFull.split('-')[0] || '';
  return DISPLAY_LABELS[lFull] || DISPLAY_LABELS[l] || fallback;
}

export function getDateFormatHint(locale: SupportedLocale, fallback = 'yyyy-MM-dd'): string {
  const lFull = norm(locale);
  const l = lFull.split('-')[0] || '';
  return DISPLAY_DATE_FORMATS[lFull] || DISPLAY_DATE_FORMATS[l] || fallback;
}

export function getIntlLocale(locale: SupportedLocale, fallback = 'en-US'): string {
  const lFull = norm(locale);
  const l = lFull.split('-')[0] || '';

  // önce tam eşleşme, sonra kısa eşleşme
  const mapped = DISPLAY_INTL_MAP[lFull] || DISPLAY_INTL_MAP[l];
  if (mapped) return mapped;

  // hiç map yoksa: full tag'ı Intl'e verilebilir durumda ise onu kullan
  if (lFull) return lFull;

  return fallback;
}

/**
 * Çok dilli alanlarda fallback okuma
 * Fallback sırası:
 *  1) istenen lang (full)
 *  2) istenen lang (short)
 *  3) tr
 *  4) en
 *  5) ilk değer
 */
export function getMultiLang(
  obj?: Record<string, string> | null,
  lang?: SupportedLocale | null,
): string {
  if (!obj) return '—';

  const lFull = norm(lang);
  const l = lFull.split('-')[0] || '';

  if (lFull && obj[lFull]) return obj[lFull];
  if (l && obj[l]) return obj[l];

  return obj.tr || obj.en || Object.values(obj)[0] || '—';
}
