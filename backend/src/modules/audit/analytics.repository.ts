// =============================================================
// FILE: src/modules/audit/analytics.repository.ts
// corporate-backend – Audit Analytics Repository
// =============================================================

import { db } from '../../db/client';
import { auditRequestLogs } from './schema';
import { users } from '../auth';
import { and, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import { excludeLocalhostCond } from './repository';
import { isTruthyBoolLike } from './validation';

type AuditBoolLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | undefined;
type AnalyticsDateRangeOpts = {
  created_from?: string;
  created_to?: string;
  exclude_localhost?: AuditBoolLike;
};

/* ---- helper: date range conditions ---- */
function dateRangeConds(opts: AnalyticsDateRangeOpts): SQL[] {
  const conds: SQL[] = [];
  if (opts.created_from?.trim()) {
    conds.push(gte(auditRequestLogs.created_at, sql`CAST(${opts.created_from.trim()} AS DATETIME(3))`));
  }
  if (opts.created_to?.trim()) {
    conds.push(lte(auditRequestLogs.created_at, sql`CAST(${opts.created_to.trim()} AS DATETIME(3))`));
  }
  if (typeof opts.exclude_localhost !== 'undefined' && isTruthyBoolLike(opts.exclude_localhost)) {
    conds.push(excludeLocalhostCond(auditRequestLogs));
  }
  return conds;
}

/* ---- Top Endpoints ---- */
export type TopEndpointRow = {
  path: string;
  request_count: number;
  avg_response_time: number;
  error_rate: number;
};

export async function repoGetTopEndpoints(opts: {
  created_from?: string;
  created_to?: string;
  exclude_localhost?: AuditBoolLike;
  limit?: number;
}): Promise<TopEndpointRow[]> {
  const conds = dateRangeConds(opts);
  const where = conds.length ? and(...conds) : undefined;
  const take = Math.min(opts.limit ?? 20, 100);

  const rows = await db
    .select({
      path: auditRequestLogs.path,
      request_count: sql<number>`COUNT(*)`,
      avg_response_time: sql<number>`ROUND(AVG(${auditRequestLogs.response_time_ms}), 1)`,
      error_rate: sql<number>`ROUND(SUM(CASE WHEN ${auditRequestLogs.status_code} >= 400 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2)`,
    })
    .from(auditRequestLogs)
    .where(where)
    .groupBy(auditRequestLogs.path)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(take);

  return rows.map((r) => ({
    path: String(r.path),
    request_count: Number(r.request_count ?? 0),
    avg_response_time: Number(r.avg_response_time ?? 0),
    error_rate: Number(r.error_rate ?? 0),
  }));
}

/* ---- Slowest Endpoints ---- */
export type SlowestEndpointRow = {
  path: string;
  avg_response_time: number;
  max_response_time: number;
  request_count: number;
};

export async function repoGetSlowestEndpoints(opts: {
  created_from?: string;
  created_to?: string;
  exclude_localhost?: AuditBoolLike;
  limit?: number;
}): Promise<SlowestEndpointRow[]> {
  const conds = dateRangeConds(opts);
  const where = conds.length ? and(...conds) : undefined;
  const take = Math.min(opts.limit ?? 20, 100);

  const rows = await db
    .select({
      path: auditRequestLogs.path,
      avg_response_time: sql<number>`ROUND(AVG(${auditRequestLogs.response_time_ms}), 1)`,
      max_response_time: sql<number>`MAX(${auditRequestLogs.response_time_ms})`,
      request_count: sql<number>`COUNT(*)`,
    })
    .from(auditRequestLogs)
    .where(where)
    .groupBy(auditRequestLogs.path)
    .having(sql`COUNT(*) >= 5`)
    .orderBy(sql`AVG(${auditRequestLogs.response_time_ms}) DESC`)
    .limit(take);

  return rows.map((r) => ({
    path: String(r.path),
    avg_response_time: Number(r.avg_response_time ?? 0),
    max_response_time: Number(r.max_response_time ?? 0),
    request_count: Number(r.request_count ?? 0),
  }));
}

/* ---- Top Users ---- */
export type TopUserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  request_count: number;
  last_seen: string;
};

