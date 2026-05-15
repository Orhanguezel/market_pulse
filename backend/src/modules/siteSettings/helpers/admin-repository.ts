// src/modules/siteSettings/helpers/admin-repository.ts
// Query builders/helpers for admin site settings repository.

import { and, asc, desc, eq, inArray, like, ne, or } from 'drizzle-orm';
import { siteSettings } from '../schema';

type SiteSettingsCondition =
  | ReturnType<typeof eq>
  | ReturnType<typeof ne>
  | ReturnType<typeof like>
  | ReturnType<typeof inArray>
  | ReturnType<typeof or>;

export type RepoListParams = {
  q?: string;
  keys?: string;
  prefix?: string;
  order?: string;
  limit?: string | number;
  offset?: string | number;
  localeToUse: string;
  isGlobalKey: (key: string) => boolean;
};

export type RepoDeleteManyParams = {
  idNe?: string;
  key?: string;
  keyNe?: string;
  keyIn?: string;
  prefix?: string;
  locale?: string | null;
};

export function splitCsvLike(value?: string) {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function resolveSiteSettingsOrder(order?: string) {
  if (!order) return asc(siteSettings.key);

  const [column, direction] = order.split('.');
  const sortableColumns = {
    key: siteSettings.key,
    locale: siteSettings.locale,
    created_at: siteSettings.created_at,
    updated_at: siteSettings.updated_at,
  } as const;
  const colRef = sortableColumns[column as keyof typeof sortableColumns];
  if (!colRef) return asc(siteSettings.key);
  return direction === 'desc' ? desc(colRef) : asc(colRef);
}

export function buildSiteSettingsListWhere(params: RepoListParams) {
  const { q: searchQ, keys, prefix, localeToUse, isGlobalKey } = params;
  const conditions: SiteSettingsCondition[] = [];
  const keysArr = splitCsvLike(keys);

  if (keysArr.length) conditions.push(inArray(siteSettings.key, keysArr));
  if (prefix) conditions.push(like(siteSettings.key, `${prefix}%`));
  if (searchQ) conditions.push(like(siteSettings.key, `%${searchQ}%`));

  if (localeToUse === '*') {
    conditions.push(eq(siteSettings.locale, '*'));
  } else if (keysArr.length) {
    const globalKeys = keysArr.filter(isGlobalKey);
    const normalKeys = keysArr.filter((key) => !isGlobalKey(key));

    if (globalKeys.length && !normalKeys.length) {
      conditions.push(eq(siteSettings.locale, '*'));
    } else if (!globalKeys.length && normalKeys.length) {
      conditions.push(eq(siteSettings.locale, localeToUse));
    } else if (globalKeys.length && normalKeys.length) {
      conditions.push(
        or(
          and(eq(siteSettings.locale, '*'), inArray(siteSettings.key, globalKeys)),
          and(eq(siteSettings.locale, localeToUse), inArray(siteSettings.key, normalKeys)),
        ),
      );
    } else {
      conditions.push(eq(siteSettings.locale, localeToUse));
    }
  } else {
    conditions.push(eq(siteSettings.locale, localeToUse));
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

export function applySiteSettingsPagination<T extends { limit: (n: number) => T; offset: (n: number) => T }>(
  qb: T,
  params: Pick<RepoListParams, 'limit' | 'offset'>,
) {
  let query = qb;

  if (params.limit != null && params.limit !== '') {
    const limit = Number(params.limit);
    if (!Number.isNaN(limit) && limit > 0) query = query.limit(limit);
  }

  if (params.offset != null && params.offset !== '') {
    const offset = Number(params.offset);
    if (!Number.isNaN(offset) && offset >= 0) query = query.offset(offset);
  }

  return query;
}

export function buildSiteSettingsDeleteWhere(params: RepoDeleteManyParams) {
  const conditions: SiteSettingsCondition[] = [];

  if (params.idNe) conditions.push(ne(siteSettings.id, params.idNe));
  if (params.key) conditions.push(eq(siteSettings.key, params.key));
  if (params.keyNe) conditions.push(ne(siteSettings.key, params.keyNe));

  const keyIn = splitCsvLike(params.keyIn);
  if (keyIn.length) conditions.push(inArray(siteSettings.key, keyIn));

  if (params.prefix) conditions.push(like(siteSettings.key, `${params.prefix}%`));
  if (params.locale) conditions.push(eq(siteSettings.locale, params.locale));

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}
