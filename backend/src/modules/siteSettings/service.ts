// =============================================================
// FILE: src/modules/siteSettings/service.ts
// corporate-backend – SiteSettings Service
// Key points:
//  - Always include '*' in fallback chain (global settings).
//  - Normalize locales (trim + lower + de-DE -> de candidates).
//  - Unify global reads via getGlobalSettingValue().
//  - buildLocaleFallbackChain order:
//      requested -> prefix -> effective default -> preferred -> app_locales -> '*'
//  - Adds: getGtmContainerId()
//  - ✅ Adds: Global site media (logo/favicon) helpers (locale-independent via '*')
// FIXES:
//  - getAppLocalesMeta fallbacks: tr/en/de codes + labels (no duplicates)
// =============================================================

import { env } from '../../core/env';
import {
  GLOBAL_LOCALE,
  PREFERRED_FALLBACK_LOCALE,
  buildLocaleCandidates,
  cloneDefaultAppLocales,
  getFirstNonEmptySetting,
  getGlobalSettingValue,
  loadSettingsMap,
  normalizeLooseLocale,
  normalizeSettingBool,
  normalizeSettingString,
  parseAppLocalesValueToMeta,
  parseSiteMediaUrl,
  uniqLocales,
  GOOGLE_KEYS,
  SITE_MEDIA_KEYS,
  STORAGE_KEYS,
  TELEGRAM_KEYS,
  type AppLocaleMeta,
  type SiteMediaKey,
} from './helpers';

// ---------------------------------------------------------------------------
// COMMON HELPERS
// ---------------------------------------------------------------------------

export { PREFERRED_FALLBACK_LOCALE, buildLocaleCandidates, getGlobalSettingValue, type AppLocaleMeta } from './helpers';

export async function getAppLocalesMeta(): Promise<AppLocaleMeta[]> {
  const raw = await getGlobalSettingValue('app_locales');
  if (!raw) {
    return cloneDefaultAppLocales();
  }

  const v: unknown = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  })();

  const metas = parseAppLocalesValueToMeta(v);
  if (metas.length) return metas;

  return cloneDefaultAppLocales();
}


export async function getAppLocales(_locale?: string | null): Promise<string[]> {
  const metas = await getAppLocalesMeta();
  return uniqLocales(metas.filter((m) => m.is_active !== false).map((m) => m.code));
}

export async function getDefaultLocale(_locale?: string | null): Promise<string> {
  const raw = await getGlobalSettingValue('default_locale');
  const s = normalizeLooseLocale(raw);
  return s || 'tr';
}

export async function getEffectiveDefaultLocale(): Promise<string> {
  const def = (await getDefaultLocale(null)).trim().toLowerCase();
  const metas = await getAppLocalesMeta();
  const active = metas.filter((m) => m.is_active !== false);

  if (active.some((m) => m.code === def)) return def;

  const fromMeta = active.find((m) => m.is_default)?.code;
  return (fromMeta || active[0]?.code || def || 'tr').trim().toLowerCase();
}

/**
 * ✅ Locale fallback chain
 * Sıra:
 *  1) requested exact
 *  2) requested prefix
 *  3) effective default_locale (global)
 *  4) preferred fallback (opsiyonel)
 *  5) app_locales (aktif)
 *  6) '*' (GLOBAL)
 */
export async function buildLocaleFallbackChain(opts: {
  requested?: string | null;
  preferred?: string;
}): Promise<string[]> {
  const req = normalizeLooseLocale(opts.requested) || '';
  const preferred = normalizeLooseLocale(opts.preferred) || PREFERRED_FALLBACK_LOCALE;

  const candidates = buildLocaleCandidates(req);
  const def = await getEffectiveDefaultLocale();
  const appLocales = await getAppLocales(null);

  return uniqLocales([candidates[0], candidates[1], def, preferred, ...appLocales, GLOBAL_LOCALE]);
}

// ---------------------------------------------------------------------------
// ✅ SITE MEDIA (GLOBAL-ONLY): LOGO / FAVICON
// ---------------------------------------------------------------------------

export { SITE_MEDIA_KEYS, type SiteMediaKey } from './helpers';

export async function getSiteMediaRaw(key: SiteMediaKey): Promise<string | null> {
  return await getGlobalSettingValue(key);
}

export async function getSiteMediaUrl(key: SiteMediaKey): Promise<string | null> {
  const raw = await getSiteMediaRaw(key);
  return parseSiteMediaUrl(raw);
}

export async function getSiteLogoUrl(): Promise<string | null> {
  return await getSiteMediaUrl('site_logo');
}

