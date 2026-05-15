// =============================================================
// FILE: src/modules/siteSettings/settingPolicy.ts
// corporate-backend – Key policy + value normalization/validation
// SEO strict validation uses seo.validation.ts (single source)
// =============================================================

import type { JsonLike } from '../_shared';
import { STRICT_SEO_KEYS, validateSeoSettingValue, assertSeoLocaleRule } from './seo.validation';

/**
 * Key policy:
 * - GLOBAL_ONLY_KEYS: her zaman locale='*'
 * - STRICT_SEO_KEYS:
 *    - seo/site_seo: locale yoksa '*' (global default); locale varsa override
 *    - site_meta_default: locale '*' yasak (per-locale zorunlu)
 * - default: mevcut davranış (locale yoksa all-locales)
 *
 * Not: Analytics yaklaşımı:
 *  - gtm_container_id: global
 *  - ga4_measurement_id: global (GTM yoksa fallback)
 *  - cookie_consent: global config
 *
 * Media (logo/favicon) yaklaşımı:
 *  - site_logo / site_logo_dark / site_logo_light / site_favicon => global
 *  - value: string URL veya { url, asset_id, alt } gibi JSON object olabilir
 */

const normKey = (key: unknown) =>
  String(key ?? '')
    .trim()
    .toLowerCase();

export const GLOBAL_ONLY_KEYS = new Set<string>([
  // locales
  'app_locales',
  'default_locale',

  // base
  'public_base_url',

  // analytics
  'gtm_container_id',
  'ga4_measurement_id',

  // smtp
  'smtp_host',
  'smtp_port',
  'smtp_username',
  'smtp_password',
  'smtp_from_email',
  'smtp_from_name',
  'smtp_ssl',

  // google oauth
  'google_client_id',
  'google_client_secret',

  // storage
  'storage_driver',
  'storage_local_root',
  'storage_local_base_url',
  'cloudinary_cloud_name',
  'cloudinary_api_key',
  'cloudinary_api_secret',
  'cloudinary_folder',
  'cloudinary_unsigned_preset',
  'storage_cdn_public_base',
  'storage_public_api_base',

  // Media keys and admin UI config are removed from here to allow localized overrides
]);

/**
 * Value normalization/validation by key.
 * - SEO keys: strict Zod validation (single source: seo.validation.ts)
 * - Others: pass-through
 */
export function normalizeValueByKey(key: string, value: JsonLike): JsonLike {
  const k = normKey(key);

  if (STRICT_SEO_KEYS.has(k)) {
    return validateSeoSettingValue(k, value) as unknown as JsonLike;
  }

  // Media keys: pass-through (string veya object)
  return value;
}

/**
 * Admin update/create esnasında locale deterministik hale getir.
 * - GLOBAL_ONLY_KEYS => always '*'
 * - SEO strict locale rules enforced (site_meta_default cannot be '*')
 * - Otherwise: keep caller's locale (or null)
 */
export function coerceLocaleByKey(key: string, locale: string | null): string | null {
  const k = normKey(key);

  if (GLOBAL_ONLY_KEYS.has(k)) return '*';
  if (k.startsWith('telegram_')) return '*';

  if (STRICT_SEO_KEYS.has(k)) {
    const effective = locale ?? '*';
    assertSeoLocaleRule(k, effective);
    return effective;
  }

  return locale;
}
