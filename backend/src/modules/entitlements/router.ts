import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { activateModule, listCatalog, listTenantModules, suspendModule } from './service';

const tenantParamsSchema = z.object({
  tenantKey: z.string().trim().min(1).max(64),
});

const moduleBodySchema = z.object({
  module_key: z.string().trim().min(1).max(64),
  status: z.enum(['trial', 'active', 'suspended', 'cancelled']).optional(),
  expires_at: z.string().trim().min(1).nullable().optional(),
  config: z.unknown().optional(),
});

function badRequest(reply: FastifyReply) {
  return reply.code(400).send({ error: { message: 'invalid_body' } });
}

export async function registerEntitlementsAdmin(app: FastifyInstance) {
  app.get('/entitlements/catalog', async () => listCatalog());

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
}
