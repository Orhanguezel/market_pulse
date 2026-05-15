// =============================================================
// FILE: src/modules/audit/validation.ts
// =============================================================

import { z } from 'zod';
import { boolLike } from '../_shared';

// ✅ herkes aynı helper’ı kullansın (repo/controller/service)
export const isTruthyBoolLike = (v: unknown) => v === true || v === 1 || v === '1' || v === 'true';

export const AUDIT_AUTH_EVENTS = ['login_success', 'login_failed', 'logout'] as const;
export type AuditAuthEvent = (typeof AUDIT_AUTH_EVENTS)[number];
export const AUDIT_AUTH_EVENT_ENUM = z.enum(AUDIT_AUTH_EVENTS);

/* -------------------------------------------------------------
 * ADMIN – Request logs list query
 * ------------------------------------------------------------- */
export const auditRequestLogsListQuerySchema = z.object({
  q: z.string().optional(),
  method: z.string().max(16).optional(),
  status_code: z.coerce.number().int().min(100).max(599).optional(),

  user_id: z.string().max(64).optional(),
  ip: z.string().max(64).optional(),

  only_admin: boolLike.optional(),
  exclude_localhost: boolLike.optional(),

  created_from: z.string().optional(),
  created_to: z.string().optional(),

  sort: z.enum(['created_at', 'response_time_ms', 'status_code']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),

  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type AuditRequestLogsListQuery = z.infer<typeof auditRequestLogsListQuerySchema>;

/* -------------------------------------------------------------
 * ADMIN – Auth events list query
 * ------------------------------------------------------------- */
export const auditAuthEventsListQuerySchema = z.object({
  event: AUDIT_AUTH_EVENT_ENUM.optional(),
  user_id: z.string().max(64).optional(),
  email: z.string().max(255).optional(),
  ip: z.string().max(64).optional(),

  exclude_localhost: boolLike.optional(),

  created_from: z.string().optional(),
  created_to: z.string().optional(),

  sort: z.enum(['created_at']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),

  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type AuditAuthEventsListQuery = z.infer<typeof auditAuthEventsListQuerySchema>;

/* -------------------------------------------------------------
 * ADMIN – Metrics daily query
 * GET /audit/metrics/daily?days=14&only_admin=true&path_prefix=/api
 * ------------------------------------------------------------- */
export const auditMetricsDailyQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(14),
  only_admin: boolLike.optional(),
  exclude_localhost: boolLike.optional(),
  path_prefix: z.string().max(255).optional(),
});

export type AuditMetricsDailyQuery = z.infer<typeof auditMetricsDailyQuerySchema>;

/* -------------------------------------------------------------
 * ADMIN – Geo stats query
 * GET /audit/geo-stats?days=30&only_admin=true&source=requests
 * ------------------------------------------------------------- */
export const auditGeoStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
  only_admin: boolLike.optional(),
  exclude_localhost: boolLike.optional(),
  source: z.enum(['requests', 'auth']).default('requests'),
});

export type AuditGeoStatsQueryValidated = z.infer<typeof auditGeoStatsQuerySchema>;

/* -------------------------------------------------------------
 * ADMIN – Clear audit logs
 * DELETE /audit/clear?target=all|requests|auth
 * ------------------------------------------------------------- */
export const auditClearQuerySchema = z.object({
  target: z.enum(['requests', 'auth', 'all']).default('all'),
});

export type AuditClearQuery = z.infer<typeof auditClearQuerySchema>;

/* -------------------------------------------------------------
 * ANALYTICS – Date range query (shared base)
 * ------------------------------------------------------------- */
export const analyticsDateRangeQuery = z.object({
  created_from: z.string().optional(),
  created_to: z.string().optional(),
  exclude_localhost: boolLike.optional(),
  limit: z.coerce.number().int().min(1).max(250).optional(),
});

export type AnalyticsDateRangeQuery = z.infer<typeof analyticsDateRangeQuery>;

/* -------------------------------------------------------------
 * ANALYTICS – Hourly breakdown query
 * ------------------------------------------------------------- */
export const analyticsHourlyQuery = z.object({
  created_from: z.string().min(1, 'created_from is required'),
  created_to: z.string().min(1, 'created_to is required'),
  exclude_localhost: boolLike.optional(),
});

export type AnalyticsHourlyQuery = z.infer<typeof analyticsHourlyQuery>;

/* -------------------------------------------------------------
 * ANALYTICS – Response time stats query
 * ------------------------------------------------------------- */
export const analyticsResponseTimeQuery = z.object({
  created_from: z.string().optional(),
  created_to: z.string().optional(),
  exclude_localhost: boolLike.optional(),
  path: z.string().max(255).optional(),
});

export type AnalyticsResponseTimeQuery = z.infer<typeof analyticsResponseTimeQuery>;

/* -------------------------------------------------------------
 * ANALYTICS – Monthly aggregation query
 * ------------------------------------------------------------- */
export const analyticsMonthlyQuery = z.object({
  months: z.coerce.number().int().min(1).max(24).default(12),
  exclude_localhost: boolLike.optional(),
});

export type AnalyticsMonthlyQuery = z.infer<typeof analyticsMonthlyQuery>;

/* -------------------------------------------------------------
 * EXPORT – Audit logs export query
 * ------------------------------------------------------------- */
export const auditExportQuery = z.object({
  format: z.enum(['csv', 'json']).default('csv'),

  // Shared filters (same as list endpoints)
  q: z.string().optional(),
  method: z.string().max(16).optional(),
  status_code: z.coerce.number().int().min(100).max(599).optional(),
  user_id: z.string().max(64).optional(),
  ip: z.string().max(64).optional(),
  only_admin: boolLike.optional(),
  exclude_localhost: boolLike.optional(),
  created_from: z.string().optional(),
  created_to: z.string().optional(),

  // Auth events specific
  event: AUDIT_AUTH_EVENT_ENUM.optional(),
  email: z.string().max(255).optional(),
});

export type AuditExportQuery = z.infer<typeof auditExportQuery>;
