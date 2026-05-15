// =============================================================
// FILE: src/modules/audit/repository.ts
// corporate-backend – Audit Repository (Drizzle queries)
// =============================================================

import { db } from '../../db/client';
import { and, asc, desc, eq, like, or, sql, type SQL, gte, lte } from 'drizzle-orm';

import {
  auditRequestLogs,
  auditAuthEvents,
  type AuditRequestLogRow,
  type AuditAuthEventRow,
  type NewAuditRequestLogRow,
} from './schema';

import { auditEvents, type NewAuditEventRow } from './audit_events.schema';
import { users } from '../auth';

import type {
  AuditRequestLogsListQuery,
  AuditAuthEventsListQuery,
  AuditMetricsDailyQuery,
} from './validation';

import { isTruthyBoolLike } from './validation';

type AuditIpTable = typeof auditRequestLogs | typeof auditAuthEvents;
type AuditGeoStatsBool = boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | undefined;
type ExportRequestLogQuery = {
  q?: string;
  method?: string;
  status_code?: number;
  user_id?: string;
  ip?: string;
  only_admin?: AuditGeoStatsBool;
  exclude_localhost?: AuditGeoStatsBool;
  created_from?: string;
  created_to?: string;
};
type ExportAuthEventQuery = {
  event?: string;
  user_id?: string;
  email?: string;
  ip?: string;
  exclude_localhost?: AuditGeoStatsBool;
  created_from?: string;
  created_to?: string;
};

function parseDateTime3(s: string) {
  return sql`CAST(${s} AS DATETIME(3))`;
}

/* ---- Localhost exclusion helper ---- */
export function excludeLocalhostCond(table: AuditIpTable): SQL {
  return sql`${table.ip} NOT IN ('127.0.0.1', '::1', '::ffff:127.0.0.1')`;
}

/* ---- Enriched types (with user info) ---- */
export type AuditRequestLogEnriched = AuditRequestLogRow & {
  user_email: string | null;
  user_full_name: string | null;
};

export type AuditAuthEventEnriched = AuditAuthEventRow & {
  user_full_name: string | null;
};

/* -------------------------------------------------------------
 * LIST – Request logs (with user enrichment)
 * ------------------------------------------------------------- */
export async function repoListAuditRequestLogs(
  q: AuditRequestLogsListQuery,
): Promise<{ items: AuditRequestLogEnriched[]; total: number }> {
  const conds: (SQL | undefined)[] = [];

  if (q.q && q.q.trim()) {
    const s = `%${q.q.trim()}%`;
    conds.push(or(like(auditRequestLogs.path, s), like(auditRequestLogs.url, s)));
  }

  if (q.method && q.method.trim()) {
    conds.push(eq(auditRequestLogs.method, q.method.trim().toUpperCase()));
  }

  if (typeof q.status_code === 'number') {
    conds.push(eq(auditRequestLogs.status_code, q.status_code));
  }

  if (q.user_id) conds.push(eq(auditRequestLogs.user_id, q.user_id));
  if (q.ip) conds.push(eq(auditRequestLogs.ip, q.ip));

  if (typeof q.only_admin !== 'undefined' && isTruthyBoolLike(q.only_admin)) {
    conds.push(eq(auditRequestLogs.is_admin, 1));
  }

  if (typeof q.exclude_localhost !== 'undefined' && isTruthyBoolLike(q.exclude_localhost)) {
    conds.push(excludeLocalhostCond(auditRequestLogs));
  }

  if (q.created_from && q.created_from.trim()) {
    conds.push(gte(auditRequestLogs.created_at, parseDateTime3(q.created_from.trim())));
  }
  if (q.created_to && q.created_to.trim()) {
    conds.push(lte(auditRequestLogs.created_at, parseDateTime3(q.created_to.trim())));
  }

  const whereCond =
    conds.length > 0 ? (and(...(conds.filter(Boolean) as SQL[])) as SQL) : undefined;

  const take = q.limit ?? 50;
  const skip = q.offset ?? 0;

  const sort = q.sort ?? 'created_at';
  const dir = q.orderDir ?? 'desc';

  const orderExpr: SQL =
    sort === 'response_time_ms'
      ? dir === 'asc'
        ? asc(auditRequestLogs.response_time_ms)
        : desc(auditRequestLogs.response_time_ms)
      : sort === 'status_code'
      ? dir === 'asc'
        ? asc(auditRequestLogs.status_code)
        : desc(auditRequestLogs.status_code)
      : dir === 'asc'
      ? asc(auditRequestLogs.created_at)
      : desc(auditRequestLogs.created_at);

  const baseQuery = db
    .select({
      id: auditRequestLogs.id,
      req_id: auditRequestLogs.req_id,
      method: auditRequestLogs.method,
      url: auditRequestLogs.url,
      path: auditRequestLogs.path,
      status_code: auditRequestLogs.status_code,
      response_time_ms: auditRequestLogs.response_time_ms,
      ip: auditRequestLogs.ip,
      user_agent: auditRequestLogs.user_agent,
      referer: auditRequestLogs.referer,
      user_id: auditRequestLogs.user_id,
      is_admin: auditRequestLogs.is_admin,
      country: auditRequestLogs.country,
      city: auditRequestLogs.city,
      error_message: auditRequestLogs.error_message,
      error_code: auditRequestLogs.error_code,
      request_body: auditRequestLogs.request_body,
      created_at: auditRequestLogs.created_at,
      user_email: users.email,
      user_full_name: users.full_name,
    })
    .from(auditRequestLogs)
    .leftJoin(users, eq(auditRequestLogs.user_id, users.id));

  const rowsQuery = whereCond ? baseQuery.where(whereCond as SQL) : baseQuery;

  const items = await rowsQuery
    .orderBy(orderExpr, desc(auditRequestLogs.id))
    .limit(take)
    .offset(skip);

  const countBase = db.select({ c: sql<number>`COUNT(*)` }).from(auditRequestLogs);
  const countQuery = whereCond ? countBase.where(whereCond as SQL) : countBase;

  const cnt = await countQuery;
  const total = Number(cnt[0]?.c ?? 0);

  return {
    items: items.map((r) => ({
      ...r,
      user_email: r.user_email ?? null,
      user_full_name: r.user_full_name ?? null,
    })) as AuditRequestLogEnriched[],
    total,
  };
}

