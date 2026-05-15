// src/modules/_shared/contentRange.ts
import type { FastifyReply } from 'fastify';

export function setContentRange(reply: FastifyReply, offset: number, limit: number, total: number) {
  const end = Math.max(0, Math.min(total - 1, offset + limit - 1));
  reply.header('Content-Range', `${offset}-${end}/${total}`);
}
