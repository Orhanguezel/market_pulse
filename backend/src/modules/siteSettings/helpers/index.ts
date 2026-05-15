// src/modules/siteSettings/helpers/index.ts
// Local helper barrel for siteSettings. Keep explicit; no export *.

export {
  normalizeLooseLocale,
  getAdminAppLocales,
  getAdminDefaultLocale,
  buildAdminFallbacks,
  isLocaleMap,
  isGlobalKey,
} from './admin-locale';

export {
  readAdminAggregateSettings,
  upsertAdminAggregateSettings,
  ADMIN_AGGREGATE_SETTING_KEYS,
} from './admin-aggregate';
export type {
  AdminAggregateSettingKey,
  AdminAggregateSettingsPayload,
  AdminAggregateSettingsResponse,
} from './admin-aggregate';

export {
  listAdminSiteSettings,
  getAdminSiteSettingByKey,
  createAdminSiteSetting,
  hasAdminSettingValue,
  updateAdminSiteSetting,
  bulkUpsertAdminSiteSettings,
  deleteManyAdminSiteSettings,
  deleteAdminSiteSetting,
  getAdminAppLocalesMeta,
  getAdminEffectiveDefaultLocale,
} from './admin-crud';
export type { SiteSettingsListQuery } from './admin-crud';

export {
  applySiteSettingsPagination,
  buildSiteSettingsDeleteWhere,
  buildSiteSettingsListWhere,
  resolveSiteSettingsOrder,
} from './admin-repository';
export type { RepoDeleteManyParams, RepoListParams } from './admin-repository';

export {
  GLOBAL_LOCALE,
  PREFERRED_FALLBACK_LOCALE,
  buildLocaleCandidates,
  normalizeSettingBool,
  normalizeSettingString,
  uniqLocales,
  normalizeDbValueToString,
  parseSiteMediaUrl,
  getGlobalSettingValue,
  fetchSettingsRows,
  loadSettingsMap,
  getFirstNonEmptySetting,
  parseAppLocalesValueToMeta,
} from './service';
export type { AppLocaleMeta, SettingRow } from './service';

export {
  STORAGE_KEYS,
  GOOGLE_KEYS,
  TELEGRAM_KEYS,
  SITE_MEDIA_KEYS,
} from './constants';
export type { SiteMediaKey } from './constants';

export { DEFAULT_APP_LOCALES, cloneDefaultAppLocales } from '../../_shared';
export type { AppLocaleMeta as SiteSettingsAppLocaleMeta } from '../../_shared';