export async function getSiteLogoDarkUrl(): Promise<string | null> {
  return await getSiteMediaUrl('site_logo_dark');
}

export async function getSiteLogoLightUrl(): Promise<string | null> {
  return await getSiteMediaUrl('site_logo_light');
}

export async function getSiteFaviconUrl(): Promise<string | null> {
  return await getSiteMediaUrl('site_favicon');
}

export async function getAppleTouchIconUrl(): Promise<string | null> {
  return await getSiteMediaUrl('site_apple_touch_icon');
}

export async function getSiteAppIcon512Url(): Promise<string | null> {
  return await getSiteMediaUrl('site_app_icon_512');
}

export async function getSiteOgDefaultImageUrl(): Promise<string | null> {
  return await getSiteMediaUrl('site_og_default_image');
}

// ---------------------------------------------------------------------------
// SMTP
// ---------------------------------------------------------------------------

export type SmtpSettings = {
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  fromEmail: string | null;
  fromName: string | null;
  secure: boolean;
};

export async function getSmtpSettings(locale?: string | null): Promise<SmtpSettings> {
  const localeCandidates = await buildLocaleFallbackChain({ requested: locale });

  const [host, portStr, username, password, fromEmail, fromName, sslStr] = await Promise.all([
    getFirstNonEmptySetting({ key: 'smtp_host', localeCandidates }),
    getFirstNonEmptySetting({ key: 'smtp_port', localeCandidates }),
    getFirstNonEmptySetting({ key: 'smtp_username', localeCandidates }),
    getFirstNonEmptySetting({ key: 'smtp_password', localeCandidates }),
    getFirstNonEmptySetting({ key: 'smtp_from_email', localeCandidates }),
    getFirstNonEmptySetting({ key: 'smtp_from_name', localeCandidates }),
    getFirstNonEmptySetting({ key: 'smtp_ssl', localeCandidates }),
  ]);

  const port = portStr ? Number(portStr) : null;

  return {
    host: normalizeSettingString(host),
    port: typeof port === 'number' && Number.isFinite(port) ? port : null,
    username: normalizeSettingString(username),
    password: normalizeSettingString(password),
    fromEmail: normalizeSettingString(fromEmail),
    fromName: normalizeSettingString(fromName),
    secure: normalizeSettingBool(sslStr),
  };
}

// ---------------------------------------------------------------------------
// STORAGE
// ---------------------------------------------------------------------------

export type StorageDriver = 'local' | 'cloudinary';

export type StorageSettings = {
  driver: StorageDriver;
  localRoot: string | null;
  localBaseUrl: string | null;
  cloudName: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  folder: string | null;

  // ✅ ZATEN VAR: DB key = cloudinary_unsigned_preset
  unsignedUploadPreset: string | null;

  cdnPublicBase: string | null;
  publicApiBase: string | null;
};

const toDriver = (raw: string | null | undefined): StorageDriver => {
  const v = (raw || '').trim().toLowerCase();
  if (v === 'local' || v === 'cloudinary') return v;

  const envRaw = (env.STORAGE_DRIVER || '').trim().toLowerCase();
  if (envRaw === 'local' || envRaw === 'cloudinary') return envRaw as StorageDriver;

  return 'cloudinary';
};

