import type { FastifyInstance } from 'fastify';
import {
  createOutreachCampaign,
  deleteOutreachCampaign,
  generateOutreachDrafts,
  getOutreachCampaign,
  listOutreachCampaigns,
  syncHostKeywords,
  updateOutreachCampaign,
} from './campaign/campaign.controller';
import {
  approveToLead,
  aggregateRejectionPatternsHandler,
  competitorScan,
  createIcp,
  createRule,
  createSavedSearchHandler,
  deleteIcp,
  deleteRule,
  deleteSavedSearchHandler,
  feedbackApprovedStats,
  feedbackRejectionStats,
  getLeadCandidate,
  enrichBatch,
  enrichOne,
  fairSuggestions,
  fairBriefingBulkPdf,
  fairBriefingCandidatePdf,
  fairBriefingDayPdf,
  generateOutreach,
  getAmazonJob,
  getAmazonRiskScores,
  getBulkAmazonRiskScores,
  getAmazonScan,
  getAmazonScanProductsList,
  getKeepaUsage,
  rescoreAmazonJob,
  getIcp,
  listAmazonJobs,
  listB2bJobs,
  listDrafts,
  listEnrichment,
  listFairJobs,
  listIcp,
  listLeadCandidates,
  listRules,
  listSavedSearchesHandler,
  openTrackingPixel,
  rejectionPatterns,
  reviewCandidate,
  runSavedSearchHandler,
  scraperCallback,
  sendDraft,
  startAmazonJob,
  startAmazonScan,
  startB2bJob,
  startFairJob,
  startGenericFairRunner,
  updateDraft,
  updateIcp,
  updateSavedSearchHandler,
} from './controller';

export async function registerLeadMachinePublic(app: FastifyInstance) {
  app.get('/lead-machine/outreach/open/:id/pixel.gif', openTrackingPixel);
}

export async function registerLeadMachineAdmin(app: FastifyInstance) {
  app.get('/lead-machine/candidates', listLeadCandidates);
  app.get('/lead-machine/candidates/:id', getLeadCandidate);
  app.patch('/lead-machine/candidates/:id/review', reviewCandidate);
  app.post('/lead-machine/candidates/:id/approve-to-lead', approveToLead);
  app.post('/lead-machine/scraper-callback', scraperCallback);
  app.get('/lead-machine/rejection-patterns', rejectionPatterns);
  app.post('/lead-machine/rejection-patterns/aggregate', aggregateRejectionPatternsHandler);

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
  app.get('/lead-machine/amazon/risk-scores/:keyword', getAmazonRiskScores);
  app.post('/lead-machine/amazon/risk-scores/bulk', getBulkAmazonRiskScores);
  app.get('/lead-machine/amazon/scan/:jobId/products', getAmazonScanProductsList);
  app.post('/lead-machine/amazon/jobs/:jobId/rescore', rescoreAmazonJob);
  app.get('/lead-machine/keepa/usage', getKeepaUsage);

  app.post('/lead-machine/b2b/jobs', startB2bJob);
  app.get('/lead-machine/b2b/jobs', listB2bJobs);

  app.post('/lead-machine/fair/jobs', startFairJob);
  app.post('/lead-machine/fair/run', startGenericFairRunner);
  app.get('/lead-machine/fair/jobs', listFairJobs);
  app.get('/lead-machine/fair/suggestions', fairSuggestions);
  app.get('/lead-machine/fair/brifing/:candidateId.pdf', fairBriefingCandidatePdf);
  app.get('/lead-machine/fair/brifing/day/:date.pdf', fairBriefingDayPdf);
  app.post('/lead-machine/fair/brifing/bulk', fairBriefingBulkPdf);

  app.post('/lead-machine/enrich/:candidateId', enrichOne);
  app.get('/lead-machine/enrich/:candidateId', listEnrichment);
  app.post('/lead-machine/enrich/batch', enrichBatch);

  app.post('/lead-machine/outreach/generate/:candidateId', generateOutreach);
  app.get('/lead-machine/outreach/drafts', listDrafts);
  app.patch('/lead-machine/outreach/drafts/:id', updateDraft);
  app.post('/lead-machine/outreach/drafts/:id/send', sendDraft);

  app.get('/lead-machine/outreach/campaigns', listOutreachCampaigns);
  app.get('/lead-machine/outreach/campaigns/:id', getOutreachCampaign);
  app.post('/lead-machine/outreach/campaigns', createOutreachCampaign);
  app.patch('/lead-machine/outreach/campaigns/:id', updateOutreachCampaign);
  app.delete('/lead-machine/outreach/campaigns/:id', deleteOutreachCampaign);
  app.post('/lead-machine/outreach/campaigns/:id/generate-drafts', generateOutreachDrafts);
  app.post('/lead-machine/outreach/campaigns/:id/sync-host-keywords', syncHostKeywords);

  app.post('/lead-machine/competitor/scan', competitorScan);

  app.get('/lead-machine/feedback/rejection-stats', feedbackRejectionStats);
  app.get('/lead-machine/feedback/approved-stats', feedbackApprovedStats);

  app.get('/lead-machine/rules', listRules);
  app.post('/lead-machine/rules', createRule);
  app.delete('/lead-machine/rules/:id', deleteRule);

  app.get('/lead-machine/amazon/saved-searches',           listSavedSearchesHandler);
  app.post('/lead-machine/amazon/saved-searches',          createSavedSearchHandler);
  app.patch('/lead-machine/amazon/saved-searches/:id',     updateSavedSearchHandler);
  app.delete('/lead-machine/amazon/saved-searches/:id',    deleteSavedSearchHandler);
  app.post('/lead-machine/amazon/saved-searches/:id/run',  runSavedSearchHandler);
}
