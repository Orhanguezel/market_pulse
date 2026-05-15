// =============================================================
// FILE: src/modules/audit/stream.routes.ts
// corporate-backend – Audit Stream Routes (SSE)
//   - ONLY route definitions
//   - Admin guards are applied at the app.ts level
// =============================================================

import type { FastifyInstance } from 'fastify';
import { handleAuditStreamSse } from './stream.controller';

export async function registerAuditStream(app: FastifyInstance) {
  const B ='/audit/stream';
  app.get(B, handleAuditStreamSse);
}
