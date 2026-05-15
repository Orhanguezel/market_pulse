// src/modules/siteSettings/repository.ts
// TUM DB sorgulari burada (write + read). repo* prefix.
// Admin-only list/delete sorgulari: admin.repository.ts

import { randomUUID } from 'crypto';
import { db } from '../../db/client';
import { siteSettings } from './schema';
import { and, asc, eq, inArray, like } from 'drizzle-orm';
import type { JsonLike } from '../_shared';
import { coerceLocaleByKey, normalizeValueByKey } from './settingPolicy';

// ── Helpers ──────────────────────────────────────────────────────────────────

type SiteSettingRow = typeof siteSettings.$inferSelect;
type LocaleCode = string;

function parseDbValue(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

function stringifyValue(v: JsonLike): string {
  return JSON.stringify(v);
}

export function rowToDto(r: SiteSettingRow) {
  return {
    id: r.id,
    key: r.key,
    locale: r.locale,
    value: parseDbValue(r.value),
    created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  };
}

// ── Write Operations ─────────────────────────────────────────────────────────

export async function repoUpsertOne(key: string, locale: LocaleCode, value: JsonLike) {
  const k = String(key || '').trim();
  const coercedLocale = (coerceLocaleByKey(k, locale) ?? locale) as LocaleCode;
  const normalizedValue = normalizeValueByKey(k, value);

  const now = new Date();
  await db
    .insert(siteSettings)
    .values({
      id: randomUUID(),
      key: k,
      locale: coercedLocale,
      value: stringifyValue(normalizedValue as JsonLike),
      created_at: now,
      updated_at: now,
    })
    .onDuplicateKeyUpdate({
      set: { value: stringifyValue(normalizedValue as JsonLike), updated_at: now },
    });
}

export async function repoUpsertAllLocales(key: string, value: JsonLike, appLocales: LocaleCode[]) {
  for (const l of appLocales) {
    await repoUpsertOne(key, l, value);
  }
}

// ── Read Operations ──────────────────────────────────────────────────────────

export async function repoGetRowsByKeyAndFallbacks(key: string, fallbacks: LocaleCode[]) {
  if (!fallbacks.length) return [];
  return db
    .select()
    .from(siteSettings)
    .where(and(eq(siteSettings.key, key), inArray(siteSettings.locale, fallbacks)));
}

export async function repoGetFirstRowByFallback(
  key: string,
  fallbacks: LocaleCode[],
): Promise<SiteSettingRow | null> {
  const rows = await repoGetRowsByKeyAndFallbacks(key, fallbacks);
  const byLocale = new Map(rows.map((r) => [r.locale, r]));
  for (const l of fallbacks) {
    const r = byLocale.get(l);
    if (r) return r;
  }
  return null;
}

export async function repoGetRowByKeyAndLocale(key: string, locale: LocaleCode) {
  const rows = await db
    .select()
    .from(siteSettings)
    .where(and(eq(siteSettings.key, key), eq(siteSettings.locale, locale)))
    .limit(1);
  return rows[0] ?? null;
}

export async function repoGetRowsByKey(key: string): Promise<SiteSettingRow[]> {
  return db.select().from(siteSettings).where(eq(siteSettings.key, key));
}

export async function repoGetAllByConditions(params: {
  key?: string;
  prefix?: string;
  keyIn?: string[];
}): Promise<SiteSettingRow[]> {
  const conds: ReturnType<typeof eq>[] | ReturnType<typeof inArray>[] | ReturnType<typeof like>[] = [] as Array<
    ReturnType<typeof eq> | ReturnType<typeof inArray> | ReturnType<typeof like>
  >;

  if (params.key && params.prefix) {
    conds.push(inArray(siteSettings.key, [`${params.prefix}${params.key}`, params.key]));
  } else {
    if (params.prefix) conds.push(like(siteSettings.key, `${params.prefix}%`));
    if (params.key) conds.push(eq(siteSettings.key, params.key));
  }
  if (params.keyIn?.length) conds.push(inArray(siteSettings.key, params.keyIn));

  return db
    .select()
    .from(siteSettings)
    .where(conds.length ? (conds.length === 1 ? conds[0] : and(...conds)) : undefined)
    .orderBy(asc(siteSettings.key));
}
