import type { FastifyInstance } from 'fastify';
import {
  approveToLead,
  competitorScan,
  createIcp,
  deleteIcp,
  enrichBatch,
  enrichOne,
  fairSuggestions,
  generateOutreach,
  getAmazonJob,
  getAmazonRiskScores,
  getAmazonScan,
  listAmazonScanProductsHandler,
  getIcp,
  listAmazonJobs,
  listB2bJobs,
  listDrafts,
  listEnrichment,
  listFairJobs,
  listIcp,
  listLeadCandidates,
  rejectionPatterns,
  reviewCandidate,
  scraperCallback,
  startAmazonJob,
  startAmazonScan,
  startB2bJob,
  startFairJob,
  updateDraft,
  updateIcp,
} from './controller';

export async function registerLeadMachineAdmin(app: FastifyInstance) {
  app.get('/lead-machine/candidates', listLeadCandidates);
  app.patch('/lead-machine/candidates/:id/review', reviewCandidate);
  app.post('/lead-machine/candidates/:id/approve-to-lead', approveToLead);
  app.post('/lead-machine/scraper-callback', scraperCallback);
  app.get('/lead-machine/rejection-patterns', rejectionPatterns);

  app.get('/lead-machine/icp', listIcp);
  app.get('/lead-machine/icp/:id', getIcp);
  app.post('/lead-machine/icp', createIcp);
  app.patch('/lead-machine/icp/:id', updateIcp);
  app.delete('/lead-machine/icp/:id', deleteIcp);

  app.post('/lead-machine/amazon/jobs', startAmazonJob);
  app.get('/lead-machine/amazon/jobs', listAmazonJobs);
  app.get('/lead-machine/amazon/jobs/:id', getAmazonJob);
  app.post('/lead-machine/amazon/scan', startAmazonScan);
  app.get('/lead-machine/amazon/scan/:jobId', getAmazonScan);
  app.get('/lead-machine/amazon/scan/:jobId/products', listAmazonScanProductsHandler);
  app.get('/lead-machine/amazon/risk-scores/:keyword', getAmazonRiskScores);

  app.post('/lead-machine/b2b/jobs', startB2bJob);
  app.get('/lead-machine/b2b/jobs', listB2bJobs);

  app.post('/lead-machine/fair/jobs', startFairJob);
  app.get('/lead-machine/fair/jobs', listFairJobs);
  app.get('/lead-machine/fair/suggestions', fairSuggestions);

  app.post('/lead-machine/enrich/:candidateId', enrichOne);
  app.get('/lead-machine/enrich/:candidateId', listEnrichment);
  app.post('/lead-machine/enrich/batch', enrichBatch);

  app.post('/lead-machine/outreach/generate/:candidateId', generateOutreach);
  app.get('/lead-machine/outreach/drafts', listDrafts);
  app.patch('/lead-machine/outreach/drafts/:id', updateDraft);

  app.post('/lead-machine/competitor/scan', competitorScan);
}
