import {
  mysqlTable,
  char,
  varchar,
  text,
  datetime,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth';

/**
 * profiles.id = users.id (UUID)
 * Adres alanlari opsiyonel.
 */
export const profiles = mysqlTable(
  'profiles',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(), // FK (users.id)
    full_name: text('full_name'),
    phone: varchar('phone', { length: 64 }),
    avatar_url: text('avatar_url'),
    address_line1: varchar('address_line1', { length: 255 }),
    address_line2: varchar('address_line2', { length: 255 }),
    city: varchar('city', { length: 128 }),
    country: varchar('country', { length: 128 }),
    postal_code: varchar('postal_code', { length: 32 }),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),

    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    foreignKey({
      columns: [t.id],
      foreignColumns: [users.id],
      name: 'fk_profiles_id_users_id',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

export type ProfileRow = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;