export async function getStorageSettings(locale?: string | null): Promise<StorageSettings> {
  const localeCandidates = await buildLocaleFallbackChain({ requested: locale });
  const map = await loadSettingsMap({ keys: STORAGE_KEYS, localeCandidates });

  const driver = toDriver(map.get('storage_driver'));

  const localRoot =
    normalizeSettingString(map.get('storage_local_root')) ?? normalizeSettingString(env.LOCAL_STORAGE_ROOT) ?? null;

  const localBaseUrl =
    normalizeSettingString(map.get('storage_local_base_url')) ??
    normalizeSettingString(env.LOCAL_STORAGE_BASE_URL) ??
    null;

  const cdnPublicBase =
    normalizeSettingString(map.get('storage_cdn_public_base')) ??
    normalizeSettingString(env.STORAGE_CDN_PUBLIC_BASE) ??
    normalizeSettingString(env.CDN_PUBLIC_BASE) ??
    null;

  const publicApiBase =
    normalizeSettingString(map.get('storage_public_api_base')) ??
    normalizeSettingString(env.STORAGE_PUBLIC_API_BASE) ??
    normalizeSettingString(env.PUBLIC_API_BASE) ??
    null;

  const cloudName =
    normalizeSettingString(map.get('cloudinary_cloud_name')) ??
    normalizeSettingString(env.CLOUDINARY_CLOUD_NAME) ??
    normalizeSettingString(env.CLOUDINARY?.cloudName) ??
    null;

  const apiKey =
    normalizeSettingString(map.get('cloudinary_api_key')) ??
    normalizeSettingString(env.CLOUDINARY_API_KEY) ??
    normalizeSettingString(env.CLOUDINARY?.apiKey) ??
    null;

  const apiSecret =
    normalizeSettingString(map.get('cloudinary_api_secret')) ??
    normalizeSettingString(env.CLOUDINARY_API_SECRET) ??
    normalizeSettingString(env.CLOUDINARY?.apiSecret) ??
    null;

  const folder =
    normalizeSettingString(map.get('cloudinary_folder')) ??
    normalizeSettingString(env.CLOUDINARY_FOLDER) ??
    normalizeSettingString(env.CLOUDINARY?.folder) ??
    null;

  // ✅ DB key map: cloudinary_unsigned_preset
  const unsignedUploadPreset =
    normalizeSettingString(map.get('cloudinary_unsigned_preset')) ??
    // ENV fallback'leri (isim değiştirmeden ALIAS)
    normalizeSettingString(envFallbacks.CLOUDINARY_UNSIGNED_UPLOAD_PRESET) ??
    normalizeSettingString(envFallbacks.CLOUDINARY_UNSIGNED_PRESET) ??
    normalizeSettingString(envFallbacks.CLOUDINARY?.unsignedUploadPreset) ??
    normalizeSettingString(envFallbacks.CLOUDINARY?.uploadPreset) ??
    null;

  return {
    driver,
    localRoot,
    localBaseUrl,
    cloudName,
    apiKey,
    apiSecret,
    folder,
    unsignedUploadPreset,
    cdnPublicBase,
    publicApiBase,
  };
}

// ---------------------------------------------------------------------------
// GOOGLE
// ---------------------------------------------------------------------------

export type GoogleSettings = {
  clientId: string | null;
  clientSecret: string | null;
};

export async function getGoogleSettings(locale?: string | null): Promise<GoogleSettings> {
  const localeCandidates = await buildLocaleFallbackChain({ requested: locale });
  const map = await loadSettingsMap({ keys: GOOGLE_KEYS, localeCandidates });

  const clientId =
    normalizeSettingString(map.get('google_client_id')) ?? normalizeSettingString(env.GOOGLE_CLIENT_ID) ?? null;

  const clientSecret =
    normalizeSettingString(map.get('google_client_secret')) ?? normalizeSettingString(env.GOOGLE_CLIENT_SECRET) ?? null;

  return { clientId, clientSecret };
}

// ---------------------------------------------------------------------------
// PUBLIC BASE URL
// ---------------------------------------------------------------------------

export async function getPublicBaseUrl(locale?: string | null): Promise<string | null> {
  const localeCandidates = await buildLocaleFallbackChain({ requested: locale });

  const v = await getFirstNonEmptySetting({ key: 'public_base_url', localeCandidates });
  if (v) return v.replace(/\/+$/, '');

  const envV = normalizeSettingString(envFallbacks.PUBLIC_BASE_URL) ?? normalizeSettingString(process.env.PUBLIC_BASE_URL);

  return envV ? envV.replace(/\/+$/, '') : null;
}

// ---------------------------------------------------------------------------
// ANALYTICS (GA4 + GTM)
// ---------------------------------------------------------------------------

export async function getGa4MeasurementId(locale?: string | null): Promise<string | null> {
  const localeCandidates = await buildLocaleFallbackChain({ requested: locale });
  const v = await getFirstNonEmptySetting({ key: 'ga4_measurement_id', localeCandidates });
  return v ? v.trim() : null;
}

export async function getGtmContainerId(locale?: string | null): Promise<string | null> {
  const localeCandidates = await buildLocaleFallbackChain({ requested: locale });
  const v = await getFirstNonEmptySetting({ key: 'gtm_container_id', localeCandidates });
  return v ? v.trim() : null;
}

// ---------------------------------------------------------------------------
// COOKIE CONSENT
// ---------------------------------------------------------------------------

export type CookieConsentConfig = {
  consent_version: number;
  defaults: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  ui?: { enabled?: boolean };
};

const defaultCookieConsentConfig: CookieConsentConfig = {
  consent_version: 1,
  defaults: { necessary: true, analytics: false, marketing: false },
  ui: { enabled: true },
};