export async function repoGetTopUsers(opts: {
  created_from?: string;
  created_to?: string;
  exclude_localhost?: AuditBoolLike;
  limit?: number;
}): Promise<TopUserRow[]> {
  const conds: SQL[] = [sql`${auditRequestLogs.user_id} IS NOT NULL`];
  conds.push(...dateRangeConds(opts));
  const where = and(...conds);
  const take = Math.min(opts.limit ?? 20, 100);

  const rows = await db
    .select({
      user_id: auditRequestLogs.user_id,
      email: users.email,
      full_name: users.full_name,
      request_count: sql<number>`COUNT(*)`,
      last_seen: sql<string>`MAX(${auditRequestLogs.created_at})`,
    })
    .from(auditRequestLogs)
    .leftJoin(users, eq(auditRequestLogs.user_id, users.id))
    .where(where)
    .groupBy(auditRequestLogs.user_id, users.email, users.full_name)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(take);

  return rows.map((r) => ({
    user_id: String(r.user_id),
    email: r.email ?? null,
    full_name: r.full_name ?? null,
    request_count: Number(r.request_count ?? 0),
    last_seen: String(r.last_seen ?? ''),
  }));
}

/* ---- Top IPs ---- */
export type TopIpRow = {
  ip: string;
  country: string | null;
  request_count: number;
  last_seen: string;
};

export async function repoGetTopIps(opts: {
  created_from?: string;
  created_to?: string;
  exclude_localhost?: AuditBoolLike;
  limit?: number;
}): Promise<TopIpRow[]> {
  const conds = dateRangeConds(opts);
  const where = conds.length ? and(...conds) : undefined;
  const take = Math.min(opts.limit ?? 20, 100);

  const rows = await db
    .select({
      ip: auditRequestLogs.ip,
      country: sql<string>`MAX(${auditRequestLogs.country})`,
      request_count: sql<number>`COUNT(*)`,
      last_seen: sql<string>`MAX(${auditRequestLogs.created_at})`,
    })
    .from(auditRequestLogs)
    .where(where)
    .groupBy(auditRequestLogs.ip)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(take);

  return rows.map((r) => ({
    ip: String(r.ip),
    country: r.country ?? null,
    request_count: Number(r.request_count ?? 0),
    last_seen: String(r.last_seen ?? ''),
  }));
}

/* ---- Status Distribution ---- */
export type StatusDistributionRow = {
  status_group: string;
  count: number;
};

export async function repoGetStatusDistribution(opts: {
  created_from?: string;
  created_to?: string;
  exclude_localhost?: AuditBoolLike;
}): Promise<StatusDistributionRow[]> {
  const conds = dateRangeConds(opts);
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db
    .select({
      status_group: sql<string>`CASE
        WHEN ${auditRequestLogs.status_code} BETWEEN 200 AND 299 THEN '2xx'
        WHEN ${auditRequestLogs.status_code} BETWEEN 300 AND 399 THEN '3xx'
        WHEN ${auditRequestLogs.status_code} BETWEEN 400 AND 499 THEN '4xx'
        WHEN ${auditRequestLogs.status_code} >= 500 THEN '5xx'
        ELSE 'other'
      END`,
      count: sql<number>`COUNT(*)`,
    })
    .from(auditRequestLogs)
    .where(where)
    .groupBy(sql`CASE
      WHEN ${auditRequestLogs.status_code} BETWEEN 200 AND 299 THEN '2xx'
      WHEN ${auditRequestLogs.status_code} BETWEEN 300 AND 399 THEN '3xx'
      WHEN ${auditRequestLogs.status_code} BETWEEN 400 AND 499 THEN '4xx'
      WHEN ${auditRequestLogs.status_code} >= 500 THEN '5xx'
      ELSE 'other'
    END`)
    .orderBy(sql`1`);

  return rows.map((r) => ({
    status_group: String(r.status_group ?? 'other'),
    count: Number(r.count ?? 0),
  }));
}

/* ---- Method Distribution ---- */
export type MethodDistributionRow = {
  method: string;
  count: number;
};

export async function repoGetMethodDistribution(opts: {
  created_from?: string;
  created_to?: string;
  exclude_localhost?: AuditBoolLike;
}): Promise<MethodDistributionRow[]> {
  const conds = dateRangeConds(opts);
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db
    .select({
      method: auditRequestLogs.method,
      count: sql<number>`COUNT(*)`,
    })
    .from(auditRequestLogs)
    .where(where)
    .groupBy(auditRequestLogs.method)
    .orderBy(sql`COUNT(*) DESC`);

  return rows.map((r) => ({
    method: String(r.method),
    count: Number(r.count ?? 0),
  }));
}

