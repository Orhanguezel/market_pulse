import type { ThemeConfig } from './types';

/**
 * Varsayilan tema konfigurasyonu.
 * Frontend globals.css @theme token'lariyla birebir eslesir.
 * Turuncu (#F97316) + Lacivert (#0F2340) paleti, DM Sans font.
 */
export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    // Brand — Turuncu (frontend: --color-brand)
    primary: '#F97316',       // hsl(27 96% 53%) — butonlar, CTA
    primaryDark: '#D4610B',   // hsl(22 92% 44%) — hover
    accent: '#FEE8D6',        // hsl(27 96% 94%) — brand-light tint

    // Surface (frontend: --color-background, --color-surface, --color-bg-alt)
    background: '#F8FAFC',    // hsl(210 17% 98%) — sayfa bg
    surfaceBase: '#EEF2F7',   // hsl(210 17% 95%) — bg-alt section
    surfaceRaised: '#FFFFFF', // hsl(0 0% 100%) — kart yuzeyi
    surfaceMuted: '#FFF4ED',  // hsl(27 96% 97%) — brand-xlight zebra

    // Text (frontend: --color-foreground, --color-muted, --color-faint)
    textStrong: '#0F172A',    // hsl(215 28% 9%) — basliklar
    textBody: '#64748B',      // hsl(215 16% 47%) — govde (muted)
    textMuted: '#94A3B8',     // hsl(215 14% 66%) — soluk (faint)

    // Border (frontend: --color-border, --color-border-soft)
    border: '#CBD5E1',        // hsl(215 20% 88%)
    borderLight: '#E2E8F0',   // hsl(215 20% 94%)

    // Nav / Footer — Lacivert (frontend: --color-navy)
    navBg: '#0F2340',         // hsl(215 68% 16%)
    navFg: '#FFFFFF',
    footerBg: '#0F2340',      // hsl(215 68% 16%) — ayni lacivert
    footerFg: '#E2E8F0',      // hsl(215 20% 94%)

    // Status (frontend: --color-success, --color-warning, --color-danger)
    success: '#16A34A',       // hsl(142 76% 36%)
    warning: '#F59E0B',       // hsl(38 92% 50%)
    danger: '#EF4444',        // hsl(0 84% 60%)

    // Dark sections (frontend: surface-dark-shell, surface-hero-overlay)
    surfaceDarkBg: '#0F2340',       // navy
    surfaceDarkText: '#E2E8F0',     // border-soft (acik gri metin)
    surfaceDarkHeading: '#F97316',  // brand turuncu baslik
  },

  typography: {
    fontHeading: 'DM Sans, system-ui, -apple-system, sans-serif',
    fontBody: 'DM Sans, system-ui, -apple-system, sans-serif',
  },

  radius: '0.5rem',   // frontend: --radius
  darkMode: 'light',

  // Anasayfa section arka plan sirasi (frontend surface utility'leriyle uyumlu)
  sectionBackgrounds: [
    { key: 'hero', bg: 'transparent', overlay: 'rgba(15,35,64,0.7)' },
    { key: 'how_it_works', bg: '#FFFFFF' },
    { key: 'products_list', bg: '#EEF2F7' },
    { key: 'benefits', bg: '#FFFFFF' },
    { key: 'testimonials', bg: '#FFF4ED' },
    { key: 'faq', bg: '#FFFFFF' },
    { key: 'cta', bg: '#0F2340', textColor: '#FFFFFF', headingColor: '#F97316' },
  ],
};