/* -------------------------------------------------------------
 * LIST – Auth events (with user enrichment)
 * ------------------------------------------------------------- */
export async function repoListAuditAuthEvents(
  q: AuditAuthEventsListQuery,
): Promise<{ items: AuditAuthEventEnriched[]; total: number }> {
  const conds: (SQL | undefined)[] = [];

  if (q.event) conds.push(eq(auditAuthEvents.event, q.event));
  if (q.user_id) conds.push(eq(auditAuthEvents.user_id, q.user_id));
  if (q.email) conds.push(eq(auditAuthEvents.email, q.email));
  if (q.ip) conds.push(eq(auditAuthEvents.ip, q.ip));

  if (typeof q.exclude_localhost !== 'undefined' && isTruthyBoolLike(q.exclude_localhost)) {
    conds.push(excludeLocalhostCond(auditAuthEvents));
  }

  if (q.created_from && q.created_from.trim()) {
    conds.push(gte(auditAuthEvents.created_at, parseDateTime3(q.created_from.trim())));
  }
  if (q.created_to && q.created_to.trim()) {
    conds.push(lte(auditAuthEvents.created_at, parseDateTime3(q.created_to.trim())));
  }

  const whereCond =
    conds.length > 0 ? (and(...(conds.filter(Boolean) as SQL[])) as SQL) : undefined;

  const take = q.limit ?? 50;
  const skip = q.offset ?? 0;

  const dir = q.orderDir ?? 'desc';
  const orderExpr: SQL =
    dir === 'asc' ? asc(auditAuthEvents.created_at) : desc(auditAuthEvents.created_at);

  const baseQuery = db
    .select({
      id: auditAuthEvents.id,
      event: auditAuthEvents.event,
      user_id: auditAuthEvents.user_id,
      email: auditAuthEvents.email,
      ip: auditAuthEvents.ip,
      user_agent: auditAuthEvents.user_agent,
      country: auditAuthEvents.country,
      city: auditAuthEvents.city,
      created_at: auditAuthEvents.created_at,
      user_full_name: users.full_name,
    })
    .from(auditAuthEvents)
    .leftJoin(users, eq(auditAuthEvents.user_id, users.id));

  const rowsQuery = whereCond ? baseQuery.where(whereCond as SQL) : baseQuery;

  const items = await rowsQuery
    .orderBy(orderExpr, desc(auditAuthEvents.id))
    .limit(take)
    .offset(skip);

  const countBase = db.select({ c: sql<number>`COUNT(*)` }).from(auditAuthEvents);
  const countQuery = whereCond ? countBase.where(whereCond as SQL) : countBase;

  const cnt = await countQuery;
  const total = Number(cnt[0]?.c ?? 0);

  return {
    items: items.map((r) => ({
      ...r,
      user_full_name: r.user_full_name ?? null,
    })) as AuditAuthEventEnriched[],
    total,
  };
}

