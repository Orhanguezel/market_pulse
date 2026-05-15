// =============================================================
// FILE: src/integrations/types/audit.types.ts
// Audit Types (Frontend DTO + Query Params)
// =============================================================

import type { BoolLike } from '@/integrations/shared/common';

export type AuditRequestLogDto = {
  id: number;

  req_id: string;
  method: string;
  url: string;
  path: string;

  status_code: number;
  response_time_ms: number;

  ip: string;
  user_agent: string | null;
  referer: string | null;
  body_snapshot: string | null;

  user_id: string | null;
  is_admin: number;

  country: string | null;
  city: string | null;

  created_at: string; // ISO
};

export const AUDIT_AUTH_EVENTS = ['login_success', 'login_failed', 'logout'] as const;
export type AuditAuthEvent = (typeof AUDIT_AUTH_EVENTS)[number];

export type AuditAuthEventDto = {
  id: number;

  event: AuditAuthEvent;
  user_id: string | null;
  email: string | null;

  ip: string;
  user_agent: string | null;

  country: string | null;
  city: string | null;

  created_at: string; // ISO
};

export type AuditRequestLogsListQueryParams = {
  q?: string;
  method?: string;
  status_code?: number;

  user_id?: string;
  ip?: string;

  only_admin?: BoolLike;

  created_from?: string; // "2025-12-24 10:00:00.000" gibi
  created_to?: string;

  sort?: 'created_at' | 'response_time_ms' | 'status_code';
  orderDir?: 'asc' | 'desc';

  limit?: number;
  offset?: number;
};

export type AuditAuthEventsListQueryParams = {
  event?: AuditAuthEvent;
  user_id?: string;
  email?: string;
  ip?: string;

  created_from?: string;
  created_to?: string;

  sort?: 'created_at';
  orderDir?: 'asc' | 'desc';

  limit?: number;
  offset?: number;
};

/**
 * ✅ Backend ile uyumlu:
 * GET /admin/audit/metrics/daily?days=14&only_admin=true&path_prefix=/api
 *
 * NOT: Backend'de created_from/created_to YOK (şu an).
 */
export type AuditMetricsDailyQueryParams = {
  days?: number; // default 14
  only_admin?: BoolLike;
  path_prefix?: string;
};

export type AuditMetricsDailyRowDto = {
  date: string; // "YYYY-MM-DD"
  requests: number;
  unique_ips: number;
  errors: number;
};

export type AuditMetricsDailyResponseDto = {
  days: AuditMetricsDailyRowDto[];
  from?: string;
  to?: string;
  only_admin?: boolean;
  path_prefix?: string;
};

export type AuditMetricsDailyDto = AuditMetricsDailyResponseDto;

export type AuditListResponse<T> = { items: T[]; total: number };

export function coerceAuditList<T>(raw: unknown): AuditListResponse<T> {
  const r = raw as any;
  if (!r) return { items: [], total: 0 };
  if (Array.isArray(r)) return { items: r as T[], total: r.length };
  if (Array.isArray(r.items)) {
    const total = Number.isFinite(Number(r.total)) ? Number(r.total) : r.items.length;
    return { items: r.items as T[], total };
  }
  if (Array.isArray(r.data)) {
    const total = Number.isFinite(Number(r.total)) ? Number(r.total) : r.data.length;
    return { items: r.data as T[], total };
  }
  return { items: [], total: 0 };
}

/* ---- Geo Stats ---- */

export type AuditGeoStatsQueryParams = {
  days?: number;
  only_admin?: BoolLike;
  source?: 'requests' | 'auth';
};

export type AuditGeoStatsRowDto = {
  country: string;
  count: number;
  unique_ips: number;
};

export type AuditGeoStatsResponseDto = {
  items: AuditGeoStatsRowDto[];
};

export function coerceAuditGeoStats(raw: unknown): AuditGeoStatsResponseDto {
  const r = raw as any;
  if (!r) return { items: [] };
  if (Array.isArray(r)) return { items: r };
  if (Array.isArray(r.items)) return { items: r.items };
  if (Array.isArray(r.data)) return { items: r.data };
  return { items: [] };
}

export function coerceAuditMetricsDaily(raw: unknown): AuditMetricsDailyResponseDto {
  const r = raw as any;
  if (!r) return { days: [] };
  if (Array.isArray(r)) return { days: r as AuditMetricsDailyRowDto[] };
  if (Array.isArray(r.days)) return r as AuditMetricsDailyResponseDto;
  if (Array.isArray(r.items)) return { ...r, days: r.items };
  if (Array.isArray(r.data)) return { ...r, days: r.data };
  return { days: [] };
}
