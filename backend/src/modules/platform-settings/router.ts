import type { FastifyInstance } from 'fastify';
import { listPlatformSettings, upsertPlatformSetting } from './controller';

export async function registerPlatformSettings(app: FastifyInstance) {
  app.get('/platform-settings', listPlatformSettings);
}

export async function registerPlatformSettingsAdmin(app: FastifyInstance) {
  app.post('/platform-settings', upsertPlatformSetting);
}