/* ---- Hourly Breakdown ---- */
export type HourlyRow = {
  date: string;
  hour: number;
  requests: number;
  errors: number;
  avg_response_time: number;
};

export async function repoGetHourlyBreakdown(opts: {
  created_from: string;
  created_to: string;
  exclude_localhost?: AuditBoolLike;
}): Promise<HourlyRow[]> {
  const conds = dateRangeConds(opts);
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db
    .select({
      date: sql<string>`DATE(${auditRequestLogs.created_at})`,
      hour: sql<number>`HOUR(${auditRequestLogs.created_at})`,
      requests: sql<number>`COUNT(*)`,
      errors: sql<number>`SUM(CASE WHEN ${auditRequestLogs.status_code} >= 400 THEN 1 ELSE 0 END)`,
      avg_response_time: sql<number>`ROUND(AVG(${auditRequestLogs.response_time_ms}), 1)`,
    })
    .from(auditRequestLogs)
    .where(where)
    .groupBy(
      sql`DATE(${auditRequestLogs.created_at})`,
      sql`HOUR(${auditRequestLogs.created_at})`,
    )
    .orderBy(
      sql`DATE(${auditRequestLogs.created_at}) ASC`,
      sql`HOUR(${auditRequestLogs.created_at}) ASC`,
    );

  return rows.map((r) => ({
    date: String(r.date),
    hour: Number(r.hour ?? 0),
    requests: Number(r.requests ?? 0),
    errors: Number(r.errors ?? 0),
    avg_response_time: Number(r.avg_response_time ?? 0),
  }));
}

/* ---- Response Time Stats ---- */
export type ResponseTimeStatsResult = {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
  total_requests: number;
};

export async function repoGetResponseTimeStats(opts: {
  created_from?: string;
  created_to?: string;
  exclude_localhost?: AuditBoolLike;
  path?: string;
}): Promise<ResponseTimeStatsResult> {
  const conds = dateRangeConds(opts);
  if (opts.path?.trim()) {
    conds.push(eq(auditRequestLogs.path, opts.path.trim()));
  }
  const where = conds.length ? and(...conds) : undefined;

  const [statsRow] = await db
    .select({
      avg: sql<number>`ROUND(AVG(${auditRequestLogs.response_time_ms}), 1)`,
      min: sql<number>`MIN(${auditRequestLogs.response_time_ms})`,
      max: sql<number>`MAX(${auditRequestLogs.response_time_ms})`,
      total: sql<number>`COUNT(*)`,
    })
    .from(auditRequestLogs)
    .where(where);

  const total = Number(statsRow?.total ?? 0);
  if (total === 0) {
    return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0, total_requests: 0 };
  }

  const p50Offset = Math.max(0, Math.floor(total * 0.5) - 1);
  const p95Offset = Math.max(0, Math.floor(total * 0.95) - 1);
  const p99Offset = Math.max(0, Math.floor(total * 0.99) - 1);

  const [r50] = await db
    .select({ v: auditRequestLogs.response_time_ms })
    .from(auditRequestLogs)
    .where(where)
    .orderBy(sql`${auditRequestLogs.response_time_ms} ASC`)
    .limit(1)
    .offset(p50Offset);

  const [r95] = await db
    .select({ v: auditRequestLogs.response_time_ms })
    .from(auditRequestLogs)
    .where(where)
    .orderBy(sql`${auditRequestLogs.response_time_ms} ASC`)
    .limit(1)
    .offset(p95Offset);

  const [r99] = await db
    .select({ v: auditRequestLogs.response_time_ms })
    .from(auditRequestLogs)
    .where(where)
    .orderBy(sql`${auditRequestLogs.response_time_ms} ASC`)
    .limit(1)
    .offset(p99Offset);

  return {
    p50: Number(r50?.v ?? 0),
    p95: Number(r95?.v ?? 0),
    p99: Number(r99?.v ?? 0),
    avg: Number(statsRow?.avg ?? 0),
    min: Number(statsRow?.min ?? 0),
    max: Number(statsRow?.max ?? 0),
    total_requests: total,
  };
}

/* ---- Dashboard Summary ---- */
export type AuditSummary = {
  today_requests: number;
  today_errors: number;
  today_error_rate: number;
  today_avg_response_time: number;
  today_unique_ips: number;
  today_unique_users: number;
  top_error_endpoint: { path: string; count: number } | null;
  slowest_endpoint: { path: string; avg_ms: number } | null;
};

