// src/modules/siteSettings/helpers/admin-crud.ts
// CRUD-specific helpers for site settings admin controller.

import { rowToDto, repoGetFirstRowByFallback, repoGetRowByKeyAndLocale, repoUpsertAllLocales, repoUpsertOne } from '../repository';
import { getAppLocalesMeta, getEffectiveDefaultLocale } from '../service';
import {
  buildAdminFallbacks,
  getAdminAppLocales,
  getAdminDefaultLocale,
  isGlobalKey,
  isLocaleMap,
  normalizeLooseLocale,
} from './admin-locale';
import { repoDeleteByKey, repoDeleteMany, repoListSettings } from '../admin.repository';
import type { JsonLike } from '../../_shared';
import type { SiteSettingBulkUpsertInput, SiteSettingUpsertInput } from '../validation';

export type SiteSettingsListQuery = Record<string, string | undefined>;

export async function listAdminSiteSettings(query: SiteSettingsListQuery) {
  const requested = normalizeLooseLocale(query.locale);
  const defaultLocale = await getAdminDefaultLocale();
  const localeToUse = requested ?? defaultLocale;

  const rows = await repoListSettings({
    q: query.q,
    keys: query.keys,
    prefix: query.prefix,
    order: query.order,
    limit: query.limit,
    offset: query.offset,
    localeToUse,
    isGlobalKey,
  });

  return rows.map(rowToDto);
}

export async function getAdminSiteSettingByKey(key: string, locale?: string | null) {
  const fallbacks = await buildAdminFallbacks(locale);
  const row = await repoGetFirstRowByFallback(key, fallbacks);
  if (!row) return null;

  const dto = rowToDto(row);
  return { key: dto.key, value: dto.value, locale: dto.locale };
}

export async function createAdminSiteSetting(input: SiteSettingUpsertInput) {
  const appLocales = await getAdminAppLocales();
  await repoUpsertAllLocales(input.key, input.value, appLocales);

  const defaultLocale = await getAdminDefaultLocale();
  const row = await repoGetRowByKeyAndLocale(input.key, defaultLocale);
  return row ? rowToDto(row) : { key: input.key, locale: defaultLocale, value: input.value };
}

export function hasAdminSettingValue(body: Partial<{ value: JsonLike }>): body is { value: JsonLike } {
  return 'value' in body;
}

export async function updateAdminSiteSetting(key: string, value: JsonLike, locale?: string | null) {
  const normalizedLocale = normalizeLooseLocale(locale);

  if (normalizedLocale === '*') {
    await repoUpsertOne(key, '*', value);
    return;
  }

  const appLocales = await getAdminAppLocales();
  if (normalizedLocale && appLocales.includes(normalizedLocale)) {
    await repoUpsertOne(key, normalizedLocale, value);
    return;
  }

  await repoUpsertAllLocales(key, value, appLocales);
}

export async function bulkUpsertAdminSiteSettings(input: SiteSettingBulkUpsertInput) {
  const appLocales = await getAdminAppLocales();
  const defaultLocale = await getAdminDefaultLocale();

  for (const item of input.items) {
    if (isLocaleMap(item.value, appLocales)) {
      const localizedValues = item.value as Partial<Record<string, JsonLike>>;

      for (const locale of appLocales) {
        const localizedValue = localizedValues[locale] ?? localizedValues[defaultLocale] ?? item.value;
        await repoUpsertOne(item.key, locale, localizedValue as JsonLike);
      }
      continue;
    }

    await repoUpsertAllLocales(item.key, item.value, appLocales);
  }
}

export async function deleteManyAdminSiteSettings(query: SiteSettingsListQuery) {
  await repoDeleteMany({
    idNe: query['id!'] ?? query.id_ne,
    key: query.key,
    keyNe: query['key!'] ?? query.key_ne,
    keyIn: query.key_in ?? query.keys,
    prefix: query.prefix,
    locale: normalizeLooseLocale(query.locale),
  });
}

export async function deleteAdminSiteSetting(key: string, locale?: string | null) {
  await repoDeleteByKey(key, normalizeLooseLocale(locale));
}

export async function getAdminAppLocalesMeta() {
  return getAppLocalesMeta();
}

export async function getAdminEffectiveDefaultLocale() {
  return getEffectiveDefaultLocale();
}
