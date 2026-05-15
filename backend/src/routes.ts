import type { FastifyInstance } from 'fastify';
import { registerHealth } from '@/modules/health';
import { requireAuth } from '@/middleware/auth';
import { requireAdmin } from '@/middleware/roles';
import { registerSharedPublic, registerSharedAdmin } from './routes/shared';
import { registerProjectPublic, registerProjectAdmin } from './routes/project';

export async function registerAllRoutes(app: FastifyInstance) {
  await app.register(async (apiProbe) => {
    await registerHealth(apiProbe);
  }, { prefix: '/api' });

  await app.register(async (api) => {
    await api.register(async (v1) => {
      await v1.register(async (adminApi) => {
        adminApi.addHook('onRequest', requireAuth);
        adminApi.addHook('onRequest', requireAdmin);
        await registerSharedAdmin(adminApi);
        await registerProjectAdmin(adminApi);
      }, { prefix: '/admin' });

      await registerSharedPublic(v1);
      await registerProjectPublic(v1);
    }, { prefix: '/v1' });
  }, { prefix: '/api' });
}