/* -------------------------------------------------------------
 * Geo Stats: group by country
 * ------------------------------------------------------------- */
export type AuditGeoStatsRow = {
  country: string;
  count: number;
  unique_ips: number;
};

export type AuditGeoStatsQuery = {
  days?: number;
  only_admin?: AuditGeoStatsBool;
  exclude_localhost?: AuditGeoStatsBool;
  source?: 'requests' | 'auth';
};

export async function repoGetAuditGeoStats(
  q: AuditGeoStatsQuery,
): Promise<AuditGeoStatsRow[]> {
  const days = Math.max(1, Math.min(90, Number(q.days ?? 30)));
  const startExpr = sql`DATE_SUB(UTC_DATE(), INTERVAL ${days - 1} DAY)`;

  const useAuth = q.source === 'auth';
  const table = useAuth ? auditAuthEvents : auditRequestLogs;

  const conds: (SQL | undefined)[] = [];
  conds.push(sql`DATE(${table.created_at}) >= ${startExpr}`);
  conds.push(sql`${table.country} IS NOT NULL AND ${table.country} != ''`);

  if (!useAuth && typeof q.only_admin !== 'undefined' && isTruthyBoolLike(q.only_admin)) {
    conds.push(eq(auditRequestLogs.is_admin, 1));
  }

  if (typeof q.exclude_localhost !== 'undefined' && isTruthyBoolLike(q.exclude_localhost)) {
    conds.push(excludeLocalhostCond(table));
  }

  const whereCond = and(...(conds.filter(Boolean) as SQL[]));

  const rows = await db
    .select({
      country: table.country,
      count: sql<number>`COUNT(*)`,
      unique_ips: sql<number>`COUNT(DISTINCT ${table.ip})`,
    })
    .from(table)
    .where(whereCond)
    .groupBy(table.country)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(200);

  return rows.map((r) => ({
    country: String(r.country ?? ''),
    count: Number(r.count ?? 0),
    unique_ips: Number(r.unique_ips ?? 0),
  }));
}

/* -------------------------------------------------------------
 * CLEAR – Tum audit loglarini sil
 * ------------------------------------------------------------- */
export type ClearAuditTarget = 'requests' | 'auth' | 'all';

export async function repoClearAuditLogs(
  target: ClearAuditTarget = 'all',
): Promise<{ deletedRequests: number; deletedAuth: number }> {
  let deletedRequests = 0;
  let deletedAuth = 0;

  if (target === 'requests' || target === 'all') {
    const countRes = await db.select({ c: sql<number>`COUNT(*)` }).from(auditRequestLogs);
    deletedRequests = Number(countRes[0]?.c ?? 0);
    await db.execute(sql`TRUNCATE TABLE audit_request_logs`);
  }

  if (target === 'auth' || target === 'all') {
    const countRes = await db.select({ c: sql<number>`COUNT(*)` }).from(auditAuthEvents);
    deletedAuth = Number(countRes[0]?.c ?? 0);
    await db.execute(sql`TRUNCATE TABLE audit_auth_events`);
  }

  return { deletedRequests, deletedAuth };
}

/* -------------------------------------------------------------
 * Metrics: daily aggregation (requests, unique_ips, errors)
 * ------------------------------------------------------------- */
export type AuditMetricsDailyRow = {
  date: string; // "YYYY-MM-DD"
  requests: number;
  unique_ips: number;
  errors: number;
};

