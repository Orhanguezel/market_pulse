// src/modules/siteSettings/index.ts
// External module surface for site settings. Keep explicit; no export *.

export { registerSiteSettings } from './router';
export { registerSiteSettingsAdmin } from './admin.routes';

export {
  getAppLocalesMeta,
  getAppLocales,
  getDefaultLocale,
  getEffectiveDefaultLocale,
  buildLocaleFallbackChain,
  getSiteMediaRaw,
  getSiteMediaUrl,
  getSiteLogoUrl,
  getSiteLogoDarkUrl,
  getSiteLogoLightUrl,
  getSiteFaviconUrl,
  getAppleTouchIconUrl,
  getSiteAppIcon512Url,
  getSiteOgDefaultImageUrl,
  getSmtpSettings,
  getGlobalSettingValue,
  getStorageSettings,
  getGoogleSettings,
  getPublicBaseUrl,
  getGa4MeasurementId,
  getGtmContainerId,
  getCookieConsentConfig,
  getTelegramSettings,
} from './service';

export { PREFERRED_FALLBACK_LOCALE, buildLocaleCandidates } from './service';
export type {
  AppLocaleMeta,
  SiteMediaKey,
  SmtpSettings,
  StorageDriver,
  StorageSettings,
  GoogleSettings,
  CookieConsentConfig,
  TelegramSettings,
} from './service';

export { SITE_MEDIA_KEYS, STORAGE_KEYS, GOOGLE_KEYS, TELEGRAM_KEYS } from './helpers';
export { DEFAULT_APP_LOCALES, cloneDefaultAppLocales } from './helpers';
export type { SiteSettingsAppLocaleMeta } from './helpers';
export { siteSettings } from './schema';

export {
  normalizeLooseLocale,
  getAdminAppLocales,
  getAdminDefaultLocale,
  buildAdminFallbacks,
  isLocaleMap,
  isGlobalKey,
} from './helpers';

export {
  adminGetSettingsAggregate,
  adminUpsertSettingsAggregate,
  adminListSiteSettings,
  adminGetSiteSettingByKey,
  adminCreateSiteSetting,
  adminUpdateSiteSetting,
  adminBulkUpsertSiteSettings,
  adminDeleteManySiteSettings,
  adminDeleteSiteSetting,
  adminGetAppLocales,
  adminGetDefaultLocale,
} from './admin.controller';