export async function repoGetAuditSummary(opts?: { exclude_localhost?: AuditBoolLike }): Promise<AuditSummary> {
  const baseConds: SQL[] = [sql`DATE(${auditRequestLogs.created_at}) = CURDATE()`];
  if (opts?.exclude_localhost && isTruthyBoolLike(opts.exclude_localhost)) {
    baseConds.push(excludeLocalhostCond(auditRequestLogs));
  }
  const todayCond = and(...baseConds)!;

  const [totals] = await db
    .select({
      requests: sql<number>`COUNT(*)`,
      errors: sql<number>`SUM(CASE WHEN ${auditRequestLogs.status_code} >= 400 THEN 1 ELSE 0 END)`,
      avg_response_time: sql<number>`ROUND(AVG(${auditRequestLogs.response_time_ms}), 1)`,
      unique_ips: sql<number>`COUNT(DISTINCT ${auditRequestLogs.ip})`,
      unique_users: sql<number>`COUNT(DISTINCT ${auditRequestLogs.user_id})`,
    })
    .from(auditRequestLogs)
    .where(todayCond);

  const requests = Number(totals?.requests ?? 0);
  const errors = Number(totals?.errors ?? 0);

  const [topErr] = await db
    .select({
      path: auditRequestLogs.path,
      count: sql<number>`COUNT(*)`,
    })
    .from(auditRequestLogs)
    .where(and(todayCond, sql`${auditRequestLogs.status_code} >= 400`))
    .groupBy(auditRequestLogs.path)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(1);

  const [slowest] = await db
    .select({
      path: auditRequestLogs.path,
      avg_ms: sql<number>`ROUND(AVG(${auditRequestLogs.response_time_ms}), 1)`,
    })
    .from(auditRequestLogs)
    .where(todayCond)
    .groupBy(auditRequestLogs.path)
    .having(sql`COUNT(*) >= 3`)
    .orderBy(sql`AVG(${auditRequestLogs.response_time_ms}) DESC`)
    .limit(1);

  return {
    today_requests: requests,
    today_errors: errors,
    today_error_rate: requests > 0 ? Math.round((errors / requests) * 10000) / 100 : 0,
    today_avg_response_time: Number(totals?.avg_response_time ?? 0),
    today_unique_ips: Number(totals?.unique_ips ?? 0),
    today_unique_users: Number(totals?.unique_users ?? 0),
    top_error_endpoint: topErr ? { path: String(topErr.path), count: Number(topErr.count) } : null,
    slowest_endpoint: slowest ? { path: String(slowest.path), avg_ms: Number(slowest.avg_ms) } : null,
  };
}

/* ---- Monthly Aggregation ---- */
export type MonthlyRow = {
  month: string;
  requests: number;
  unique_ips: number;
  errors: number;
  avg_response_time: number;
};

export async function repoGetMonthlyAggregation(opts: {
  months?: number;
  exclude_localhost?: AuditBoolLike;
}): Promise<MonthlyRow[]> {
  const monthCount = Math.min(Math.max(opts.months ?? 12, 1), 24);
  const conds: SQL[] = [sql`${auditRequestLogs.created_at} >= DATE_SUB(CURDATE(), INTERVAL ${monthCount} MONTH)`];
  if (typeof opts.exclude_localhost !== 'undefined' && isTruthyBoolLike(opts.exclude_localhost)) {
    conds.push(excludeLocalhostCond(auditRequestLogs));
  }

  const rows = await db
    .select({
      month: sql<string>`DATE_FORMAT(${auditRequestLogs.created_at}, '%Y-%m')`,
      requests: sql<number>`COUNT(*)`,
      unique_ips: sql<number>`COUNT(DISTINCT ${auditRequestLogs.ip})`,
      errors: sql<number>`SUM(CASE WHEN ${auditRequestLogs.status_code} >= 400 THEN 1 ELSE 0 END)`,
      avg_response_time: sql<number>`ROUND(AVG(${auditRequestLogs.response_time_ms}), 1)`,
    })
    .from(auditRequestLogs)
    .where(and(...conds))
    .groupBy(sql`DATE_FORMAT(${auditRequestLogs.created_at}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${auditRequestLogs.created_at}, '%Y-%m') ASC`);

  return rows.map((r) => ({
    month: String(r.month),
    requests: Number(r.requests ?? 0),
    unique_ips: Number(r.unique_ips ?? 0),
    errors: Number(r.errors ?? 0),
    avg_response_time: Number(r.avg_response_time ?? 0),
  }));
}
