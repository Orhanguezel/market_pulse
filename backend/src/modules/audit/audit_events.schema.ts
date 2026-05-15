// =============================================================
// FILE: src/modules/audit/audit_events.schema.ts
// corporate-backend – Audit Events Schema (domain/system events)
// FIX: LONGTEXT via customType + proper index()
// =============================================================

import { mysqlTable, bigint, varchar, datetime, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { longtext } from '../_shared';

export const auditEvents = mysqlTable(
  'audit_events',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),

    ts: datetime('ts', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),

    level: varchar('level', { length: 16 }).notNull(),
    topic: varchar('topic', { length: 128 }).notNull(),

    message: longtext('message'),
    actor_user_id: varchar('actor_user_id', { length: 64 }),
    ip: varchar('ip', { length: 64 }),

    entity_type: varchar('entity_type', { length: 64 }),
    entity_id: varchar('entity_id', { length: 64 }),

    meta_json: longtext('meta_json'),
  },
  (t) => ({
    idx_ts: index('audit_events_ts_idx').on(t.ts),
    idx_topic_ts: index('audit_events_topic_ts_idx').on(t.topic, t.ts),
    idx_level_ts: index('audit_events_level_ts_idx').on(t.level, t.ts),
  }),
);

export type AuditEventRow = typeof auditEvents.$inferSelect;
export type NewAuditEventRow = typeof auditEvents.$inferInsert;