export async function repoGetAuditMetricsDaily(
  q: AuditMetricsDailyQuery,
): Promise<{ days: AuditMetricsDailyRow[] }> {
  const conds: (SQL | undefined)[] = [];

  const days = Math.max(1, Math.min(90, Number(q.days ?? 14)));
  const startExpr = sql`DATE_SUB(UTC_DATE(), INTERVAL ${days - 1} DAY)`;

  conds.push(sql`DATE(${auditRequestLogs.created_at}) >= ${startExpr}`);

  if (typeof q.only_admin !== 'undefined' && isTruthyBoolLike(q.only_admin)) {
    conds.push(eq(auditRequestLogs.is_admin, 1));
  }

  if (typeof q.exclude_localhost !== 'undefined' && isTruthyBoolLike(q.exclude_localhost)) {
    conds.push(excludeLocalhostCond(auditRequestLogs));
  }

  if (q.path_prefix && q.path_prefix.trim()) {
    conds.push(like(auditRequestLogs.path, `${q.path_prefix.trim()}%`));
  }

  const whereCond = and(...(conds.filter(Boolean) as SQL[]));

  const rows = await db
    .select({
      date: sql<string>`DATE(${auditRequestLogs.created_at})`,
      requests: sql<number>`COUNT(*)`,
      unique_ips: sql<number>`COUNT(DISTINCT ${auditRequestLogs.ip})`,
      errors: sql<number>`SUM(CASE WHEN ${auditRequestLogs.status_code} >= 400 THEN 1 ELSE 0 END)`,
    })
    .from(auditRequestLogs)
    .where(whereCond)
    .groupBy(sql`DATE(${auditRequestLogs.created_at})`)
    .orderBy(sql`DATE(${auditRequestLogs.created_at}) ASC`);

  const daysOut: AuditMetricsDailyRow[] = rows.map((r) => ({
    date: String(r.date),
    requests: Number(r.requests ?? 0),
    unique_ips: Number(r.unique_ips ?? 0),
    errors: Number(r.errors ?? 0),
  }));

  return { days: daysOut };
}

/* -------------------------------------------------------------
 * Export – Request logs (enriched, for CSV/JSON export)
 * ------------------------------------------------------------- */
export async function repoExportRequestLogs(params: {
  conds: SQL[];
  limit: number;
}) {
  const whereCond = params.conds.length > 0
    ? and(...params.conds)
    : undefined;

  const baseQuery = db
    .select({
      id: auditRequestLogs.id,
      req_id: auditRequestLogs.req_id,
      method: auditRequestLogs.method,
      url: auditRequestLogs.url,
      path: auditRequestLogs.path,
      status_code: auditRequestLogs.status_code,
      response_time_ms: auditRequestLogs.response_time_ms,
      ip: auditRequestLogs.ip,
      user_agent: auditRequestLogs.user_agent,
      referer: auditRequestLogs.referer,
      user_id: auditRequestLogs.user_id,
      is_admin: auditRequestLogs.is_admin,
      country: auditRequestLogs.country,
      city: auditRequestLogs.city,
      error_message: auditRequestLogs.error_message,
      error_code: auditRequestLogs.error_code,
      created_at: auditRequestLogs.created_at,
      user_email: users.email,
      user_full_name: users.full_name,
    })
    .from(auditRequestLogs)
    .leftJoin(users, eq(auditRequestLogs.user_id, users.id));

  const rowsQuery = whereCond ? baseQuery.where(whereCond as SQL) : baseQuery;
  return rowsQuery.orderBy(desc(auditRequestLogs.created_at)).limit(params.limit);
}

/* -------------------------------------------------------------
 * Export – Auth events (enriched, for CSV/JSON export)
 * ------------------------------------------------------------- */
export async function repoExportAuthEvents(params: {
  conds: SQL[];
  limit: number;
}) {
  const whereCond = params.conds.length > 0
    ? and(...params.conds)
    : undefined;

  const baseQuery = db
    .select({
      id: auditAuthEvents.id,
      event: auditAuthEvents.event,
      user_id: auditAuthEvents.user_id,
      email: auditAuthEvents.email,
      ip: auditAuthEvents.ip,
      user_agent: auditAuthEvents.user_agent,
      country: auditAuthEvents.country,
      city: auditAuthEvents.city,
      created_at: auditAuthEvents.created_at,
      user_full_name: users.full_name,
    })
    .from(auditAuthEvents)
    .leftJoin(users, eq(auditAuthEvents.user_id, users.id));

  const rowsQuery = whereCond ? baseQuery.where(whereCond as SQL) : baseQuery;
  return rowsQuery.orderBy(desc(auditAuthEvents.created_at)).limit(params.limit);
}

/* -------------------------------------------------------------
 * Persist audit event (from SSE stream)
 * ------------------------------------------------------------- */
function safeJsonStringify(v: unknown) {
  try {
    return JSON.stringify(v ?? null);
  } catch {
    return JSON.stringify({ _error: 'meta_not_serializable' });
  }
}