export async function getCookieConsentConfig(locale?: string | null): Promise<CookieConsentConfig> {
  const localeCandidates = await buildLocaleFallbackChain({ requested: locale });
  const raw = await getFirstNonEmptySetting({ key: 'cookie_consent', localeCandidates });

  if (!raw) return defaultCookieConsentConfig;

  try {
    const parsed = JSON.parse(raw);
    return {
      consent_version: Number(parsed?.consent_version ?? 1) || 1,
      defaults: {
        necessary: parsed?.defaults?.necessary !== false,
        analytics: parsed?.defaults?.analytics === true,
        marketing: parsed?.defaults?.marketing === true,
      },
      ui: { enabled: parsed?.ui?.enabled !== false },
    };
  } catch {
    return defaultCookieConsentConfig;
  }
}

// ---------------------------------------------------------------------------
// TELEGRAM
// ---------------------------------------------------------------------------

export type TelegramSettings = {
  enabled: boolean;
  webhookEnabled: boolean;
  botToken: string | null;
  defaultChatId: string | null;
  autoReplyEnabled: boolean;
  autoReplyTemplate: string | null;
};

export async function getTelegramSettings(locale?: string | null): Promise<TelegramSettings> {
  const localeCandidates = await buildLocaleFallbackChain({ requested: locale });
  const map = await loadSettingsMap({ keys: TELEGRAM_KEYS, localeCandidates });

  const enabled = normalizeSettingBool(map.get('telegram_notifications_enabled'));
  const webhookEnabled = normalizeSettingBool(map.get('telegram_webhook_enabled'));
  const botToken = normalizeSettingString(map.get('telegram_bot_token'));
  const defaultChatId = normalizeSettingString(map.get('telegram_default_chat_id'));
  const autoReplyEnabled = normalizeSettingBool(map.get('telegram_autoreply_enabled'));
  const autoReplyTemplate = normalizeSettingString(map.get('telegram_autoreply_template'));

  return {
    enabled,
    webhookEnabled,
    botToken,
    defaultChatId,
    autoReplyEnabled,
    autoReplyTemplate,
  };
}
// ---------------------------------------------------------------------------
// KEEPA
// ---------------------------------------------------------------------------

export type KeepaSettings = {
  apiKey: string;
  tokenBudget: number;
};

export async function getKeepaSettings(): Promise<KeepaSettings> {
  const dbKey = await getGlobalSettingValue('keepa_api_key');
  const dbBudget = await getGlobalSettingValue('keepa_daily_token_budget');
  return {
    apiKey: normalizeSettingString(dbKey) || env.KEEPA_API_KEY || '',
    tokenBudget: dbBudget ? Number(dbBudget) : (env.KEEPA_DAILY_TOKEN_BUDGET ?? 1000),
  };
}

// ---------------------------------------------------------------------------
// AI (GROQ / OPENAI)
// ---------------------------------------------------------------------------

export type AISettings = {
  groqApiKey: string;
  openAIApiKey: string;
};

export async function getAISettings(): Promise<AISettings> {
  const dbGroq = await getGlobalSettingValue('groq_api_key');
  const dbOpenAI = await getGlobalSettingValue('openai_api_key');
  return {
    groqApiKey: normalizeSettingString(dbGroq) || env.GROQ_API_KEY || '',
    openAIApiKey: normalizeSettingString(dbOpenAI) || env.OPENAI_API_KEY || '',
  };
}

// ---------------------------------------------------------------------------
// OXYLABS
// ---------------------------------------------------------------------------

export type OxylabsSettings = {
  username: string;
  password: string;
};

export async function getOxylabsSettings(): Promise<OxylabsSettings> {
  const dbUser = await getGlobalSettingValue('oxylabs_username');
  const dbPass = await getGlobalSettingValue('oxylabs_password');
  return {
    username: normalizeSettingString(dbUser) || env.OXYLABS_USERNAME || '',
    password: normalizeSettingString(dbPass) || env.OXYLABS_PASSWORD || '',
  };
}

  type SiteSettingsEnvCloudinary = {
    unsignedUploadPreset?: string | null;
    uploadPreset?: string | null;
  };

  type SiteSettingsEnvFallbacks = {
    CLOUDINARY_UNSIGNED_UPLOAD_PRESET?: string | null;
    CLOUDINARY_UNSIGNED_PRESET?: string | null;
    PUBLIC_BASE_URL?: string | null;
    CLOUDINARY?: SiteSettingsEnvCloudinary | null;
  };

  const envFallbacks = env as SiteSettingsEnvFallbacks;
