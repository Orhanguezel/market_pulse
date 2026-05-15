// =============================================================
// FILE: src/integrations/types/audit.types.ts
// – Audit Types (Frontend DTO + Query Params)
// =============================================================

import { BoolLike } from '@/integrations/shared';

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

export type AuditMetricsDailyDto = {
  days: AuditMetricsDailyRowDto[];
};
