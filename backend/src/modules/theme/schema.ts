import { mysqlTable, char, mediumtext, tinyint, datetime } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const themeConfig = mysqlTable('theme_config', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  is_active: tinyint('is_active').notNull().default(1),
  config: mediumtext('config').notNull(),
  created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
});

export const THEME_ROW_ID = '00000000-0000-4000-8000-000000000001';
