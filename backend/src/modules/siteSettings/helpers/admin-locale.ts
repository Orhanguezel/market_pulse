// src/modules/siteSettings/helpers/admin-locale.ts
// Locale-aware helpers for site settings admin flows.

import { normalizeLooseLocale } from '../../_shared';
import { coerceLocaleByKey } from '../settingPolicy';
import {
  buildLocaleFallbackChain,
  getAppLocales as getAppLocalesFromService,
  getDefaultLocale as getDefaultLocaleFromService,
  PREFERRED_FALLBACK_LOCALE,
} from '../service';
import type { JsonLike } from '../../_shared';

export { normalizeLooseLocale } from '../../_shared';

export type LocaleCode = string;

export function isNonEmptyLocaleString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function getAdminAppLocales(): Promise<LocaleCode[]> {
  const list = await getAppLocalesFromService(null);
  return list?.length ? list : ['de'];
}

export async function getAdminDefaultLocale(): Promise<LocaleCode> {
  const value = normalizeLooseLocale(await getDefaultLocaleFromService(null));
  return value && value !== '*' ? value : 'de';
}

export async function buildAdminFallbacks(requested?: string | null): Promise<LocaleCode[]> {
  const requestedLocale = normalizeLooseLocale(requested);
  const chain = await buildLocaleFallbackChain({
    requested: requestedLocale,
    preferred: PREFERRED_FALLBACK_LOCALE,
  });
  return chain.filter(isNonEmptyLocaleString);
}

export function isLocaleMap(
  value: unknown,
  allowedLocales: LocaleCode[],
): value is Partial<Record<LocaleCode, JsonLike>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const source = value as Record<string, unknown>;
  const keys = Object.keys(source);
  if (!keys.length) return false;

  const allowed = new Set(allowedLocales.map((locale) => normalizeLooseLocale(locale) || locale));
  return keys.every((key) => allowed.has(normalizeLooseLocale(key) || key));
}

export function isGlobalKey(key: string): boolean {
  const normalizedKey = String(key || '').trim();
  if (!normalizedKey) return false;

  const coerced = coerceLocaleByKey(normalizedKey, 'de');
  if (coerced === '*') return true;
  if (normalizedKey === 'app_locales' || normalizedKey === 'default_locale') return true;
  if (normalizedKey === 'gtm_container_id' || normalizedKey === 'ga4_measurement_id') return true;
  if (normalizedKey === 'cookie_consent') return true;
  if (normalizedKey.startsWith('smtp_')) return true;
  if (normalizedKey.startsWith('storage_')) return true;
  if (normalizedKey.startsWith('cloudinary_')) return true;
  if (normalizedKey.startsWith('google_')) return true;
  if (normalizedKey === 'public_base_url') return true;
  if (normalizedKey.startsWith('telegram_')) return true;
  return false;
}
