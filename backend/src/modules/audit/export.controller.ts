// =============================================================
// FILE: src/modules/audit/export.controller.ts
// corporate-backend – Audit Export Controller (CSV / JSON)
// =============================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';

import {
  auditExportQuery,
  repoExportRequestLogs,
  repoExportAuthEvents,
  buildRequestLogExportConds,
  buildAuthEventExportConds,
} from './helpers';

const MAX_EXPORT_ROWS = 50_000;
type CsvExportRow = Record<string, unknown>;

/* ---- CSV helpers ---- */
function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function csvRow(values: unknown[]): string {
  return values.map(csvEscape).join(',') + '\r\n';
}

function getCsvColumnValue(item: CsvExportRow, column: string): unknown {
  return item[column];
}

/* ---- Export Request Logs ---- */
export async function exportRequestLogsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = auditExportQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }

    const q = parsed.data;
    const format = q.format;

    const conds = buildRequestLogExportConds(q);
    const items = (await repoExportRequestLogs({ conds, limit: MAX_EXPORT_ROWS })) as CsvExportRow[];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `audit-request-logs-${timestamp}.${format}`;

    if (format === 'json') {
      reply.header('Content-Type', 'application/json; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(JSON.stringify(items, null, 2));
    }

    // CSV
    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);

    const columns = [
      'id', 'req_id', 'method', 'url', 'path', 'status_code', 'response_time_ms',
      'ip', 'user_agent', 'referer', 'user_id', 'user_email', 'user_full_name',
      'is_admin', 'country', 'city', 'error_message', 'error_code', 'created_at',
    ];

    reply.raw.write(csvRow(columns));
    for (const item of items) {
      reply.raw.write(csvRow(columns.map((col) => getCsvColumnValue(item, col))));
    }
    reply.raw.end();
    return reply;
  } catch (e) {
    return handleRouteError(reply, req, e, 'export_request_logs');
  }
}

/* ---- Export Auth Events ---- */
export async function exportAuthEventsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = auditExportQuery.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }

    const q = parsed.data;
    const format = q.format;

    const conds = buildAuthEventExportConds(q);
    const items = (await repoExportAuthEvents({ conds, limit: MAX_EXPORT_ROWS })) as CsvExportRow[];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `audit-auth-events-${timestamp}.${format}`;

    if (format === 'json') {
      reply.header('Content-Type', 'application/json; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(JSON.stringify(items, null, 2));
    }

    // CSV
    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);

    const columns = [
      'id', 'event', 'user_id', 'email', 'user_full_name',
      'ip', 'user_agent', 'country', 'city', 'created_at',
    ];

    reply.raw.write(csvRow(columns));
    for (const item of items) {
      reply.raw.write(csvRow(columns.map((col) => getCsvColumnValue(item, col))));
    }
    reply.raw.end();
    return reply;
  } catch (e) {
    return handleRouteError(reply, req, e, 'export_auth_events');
  }
}
