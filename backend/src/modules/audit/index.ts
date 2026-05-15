// src/modules/audit/index.ts
// External module surface for audit. Keep explicit; no export *.

export { registerAudit } from './router';
export { registerAuditAdmin } from './admin.routes';
export { registerAuditStream } from './stream.routes';

export {
  listAuditRequestLogsAdmin,
  listAuditAuthEventsAdmin,
  getAuditMetricsDailyAdmin,
  getAuditGeoStatsAdmin,
  clearAuditLogsAdmin,
} from './admin.controller';

export {
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

export {
  exportRequestLogsAdmin,
  exportAuthEventsAdmin,
} from './export.controller';

export { handleAuditStreamSse } from './stream.controller';

export {
  writeRequestAuditLog,
  shouldSkipAuditLog,
  repoListAuditRequestLogs,
  repoListAuditAuthEvents,
  repoGetAuditMetricsDaily,
  repoGetAuditGeoStats,
  repoClearAuditLogs,
  auditRequestLogsListQuerySchema,
  auditAuthEventsListQuerySchema,
  auditMetricsDailyQuerySchema,
  auditGeoStatsQuerySchema,
  auditClearQuerySchema,
  auditExportQuery,
  isTruthyBoolLike,
} from './helpers';
