// =============================================================
// FILE: src/lib/tokens/detectThemeMode.ts
// Aktif tema preset'inin light mı dark mı olduğunu bg_base rengi
// luminance'ından hesaplar. Admin "active_theme_preset" değiştirdiğinde
// tokens.colors.bg_base güncellenir; bu fonksiyon doğru mode'u bulur.
// =============================================================

import type { DesignTokens } from './types';

export type ThemeMode = 'light' | 'dark';

/** WCAG luminance — bg renginden mode tespiti için kullanılır. */
function relativeLuminance(hex: string): number {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length !== 3 && cleaned.length !== 6) return 0.5;
  const full = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Aktif tema preset'inin mode'unu (light/dark) belirler.
 * Öncelik:
 *  1. Tokens'ta explicit `mode` field'ı varsa (gelecekte preset'lere eklenebilir)
 *  2. Tokens'ta `colors.mode` flag'i varsa (gelecek)
 *  3. `bg_base` luminance > 0.5 ise light, değilse dark
 *  4. Fallback: 'light' (varsayılan editoryal Klasik Altın light)
 */
export function detectThemeMode(tokens: DesignTokens | null | undefined): ThemeMode {
  if (!tokens) return 'light';

  // Future-proof: preset'e mode field'ı eklenirse direkt kullan
  const explicitMode = (tokens as any).mode || (tokens as any).colors?.mode;
  if (explicitMode === 'light' || explicitMode === 'dark') return explicitMode;

  const bg = tokens.colors?.bg_base;
  if (!bg || typeof bg !== 'string') return 'light';

  return relativeLuminance(bg) > 0.5 ? 'light' : 'dark';
}
