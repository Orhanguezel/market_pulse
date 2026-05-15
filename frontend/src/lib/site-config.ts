/**
 * Marka ve varsayılan site metinleri: önce env (NEXT_PUBLIC_*), sonra src/config/site-defaults.json.
 * Uygulama metinleri için DB site_settings / ui_* anahtarları kullanılmaya devam eder.
 */
import siteDefaults from '@/config/site-defaults.json';
import { normalizePublicApiBase } from '@/lib/normalize-public-api-base';
import type { DesignTokens } from '@/lib/tokens/types';

function replaceAppName(template: string, app: string): string {
  return template.replace(/\{\{appName\}\}/g, app);
}

function resolveBrandTemplate(template: string): string {
  return replaceAppName(template, getPublicAppName());
}

export function getPublicAppName(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_NAME?.trim();
  if (fromEnv) return fromEnv;
  const fromJson = String(siteDefaults.brand.appName || '').trim();
  return fromJson || 'App';
}

export function getWordMarkLine1(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BRAND_WORD_MARK_LINE1?.trim();
  if (fromEnv) return resolveBrandTemplate(fromEnv);
  const raw = String(siteDefaults.brand.wordMarkLine1 || '').trim();
  return raw ? resolveBrandTemplate(raw) : getPublicAppName();
}

export function getWordMarkLine2(): string {
  return (
    process.env.NEXT_PUBLIC_BRAND_WORD_MARK_LINE2?.trim() ||
    String(siteDefaults.brand.wordMarkLine2 || '').trim()
  );
}

export function getCopyrightHolder(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_COPYRIGHT?.trim();
  if (fromEnv) return resolveBrandTemplate(fromEnv);
  const raw = String(siteDefaults.brand.copyrightHolder || '').trim();
  return raw ? resolveBrandTemplate(raw) : getPublicAppName();
}

export function getPublicSiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    String(siteDefaults.site.originFallback || '').trim();
  return raw.replace(/\/+$/, '') || 'http://localhost:3077';
}

export function getRootLayoutTitleDefault(): string {
  const raw =
    process.env.NEXT_PUBLIC_ROOT_TITLE_DEFAULT?.trim() ||
    siteDefaults.rootLayout.titleDefault;
  return replaceAppName(raw, getPublicAppName());
}

export function getRootLayoutTitleTemplate(): string {
  const raw =
    process.env.NEXT_PUBLIC_ROOT_TITLE_TEMPLATE?.trim() ||
    siteDefaults.rootLayout.titleTemplate;
  return replaceAppName(raw, getPublicAppName());
}

export function getLocaleDescriptionFallback(locale: string): string {
  const key = locale.split('-')[0]?.toLowerCase() || 'en';
  const map = siteDefaults.seo.localeDescriptionFallback as Record<string, string>;
  const raw = map[key] || map.en || map.tr || '';
  return raw ? resolveBrandTemplate(raw) : '';
}

export function getHtmlMetaDescriptionForLocale(locale: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_HTML_DESCRIPTION?.trim();
  if (fromEnv) return fromEnv;
  const key = locale.split('-')[0]?.toLowerCase() || 'tr';
  const map = siteDefaults.seo.htmlMetaDescriptionByLocale as Record<string, string>;
  const def = String(siteDefaults.i18n.defaultLocale || 'tr');
  const raw = map[key] || map[def] || map.en || '';
  return raw ? resolveBrandTemplate(raw) : '';
}

export function getDefaultLogoAlt(): string {
  return (
    process.env.NEXT_PUBLIC_LOGO_ALT?.trim() ||
    String(siteDefaults.brand.defaultLogoAlt || '').trim() ||
    getPublicAppName()
  );
}

export function getManifestPwaStrings(): { name: string; short_name: string; description: string } {
  const nameRaw =
    process.env.NEXT_PUBLIC_MANIFEST_NAME?.trim() || String(siteDefaults.manifest.name || '');
  const shortRaw =
    process.env.NEXT_PUBLIC_MANIFEST_SHORT_NAME?.trim() ||
    String(siteDefaults.manifest.shortName || '');
  const descRaw =
    process.env.NEXT_PUBLIC_MANIFEST_DESCRIPTION?.trim() ||
    String(siteDefaults.manifest.description || '');
  return {
    name: nameRaw ? resolveBrandTemplate(nameRaw) : getPublicAppName(),
    short_name: shortRaw ? resolveBrandTemplate(shortRaw) : getPublicAppName(),
    description: descRaw ? resolveBrandTemplate(descRaw) : '',
  };
}

export function getManifestStartUrl(): string {
  return process.env.NEXT_PUBLIC_MANIFEST_START_URL?.trim() || siteDefaults.manifest.startLocalePath;
}

