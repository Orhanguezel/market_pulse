// =============================================================
// FILE: src/modules/audit/admin.routes.ts
// corporate-backend – Audit Admin Routes (Viewer + Analytics + Export)
//   - ONLY route definitions
//   - Admin guards are applied at the app.ts level
// =============================================================

import type { FastifyInstance } from 'fastify';

import {
  listAuditRequestLogsAdmin,
  listAuditAuthEventsAdmin,
  getAuditMetricsDailyAdmin,
  getAuditGeoStatsAdmin,
  clearAuditLogsAdmin,
} from './admin.controller';

import {
  getTopEndpointsAdmin,
  getSlowestEndpointsAdmin,
  getTopUsersAdmin,
  getTopIpsAdmin,
  getStatusDistributionAdmin,
  getMethodDistributionAdmin,
  getHourlyBreakdownAdmin,
  getResponseTimeStatsAdmin,
  getAuditSummaryAdmin,
  getMonthlyAggregationAdmin,
} from './analytics.controller';

import {
  exportRequestLogsAdmin,
  exportAuthEventsAdmin,
} from './export.controller';

const B = '/audit';
const A = `${B}/analytics`;

export async function registerAuditAdmin(app: FastifyInstance) {
  // ---- Core endpoints ----
  app.get(`${B}/request-logs`, listAuditRequestLogsAdmin);
  app.get(`${B}/auth-events`, listAuditAuthEventsAdmin);
  app.get(`${B}/metrics/daily`, getAuditMetricsDailyAdmin);
  app.get(`${B}/geo-stats`, getAuditGeoStatsAdmin);
  app.delete(`${B}/clear`, clearAuditLogsAdmin);

  // ---- Analytics endpoints ----
  app.get(`${A}/summary`, getAuditSummaryAdmin);
  app.get(`${A}/top-endpoints`, getTopEndpointsAdmin);
  app.get(`${A}/slowest-endpoints`, getSlowestEndpointsAdmin);
  app.get(`${A}/top-users`, getTopUsersAdmin);
  app.get(`${A}/top-ips`, getTopIpsAdmin);
  app.get(`${A}/status-distribution`, getStatusDistributionAdmin);
  app.get(`${A}/method-distribution`, getMethodDistributionAdmin);
  app.get(`${A}/hourly`, getHourlyBreakdownAdmin);
  app.get(`${A}/response-time-stats`, getResponseTimeStatsAdmin);
  app.get(`${A}/monthly`, getMonthlyAggregationAdmin);

  // ---- Export endpoints ----
  app.get(`${B}/export/request-logs`, exportRequestLogsAdmin);
  app.get(`${B}/export/auth-events`, exportAuthEventsAdmin);
}
