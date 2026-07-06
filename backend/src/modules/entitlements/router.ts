import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { getActiveTenantKey, getActiveUserId } from '@/modules/_shared';
import {
  activateModule,
  DEFAULT_USER_MODULES,
  isTenantAdmin,
  listActiveTenantModules,
  listCatalog,
  listTenantModules,
  listUserActiveModules,
  listUserModuleGrants,
  listUserTenants,
  setUserModule,
  suspendModule,
  updateCatalogModule,
} from './service';

const tenantParamsSchema = z.object({
  tenantKey: z.string().trim().min(1).max(64),
});

const userModuleParamsSchema = z.object({
  tenantKey: z.string().trim().min(1).max(64),
  userId: z.string().trim().min(1).max(36),
});

const userModuleBodySchema = z.object({
  module_key: z.string().trim().min(1).max(64),
  status: z.enum(['active', 'suspended']),
});

const moduleBodySchema = z.object({
  module_key: z.string().trim().min(1).max(64),
  status: z.enum(['trial', 'active', 'suspended', 'cancelled']).optional(),
  expires_at: z.string().trim().min(1).nullable().optional(),
  config: z.unknown().optional(),
});

const catalogParamsSchema = z.object({
  moduleKey: z.string().trim().min(1).max(64),
});

const catalogPatchSchema = z.object({
  base_price: z.coerce.number().min(0).max(1_000_000).optional(),
  currency: z.string().trim().length(3).optional(),
  billing_period: z.enum(['monthly', 'yearly']).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  is_active: z.boolean().optional(),
});

function badRequest(reply: FastifyReply) {
  return reply.code(400).send({ error: { message: 'invalid_body' } });
}

export async function myEntitlementsHandler(req: FastifyRequest) {
  const tenantKey = getActiveTenantKey();
  const userId = getActiveUserId();
  const isSuperAdmin = Boolean((req.user as { isSuperAdmin?: boolean } | undefined)?.isSuperAdmin);
  const modules = userId
    ? await listUserActiveModules(tenantKey, userId, isSuperAdmin || (await isTenantAdmin(tenantKey, userId)))
    : await listActiveTenantModules(tenantKey);
  return {
    tenant_key: tenantKey,
    modules: modules.map((module) => ({
      module_key: module.module_key,
      status: module.status,
      name: module.name,
      category: module.category,
    })),
  };
}

export async function registerEntitlementsAdmin(app: FastifyInstance) {
  app.get('/entitlements/catalog', async () => listCatalog());
  app.get('/entitlements/me', myEntitlementsHandler);

  // B1: katalog paket fiyat/meta düzenleme (süper-admin scope)
  app.patch('/entitlements/catalog/:moduleKey', async (req: FastifyRequest<{ Params: { moduleKey: string }; Body: unknown }>, reply) => {
    const params = catalogParamsSchema.safeParse(req.params);
    const body = catalogPatchSchema.safeParse(req.body);
    if (!params.success || !body.success) return badRequest(reply);
    const module = await updateCatalogModule(params.data.moduleKey, body.data);
    if (!module) return reply.code(404).send({ error: { message: 'not_found' } });
    return { module };
  });

  app.get('/entitlements/tenant/:tenantKey', async (req: FastifyRequest<{ Params: { tenantKey: string } }>, reply) => {
    const parsed = tenantParamsSchema.safeParse(req.params);
    if (!parsed.success) return badRequest(reply);
    return listTenantModules(parsed.data.tenantKey);
  });

  app.post('/entitlements/tenant/:tenantKey/activate', async (req: FastifyRequest<{ Params: { tenantKey: string }; Body: unknown }>, reply) => {
    const params = tenantParamsSchema.safeParse(req.params);
    const body = moduleBodySchema.safeParse(req.body);
    if (!params.success || !body.success) return badRequest(reply);

    const module = await activateModule(params.data.tenantKey, body.data.module_key, {
      status: body.data.status,
      expiresAt: body.data.expires_at,
      config: body.data.config,
    });
    return { module };
  });

  app.post('/entitlements/tenant/:tenantKey/suspend', async (req: FastifyRequest<{ Params: { tenantKey: string }; Body: unknown }>, reply) => {
    const params = tenantParamsSchema.safeParse(req.params);
    const body = moduleBodySchema.pick({ module_key: true }).safeParse(req.body);
    if (!params.success || !body.success) return badRequest(reply);

    const module = await suspendModule(params.data.tenantKey, body.data.module_key);
    return { module };
  });

  // Cross-tenant: kullanıcının üye olduğu tenant'lar (admin panel kullanıcı detayı)
  app.get('/entitlements/user/:userId/tenants', async (req: FastifyRequest<{ Params: { userId: string } }>, reply) => {
    const userId = z.string().trim().min(1).max(36).safeParse(req.params.userId);
    if (!userId.success) return badRequest(reply);
    return { user_id: userId.data, tenants: await listUserTenants(userId.data) };
  });

  // Kişi-bazlı modül matrisi (admin panel kullanıcı detayı için)
  app.get('/entitlements/tenant/:tenantKey/user/:userId', async (req: FastifyRequest<{ Params: { tenantKey: string; userId: string } }>, reply) => {
    const params = userModuleParamsSchema.safeParse(req.params);
    if (!params.success) return badRequest(reply);
    const [tenantModules, grants] = await Promise.all([
      listTenantModules(params.data.tenantKey),
      listUserModuleGrants(params.data.tenantKey, params.data.userId),
    ]);
    const grantMap = new Map(grants.map((g) => [g.module_key, g.status]));
    // Tenant'ın sahip olduğu her modül için kullanıcının durumu:
    // default-açık (mail/calendar) her zaman 'active'; diğerleri user_modules kaydına göre.
    return {
      tenant_key: params.data.tenantKey,
      user_id: params.data.userId,
      modules: tenantModules.map((m) => ({
        module_key: m.module_key,
        name: m.name ?? m.module_key,
        category: m.category ?? null,
        tenant_status: m.status,
        default_on: DEFAULT_USER_MODULES.has(m.module_key),
        user_status: DEFAULT_USER_MODULES.has(m.module_key) ? 'active' : (grantMap.get(m.module_key) ?? 'none'),
      })),
    };
  });

  app.post('/entitlements/tenant/:tenantKey/user/:userId/set', async (req: FastifyRequest<{ Params: { tenantKey: string; userId: string }; Body: unknown }>, reply) => {
    const params = userModuleParamsSchema.safeParse(req.params);
    const body = userModuleBodySchema.safeParse(req.body);
    if (!params.success || !body.success) return badRequest(reply);
    if (DEFAULT_USER_MODULES.has(body.data.module_key)) {
      return reply.code(400).send({ error: { message: 'default_module_not_configurable' } });
    }
    await setUserModule(params.data.tenantKey, params.data.userId, body.data.module_key, body.data.status);
    return { ok: true };
  });
}

export async function registerEntitlementsPublic(app: FastifyInstance) {
  app.get('/entitlements/me', { preHandler: requireAuth }, myEntitlementsHandler);
}
