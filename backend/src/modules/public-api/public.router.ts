import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/middleware/auth';
import {
  getMyQuota,
  publicStartScan,
  publicGetScan,
  publicGetScanProducts,
  publicGetRiskScores,
  publicGetBulkRiskScores,
  publicGetByokStatus,
  publicSaveByokKey,
  publicDeleteByokKey,
  publicGetHistory,
} from './public.controller';

export async function registerPublicApi(app: FastifyInstance) {
  // Risk scores — no auth needed (cached, public)
  app.get('/amazon/risk-scores/:keyword', publicGetRiskScores);
  app.post('/amazon/bulk-scores', publicGetBulkRiskScores);

  // Auth-gated routes
  await app.register(async (authed) => {
    authed.addHook('onRequest', requireAuth);

    authed.get('/amazon/quota',              getMyQuota);
    authed.post('/amazon/scan',              publicStartScan);
    authed.get('/amazon/scan/:jobId',        publicGetScan);
    authed.get('/amazon/scan/:jobId/products', publicGetScanProducts);
    authed.get('/amazon/history',            publicGetHistory);
    authed.get('/amazon/byok',               publicGetByokStatus);
    authed.post('/amazon/byok',              publicSaveByokKey);
    authed.delete('/amazon/byok',            publicDeleteByokKey);
  });
}
