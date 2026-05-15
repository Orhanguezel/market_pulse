// src/modules/siteSettings/schema.ts

import {
  mysqlTable,
  char,
  varchar,
  text,
  datetime,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const siteSettings = mysqlTable(
  "site_settings",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    key: varchar("key", { length: 100 }).notNull(),
    locale: varchar("locale", { length: 8 }).notNull(),
    value: text("value").notNull(),
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("site_settings_key_locale_uq").on(t.key, t.locale),
    index("site_settings_key_idx").on(t.key),
    index("site_settings_locale_idx").on(t.locale),
  ],
);