export type HeaderFallbackMenuItem = {
  id: string;
  url?: string;
  label: Record<string, string>;
  children?: HeaderFallbackMenuItem[];
};

export function getHeaderFallbackMenu(): HeaderFallbackMenuItem[] {
  return siteDefaults.navigation.headerFallbackMenu as HeaderFallbackMenuItem[];
}

export function getFooterFallbackSections(): typeof siteDefaults.navigation.footerFallbackSections {
  return siteDefaults.navigation.footerFallbackSections;
}

export function getDefaultTokenBranding(): DesignTokens['branding'] {
  const app = getPublicAppName();
  return {
    app_name: app,
    tagline:
      process.env.NEXT_PUBLIC_BRAND_TAGLINE?.trim() ||
      String(siteDefaults.brand.taglineTr || '').trim(),
    tagline_en:
      process.env.NEXT_PUBLIC_BRAND_TAGLINE_EN?.trim() ||
      String(siteDefaults.brand.taglineEn || '').trim(),
    logo_url: '',
    favicon_url: '',
    theme_color: '#15803d',
    theme_color_dark: '#052e16',
    og_image_url: '',
  };
}

/** Sayfa başlığı son eki: `Baslik | AppName` — env ile özelleştirilebilir */
export function titleWithAppName(pageTitle: string): string {
  const suffix = process.env.NEXT_PUBLIC_PAGE_TITLE_SUFFIX_PATTERN?.trim() || '%s | {{appName}}';
  return replaceAppName(suffix, getPublicAppName()).replace('%s', pageTitle);
}

export function getOrgJsonLdDescription(locale: string): string {
  const key = locale.split('-')[0]?.toLowerCase() || 'tr';
  const raw = siteDefaults as { jsonLd?: { organizationDescription?: Record<string, string> } };
  const map = raw.jsonLd?.organizationDescription;
  if (!map) return '';
  return map[key] || map.en || map.tr || '';
}

export function getPlaceholderSameAsUrls(): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_JSONLD_PLACEHOLDER_SAME_AS?.trim();
  if (fromEnv) {
    return fromEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const raw = siteDefaults as { jsonLd?: { placeholderSameAs?: string[] } };
  return Array.isArray(raw.jsonLd?.placeholderSameAs) ? raw.jsonLd.placeholderSameAs : [];
}

/** Kamu API kökü: `/api/v1` (env veya site-defaults + normalize). */
export function getPublicApiBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (env) return normalizePublicApiBase(env);
  const raw = siteDefaults as { site?: { apiBaseFallback?: string } };
  const fb = String(raw.site?.apiBaseFallback || '').trim();
  if (fb) return normalizePublicApiBase(fb);
  return normalizePublicApiBase(`${getPublicSiteOrigin()}/api`);
}

export function getSiteDisplayHostname(): string {
  try {
    return new URL(getPublicSiteOrigin()).hostname;
  } catch {
    return 'localhost';
  }
}

export function getEditorialTeamName(): string {
  const fromEnv = process.env.NEXT_PUBLIC_EDITORIAL_TEAM_NAME?.trim();
  if (fromEnv) return resolveBrandTemplate(fromEnv);
  const raw = siteDefaults as { editorial?: { teamNameTemplate?: string } };
  const tpl = String(raw.editorial?.teamNameTemplate || '').trim();
  return tpl ? resolveBrandTemplate(tpl) : getPublicAppName();
}

export function getCookieConsentStorageKey(version: string): string {
  const slug = process.env.NEXT_PUBLIC_COOKIE_CONSENT_KEY_PREFIX?.trim() || 'site';
  return `${slug}_cookie_consent_v${version}`;
}

export function getAnalyticsConsentEventName(): string {
  return process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_EVENT?.trim() || 'site_consent_update';
}

export function getAnalyticsPageViewEventName(): string {
  return process.env.NEXT_PUBLIC_ANALYTICS_PAGE_VIEW_EVENT?.trim() || 'site_page_view';
}

/** Paylaşım kartı / OG alt satırı için kısa marka sloganı */
export function getShareCardFooterTagline(): string {
  return (
    process.env.NEXT_PUBLIC_SHARE_CARD_TAGLINE?.trim() ||
    String(siteDefaults.brand.taglineTr || '').trim() ||
    getPublicAppName()
  );
}

export function getSampleEmailPlaceholder(locale: string): string {
  const domain = process.env.NEXT_PUBLIC_SAMPLE_EMAIL_DOMAIN?.trim() || 'example.com';
  const base = locale === 'tr' ? 'ornek' : 'user';
  return `${base}@${domain}`;
}

/** KVKK / veri dışa aktarma dosya adı için güvenli önek (ör. tarmin-go) */
export function getDataExportFilePrefix(): string {
  const raw = getPublicAppName().toLowerCase();
  const slug = raw.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'export';
}
