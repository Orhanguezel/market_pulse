import type { FastifyInstance } from 'fastify';
import { registerExternalDbAdmin } from '@/modules/externalDb/router';
import { registerLeadMachineAdmin, registerLeadMachinePublic, registerLeadMachineUser, registerOutreachUser } from '@/modules/lead-machine/router';
import { registerMarketAdmin, registerMarketUser } from '@/modules/market/router';
import { registerPublicApi } from '@/modules/public-api/public.router';
import { registerCrmAdmin } from '@/modules/crm';
import { registerCrmTenant } from '@/modules/crm/tenant.router';
import { registerDecisionMakerAdmin, registerDecisionMakerPublic } from '@/modules/lead-machine/decision-maker/router';
import { registerMailAccountsUser } from '@/modules/mail-accounts';
import { registerProspectListsUser } from '@/modules/prospect-lists';

export async function registerProjectPublic(api: FastifyInstance) {
  // Tenant müşteri CRM (giriş yapmış, admin değil) — kendi encapsulated scope'unda,
  // ki diğer public modüllerin hook'ları (örn. lead-machine requireModule('leads')) sızmasın.
  await api.register(async (crmApi) => {
    await registerCrmTenant(crmApi);
  });
  await api.register(async (dmApi) => {
    await registerDecisionMakerPublic(dmApi);
  });
  await api.register(async (leadMachineApi) => {
    await registerLeadMachineUser(leadMachineApi);
  });
  await api.register(async (outreachApi) => {
    await registerOutreachUser(outreachApi);
  });
  await api.register(async (mailApi) => {
    await registerMailAccountsUser(mailApi);
  });
  await api.register(async (marketApi) => {
    await registerMarketUser(marketApi);
  });
  await api.register(async (prospectApi) => {
    await registerProspectListsUser(prospectApi);
  });
  await registerPublicApi(api);
  await registerLeadMachinePublic(api);
}

export async function registerProjectAdmin(adminApi: FastifyInstance) {
  await registerExternalDbAdmin(adminApi);
  await registerMarketAdmin(adminApi);
  await registerLeadMachineAdmin(adminApi);
  await registerDecisionMakerAdmin(adminApi);
  await registerCrmAdmin(adminApi);
}
