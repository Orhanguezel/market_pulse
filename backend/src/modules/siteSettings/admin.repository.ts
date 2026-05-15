// src/modules/siteSettings/admin.repository.ts
// Admin-specific DB sorgulari (list + delete). repo* prefix.

import { db } from '../../db/client';
import { siteSettings } from './schema';
import { and, eq } from 'drizzle-orm';
import {
  applySiteSettingsPagination,
  buildSiteSettingsDeleteWhere,
  buildSiteSettingsListWhere,
  resolveSiteSettingsOrder,
  type RepoDeleteManyParams,
  type RepoListParams,
} from './helpers';

type SiteSettingRow = typeof siteSettings.$inferSelect;

export async function repoListSettings(params: RepoListParams): Promise<SiteSettingRow[]> {
  let qb = db.select().from(siteSettings).$dynamic();
  const where = buildSiteSettingsListWhere(params);
  if (where) qb = qb.where(where);
  qb = qb.orderBy(resolveSiteSettingsOrder(params.order));
  qb = applySiteSettingsPagination(qb, params);
  return qb;
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function repoDeleteMany(params: RepoDeleteManyParams) {
  const where = buildSiteSettingsDeleteWhere(params);
  let d = db.delete(siteSettings).$dynamic();
  if (where) d = d.where(where);
  await d;
}

export async function repoDeleteByKey(key: string, locale?: string | null) {
  if (locale) {
    await db
      .delete(siteSettings)
      .where(and(eq(siteSettings.key, key), eq(siteSettings.locale, locale)));
  } else {
    await db.delete(siteSettings).where(eq(siteSettings.key, key));
  }
}
