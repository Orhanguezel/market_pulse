// =============================================================
// FILE: src/modules/audit/requestLogger.plugin.ts
// corporate-backend – Request Logger Plugin (Fastify onResponse)
// =============================================================

import type { FastifyPluginAsync } from 'fastify';
import { writeRequestAuditLog, shouldSkipAuditLog } from './helpers';

type RequestLoggerOpts = Record<never, never>;
type ReplyWithElapsed = { elapsedTime?: unknown };

export const requestLoggerPlugin: FastifyPluginAsync<RequestLoggerOpts> = async (app, _opts) => {
  app.addHook('onResponse', async (req, reply) => {
    try {
      if (shouldSkipAuditLog(req)) return;

      const reqId = String(req.id || '');
      const elapsedReply = reply as typeof reply & ReplyWithElapsed;
      const elapsed = typeof elapsedReply.elapsedTime === 'number' ? elapsedReply.elapsedTime : 0;

      await writeRequestAuditLog({
        req,
        reply,
        reqId,
        responseTimeMs: elapsed,
      });
    } catch (err) {
      req.log.warn({ err }, 'audit_request_log_failed');
    }
  });
};
