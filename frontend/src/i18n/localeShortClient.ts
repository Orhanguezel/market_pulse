// =============================================================
// FILE: src/i18n/localeShortClient.ts
// – Locale normalize helper (CLIENT SAFE, NO HOOKS)
// - NO toShortLocale
// - Uses normLocaleTag
// =============================================================

import { normLocaleTag, safeStr } from '@/integrations/shared';

export function localeShortClient(v: unknown): string {
  const raw = safeStr(v);
  if (!raw) return '';
  return normLocaleTag(raw) || '';
}

export function localeShortClientOr(v: unknown, fallback = 'tr'): string {
  return localeShortClient(v) || fallback;
}
