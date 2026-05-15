export interface DesignTokenColors {
  brand_primary: string;
  brand_primary_dark: string;
  brand_primary_light: string;
  brand_secondary: string;
  brand_secondary_dim: string;
  brand_secondary_light: string;
  brand_accent: string;        // plum (mystical accent — yeni: #3D2E47)
  gold_50?: string;
  gold_100?: string;
  gold_200?: string;
  gold_300?: string;
  gold_400?: string;
  gold_500?: string;
  gold_600?: string;
  gold_700?: string;
  gold_800?: string;
  gold_900?: string;
  sand_50?: string;
  sand_100?: string;
  sand_200?: string;
  sand_300?: string;
  sand_400?: string;
  sand_500?: string;
  sand_600?: string;
  sand_700?: string;
  sand_800?: string;
  sand_900?: string;
  bg_base: string;
  bg_deep: string;
  bg_surface: string;
  bg_surface_high: string;
  text_primary: string;
  text_secondary: string;
  text_muted: string;
  text_muted_soft: string;
  border: string;
  border_soft: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  // Dark theme variantları (opsiyonel — yoksa CSS [data-theme="dark"] bloğu fallback'e düşer)
  bg_base_dark?: string;
  bg_deep_dark?: string;
  bg_surface_dark?: string;
  bg_surface_high_dark?: string;
  text_primary_dark?: string;
  text_secondary_dark?: string;
  text_muted_dark?: string;
}

export interface DesignTokenTypography {
  font_display: string;
  font_serif: string;
  font_sans: string;
  font_mono: string;
  base_size: string;
}

export interface DesignTokenRadius {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  pill: string;
}

export interface DesignTokenShadows {
  soft: string;
  card: string;
  glow_primary: string;
  glow_gold: string;
}

export interface DesignTokenBranding {
  app_name: string;
  tagline: string;
  tagline_en: string;
  logo_url: string;
  favicon_url: string;
  theme_color: string;
  theme_color_dark?: string;   // PWA / meta — dark mode için ayrı (yeni)
  og_image_url: string;
  background_image?: string;   // Tema özel arka plan görseli (yeni)
}

export interface DesignTokens {
  version: string;
  colors: DesignTokenColors;
  typography: DesignTokenTypography;
  radius: DesignTokenRadius;
  shadows: DesignTokenShadows;
  branding: DesignTokenBranding;
}
