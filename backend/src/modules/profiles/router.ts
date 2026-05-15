import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import { getMyProfile, upsertMyProfile } from './controller';



export async function registerProfiles(app: FastifyInstance) {
  const B = '/profiles';
  app.get(`${B}/me`, { preHandler: [requireAuth] }, getMyProfile);
  app.get(`${B}/v1/me`, { preHandler: [requireAuth] }, getMyProfile);

  app.put(`${B}/me`, { preHandler: [requireAuth] }, upsertMyProfile);
  app.put(`${B}/v1/me`, { preHandler: [requireAuth] }, upsertMyProfile);
  app.patch(`${B}/me`, { preHandler: [requireAuth] }, upsertMyProfile);
}
