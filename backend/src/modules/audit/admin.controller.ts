// =============================================================
// FILE: src/modules/audit/admin.controller.ts
// corporate-backend – Audit Admin Controller
// =============================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';

import {
  auditAuthEventsListQuerySchema,
  auditRequestLogsListQuerySchema,
  auditMetricsDailyQuerySchema,
  auditGeoStatsQuerySchema,
  auditClearQuerySchema,
  type AuditAuthEventsListQuery,
  type AuditRequestLogsListQuery,
  type AuditMetricsDailyQuery,
  isTruthyBoolLike,
  repoListAuditRequestLogs,
  repoListAuditAuthEvents,
  repoGetAuditMetricsDaily,
  repoGetAuditGeoStats,
  repoClearAuditLogs,
} from './helpers';
import { setContentRange } from '../_shared';

type ListResponse<T> = { items: T[]; total: number };

type ListResultShape<T> =
  | T[]
  | { items?: T[]; data?: T[]; total?: number | string }
  | null
  | undefined;

function coerceListResult<T>(r: ListResultShape<T>): ListResponse<T> {
  if (!r) return { items: [], total: 0 };
  if (Array.isArray(r)) return { items: r as T[], total: r.length };

  if (Array.isArray(r.items)) {
    return {
      items: r.items as T[],
      total: Number.isFinite(Number(r.total)) ? Number(r.total) : r.items.length,
    };
  }

  if (Array.isArray(r.data)) {
    return {
      items: r.data as T[],
      total: Number.isFinite(Number(r.total)) ? Number(r.total) : r.data.length,
    };
  }

  return { items: [], total: 0 };
}

export async function listAuditRequestLogsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = auditRequestLogsListQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }

    const q = parsed.data as AuditRequestLogsListQuery;

    const raw = await repoListAuditRequestLogs(q);
    const { items, total } = coerceListResult(raw);

    const offset = q.offset ?? 0;
    const limit = q.limit ?? items.length ?? 0;

    setContentRange(reply, offset, limit, total);
    reply.header('x-total-count', String(total ?? 0));
    return reply.send({ items, total });
  } catch (e) {
    return handleRouteError(reply, req, e, 'list_audit_request_logs');
  }
}

export async function listAuditAuthEventsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = auditAuthEventsListQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }

    const q = parsed.data as AuditAuthEventsListQuery;

    const raw = await repoListAuditAuthEvents(q);
    const { items, total } = coerceListResult(raw);

    const offset = q.offset ?? 0;
    const limit = q.limit ?? items.length ?? 0;

    setContentRange(reply, offset, limit, total);
    reply.header('x-total-count', String(total ?? 0));
    return reply.send({ items, total });
  } catch (e) {
    return handleRouteError(reply, req, e, 'list_audit_auth_events');
  }
}

export async function getAuditMetricsDailyAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = auditMetricsDailyQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }

    const q = parsed.data as AuditMetricsDailyQuery;
    const onlyAdmin =
      typeof q.only_admin === 'undefined' ? undefined : isTruthyBoolLike(q.only_admin);

    const raw = await repoGetAuditMetricsDaily({
      days: q.days,
      only_admin: onlyAdmin,
      path_prefix: q.path_prefix?.trim() ? q.path_prefix.trim() : undefined,
    });

    const days =
      typeof raw === 'object' && raw !== null && 'days' in raw && Array.isArray((raw as { days?: unknown }).days)
        ? ((raw as { days: unknown[] }).days)
        : Array.isArray(raw)
        ? raw
        : [];

    return reply.send({ days });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_audit_metrics_daily');
  }
}

export async function clearAuditLogsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = auditClearQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }

    const { target } = parsed.data;
    const result = await repoClearAuditLogs(target);
    return reply.send({ ok: true, ...result });
  } catch (e) {
    return handleRouteError(reply, req, e, 'clear_audit_logs');
  }
}

export async function getAuditGeoStatsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = auditGeoStatsQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }

    const q = parsed.data;
    const onlyAdmin =
      typeof q.only_admin === 'undefined' ? undefined : isTruthyBoolLike(q.only_admin);

    const rows = await repoGetAuditGeoStats({
      days: q.days,
      only_admin: onlyAdmin,
      source: q.source,
    });

    return reply.send({ items: rows });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_audit_geo_stats');
  }
}
