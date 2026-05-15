// ── Client-safe barrel ──
// Server-only modules → import directly:
//   '@/i18n/server'          (fetchSetting, fetchActiveLocales, getDefaultLocale, getServerI18nContext)
//   '@/i18n/apiBase.server'  (getServerApiBase)
// Default exports → import directly:
//   '@/i18n/LangBoot'
//   '@/i18n/HtmlLangSync'
//   '@/i18n/IntlProviderClient'
//   '@/i18n/request'

export * from './activeLocales';
export * from './locale';
export * from './localeShortClient';
export * from './locationEvents';
export * from './publicMetaApi';
export * from './routing';
export * from './switchLocale';
export * from './ui';
export * from './uiDb';
export * from './useLocaleShort';
