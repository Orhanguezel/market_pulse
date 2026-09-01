import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/middleware/auth';
import { requireModule } from '@/modules/entitlements';
import { deleteMyAsset, getMyAsset, getMyAssetContent, listMyAssets, listMyFolders, patchMyAsset, uploadMyAsset } from './user.controller';

export async function registerStorageUser(app: FastifyInstance) {
  const guard = { preHandler: [requireAuth, requireModule('crm')] };
  app.get('/storage/my/assets', guard, listMyAssets);
  app.get('/storage/my/assets/:id', guard, getMyAsset);
  app.get('/storage/my/assets/:id/content', guard, getMyAssetContent);
  app.post('/storage/my/assets', guard, uploadMyAsset);
  app.patch('/storage/my/assets/:id', guard, patchMyAsset);
  app.delete('/storage/my/assets/:id', guard, deleteMyAsset);
  app.get('/storage/my/folders', guard, listMyFolders);
}
