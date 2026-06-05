import type { FastifyPluginAsync } from 'fastify';
import { env } from '@/core/env';
import { runWithTenant } from '@/core/tenant-context';

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

export const tenantContextPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', (req, _reply, done) => {
    runWithTenant(resolveTenant(req), done);
  });
};

export default tenantContextPlugin;
