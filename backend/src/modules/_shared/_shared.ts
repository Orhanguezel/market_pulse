// src/modules/_shared/_shared.ts
// Legacy re-exports — _shared/ içi sibling dosyalar buradan çekebilir
// Dış modüller @/modules/_shared barrel (index.ts) kullanır

export { toBool01, pickUserDto } from './dto';
export { safeTrim, toBool, toBoolOrUndefined, nullIfEmpty, toInt, toFiniteNumber, isDuplicateError } from './parse';
export { parseEnvInt, parseEnvBool, parseEnvList } from './env';
export type { Id36, LocaleCode, Ymd, Hm, safeText } from './schemas';
export { uuid36Schema, hmSchema, ymdSchema, dowSchema } from './schemas';
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
