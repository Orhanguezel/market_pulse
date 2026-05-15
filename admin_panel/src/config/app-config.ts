// =============================================================
// FILE: src/config/app-config.ts
// Admin Panel Config — DB'den gelen branding verileri için fallback
// =============================================================

import packageJson from '../../package.json';

const currentYear = new Date().getFullYear();
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Admin Panel';
const appCopyright = process.env.NEXT_PUBLIC_APP_COPYRIGHT || 'Platform';
const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Yonetim paneli.';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3094';

export type AdminBrandingConfig = {
  app_name: string;
  app_copyright: string;
  html_lang: string;
  theme_color: string;
  favicon_16: string;
  favicon_32: string;
  favicon_url: string;
  logo_url: string;
  apple_touch_icon: string;
  /** Giriş sayfası sol panel başlığı (boşsa çeviri: Tekrar hoş geldiniz). */
  admin_login_heading: string;
  /** Giriş sayfası sol panel alıntı metni. */
  admin_login_quote: string;
  /** Giriş arka plan görseli URL (boşsa /img/admin_login_bg.png). */
  admin_login_background_url: string;
  meta: {
    title: string;
    description: string;
    og_url: string;
    og_title: string;
    og_description: string;
    og_image: string;
    twitter_card: string;
  };
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const DEFAULT_BRANDING: AdminBrandingConfig = {
  app_name: appName,
  app_copyright: appCopyright,
  html_lang: 'tr',
  theme_color: '#15803d',
  favicon_16: `${basePath}/favicon/favicon-16.svg`,
  favicon_32: `${basePath}/favicon/favicon-32.svg`,
  favicon_url: `${basePath}/favicon.ico`,
  logo_url: '',
  apple_touch_icon: `${basePath}/favicon/apple-touch-icon.svg`,
  admin_login_heading: 'Pazar İstihbaratı ve Stratejik Analiz',
  admin_login_quote:
    'Veriye dayalı satış stratejileri ve churn analizi ile pazar hakimiyetinizi güçlendirin.',
  admin_login_background_url: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/admin_login_bg.png`,
  meta: {
    title: appName,
    description: appDescription,
    og_url: siteUrl,
    og_title: appName,
    og_description: appDescription,
    og_image: `${basePath}/favicon.svg`,
    twitter_card: 'summary_large_image',
  },
};

export const APP_CONFIG = {
  name: DEFAULT_BRANDING.app_name,
  version: packageJson.version,
  copyright: `© ${currentYear}, ${DEFAULT_BRANDING.app_copyright}.`,
  meta: {
    title: DEFAULT_BRANDING.meta.title,
    description: DEFAULT_BRANDING.meta.description,
  },
  branding: DEFAULT_BRANDING,
} as const;
