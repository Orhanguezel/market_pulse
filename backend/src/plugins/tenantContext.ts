import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '@/core/env';
import { enterTenant } from '@/core/tenant-context';
import type { JwtUser } from '@/middleware/auth';

function firstString(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstString(value[0]);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

type TenantResolution =
  | { ok: true; tenant: string }
  | { ok: false; message: 'tenant_forbidden' | 'no_tenant_assigned' };

function getRequestedTenant(req: { query?: unknown; headers: Record<string, unknown> }): string | undefined {
  const query = req.query && typeof req.query === 'object'
    ? req.query as Record<string, unknown>
    : {};
  return firstString(query.tenantKey)
    ?? firstString(req.headers['x-tenant']);
}

function getJwtUser(req: { user?: unknown }): JwtUser | null {
  if (!req.user || typeof req.user !== 'object') return null;
  return req.user as JwtUser;
}

function getAllowedTenants(user: JwtUser): string[] {
  return Array.isArray(user.tenants)
    ? user.tenants.filter((tenant): tenant is string => typeof tenant === 'string' && tenant.trim().length > 0)
    : [];
}

function resolveTenant(req: { query?: unknown; headers: Record<string, unknown>; user?: unknown }): TenantResolution {
  const requested = getRequestedTenant(req);
  const user = getJwtUser(req);

  if (!user) {
    return { ok: true, tenant: env.TENANT_KEY ?? 'default' };
  }

  if (user.isSuperAdmin) {
    return { ok: true, tenant: requested ?? user.defaultTenant ?? env.TENANT_KEY ?? 'default' };
  }

  const tenants = getAllowedTenants(user);
  if (requested && !tenants.includes(requested)) {
    return { ok: false, message: 'tenant_forbidden' };
  }

  const tenant = requested ?? user.defaultTenant ?? undefined;
  if (!tenant) {
    return { ok: false, message: 'no_tenant_assigned' };
  }

  return { ok: true, tenant };
}

// fp ile sarılır ki onRequest hook'u izole edilmesin ve TÜM route'lara uygulansın.
// (Sarılmazsa hook sadece bu plugin'in alt scope'una etki eder → route'lar tenant context görmez.)
const tenantContextImpl: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', (req, reply, done) => {
    const resolved = resolveTenant(req);
    if (!resolved.ok) {
      void reply.code(403).send({ error: { message: resolved.message } });
      return;
    }
    enterTenant(resolved.tenant);
    done();
  });
};

export const tenantContextPlugin = fp(tenantContextImpl, { name: 'tenant-context' });

export default tenantContextPlugin;
