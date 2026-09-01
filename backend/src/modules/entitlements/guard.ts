import type { FastifyReply, FastifyRequest } from 'fastify';
import { getActiveTenantKey } from '@/modules/_shared';
import type { JwtUser } from '@/middleware/auth';
import { hasModule } from './service';

function getJwtUser(req: FastifyRequest): JwtUser | null {
  const user = (req as FastifyRequest & { user?: unknown }).user;
  return user && typeof user === 'object' ? user as JwtUser : null;
}

export function requireModule(moduleKey: string) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = getJwtUser(req);
    if (user?.isSuperAdmin) return;

    const tenantKey = getActiveTenantKey();
    if (await hasModule(tenantKey, moduleKey)) return;

    return reply.code(402).send({
      error: 'MODULE_NOT_ENTITLED',
      module: moduleKey,
    });
  };
}
