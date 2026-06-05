import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '@/core/env';
import { enterTenant } from '@/core/tenant-context';

function firstString(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstString(value[0]);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function resolveTenant(req: { query?: unknown; headers: Record<string, unknown> }) {
  const query = req.query && typeof req.query === 'object'
    ? req.query as Record<string, unknown>
    : {};
  return firstString(query.tenantKey)
    ?? firstString(req.headers['x-tenant'])
    ?? env.TENANT_KEY
    ?? 'default';
}

// fp ile sarılır ki onRequest hook'u izole edilmesin ve TÜM route'lara uygulansın.
// (Sarılmazsa hook sadece bu plugin'in alt scope'una etki eder → route'lar tenant context görmez.)
const tenantContextImpl: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', (req, _reply, done) => {
    enterTenant(resolveTenant(req));
    done();
  });
};

export const tenantContextPlugin = fp(tenantContextImpl, { name: 'tenant-context' });

export default tenantContextPlugin;
