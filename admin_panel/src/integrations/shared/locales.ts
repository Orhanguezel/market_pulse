// =============================================================
// FILE: src/integrations/shared/locales.ts
// FINAL — app_locales value model + parser
// =============================================================

import type { JsonLike } from '@/integrations/shared';

export type AppLocale = {
  code: string; // 'tr' | 'en' | ...
  label: string; // 'Türkçe' | 'English' | ...
  is_default?: boolean;
  is_active?: boolean;
};

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function parseAppLocales(value: JsonLike | unknown): AppLocale[] {
  const v = value as unknown;

  if (!Array.isArray(v)) return [];

  const out: AppLocale[] = [];
  for (const item of v) {
    if (!isObj(item)) continue;

    const code = String(item.code ?? '').trim();
    const label = String(item.label ?? '').trim();
    if (!code || !label) continue;

    out.push({
      code,
      label,
      is_default: Boolean(item.is_default),
      is_active: item.is_active === undefined ? true : Boolean(item.is_active),
    });
  }

  return out;
}
