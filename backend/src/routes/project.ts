import type { FastifyInstance } from 'fastify';
import { registerExternalDbAdmin } from '@/modules/externalDb/router';
import { registerLeadMachineAdmin, registerLeadMachinePublic } from '@/modules/lead-machine/router';
import { registerMarketAdmin } from '@/modules/market/router';
import { registerPublicApi } from '@/modules/public-api/public.router';
import { registerCrmAdmin } from '@/modules/crm';
import { registerCrmTenant } from '@/modules/crm/tenant.router';
import { registerDecisionMakerPublic } from '@/modules/lead-machine/decision-maker/router';

export async function registerProjectPublic(api: FastifyInstance) {
  // Tenant müşteri CRM (giriş yapmış, admin değil) — kendi encapsulated scope'unda,
  // ki diğer public modüllerin hook'ları (örn. lead-machine requireModule('leads')) sızmasın.
  await api.register(async (crmApi) => {
    await registerCrmTenant(crmApi);
  });
  await api.register(async (dmApi) => {
    await registerDecisionMakerPublic(dmApi);
  });
  await registerPublicApi(api);
  await registerLeadMachinePublic(api);
}

export async function registerProjectAdmin(adminApi: FastifyInstance) {
  await registerExternalDbAdmin(adminApi);
  await registerMarketAdmin(adminApi);
  await registerLeadMachineAdmin(adminApi);
  await registerCrmAdmin(adminApi);
}
