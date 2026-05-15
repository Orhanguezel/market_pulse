// src/modules/userRoles/schema.ts
import {
  mysqlTable,
  char,
  mysqlEnum,
  datetime,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "../auth/schema";

export const userRoles = mysqlTable(
  "user_roles",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    role: mysqlEnum("role", ["admin", "editor", "carrier", "customer", "dealer"])
      .notNull()
      .default("customer"),
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    // FK → users.id
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: "fk_user_roles_user_id_users_id",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),

    // Benzersizlik: aynı user aynı role bir kez
    uniqueIndex("user_roles_user_id_role_unique").on(t.user_id, t.role),

    // Arama performansı için indexler
    index("user_roles_user_id_idx").on(t.user_id),
    index("user_roles_role_idx").on(t.role),
    index("user_roles_user_id_created_at_idx").on(t.user_id, t.created_at),
  ],
);

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
