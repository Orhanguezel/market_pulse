// =============================================================
// FILE: src/modules/audit/metrics.repository.ts
// corporate-backend – Audit Metrics Repository (daily aggregation)
// =============================================================

import { db } from '../../db/client';
import { auditRequestLogs } from './schema';
import { and, eq, gte, like, sql, type SQL } from 'drizzle-orm';

export type AuditMetricsDailyRow = {
  date: string; // YYYY-MM-DD
  requests: number;
  unique_ips: number;
  errors: number;
};

export type GetAuditMetricsDailyInput = {
  days: number; // 1..90
  only_admin?: boolean;
  path_prefix?: string;
};

function clampDays(days: unknown, fallback = 14) {
  const n = typeof days === 'number' ? days : Number(days);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(90, Math.floor(n)));
}

export async function repoGetAuditMetricsDaily(
  input: GetAuditMetricsDailyInput,
): Promise<{ days: AuditMetricsDailyRow[] }> {
  const days = clampDays(input.days, 14);

  const fromExpr = sql<Date>`DATE_SUB(CURDATE(), INTERVAL ${days - 1} DAY)`;

  const conds: SQL[] = [gte(auditRequestLogs.created_at, fromExpr)];

  if (typeof input.only_admin === 'boolean') {
    conds.push(eq(auditRequestLogs.is_admin, input.only_admin ? 1 : 0));
  }

  if (input.path_prefix && input.path_prefix.trim()) {
    const p = input.path_prefix.trim();
    conds.push(like(auditRequestLogs.path, `${p}%`));
  }

  const rows = await db
    .select({
      date: sql<string>`DATE(${auditRequestLogs.created_at})`,
      requests: sql<number>`COUNT(*)`,
      unique_ips: sql<number>`COUNT(DISTINCT ${auditRequestLogs.ip})`,
      errors: sql<number>`SUM(CASE WHEN ${auditRequestLogs.status_code} >= 400 THEN 1 ELSE 0 END)`,
    })
    .from(auditRequestLogs)
    .where(and(...conds))
    .groupBy(sql`DATE(${auditRequestLogs.created_at})`)
    .orderBy(sql`DATE(${auditRequestLogs.created_at}) ASC`);

  const daysArr: AuditMetricsDailyRow[] = (rows ?? []).map((r) => ({
    date: String(r.date ?? ''),
    requests: Number(r.requests ?? 0),
    unique_ips: Number(r.unique_ips ?? 0),
    errors: Number(r.errors ?? 0),
  }));

  return { days: daysArr };
}
