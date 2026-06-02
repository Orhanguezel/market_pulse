// src/modules/_shared/index.ts
// Barrel — tum moduller SADECE buradan import eder: @/modules/_shared

export { safeTrim, toBool, toBoolOrUndefined, toBoolDefault, nullIfEmpty, toInt, toFiniteNumber, toNum, isDuplicateError, normalizeLocaleStr } from './parse';
export { parseEnvInt, parseEnvBool, parseEnvList } from './env';

export { toBool01, pickUserDto } from './dto';

export type { Id36, LocaleCode, Ymd, Hm, safeText } from './schemas';
export { uuid36Schema, hmSchema, ymdSchema, dowSchema } from './schemas';

export { to01, type BoolLike01 } from './flags';

export { normalizeLocale, normalizeLooseLocale, resolveRequestLocales, getLocalesForCreate } from './locale';
export type { LocaleQueryLike, ResolvedLocales } from './locale';

export {
  DEFAULT_APP_LOCALES,
  cloneDefaultAppLocales,
  parseAppLocalesValueToMeta,
  getActiveAppLocaleCodes,
  pickDefaultAppLocaleCode,
} from './app-locales';
export type { AppLocaleMeta } from './app-locales';

export { jsonLike, packJson, unpackArray, parseJsonArrayString, extractHtmlFromJson, packContent } from './json';
export type { JsonLike } from './json';

export { longtext, longtextJsonStringArray } from './longtext';

export { toYmdUtc, parseRange, computeWindow } from './time';
export type { RangeKey, TrendBucket } from './time';

export {
  boolLike,
  LOCALE_LIKE,
  UUID36,
  URL2000,
  SLUG,
  UrlArrayLike,
  UuidArrayLike,
  emptyToNull,
  urlOrRelativePath,
} from './validation';
export type { BooleanLike } from './validation';

export {
  getAuthUserId,
  parsePage,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendServerError,
  handleRouteError,
} from './http';

export { setContentRange } from './contentRange';
export { authSecurity, fromZodSchema, idParamsSchema, okResponseSchema } from './swagger';
export {
  CACHE_TTL,
  cacheKeys,
  buildCacheQueryKey,
  repoGetCacheJson,
  repoSetCacheJson,
  repoDeleteCacheByPrefixes,
} from './cache';

export { formatAdminUserRow } from './admin.helpers';

export { publicUrlOf, pageToOffset } from './repo-helpers';
export { andTenant, getActiveTenantKey, tenantPredicate, tenantValues, tenantWhereSql } from './tenant-scope';

export { trimImageBuffer, maybeTrimUploadBuffer, shouldAutoTrim } from './image-trim';
export type { TrimOptions } from './image-trim';
