import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { requireModule } from '@/modules/entitlements';
import { getRequiredTenantKey, getRequiredUserId } from '@/modules/_shared';
import {
  importList,
  listLists,
  listCompanies,
  countFreeEnrichTargets,
  runFreeEnrich,
  runApolloEnrich,
  apolloEnabled,
  type ImportCompany,
} from './service';

const importSchema = z.object({
  name: z.string().trim().min(1).max(255),
  source_file: z.string().trim().max(255).optional(),
  companies: z
    .array(z.object({ company_name: z.string().trim().min(1), website: z.string().trim().nullable().optional() }))
    .min(1)
    .max(20000),
});

const apolloSchema = z.object({
  company_ids: z.array(z.string().trim().min(1).max(36)).min(1).max(500),
});

function bad(reply: FastifyReply, msg = 'invalid_body') {
  return reply.code(400).send({ error: { message: msg } });
}

export async function registerProspectListsUser(app: FastifyInstance) {
  const guard = { preHandler: [requireAuth, requireModule('leads')] };

  // Import — frontend xlsx'i client-side parse edip JSON gönderir.
  app.post('/prospect-lists', guard, async (req: FastifyRequest<{ Body: unknown }>, reply) => {
    const parsed = importSchema.safeParse(req.body);
    if (!parsed.success) return bad(reply);
    const tenantKey = getRequiredTenantKey();
    const ownerId = getRequiredUserId();
    const res = await importList(
      tenantKey,
      ownerId,
      parsed.data.name,
      parsed.data.source_file ?? null,
      parsed.data.companies as ImportCompany[],
    );
    return reply.code(201).send({ list_id: res.listId, total: res.total });
  });

  app.get('/prospect-lists', guard, async () => {
    return { lists: await listLists(getRequiredTenantKey(), getRequiredUserId()) };
  });

  app.get<{ Params: { id: string }; Querystring: { limit?: string; offset?: string } }>('/prospect-lists/:id/companies', guard, async (req) => {
    const limit = Math.min(Math.max(Number(req.query.limit ?? 200) || 200, 1), 1000);
    const offset = Math.max(Number(req.query.offset ?? 0) || 0, 0);
    return { companies: await listCompanies(getRequiredTenantKey(), getRequiredUserId(), req.params.id, limit, offset) };
  });

  // Ücretsiz enrichment — arka planda başlar, hemen döner (UI poll eder).
  app.post<{ Params: { id: string } }>('/prospect-lists/:id/enrich-free', guard, async (req) => {
    const tenantKey = getRequiredTenantKey();
    const ownerId = getRequiredUserId();
    const listId = req.params.id;
    // Kaç firma taranacak (pending + sonuç bulunamamış) — UI'da bildirilir.
    const queued = await countFreeEnrichTargets(tenantKey, ownerId, listId);
    if (queued > 0) {
      void runFreeEnrich(tenantKey, ownerId, listId).catch((err) => app.log.error({ err }, 'prospect_free_enrich_failed'));
    }
    return { started: queued > 0, queued };
  });

  // Apollo enrichment (seçili firmalar) — arka planda.
  app.post('/prospect-lists/enrich-apollo', guard, async (req: FastifyRequest<{ Body: unknown }>, reply) => {
    const parsed = apolloSchema.safeParse(req.body);
    if (!parsed.success) return bad(reply);
    const tenantKey = getRequiredTenantKey();
    const ownerId = getRequiredUserId();
    const ids = parsed.data.company_ids;
    void runApolloEnrich(tenantKey, ownerId, ids).catch((err) => app.log.error({ err }, 'prospect_apollo_enrich_failed'));
    return { started: true, count: ids.length, apollo_enabled: apolloEnabled() };
  });

  app.get('/prospect-lists/status', guard, async () => ({ apollo_enabled: apolloEnabled() }));
}
