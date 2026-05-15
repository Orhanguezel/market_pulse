// =============================================================
// FILE: src/layout/Layout.tsx
// Public Layout (CENTRAL SEO / SINGLE SOURCE)
// - ✅ ui_common KALDIRILDI (site_settings.site_meta_default kullanılır)
// - ✅ Default meta/title/desc: site_meta_default (locale -> '*' fallback)
// - ✅ Logo: site_logo(*) dinamik (LCP: Header/SiteLogo priority; ayrı link preload yok)
// - ✅ PERF: site_settings batch listSiteSettings (2 query)
// - ✅ Canonical + og:url + hreflang SSR tek kaynak: _document (Pages Router)
// - ✅ DB-driven SEO: seo/site_seo (locale -> '*' fallback)
// - ✅ DB-driven Brand/Contact/Socials: locale -> '*' fallback
// - ✅ Icons: GLOBAL '*'
// - ✅ RTK refetchOnFocus/reconnect/mountOrArgChange OFF
// - ✅ SEO overrides: layoutSeoStore (LayoutSeoBridge) + optional Layout props
// - ✅ No inline styles
// =============================================================

'use client';

import React, { Fragment, useMemo, useSyncExternalStore } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from './header/Header';
import FooterTwo from './footer/Footer';
import ScrollProgress from './ScrollProgress';

import { SiteIconsHead } from '@/seo';

import { useListSiteSettingsQuery } from '@/integrations/rtk/hooks';
import type { SettingValue, SiteSettingRow } from '@/integrations/shared';
import { safeStr, asObj, siteUrlBase, absoluteUrl, normLocaleShort } from '@/integrations/shared';

import { buildCanonical } from '@/seo';
import { buildMeta, filterClientHeadSpecs, type MetaInput } from '@/seo';

// ✅ i18n
import { useLocaleShort } from '@/i18n';
import { FALLBACK_LOCALE } from '@/integrations/shared';

// ✅ JSON-LD
import { JsonLd, graph, org, website, sameAsFromSocials } from '@/seo';

// ✅ SEO SCHEMA HELPERS (DB-backed)
import { parseSeoFromSettings, DEFAULT_SITE_META_DEFAULT_BY_LOCALE } from '@/integrations/shared/seoSchema';
import { getOrgJsonLdDescription, getPlaceholderSameAsUrls, getPublicAppName } from '@/lib/site-config';

// ✅ Store-based page overrides (LayoutSeoBridge)
import { getLayoutSeoSnapshot, subscribeLayoutSeo, type LayoutSeoOverrides } from '@/seo';

type SimpleBrand = {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  socials?: Record<string, string>;
};

type LayoutProps = {
  children: React.ReactNode;

  /**
   * Optional page overrides (legacy / optional)
   * NOTE: store overrides (LayoutSeoBridge) take priority over these props.
   */
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;

  /**
   * Optional brand overrides (rare; mostly DB)
   */
  brand?: SimpleBrand;
};

const FALLBACK_FAVICON = '/favicon.svg';

function cleanString(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  return String(v).trim();
}

function getSafeLocale(lc: unknown): string {
  const v = cleanString(lc);
  const fb = cleanString(FALLBACK_LOCALE) || 'tr';
  return v || fb;
}

function toAbsoluteMaybe(u: string): string {
  const v = safeStr(u);
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return absoluteUrl(v);
}

function cleanSocials(input: Record<string, any> | null | undefined): Record<string, string> {
  const obj = input && typeof input === 'object' ? input : {};
  const out: Record<string, string> = {};
  for (const k of Object.keys(obj)) {
    const v = cleanString((obj as any)[k]);
    if (!v) continue;
    out[k] = v;
  }
  return out;
}

/**
 * site_settings.value için desteklenen formatlar:
 *  - "https://..." (string URL)
 *  - { url, width?, height? }
 *  - "{ \"url\": \"...\", \"width\": 160, \"height\": 60 }"
 */
