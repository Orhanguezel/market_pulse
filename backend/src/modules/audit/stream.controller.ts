// =============================================================
// FILE: src/modules/audit/stream.controller.ts
// corporate-backend – Audit Realtime Stream Controller (SSE)
// =============================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import { bus, type AppEvent } from '../../core/events';
import { repoPersistAuditEvent } from './helpers';

type SseClient = { id: string; reply: FastifyReply };
type ErrorWithMessage = { message?: string };
type StreamRequest = FastifyRequest & { id?: string | number; reqId?: string | number; log?: { warn?: (payload: { err: unknown }, msg: string) => void } };

const clients = new Set<SseClient>();
let subscribed = false;

function sseWrite(reply: FastifyReply, event: string, data: unknown) {
  reply.raw.write(`event: ${event}\n`);
  reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcast(event: string, data: unknown) {
  for (const c of clients) {
    try {
      sseWrite(c.reply, event, data);
    } catch {
      // ignore; disconnect cleanup handles removal
    }
  }
}

function ensureBusSubscribed() {
  if (subscribed) return;
  subscribed = true;

  bus.on('app.event', async (evt) => {
    // 1) persist (best-effort)
    try {
      await repoPersistAuditEvent(evt);
    } catch (err) {
      broadcast('app.event', {
        ts: new Date().toISOString(),
        level: 'warn',
        topic: 'audit.stream.persist_failed',
        message: 'audit_event_persist_failed',
        meta: { err: String((err as ErrorWithMessage)?.message ?? err) },
      });
    }

    // 2) stream
    broadcast('app.event', evt);
  });
}

/**
 * GET /api/admin/audit/stream  (SSE)
 * Admin guards are applied at the app.ts level.
 */
export async function handleAuditStreamSse(req: FastifyRequest, reply: FastifyReply) {
  ensureBusSubscribed();

  // SSE headers
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const streamReq = req as StreamRequest;
  const client: SseClient = { id: String(streamReq.id ?? streamReq.reqId ?? Date.now()), reply };
  clients.add(client);

  // hello
  sseWrite(reply, 'hello', {
    ts: new Date().toISOString(),
    ok: true,
    clients: clients.size,
  });

  // keep-alive ping
  const t = setInterval(() => {
    try {
      sseWrite(reply, 'ping', { ts: new Date().toISOString() });
    } catch {
      // ignore
    }
  }, 15_000);

  const cleanup = () => {
    clearInterval(t);
    clients.delete(client);
  };

  req.raw.on('close', cleanup);
  req.raw.on('end', cleanup);

  return reply; // keep open
}
