// ===================================================================
// FILE: src/modules/notifications/schema.ts
// ===================================================================

import {
  mysqlTable,
  char,
  varchar,
  text,
  boolean,
  datetime,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const notifications = mysqlTable(
  "notifications",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    is_read: boolean("is_read").notNull().default(false),
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    userIdx: index("idx_notifications_user_id").on(table.user_id),
    userReadIdx: index("idx_notifications_user_read").on(
      table.user_id,
      table.is_read,
    ),
    createdIdx: index("idx_notifications_created_at").on(table.created_at),
  }),
);

export type NotificationRow = typeof notifications.$inferSelect;
export type NotificationInsert = typeof notifications.$inferInsert;

export type NotificationType =
  | "order_created"
  | "order_paid"
  | "order_failed"
  | "catalog_request_created" // ✅ EKLENDİ
  | "system"
  | "custom"
  | (string & {});
