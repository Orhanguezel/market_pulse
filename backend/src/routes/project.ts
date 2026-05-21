import type { FastifyInstance } from 'fastify';
import { registerExternalDbAdmin } from '@/modules/externalDb/router';
import { registerLeadMachineAdmin, registerLeadMachinePublic } from '@/modules/lead-machine/router';
import { registerMarketAdmin } from '@/modules/market/router';
import { registerPublicApi } from '@/modules/public-api/public.router';

export async function registerProjectPublic(api: FastifyInstance) {
  await registerPublicApi(api);
  await registerLeadMachinePublic(api);
}

export async function registerProjectAdmin(adminApi: FastifyInstance) {
  await registerExternalDbAdmin(adminApi);
  await registerMarketAdmin(adminApi);
  await registerLeadMachineAdmin(adminApi);
}
