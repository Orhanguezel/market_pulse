import type { DesignTokens } from './types';

function cssValue(value: string | undefined): string {
  return String(value || '').replace(/[;{}]/g, '').trim();
}

/* ─── Renk türetme yardımcıları ──────────────────────────────────────────
 * Eksik gold_50..900 / sand_50..900 değerleri için brand renklerinden
 * sentetik scale üret. Hex'i HSL'e çevirip lightness'ı kademeli değiştirir.
 * Böylece tema seçen herkes (bazı dark preset'lerde scale eksik) tutarlı palet alır.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  const full = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const SCALE_LIGHTNESS = [97, 92, 84, 73, 60, 50, 42, 33, 24, 15] as const; // 50..900

/** Brand renginden 10 kademeli scale üret (50, 100, 200, ..., 900). */
function deriveScale(baseHex: string | undefined): string[] {
  if (!baseHex) return SCALE_LIGHTNESS.map(() => '#cccccc');
  const hsl = hexToHsl(baseHex);
  if (!hsl) return SCALE_LIGHTNESS.map(() => baseHex);
  // Saturation'ı orta-yüksek tut (renk canlılığı)
  const s = Math.max(35, Math.min(80, hsl.s));
  return SCALE_LIGHTNESS.map((l) => hslToHex(hsl.h, s, l));
}

/** Var olan token kullan, yoksa scale'den ilgili değer. */
function pickScale(provided: string | undefined, scale: string[], idx: number): string {
  return cssValue(provided) || scale[idx] || '#cccccc';
}

/**
 * DesignTokens → :root CSS variables string.
 * Dark theme variantları varsa [data-theme="dark"] bloğunda override yazılır.
 * globals.css'teki :root + [data-theme="dark"] hardcoded fallback'ler korunur.
 */
export function tokensToCSS(tokens: DesignTokens): string {
  const c = tokens.colors;
  const t = tokens.typography;
  const r = tokens.radius;
  const s = tokens.shadows;

  // Tüm preset'lerin tutarlı palet üretmesi için: gold scale brand_secondary'den,
  // sand scale brand_primary'den (ya da bg_base'den) sentetik türetilir. Preset
  // kendi tonlarını verdiyse onlar öncelikli.
  const goldScale = deriveScale(c.gold_500 || c.brand_secondary || c.brand_primary);
  const sandScale = deriveScale(c.sand_500 || c.brand_primary || c.bg_base);

  const lightVars = `
--gm-primary:${cssValue(c.brand_primary)};
--gm-primary-dark:${cssValue(c.brand_primary_dark)};
--gm-primary-light:${cssValue(c.brand_primary_light)};
--gm-primary-hover:${cssValue(c.brand_primary_dark)};
--gm-gold:${cssValue(c.brand_secondary)};
--gm-gold-dim:${cssValue(c.brand_secondary_dim)};
--gm-gold-light:${cssValue(c.brand_secondary_light)};
--gm-gold-deep:${cssValue(c.gold_800 || c.brand_primary_dark)};
--gm-accent:${cssValue(c.brand_accent)};
--gm-gold-50:${pickScale(c.gold_50, goldScale, 0)};
--gm-gold-100:${pickScale(c.gold_100, goldScale, 1)};
--gm-gold-200:${pickScale(c.gold_200, goldScale, 2)};
--gm-gold-300:${pickScale(c.gold_300, goldScale, 3)};
--gm-gold-400:${pickScale(c.gold_400, goldScale, 4)};
--gm-gold-500:${pickScale(c.gold_500, goldScale, 5)};
--gm-gold-600:${pickScale(c.gold_600, goldScale, 6)};
--gm-gold-700:${pickScale(c.gold_700, goldScale, 7)};
--gm-gold-800:${pickScale(c.gold_800, goldScale, 8)};
--gm-gold-900:${pickScale(c.gold_900, goldScale, 9)};
--gm-sand-50:${pickScale(c.sand_50, sandScale, 0)};
--gm-sand-100:${pickScale(c.sand_100, sandScale, 1)};
--gm-sand-200:${pickScale(c.sand_200, sandScale, 2)};
--gm-sand-300:${pickScale(c.sand_300, sandScale, 3)};
--gm-sand-400:${pickScale(c.sand_400, sandScale, 4)};
--gm-sand-500:${pickScale(c.sand_500, sandScale, 5)};
--gm-sand-600:${pickScale(c.sand_600, sandScale, 6)};
--gm-sand-700:${pickScale(c.sand_700, sandScale, 7)};
--gm-sand-800:${pickScale(c.sand_800, sandScale, 8)};
--gm-sand-900:${pickScale(c.sand_900, sandScale, 9)};
--gm-bg:${cssValue(c.bg_base)};
--gm-bg-deep:${cssValue(c.bg_deep)};
--gm-surface:${cssValue(c.bg_surface)};
--gm-surface-high:${cssValue(c.bg_surface_high)};
--gm-text:${cssValue(c.text_primary)};
--gm-text-dim:${cssValue(c.text_secondary)};
--gm-muted:${cssValue(c.text_muted)};
--gm-muted-soft:${cssValue(c.text_muted_soft)};
--gm-border:${cssValue(c.border)};
--gm-border-soft:${cssValue(c.border_soft)};
--gm-success:${cssValue(c.success)};
--gm-warning:${cssValue(c.warning)};
--gm-error:${cssValue(c.error)};
--gm-info:${cssValue(c.info)};
--gm-font-display:${cssValue(t.font_display)};
--gm-font-serif:${cssValue(t.font_serif)};
--gm-font-sans:${cssValue(t.font_sans)};
--gm-font-mono:${cssValue(t.font_mono)};
--gm-font-base-size:${cssValue(t.base_size)};
--gm-radius-xs:${cssValue(r.xs)};
--gm-radius-sm:${cssValue(r.sm)};
--gm-radius-md:${cssValue(r.md)};
--gm-radius-lg:${cssValue(r.lg)};
--gm-radius-xl:${cssValue(r.xl)};
--gm-radius-pill:${cssValue(r.pill)};
--gm-shadow-soft:${cssValue(s.soft)};
--gm-shadow-card:${cssValue(s.card)};
--gm-shadow-glow:${cssValue(s.glow_primary)};
--gm-shadow-gold:${cssValue(s.glow_gold)};
--gm-bg-image:${tokens.branding.background_image ? `url("${tokens.branding.background_image}")` : 'none'};
`.trim();

  // Dark theme override — bg/text/border alanları, brand renkleri aynı kalır
  const hasDark = c.bg_base_dark || c.text_primary_dark;
  const darkVars = hasDark
    ? `
--gm-bg:${cssValue(c.bg_base_dark)};
--gm-bg-deep:${cssValue(c.bg_deep_dark)};
--gm-surface:${cssValue(c.bg_surface_dark)};
--gm-surface-high:${cssValue(c.bg_surface_high_dark)};
--gm-text:${cssValue(c.text_primary_dark)};
--gm-text-dim:${cssValue(c.text_secondary_dark)};
--gm-muted:${cssValue(c.text_muted_dark)};
`.trim()
    : '';

  return `:root {\n${lightVars}\n}\n${darkVars ? `[data-theme="dark"] {\n${darkVars}\n}` : ''}`;
}