export async function repoPersistAuditEvent(evt: {
  ts: string | number;
  level?: string;
  topic?: string;
  message?: string | null;
  actor_user_id?: string | null;
  ip?: string | null;
  entity?: { type?: string; id?: string | number } | null;
  meta?: unknown;
}) {
  const row: NewAuditEventRow = {
    ts: new Date(evt.ts),
    level: String(evt.level || 'info'),
    topic: String(evt.topic || 'app.event'),
    message: evt.message ?? null,
    actor_user_id: evt.actor_user_id ?? null,
    ip: evt.ip ?? null,
    entity_type: evt.entity?.type ?? null,
    entity_id: evt.entity?.id != null ? String(evt.entity.id) : null,
    meta_json: evt.meta ? safeJsonStringify(evt.meta) : null,
  };
  await db.insert(auditEvents).values(row);
}

/* -------------------------------------------------------------
 * Retention cleanup – delete old rows
 * ------------------------------------------------------------- */
export async function repoDeleteOldRequestLogs(retentionDays: number) {
  await db.execute(
    sql`DELETE FROM audit_request_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ${retentionDays} DAY)`,
  );
}

export async function repoDeleteOldAuthEvents(retentionDays: number) {
  await db.execute(
    sql`DELETE FROM audit_auth_events WHERE created_at < DATE_SUB(NOW(), INTERVAL ${retentionDays} DAY)`,
  );
}

export async function repoDeleteOldAuditEvents(retentionDays: number) {
  await db.execute(
    sql`DELETE FROM audit_events WHERE ts < DATE_SUB(NOW(), INTERVAL ${retentionDays} DAY)`,
  );
}

/* -------------------------------------------------------------
 * Insert request audit log
 * ------------------------------------------------------------- */
export async function repoInsertRequestLog(data: {
  req_id: string;
  method: string;
  url: string;
  path: string;
  status_code: number;
  response_time_ms: number;
  ip: string;
  user_agent: string | null;
  referer: string | null;
  user_id: string | null;
  is_admin: number;
  country: string | null;
  city: string | null;
  error_message: string | null;
  error_code: string | null;
  request_body: string | null;
}) {
  const row: NewAuditRequestLogRow = {
    ...data,
    created_at: new Date(),
  };
  await db.insert(auditRequestLogs).values(row);
}

/* -------------------------------------------------------------
 * Build export filter conditions (shared by export controller)
 * ------------------------------------------------------------- */
export function buildRequestLogExportConds(q: ExportRequestLogQuery): SQL[] {
  const conds: SQL[] = [];

  if (q.q?.trim()) {
    const s = `%${q.q.trim()}%`;
    const c = or(like(auditRequestLogs.path, s), like(auditRequestLogs.url, s));
    if (c) conds.push(c);
  }
  if (q.method?.trim()) conds.push(eq(auditRequestLogs.method, q.method.trim().toUpperCase()));
  if (typeof q.status_code === 'number') conds.push(eq(auditRequestLogs.status_code, q.status_code));
  if (q.user_id) conds.push(eq(auditRequestLogs.user_id, q.user_id));
  if (q.ip) conds.push(eq(auditRequestLogs.ip, q.ip));
  if (typeof q.only_admin !== 'undefined' && isTruthyBoolLike(q.only_admin)) {
    conds.push(eq(auditRequestLogs.is_admin, 1));
  }
  if (typeof q.exclude_localhost !== 'undefined' && isTruthyBoolLike(q.exclude_localhost)) {
    conds.push(excludeLocalhostCond(auditRequestLogs));
  }
  if (q.created_from?.trim()) conds.push(gte(auditRequestLogs.created_at, parseDateTime3(q.created_from.trim())));
  if (q.created_to?.trim()) conds.push(lte(auditRequestLogs.created_at, parseDateTime3(q.created_to.trim())));

  return conds;
}

export function buildAuthEventExportConds(q: ExportAuthEventQuery): SQL[] {
  const conds: SQL[] = [];

  if (q.event) conds.push(eq(auditAuthEvents.event, q.event));
  if (q.user_id) conds.push(eq(auditAuthEvents.user_id, q.user_id));
  if (q.email) conds.push(eq(auditAuthEvents.email, q.email));
  if (q.ip) conds.push(eq(auditAuthEvents.ip, q.ip));
  if (typeof q.exclude_localhost !== 'undefined' && isTruthyBoolLike(q.exclude_localhost)) {
    conds.push(excludeLocalhostCond(auditAuthEvents));
  }
  if (q.created_from?.trim()) conds.push(gte(auditAuthEvents.created_at, parseDateTime3(q.created_from.trim())));
  if (q.created_to?.trim()) conds.push(lte(auditAuthEvents.created_at, parseDateTime3(q.created_to.trim())));

  return conds;
}
