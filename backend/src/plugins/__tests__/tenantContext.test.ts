import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, test } from 'bun:test';
import fastify, { type FastifyInstance } from 'fastify';
import { env } from '@/core/env';
import type { JwtUser } from '@/middleware/auth';

const { default: tenantContextPlugin } = await import('../tenantContext');
const { getActiveTenantKey } = await import('@/modules/_shared/tenant-scope');
const originalTenantKey = env.TENANT_KEY;

async function buildApp(user?: JwtUser): Promise<FastifyInstance> {
  const app = fastify();
  if (user) {
    app.addHook('onRequest', async (req) => {
      (req as unknown as { user: JwtUser }).user = user;
    });
  }
  await app.register(tenantContextPlugin);

  // Deliberately registered outside the plugin body. Without fastify-plugin,
  // the plugin hook is encapsulated and this route never sees tenant context.
  app.get('/tenant', async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    return { tenant: getActiveTenantKey() };
  });
  await app.ready();
  return app;
}

let app: FastifyInstance | null = null;

afterEach(async () => {
  await app?.close();
  app = null;
  env.TENANT_KEY = originalTenantKey;
});

describe('tenant context plugin integration', () => {
  test('is wrapped with fastify-plugin so hooks apply to parent routes', () => {
    expect((tenantContextPlugin as unknown as Record<symbol, unknown>)[Symbol.for('skip-override')]).toBe(true);
  });

  test('uses enterWith-based context assignment rather than run(done)', () => {
    const pluginSource = readFileSync(new URL('../tenantContext.ts', import.meta.url), 'utf8');
    const contextSource = readFileSync(new URL('../../core/tenant-context.ts', import.meta.url), 'utf8');

    expect(pluginSource).toContain('enterTenant(resolved.tenant)');
    expect(pluginSource).not.toContain('runWithTenant(resolveTenant(req), done)');
    expect(contextSource).toContain('tenantStorage.enterWith(tenantKey)');
  });

  test('ignores client tenant on public routes and uses env fallback', async () => {
    env.TENANT_KEY = 'fallback-tenant';
    app = await buildApp();

    const vista = await app.inject({ method: 'GET', url: '/tenant', headers: { 'X-Tenant': 'vistaseeds' } });
    expect(vista.statusCode).toBe(200);
    expect(vista.json()).toEqual({ tenant: 'fallback-tenant' });

    const query = await app.inject({ method: 'GET', url: '/tenant?tenantKey=bereketfide' });
    expect(query.statusCode).toBe(200);
    expect(query.json()).toEqual({ tenant: 'fallback-tenant' });
  });

  test('uses default tenant for authenticated non-super-admin without client tenant', async () => {
    env.TENANT_KEY = 'fallback-tenant';
    app = await buildApp({
      sub: 'user-1',
      role: 'customer',
      isSuperAdmin: false,
      tenants: ['vistaseeds'],
      defaultTenant: 'vistaseeds',
    });

    const res = await app.inject({ method: 'GET', url: '/tenant' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ tenant: 'vistaseeds' });
  });

  test('rejects cross-tenant request for authenticated non-super-admin', async () => {
    env.TENANT_KEY = 'fallback-tenant';
    app = await buildApp({
      sub: 'user-1',
      role: 'customer',
      isSuperAdmin: false,
      tenants: ['vistaseeds'],
      defaultTenant: 'vistaseeds',
    });

    const res = await app.inject({ method: 'GET', url: '/tenant', headers: { 'X-Tenant': 'bereketfide' } });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: { message: 'tenant_forbidden' } });
  });

  test('lets super-admin switch tenants with client tenant', async () => {
    env.TENANT_KEY = 'fallback-tenant';
    app = await buildApp({
      sub: 'admin-1',
      role: 'admin',
      isSuperAdmin: true,
      tenants: [],
      defaultTenant: 'vistaseeds',
    });

    const res = await app.inject({ method: 'GET', url: '/tenant', headers: { 'X-Tenant': 'bereketfide' } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ tenant: 'bereketfide' });
  });

  test('rejects authenticated non-super-admin with no tenant assignment', async () => {
    env.TENANT_KEY = 'fallback-tenant';
    app = await buildApp({
      sub: 'user-1',
      role: 'customer',
      isSuperAdmin: false,
      tenants: [],
      defaultTenant: null,
    });

    const res = await app.inject({ method: 'GET', url: '/tenant' });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: { message: 'no_tenant_assigned' } });
  });
});
