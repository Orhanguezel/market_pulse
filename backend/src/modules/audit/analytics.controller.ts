// =============================================================
// FILE: src/modules/audit/analytics.controller.ts
// corporate-backend – Audit Analytics Controller
// =============================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';

import {
  analyticsDateRangeQuery,
  analyticsHourlyQuery,
  analyticsResponseTimeQuery,
  analyticsMonthlyQuery,
  repoGetTopEndpoints,
  repoGetSlowestEndpoints,
  repoGetTopUsers,
  repoGetTopIps,
  repoGetStatusDistribution,
  repoGetMethodDistribution,
  repoGetHourlyBreakdown,
  repoGetResponseTimeStats,
  repoGetAuditSummary,
  repoGetMonthlyAggregation,
} from './helpers';

/* ---- Top Endpoints ---- */
export async function getTopEndpointsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = analyticsDateRangeQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }
    const items = await repoGetTopEndpoints(parsed.data);
    return reply.send({ items });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_top_endpoints');
  }
}

/* ---- Slowest Endpoints ---- */
export async function getSlowestEndpointsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = analyticsDateRangeQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }
    const items = await repoGetSlowestEndpoints(parsed.data);
    return reply.send({ items });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_slowest_endpoints');
  }
}

/* ---- Top Users ---- */
export async function getTopUsersAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = analyticsDateRangeQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }
    const items = await repoGetTopUsers(parsed.data);
    return reply.send({ items });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_top_users');
  }
}

/* ---- Top IPs ---- */
export async function getTopIpsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = analyticsDateRangeQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }
    const items = await repoGetTopIps(parsed.data);
    return reply.send({ items });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_top_ips');
  }
}

/* ---- Status Distribution ---- */
export async function getStatusDistributionAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = analyticsDateRangeQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }
    const items = await repoGetStatusDistribution(parsed.data);
    return reply.send({ items });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_status_distribution');
  }
}

/* ---- Method Distribution ---- */
export async function getMethodDistributionAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = analyticsDateRangeQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }
    const items = await repoGetMethodDistribution(parsed.data);
    return reply.send({ items });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_method_distribution');
  }
}

/* ---- Hourly Breakdown ---- */
export async function getHourlyBreakdownAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = analyticsHourlyQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }
    const items = await repoGetHourlyBreakdown(parsed.data);
    return reply.send({ items });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_hourly_breakdown');
  }
}

/* ---- Response Time Stats ---- */
export async function getResponseTimeStatsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = analyticsResponseTimeQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }
    const stats = await repoGetResponseTimeStats(parsed.data);
    return reply.send(stats);
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_response_time_stats');
  }
}

/* ---- Summary ---- */
export async function getAuditSummaryAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = (req.query ?? {}) as { exclude_localhost?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false' };
    const summary = await repoGetAuditSummary({ exclude_localhost: q.exclude_localhost });
    return reply.send(summary);
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_audit_summary');
  }
}

/* ---- Monthly Aggregation ---- */
export async function getMonthlyAggregationAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = analyticsMonthlyQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }
    const items = await repoGetMonthlyAggregation(parsed.data);
    return reply.send({ items });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_monthly_aggregation');
  }
}
