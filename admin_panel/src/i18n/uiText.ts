// =============================================================
// FILE: src/i18n/uiText.ts
// guezelwebdesign – UI text guards (shared)
// =============================================================

export function isValidUiText(value: unknown, key: string): boolean {
  const v = String(value ?? '').trim();
  if (!v) return false;

  // Missing durumda bazı helper’lar key'i aynen döndürür
  if (v === key) return false;

  // ui_xxx gibi key formatını direkt reject et
  if (/^ui_[a-z0-9_]+$/i.test(v)) return false;

  // "[key]" / "{{key}}" gibi placeholder dönebilir
  const normalized = v.replace(/\s+/g, '');
  if (normalized === `[${key}]`) return false;
  if (normalized === `{{${key}}}`) return false;

  return true;
}
