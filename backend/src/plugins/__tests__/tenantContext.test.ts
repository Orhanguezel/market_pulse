import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, test } from 'bun:test';
import fastify, { type FastifyInstance } from 'fastify';
import { env } from '@/core/env';

const { default: tenantContextPlugin } = await import('../tenantContext');
const { getActiveTenantKey } = await import('@/modules/_shared/tenant-scope');
const originalTenantKey = env.TENANT_KEY;

async function buildApp(): Promise<FastifyInstance> {
  const app = fastify();
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

    expect(pluginSource).toContain('enterTenant(resolveTenant(req))');
    expect(pluginSource).not.toContain('runWithTenant(resolveTenant(req), done)');
    expect(contextSource).toContain('tenantStorage.enterWith(tenantKey)');
  });

  test('propagates request tenant through the real Fastify hook chain', async () => {
    env.TENANT_KEY = 'fallback-tenant';
    app = await buildApp();

    const vista = await app.inject({ method: 'GET', url: '/tenant', headers: { 'X-Tenant': 'vistaseeds' } });
    expect(vista.statusCode).toBe(200);
    expect(vista.json()).toEqual({ tenant: 'vistaseeds' });

    const bereket = await app.inject({ method: 'GET', url: '/tenant', headers: { 'X-Tenant': 'bereketfide' } });
    expect(bereket.statusCode).toBe(200);
    expect(bereket.json()).toEqual({ tenant: 'bereketfide' });
  });

  test('resolves query tenant and env fallback without leaking previous requests', async () => {
    env.TENANT_KEY = 'fallback-tenant';
    app = await buildApp();

    const header = await app.inject({ method: 'GET', url: '/tenant', headers: { 'X-Tenant': 'vistaseeds' } });
    expect(header.json()).toEqual({ tenant: 'vistaseeds' });

    const query = await app.inject({ method: 'GET', url: '/tenant?tenantKey=bereketfide' });
    expect(query.statusCode).toBe(200);
    expect(query.json()).toEqual({ tenant: 'bereketfide' });

    const fallback = await app.inject({ method: 'GET', url: '/tenant' });
    expect(fallback.statusCode).toBe(200);
    expect(fallback.json()).toEqual({ tenant: 'fallback-tenant' });
  });
});
