// src/modules/audit/helpers/index.ts
// Local helper barrel for audit module. Keep explicit; no export *.

export {
  auditAuthEventsListQuerySchema,
  auditRequestLogsListQuerySchema,
  auditMetricsDailyQuerySchema,
  auditGeoStatsQuerySchema,
  auditClearQuerySchema,
  analyticsDateRangeQuery,
  analyticsHourlyQuery,
  analyticsResponseTimeQuery,
  analyticsMonthlyQuery,
  auditExportQuery,
  isTruthyBoolLike,
} from '../validation';
export type {
  AuditAuthEventsListQuery,
  AuditRequestLogsListQuery,
  AuditMetricsDailyQuery,
} from '../validation';

export {
  repoListAuditRequestLogs,
  repoListAuditAuthEvents,
  repoGetAuditMetricsDaily,
  repoGetAuditGeoStats,
  repoClearAuditLogs,
  repoExportRequestLogs,
  repoExportAuthEvents,
  buildRequestLogExportConds,
  buildAuthEventExportConds,
  repoPersistAuditEvent,
} from '../repository';

export {
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
} from '../analytics.repository';

export {
  writeRequestAuditLog,
  shouldSkipAuditLog,
} from '../service';
