import './globals.css';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { appFontVariableClassName } from '@/lib/fonts/app-fonts';
import { fetchSetting } from '@/i18n/server';
import { fetchDesignTokens } from '@/lib/tokens/fetchTokens.server';
import { detectThemeMode } from '@/lib/tokens/detectThemeMode';
import {
  getHtmlMetaDescriptionForLocale,
  getPublicSiteOrigin,
  getRootLayoutTitleDefault,
  getRootLayoutTitleTemplate,
} from '@/lib/site-config';

export async function generateViewport(): Promise<Viewport> {
  let themeColor = '#15803d';
  try {
    const row = await fetchSetting('design_tokens', '*', { revalidate: 300 });
    const raw = row?.value;
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    themeColor =
      obj?.branding?.theme_color || obj?.colors?.brand_primary || themeColor;
  } catch {
    // fallback to brand default
  }
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor,
  };
}

function extractUrl(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.startsWith('{')) {
      try { return (JSON.parse(s) as { url?: string }).url || ''; } catch { return s; }
    }
    return s;
  }
  if (typeof val === 'object') return String((val as { url?: string }).url || '');
  return '';
}

const SUPPORTED_LOCALES = ['tr', 'en', 'de'];

/** Extract locale from the request URL pathname (e.g. /en/about → "en") */
async function resolveHtmlLang(): Promise<string> {
  const h = await headers();
  const pathname = h.get('x-next-url') || h.get('x-invoke-path') || '';
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (SUPPORTED_LOCALES.includes(seg)) return seg;
  return 'tr';
}

export async function generateMetadata(): Promise<Metadata> {
  const favicon = await fetchSetting('site_favicon', '*');
  const faviconUrl = extractUrl(favicon?.value) || '/favicon.svg';

  const gscVerification = await fetchSetting('google_site_verification', '*');
  const gscCode = String(gscVerification?.value || '').trim();
  const bingVerification = await fetchSetting('bing_site_verification', '*');
  const bingCode = String(
    process.env.BING_SITE_VERIFICATION ||
    process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ||
    bingVerification?.value ||
    '',
  ).trim();

  const metadata: Metadata = {
    metadataBase: new URL(getPublicSiteOrigin()),
    title: {
      default: getRootLayoutTitleDefault(),
      template: getRootLayoutTitleTemplate(),
    },
    manifest: '/manifest.webmanifest',
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
  };

  if (gscCode) {
    metadata.verification = {
      google: gscCode,
    };
  }

  if (bingCode) {
    metadata.verification = {
      ...metadata.verification,
      other: {
        ...(metadata.verification?.other || {}),
        'msvalidate.01': bingCode,
      },
    };
  }

  return metadata;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await resolveHtmlLang();
  const htmlDescription = getHtmlMetaDescriptionForLocale(lang);
  // Tema mode'u design_tokens içindeki bg_base luminance'ından hesapla (preset'ten gelir).
  // Kullanıcı manuel toggle yaparsa client-side override eder (localStorage).
  const tokens = await fetchDesignTokens();
  const themeMode = detectThemeMode(tokens);
  return (
    <html
      lang={lang}
      data-theme={themeMode}
      data-scroll-behavior="smooth"
      className={appFontVariableClassName}
      suppressHydrationWarning
    >
      <head>
        <meta name="description" content={htmlDescription} />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
