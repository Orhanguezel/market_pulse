// =============================================================
// FILE: src/modules/theme/repository.ts
// Theme DB sorguları
// =============================================================
import { db } from '../../db/client';
import { eq } from 'drizzle-orm';
import { deepMergeThemeConfig, parseStoredThemeConfig } from './helpers';
import { themeConfig, THEME_ROW_ID } from './schema';
import { DEFAULT_THEME } from './defaults';
import type { ThemeConfig, ThemeUpdateInput } from './types';

export async function repoGetThemeConfig(): Promise<ThemeConfig> {
  const [row] = await db.select().from(themeConfig).where(eq(themeConfig.id, THEME_ROW_ID)).limit(1);
  return parseStoredThemeConfig(row?.config);
}

export async function repoUpsertThemeConfig(config: ThemeConfig) {
  const json = JSON.stringify(config);
  const [existing] = await db
    .select({ id: themeConfig.id })
    .from(themeConfig)
    .where(eq(themeConfig.id, THEME_ROW_ID))
    .limit(1);

  if (existing) {
    await db.update(themeConfig).set({ config: json }).where(eq(themeConfig.id, THEME_ROW_ID));
  } else {
    await db.insert(themeConfig).values({ id: THEME_ROW_ID, config: json, is_active: 1 });
  }
}

export function mergeThemeConfig(current: ThemeConfig, patch: Partial<ThemeConfig>): ThemeConfig {
  return deepMergeThemeConfig(current, patch);
}
