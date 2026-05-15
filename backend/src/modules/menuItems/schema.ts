// ===================================================================
// FILE: src/modules/menuItems/schema.ts
// ===================================================================

import {
  mysqlTable,
  char,
  varchar,
  int,
  boolean,
  datetime,
  index,
  foreignKey,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const menuItems = mysqlTable(
  "menu_items",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),

    parent_id: char("parent_id", { length: 36 }),

    // parent alanlar
    type: varchar("type", { length: 16 }).notNull().default("custom"), // 'page' | 'custom'
    page_id: char("page_id", { length: 36 }),
    location: varchar("location", { length: 16 })
      .notNull()
      .default("header"),
    icon: varchar("icon", { length: 64 }),
    section_id: char("section_id", { length: 36 }),

    site_id: char("site_id", { length: 36 }),

    order_num: int("order_num").notNull().default(0),
    is_active: boolean("is_active").notNull().default(true),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("menu_items_parent_idx").on(t.parent_id),
    index("menu_items_site_idx").on(t.site_id),
    index("menu_items_active_idx").on(t.is_active),
    index("menu_items_order_idx").on(t.order_num),
    index("menu_items_created_idx").on(t.created_at),
    index("menu_items_updated_idx").on(t.updated_at),
    index("menu_items_location_idx").on(t.location),
    index("menu_items_section_idx").on(t.section_id),
    foreignKey({
      columns: [t.parent_id],
      foreignColumns: [t.id],
      name: "menu_items_parent_fk",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
  ],
);

export const menuItemsI18n = mysqlTable(
  "menu_items_i18n",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    menu_item_id: char("menu_item_id", { length: 36 })
      .notNull()
      .references(() => menuItems.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    locale: varchar("locale", { length: 10 }).notNull(),

    title: varchar("title", { length: 100 }).notNull(),
    url: varchar("url", { length: 500 }).notNull(),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("ux_menu_items_i18n_item_locale").on(
      t.menu_item_id,
      t.locale,
    ),
    index("menu_items_i18n_locale_idx").on(t.locale),
    index("menu_items_i18n_title_idx").on(t.title),
  ],
);

export type MenuItemRow = typeof menuItems.$inferSelect;
export type NewMenuItemRow = typeof menuItems.$inferInsert;

export type MenuItemI18nRow = typeof menuItemsI18n.$inferSelect;
export type NewMenuItemI18nRow = typeof menuItemsI18n.$inferInsert;
