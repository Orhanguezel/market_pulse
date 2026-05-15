import type { FastifyReply, FastifyRequest } from 'fastify';
import { handleRouteError } from '../_shared';
import { repoCheckHealth } from './repository';

export async function getHealth(req: FastifyRequest, reply: FastifyReply) {
  try {
    console.log('[HEALTH] Check requested');
    const result = await repoCheckHealth(req.server);
    return reply.send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'health_check_failed');
  }
}
