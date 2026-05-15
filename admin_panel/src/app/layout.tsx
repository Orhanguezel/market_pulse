// =============================================================
// FILE: src/app/layout.tsx
// RootLayout — DB'den branding config ile dinamik metadata
// - generateMetadata() ile SSR'da DB'den meta bilgileri çekilir
// - ThemeBootScript runs before interactive via next/script
// - suppressHydrationWarning on html + body to tolerate extension-added attrs
// =============================================================

import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

import { Toaster } from '@/components/ui/sonner';
import { fontVars } from '@/lib/fonts/registry';
import { PREFERENCE_DEFAULTS } from '@/lib/preferences/preferences-config';
import { fetchBrandConfig, fetchBrandingConfig } from '@/server/fetch-branding';

import StoreProvider from '@/stores/Provider';
import { PreferencesStoreProvider } from '@/stores/preferences/preferences-provider';
import { LocaleProvider } from '@/i18n';

import './globals.css';

export async function generateViewport(): Promise<Viewport> {
  const branding = await fetchBrandingConfig();
  return { themeColor: branding.theme_color };
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchBrandingConfig();

  return {
    metadataBase: new URL(branding.meta.og_url || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3094'),
    title: branding.meta.title,
    description: branding.meta.description,
    icons: {
      icon: [
        { url: branding.favicon_url || '/favicon.ico', sizes: 'any' },
      ],
      apple: branding.apple_touch_icon,
    },
    openGraph: {
      type: 'website',
      url: branding.meta.og_url,
      title: branding.meta.og_title,
      description: branding.meta.og_description,
      images: [branding.meta.og_image],
    },
    twitter: {
      card: 'summary_large_image',
      title: branding.meta.og_title,
      description: branding.meta.og_description,
      images: [branding.meta.og_image],
    },
  };
}

function ThemeBootInlineScript() {
  const {
    theme_mode,
    theme_preset,
    content_layout,
    navbar_style,
    sidebar_variant,
    sidebar_collapsible,
    font,
  } = PREFERENCE_DEFAULTS;

  const code = `
(function () {
  try {
    var d = document.documentElement;

    // cookie reader helper
    function ck(n) {
      var m = document.cookie.match(new RegExp('(?:^|;\\\\s*)' + n + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    }

    // theme mode (cookie → localStorage → default)
    var mode = ck('theme_mode') || (function(){try{return localStorage.getItem('theme_mode')}catch(e){return null}})() || ${JSON.stringify(theme_mode)};
    if (mode === 'dark') d.classList.add('dark');
    else d.classList.remove('dark');

    // theme preset
    d.dataset.themePreset = ck('theme_preset') || ${JSON.stringify(theme_preset)};

    // layout & font from cookies or defaults
    d.dataset.contentLayout = ck('content_layout') || ${JSON.stringify(content_layout)};
    d.dataset.navbarStyle = ck('navbar_style') || ${JSON.stringify(navbar_style)};
    d.dataset.sidebarVariant = ck('sidebar_variant') || ${JSON.stringify(sidebar_variant)};
    d.dataset.sidebarCollapsible = ck('sidebar_collapsible') || ${JSON.stringify(sidebar_collapsible)};
    d.dataset.font = ck('font') || ${JSON.stringify(font)};

  } catch (e) {}
})();
`;

  return (
    <Script id="theme-boot" strategy="beforeInteractive">
      {code}
    </Script>
  );
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const branding = await fetchBrandingConfig();
  const brandConfig = await fetchBrandConfig();

  const { theme_preset, content_layout, navbar_style, sidebar_variant, sidebar_collapsible, font } =
    PREFERENCE_DEFAULTS;

  return (
    <html
      lang={branding.html_lang}
      suppressHydrationWarning
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
    >
      <head>
        <style>{`
          :root {
            --logo-coral: ${brandConfig.primaryHex};
            --brand-gold: ${brandConfig.accentHex};
            --sidebar: ${brandConfig.sidebarBgCss};
          }
          .dark {
            --logo-coral: ${brandConfig.primaryHexDark};
            --brand-gold: ${brandConfig.accentHexDark};
            /* Sidebar will fallback to the dark value in globals.css unless we explicitly override it here */
          }
        `}</style>
      </head>
      <body className={`${fontVars} min-h-screen antialiased`} suppressHydrationWarning>
        <ThemeBootInlineScript />

        <StoreProvider>
          <PreferencesStoreProvider>
            <LocaleProvider>
              {children}
              <Toaster />
            </LocaleProvider>
          </PreferencesStoreProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
