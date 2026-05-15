// src/modules/siteSettings/helpers/admin-aggregate.ts
// Aggregate read/write helpers for site settings admin controller.

import { rowToDto, repoGetFirstRowByFallback, repoUpsertAllLocales, repoUpsertOne } from '../repository';
import {
  buildAdminFallbacks,
  getAdminAppLocales,
  getAdminDefaultLocale,
  isLocaleMap,
  normalizeLooseLocale,
} from './admin-locale';
import type { JsonLike } from '../../_shared';

export const ADMIN_AGGREGATE_SETTING_KEYS = ['contact_info', 'socials', 'businessHours'] as const;

export type AdminAggregateSettingKey = (typeof ADMIN_AGGREGATE_SETTING_KEYS)[number];

export type AdminAggregateSettingsPayload = Partial<Record<AdminAggregateSettingKey, JsonLike>>;

export type AdminAggregateSettingsResponse = {
  contact_info: JsonLike;
  socials: JsonLike;
  businessHours: JsonLike;
};

const EMPTY_OBJECT = {} as JsonLike;
const EMPTY_ARRAY = [] as JsonLike;

export async function readAdminAggregateSettings(locale?: string | null): Promise<AdminAggregateSettingsResponse> {
  const fallbacks = await buildAdminFallbacks(locale);

  const results = await Promise.all(
    ADMIN_AGGREGATE_SETTING_KEYS.map(async (key) => {
      const row = await repoGetFirstRowByFallback(key, fallbacks);
      return row ? rowToDto(row).value : undefined;
    }),
  );

  return {
    contact_info: (results[0] ?? EMPTY_OBJECT) as JsonLike,
    socials: (results[1] ?? EMPTY_OBJECT) as JsonLike,
    businessHours: (results[2] ?? EMPTY_ARRAY) as JsonLike,
  };
}

export async function upsertAdminAggregateSettings(
  body: AdminAggregateSettingsPayload,
  locale?: string | null,
): Promise<void> {
  const localeParam = normalizeLooseLocale(locale);
  const entries = Object.entries(body).filter(([, value]) => value !== undefined) as [
    AdminAggregateSettingKey,
    JsonLike,
  ][];

  const appLocales = await getAdminAppLocales();
  const defaultLocale = await getAdminDefaultLocale();

  for (const [key, value] of entries) {
    const effectiveLocale = localeParam && localeParam !== '*' ? localeParam : null;

    if (effectiveLocale) {
      if (isLocaleMap(value, appLocales)) {
        const localizedValue = value[effectiveLocale] ?? value[defaultLocale];
        if (localizedValue !== undefined) {
          await repoUpsertOne(key, effectiveLocale, localizedValue as JsonLike);
        }
      } else {
        await repoUpsertOne(key, effectiveLocale, value);
      }
      continue;
    }

    if (isLocaleMap(value, appLocales)) {
      for (const localeCode of appLocales) {
        const localizedValue = value[localeCode] ?? value[defaultLocale] ?? value;
        await repoUpsertOne(key, localeCode, localizedValue as JsonLike);
      }
      continue;
    }

    await repoUpsertAllLocales(key, value, appLocales);
  }
}