function extractMediaUrl(val: SettingValue | null | undefined): string {
  if (val === null || val === undefined) return '';

  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return '';

    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));
    if (!looksJson) return s;

    try {
      const parsed = JSON.parse(s);
      return safeStr((parsed as any)?.url);
    } catch {
      return s;
    }
  }

  if (typeof val === 'object') {
    return safeStr((val as any)?.url);
  }

  return '';
}

function extractJson(val: SettingValue | null | undefined): any {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') return val;

  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return null;

    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));
    if (!looksJson) return null;

    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }

  return null;
}

/* -----------------------------
   RTK stable query options
----------------------------- */

const STABLE_QUERY_OPTS = {
  refetchOnFocus: false,
  refetchOnReconnect: false,
  refetchOnMountOrArgChange: false,
} as const;

/* -----------------------------
   Helpers: rows -> map
----------------------------- */

function rowsToMap(rows: SiteSettingRow[] | undefined): Record<string, SettingValue> {
  const out: Record<string, SettingValue> = {};
  const arr = Array.isArray(rows) ? rows : [];
  for (const r of arr) {
    const k = safeStr((r as any)?.key);
    if (!k) continue;
    out[k] = (r as any)?.value as SettingValue;
  }
  return out;
}

function pickSetting(
  localeMap: Record<string, SettingValue>,
  globalMap: Record<string, SettingValue>,
  key: string,
): SettingValue | null {
  const a = localeMap[key];
  if (a !== null && a !== undefined) return a;
  const b = globalMap[key];
  if (b !== null && b !== undefined) return b;
  return null;
}

/* -----------------------------
   Error Boundary
----------------------------- */

class LayoutErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: any) {
    // eslint-disable-next-line no-console
    console.error('[LayoutErrorBoundary] child render error:', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="container py-4">
            <h1 className="mb-2">Something went wrong</h1>
            <p className="mb-0">The page content failed to render. Please refresh and try again.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default function Layout({
  children,
  title,
  description,
  ogImage,
  noindex,
  brand,
}: LayoutProps) {
  const router = useRouter();
  const isProd = process.env.NODE_ENV === 'production';

  // ✅ Store overrides (LayoutSeoBridge) — navigation-safe
  const storeOverrides: LayoutSeoOverrides = useSyncExternalStore(
    subscribeLayoutSeo,
    getLayoutSeoSnapshot,
    getLayoutSeoSnapshot,
  );

  // ✅ merge (store has priority)
  const effectiveTitleProp = storeOverrides.title ?? title;
  const effectiveDescProp = storeOverrides.description ?? description;
  const effectiveOgProp = storeOverrides.ogImage ?? ogImage;
  const effectiveNoindexProp =
    typeof storeOverrides.noindex === 'boolean' ? storeOverrides.noindex : noindex;

  // ✅ Locale
  const locale = getSafeLocale(useLocaleShort());

  // ------------------------------------------------------------
  // ✅ PERF: Batch fetch site_settings (2 query)
  // - Query 1: locale-specific keys
  // - Query 2: global '*' keys (also acts as fallback for locale keys)
  // ------------------------------------------------------------

  const LOCALE_KEYS = useMemo(
    () => [
      'seo',
      'site_seo',
      'site_meta_default', // ✅ new default title/desc fallback
      'contact_info',
      'company_brand',
      'socials',
    ],
    [],
  );

  const GLOBAL_KEYS = useMemo(
    () => [
      // icons + site media
      'site_logo',
      'site_logo_dark',
      'site_logo_light',
      'site_favicon',
      'site_og_default_image',

      // fallback for locale keys
      'seo',
      'site_seo',
      'site_meta_default',
      'contact_info',
      'company_brand',
      'socials',
    ],
    [],
  );

  const { data: localeRows } = useListSiteSettingsQuery(
    { locale, keys: LOCALE_KEYS },
    STABLE_QUERY_OPTS,
  );

  const { data: globalRows } = useListSiteSettingsQuery(
    { locale: '*', keys: GLOBAL_KEYS },
    STABLE_QUERY_OPTS,
  );

  const localeMap = useMemo(() => rowsToMap(localeRows as any), [localeRows]);
  const globalMap = useMemo(() => rowsToMap(globalRows as any), [globalRows]);

  // ------------------------------------------------------------
  // ✅ site_meta_default (locale -> '*' fallback)
  // ------------------------------------------------------------

  const metaDefault = useMemo(() => {
    const raw = pickSetting(localeMap, globalMap, 'site_meta_default');
    const obj = extractJson(raw) || {};
    return {
      title: cleanString((obj as any).title),
      description: cleanString((obj as any).description),
      keywords: cleanString((obj as any).keywords),
    };
  }, [localeMap, globalMap]);

  // ------------------------------------------------------------
  // ✅ SEO (seo -> site_seo fallback, locale -> '*' fallback)
  // ------------------------------------------------------------

  const seo = useMemo(() => {
    const raw =
      pickSetting(localeMap, globalMap, 'seo') ??
      pickSetting(localeMap, globalMap, 'site_seo') ??
      null;

    return parseSeoFromSettings(raw as any);
  }, [localeMap, globalMap]);

  const seoTitleDefault = useMemo(() => cleanString(seo.title_default), [seo.title_default]);
  const seoDescription = useMemo(() => cleanString(seo.description), [seo.description]);
  const seoSiteName = useMemo(() => cleanString(seo.site_name), [seo.site_name]);

  const ogLegacyImage = useMemo(() => {
    const ogObj = asObj(seo.open_graph) || {};
    return cleanString((ogObj as any)?.image);
  }, [seo.open_graph]);

  const ogImagesArrFirst = useMemo(() => {
    const ogObj = asObj(seo.open_graph) || {};
    const arr = Array.isArray((ogObj as any).images) ? (ogObj as any).images : [];
    return arr?.[0] ? cleanString(arr[0]) : '';
  }, [seo.open_graph]);

  const twCard = useMemo(() => {
    const twObj = asObj(seo.twitter) || {};
    return cleanString((twObj as any).card) || 'summary_large_image';
  }, [seo.twitter]);

  const twSite = useMemo(() => {
    const twObj = asObj(seo.twitter) || {};
    return cleanString((twObj as any).site);
  }, [seo.twitter]);

  const twCreator = useMemo(() => {
    const twObj = asObj(seo.twitter) || {};
    return cleanString((twObj as any).creator);
  }, [seo.twitter]);

  // ------------------------------------------------------------
  // ✅ Final SEO values (page overrides take precedence)
  // Fallback order:
  // - store/prop overrides
  // - seo.title_default / seo.description
  // - site_meta_default (locale -> '*' fallback)
  // - hard fallback
  // ------------------------------------------------------------

  const finalTitle = useMemo(() => {
    const loc = normLocaleShort(String(locale), FALLBACK_LOCALE);
    const hardFb =
      DEFAULT_SITE_META_DEFAULT_BY_LOCALE[loc]?.title ||
      DEFAULT_SITE_META_DEFAULT_BY_LOCALE.en?.title ||
      DEFAULT_SITE_META_DEFAULT_BY_LOCALE.tr?.title ||
      getPublicAppName();
    return cleanString(effectiveTitleProp) || seoTitleDefault || metaDefault.title || hardFb;
  }, [effectiveTitleProp, seoTitleDefault, metaDefault.title, locale]);

  const finalDescription = useMemo(() => {
    const loc = normLocaleShort(String(locale), FALLBACK_LOCALE);
    const hardFb =
      DEFAULT_SITE_META_DEFAULT_BY_LOCALE[loc]?.description ||
      DEFAULT_SITE_META_DEFAULT_BY_LOCALE.en?.description ||
      DEFAULT_SITE_META_DEFAULT_BY_LOCALE.tr?.description ||
      '';
    return cleanString(effectiveDescProp) || seoDescription || metaDefault.description || hardFb;
  }, [effectiveDescProp, seoDescription, metaDefault.description, locale]);

  const resolvedOgImage = useMemo(() => {
    const direct = cleanString(effectiveOgProp);
    if (direct) return direct;
    if (ogLegacyImage) return ogLegacyImage;
    if (ogImagesArrFirst) return ogImagesArrFirst;

    // ✅ final fallback: site_og_default_image (*)
    const ogDefault = extractMediaUrl((globalMap.site_og_default_image as SettingValue) ?? null);
    return cleanString(ogDefault) || '';
  }, [effectiveOgProp, ogLegacyImage, ogImagesArrFirst, globalMap.site_og_default_image]);

  // ------------------------------------------------------------
  // ✅ Icons (GLOBAL '*')
  // ------------------------------------------------------------

  const iconUrls = useMemo(() => {
    const faviconUrl =
      extractMediaUrl((globalMap.site_favicon as SettingValue) ?? null) || FALLBACK_FAVICON;

    const appleTouchUrl = extractMediaUrl(
      (globalMap.site_apple_touch_icon as SettingValue) ?? null,
    );

    const appIcon512Url = extractMediaUrl((globalMap.site_app_icon_512 as SettingValue) ?? null);

    return {
      faviconUrl: safeStr(faviconUrl) || FALLBACK_FAVICON,
      appleTouchUrl: safeStr(appleTouchUrl),
      appIcon512Url: safeStr(appIcon512Url),
    };
  }, [globalMap.site_favicon, globalMap.site_apple_touch_icon, globalMap.site_app_icon_512]);

  // ------------------------------------------------------------
  // ✅ Brand/Contact/Socials (locale -> '*' fallback; brand prop can override)
  // ------------------------------------------------------------

  const normalizedBrand = useMemo(() => {
    const contact = (pickSetting(localeMap, globalMap, 'contact_info') ?? {}) as any;
    const brandVal = (pickSetting(localeMap, globalMap, 'company_brand') ?? {}) as any;
    const socialsVal = (pickSetting(localeMap, globalMap, 'socials') ?? {}) as any;

    const name =
      cleanString(brandVal?.name) || cleanString(contact?.companyName) || getPublicAppName();

    const website =
      cleanString(brandVal?.website) || cleanString(contact?.website) || siteUrlBase();

    const phones = Array.isArray(contact?.phones) ? contact.phones : [];
    const phoneVal =
      cleanString(brandVal?.phone) ||
      cleanString(phones?.[0]) ||
      cleanString(contact?.whatsappNumber) ||
      '';

    const emailVal = cleanString(brandVal?.email) || cleanString(contact?.email) || '';

    const mergedSocials = {
      ...cleanSocials(asObj(socialsVal) as any),
      ...cleanSocials(asObj(brandVal?.socials) as any),
    };

    return {
      name,
      website,
      phone: phoneVal,
      email: emailVal,
      socials: mergedSocials,
    } as SimpleBrand;
  }, [localeMap, globalMap]);

  const effectiveBrand: SimpleBrand = useMemo(() => {
    if (!brand) return normalizedBrand;

    const mergedSocials = {
      ...(normalizedBrand.socials || {}),
      ...cleanSocials(brand.socials || {}),
    };

    return { ...normalizedBrand, ...brand, socials: mergedSocials };
  }, [brand, normalizedBrand]);

  // ------------------------------------------------------------
  // ✅ Logo (GLOBAL '*') + optional override prop
  // ------------------------------------------------------------

  const siteLogoUrl = useMemo(() => {
    return extractMediaUrl((globalMap.site_logo as SettingValue) ?? null);
  }, [globalMap.site_logo]);

  // ------------------------------------------------------------
  // ✅ Head Meta specs
  // ------------------------------------------------------------

  const headMetaSpecs = useMemo(() => {
    const meta: MetaInput = {
      title: finalTitle,
      description: finalDescription,
      image: resolvedOgImage ? toAbsoluteMaybe(resolvedOgImage) : undefined,
      siteName: seoSiteName || effectiveBrand.name || getPublicAppName(),
      noindex: !!effectiveNoindexProp,
      twitterCard: twCard,
      twitterSite: twSite || undefined,
      twitterCreator: twCreator || undefined,
    };

    // Safety: canonical/hreflang/og:url client'ta basılmasın
    return filterClientHeadSpecs(buildMeta(meta));
  }, [
    finalTitle,
    finalDescription,
    resolvedOgImage,
    seoSiteName,
    effectiveBrand.name,
    effectiveNoindexProp,
    twCard,
    twSite,
    twCreator,
  ]);

  // ------------------------------------------------------------
  // ✅ JSON-LD
  // ------------------------------------------------------------

  const jsonLdData = useMemo(() => {
    const base = siteUrlBase();
    const orgId = `${base}#org`;
    const websiteId = `${base}#website`;

    const placeholderSameAs = getPlaceholderSameAsUrls();
    const sameAs = sameAsFromSocials(effectiveBrand.socials || null);

    return graph([
      org({
        id: orgId,
        name: effectiveBrand.name || getPublicAppName(),
        url: cleanString(effectiveBrand.website) || base,
        logo: siteLogoUrl || undefined,
        sameAs: sameAs.length ? sameAs : placeholderSameAs,
        description: getOrgJsonLdDescription(String(locale)),
        priceRange: '₺149-₺3500',
        areaServed: 'TR',
      }),
      website({
        id: websiteId,
        name: effectiveBrand.name || getPublicAppName(),
        url: base,
        publisherId: orgId,
        searchUrlTemplate: `${base}/tr/dashboard?q={q}`,
      }),
    ]);
  }, [effectiveBrand.name, effectiveBrand.website, effectiveBrand.socials, siteLogoUrl, locale]);

  // ------------------------------------------------------------
  // ✅ Error fallback UI (no ui_common)
  // ------------------------------------------------------------

  const errorFallback = useMemo(() => {
    return (
      <div className="container py-4">
        <h1 className="mb-2">Something Went Wrong</h1>
        <p className="mb-3">An unexpected error occurred. Please refresh the page and try again.</p>
        <button
          type="button"
          className="solid__btn d-inline-flex align-items-center"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }, []);

  // ✅ Debug canonical (dev only)
  const debugCanonicalAbs = useMemo(() => {
    if (isProd) return '';

    const lcHint =
      typeof router.query?.__lc === 'string'
        ? router.query.__lc
        : Array.isArray(router.query?.__lc)
          ? router.query.__lc[0]
          : '';

    return buildCanonical({
      asPath: router.asPath,
      locale,
      fallbackPathname: '/',
      lcHint,
    });
  }, [isProd, router.asPath, router.query?.__lc, locale]);

  return (
    <Fragment>
      <Head>
        <meta name="app:layout" content="public" />

        <SiteIconsHead
          faviconUrl={iconUrls.faviconUrl}
          appleTouchUrl={iconUrls.appleTouchUrl}
          appIcon512Url={iconUrls.appIcon512Url}
        />

        <title>{finalTitle}</title>

        {/* ✅ Canonical + og:url + hreflang SSR tek kaynak: _document */}
        {headMetaSpecs.map((spec) => {
          if (spec.kind === 'link') {
            const k = `l:${spec.rel}:${spec.href}`;
            return <link key={k} rel={spec.rel} href={spec.href} />;
          }
          if (spec.kind === 'meta-name') {
            const k = `n:${spec.key}:${spec.value}`;
            return <meta key={k} name={spec.key} content={spec.value} />;
          }
          const k = `p:${spec.key}:${spec.value}`;
          return <meta key={k} property={spec.key} content={spec.value} />;
        })}

        <JsonLd id="global" data={jsonLdData} />

        {!isProd && debugCanonicalAbs ? (
          <meta name="debug:canonicalAbs" content={debugCanonicalAbs} />
        ) : null}
      </Head>

      <div className="my-app">
        <Header brand={effectiveBrand} />
        <main>
          <LayoutErrorBoundary fallback={errorFallback}>{children}</LayoutErrorBoundary>
        </main>
        <FooterTwo />
        <ScrollProgress />
      </div>
    </Fragment>
  );
}
