import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/middleware/auth';
import { requireModule } from '@/modules/entitlements';
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
  createLeadCandidate,
  createRule,
  createLinkedInSequenceHandler,
  createSavedSearchHandler,
  deleteIcp,
  deleteRule,
  deleteSavedSearchHandler,
  feedbackApprovedStats,
  feedbackRejectionStats,
  getLeadCandidate,
  enrichBatch,
  enrichDecisionMakersBatch,
  enrichOne,
  fairSuggestions,
  fairBriefingBulkPdf,
  fairBriefingCandidatePdf,
  fairBriefingDayPdf,
  generateOutreach,
  generateLinkedInTemplatesHandler,
  getAmazonJob,
  getAmazonRiskScores,
  getBulkAmazonRiskScores,
  getAmazonScan,
  getAmazonScanProductsList,
  getB2bJob,
  getCustomsJob,
  getFairJob,
  getKeepaUsage,
  rescoreAmazonJob,
  getIcp,
  listAmazonJobs,
  listB2bJobs,
  listCustomsJobs,
  listDrafts,
  listEnrichment,
  listFairJobs,
  listIcp,
  listLeadCandidates,
  listLinkedInSequenceHandler,
  listRules,
  listSavedSearchesHandler,
  openTrackingPixel,
  rejectionPatterns,
  reviewCandidate,
  reviewCandidatesBulk,
  runSavedSearchHandler,
  scraperCallback,
  sendDraft,
  startAmazonJob,
  startAmazonScan,
  startB2bJob,
  startCustomsJob,
  startFairJob,
  startGenericFairRunner,
  updateDraft,
  updateIcp,
  updateSavedSearchHandler,
} from './controller';
import {
  deleteBulkList,
  generateBulkDrafts,
  getBulkList,
  listBulkLists,
  listBulkRecipients,
  sendBulkList,
  uploadBulkList,
} from './outreach/bulk-list.controller';

export async function registerLeadMachinePublic(app: FastifyInstance) {
  app.get('/lead-machine/outreach/open/:id/pixel.gif', openTrackingPixel);
  app.post('/lead-machine/scraper-callback', scraperCallback);
}

export async function registerLeadMachineUser(app: FastifyInstance) {
  const guard = { preHandler: [requireAuth, requireModule('leads')], config: { leadMachineScope: 'user' as const } };
  const routeHandler = <T>(handler: T) => handler as never;

  app.get('/lead-machine/candidates', guard, routeHandler(listLeadCandidates));
  app.post('/lead-machine/candidates', guard, routeHandler(createLeadCandidate));
  app.get('/lead-machine/candidates/:id', guard, routeHandler(getLeadCandidate));
  app.patch('/lead-machine/candidates/:id/review', guard, routeHandler(reviewCandidate));
  app.patch('/lead-machine/candidates/bulk-review', guard, routeHandler(reviewCandidatesBulk));
  app.post('/lead-machine/candidates/:id/approve-to-lead', guard, routeHandler(approveToLead));

  app.get('/lead-machine/icp', guard, routeHandler(listIcp));
  app.get('/lead-machine/icp/:id', guard, routeHandler(getIcp));
  app.post('/lead-machine/icp', guard, routeHandler(createIcp));
  app.patch('/lead-machine/icp/:id', guard, routeHandler(updateIcp));
  app.delete('/lead-machine/icp/:id', guard, routeHandler(deleteIcp));

  app.post('/lead-machine/b2b/jobs', guard, routeHandler(startB2bJob));
  app.get('/lead-machine/b2b/jobs', guard, routeHandler(listB2bJobs));
  app.get('/lead-machine/b2b/jobs/:id', guard, routeHandler(getB2bJob));
  app.post('/lead-machine/customs/jobs', guard, routeHandler(startCustomsJob));
  app.get('/lead-machine/customs/jobs', guard, routeHandler(listCustomsJobs));
  app.get('/lead-machine/customs/jobs/:id', guard, routeHandler(getCustomsJob));
  app.post('/lead-machine/fair/jobs', guard, routeHandler(startFairJob));
  app.post('/lead-machine/fair/run', guard, routeHandler(startGenericFairRunner));
  app.get('/lead-machine/fair/jobs', guard, routeHandler(listFairJobs));
  app.get('/lead-machine/fair/jobs/:id', guard, routeHandler(getFairJob));
  app.get('/lead-machine/amazon/jobs', guard, routeHandler(listAmazonJobs));
  app.get('/lead-machine/amazon/jobs/:id', guard, routeHandler(getAmazonJob));
  app.post('/lead-machine/amazon/jobs/:jobId/rescore', guard, routeHandler(rescoreAmazonJob));
  app.get('/lead-machine/fair/brifing/:candidateId.pdf', guard, routeHandler(fairBriefingCandidatePdf));
  app.get('/lead-machine/fair/brifing/day/:date.pdf', guard, routeHandler(fairBriefingDayPdf));
  app.post('/lead-machine/fair/brifing/bulk', guard, routeHandler(fairBriefingBulkPdf));

  app.post('/lead-machine/enrich/:candidateId', guard, routeHandler(enrichOne));
  app.get('/lead-machine/enrich/:candidateId', guard, routeHandler(listEnrichment));
  app.post('/lead-machine/enrich/batch', guard, routeHandler(enrichBatch));

  app.get('/lead-machine/rules', guard, routeHandler(listRules));
  app.post('/lead-machine/rules', guard, routeHandler(createRule));
  app.delete('/lead-machine/rules/:id', guard, routeHandler(deleteRule));

  app.get('/lead-machine/feedback/rejection-stats', guard, routeHandler(feedbackRejectionStats));
  app.get('/lead-machine/feedback/approved-stats', guard, routeHandler(feedbackApprovedStats));
}

export async function registerOutreachUser(app: FastifyInstance) {
  const guard = { preHandler: [requireAuth, requireModule('email-marketing')] };
  const routeHandler = <T>(handler: T) => handler as never;

  app.get('/lead-machine/outreach/campaigns', guard, routeHandler(listOutreachCampaigns));
  app.get('/lead-machine/outreach/campaigns/:id', guard, routeHandler(getOutreachCampaign));
  app.post('/lead-machine/outreach/campaigns', guard, routeHandler(createOutreachCampaign));
  app.patch('/lead-machine/outreach/campaigns/:id', guard, routeHandler(updateOutreachCampaign));
  app.delete('/lead-machine/outreach/campaigns/:id', guard, routeHandler(deleteOutreachCampaign));
  app.post('/lead-machine/outreach/campaigns/:id/generate-drafts', guard, routeHandler(generateOutreachDrafts));
  app.post('/lead-machine/outreach/campaigns/:id/sync-host-keywords', guard, routeHandler(syncHostKeywords));

  app.get('/lead-machine/outreach/drafts', guard, routeHandler(listDrafts));
  app.post('/lead-machine/outreach/generate/:candidateId', guard, routeHandler(generateOutreach));
  app.patch('/lead-machine/outreach/drafts/:id', guard, routeHandler(updateDraft));
  app.post('/lead-machine/outreach/drafts/:id/send', guard, routeHandler(sendDraft));

  app.get('/lead-machine/outreach/lists', guard, routeHandler(listBulkLists));
  app.post('/lead-machine/outreach/lists', guard, routeHandler(uploadBulkList));
  app.get('/lead-machine/outreach/lists/:id', guard, routeHandler(getBulkList));
  app.get('/lead-machine/outreach/lists/:id/recipients', guard, routeHandler(listBulkRecipients));
  app.post('/lead-machine/outreach/lists/:id/generate', guard, routeHandler(generateBulkDrafts));
  app.post('/lead-machine/outreach/lists/:id/send', guard, routeHandler(sendBulkList));
  app.delete('/lead-machine/outreach/lists/:id', guard, routeHandler(deleteBulkList));
}

export async function registerLeadMachineAdmin(app: FastifyInstance) {
  app.addHook('preHandler', requireModule('leads'));
  const emailMarketingGuard = { preHandler: requireModule('email-marketing') };
  const emailHandler = <T>(handler: T) => handler as never;

  app.get('/lead-machine/candidates', listLeadCandidates);
  app.get('/lead-machine/candidates/:id', getLeadCandidate);
  app.patch('/lead-machine/candidates/:id/review', reviewCandidate);
  app.patch('/lead-machine/candidates/bulk-review', reviewCandidatesBulk);
  app.post('/lead-machine/candidates/:id/approve-to-lead', approveToLead);
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
  app.get('/lead-machine/b2b/jobs/:id', getB2bJob);

  app.post('/lead-machine/customs/jobs', startCustomsJob);
  app.get('/lead-machine/customs/jobs', listCustomsJobs);
  app.get('/lead-machine/customs/jobs/:id', getCustomsJob);

  app.post('/lead-machine/fair/jobs', startFairJob);
  app.post('/lead-machine/fair/run', startGenericFairRunner);
  app.get('/lead-machine/fair/jobs', listFairJobs);
  app.get('/lead-machine/fair/jobs/:id', getFairJob);
  app.get('/lead-machine/fair/suggestions', fairSuggestions);
  app.get('/lead-machine/fair/brifing/:candidateId.pdf', fairBriefingCandidatePdf);
  app.get('/lead-machine/fair/brifing/day/:date.pdf', fairBriefingDayPdf);
  app.post('/lead-machine/fair/brifing/bulk', fairBriefingBulkPdf);

  app.post('/lead-machine/enrich/:candidateId', enrichOne);
  app.get('/lead-machine/enrich/:candidateId', listEnrichment);
  app.post('/lead-machine/enrich/batch', enrichBatch);
  app.post('/lead-machine/candidates/enrich-decision-makers', enrichDecisionMakersBatch);

  app.post('/lead-machine/outreach/generate/:candidateId', emailMarketingGuard, emailHandler(generateOutreach));
  app.post('/lead-machine/outreach/linkedin-templates', emailMarketingGuard, emailHandler(generateLinkedInTemplatesHandler));
  app.post('/lead-machine/outreach/linkedin-sequence', emailMarketingGuard, emailHandler(createLinkedInSequenceHandler));
  app.get('/lead-machine/outreach/linkedin-sequence', emailMarketingGuard, emailHandler(listLinkedInSequenceHandler));
  app.get('/lead-machine/outreach/drafts', emailMarketingGuard, emailHandler(listDrafts));
  app.patch('/lead-machine/outreach/drafts/:id', emailMarketingGuard, emailHandler(updateDraft));
  app.post('/lead-machine/outreach/drafts/:id/send', emailMarketingGuard, emailHandler(sendDraft));

  app.get('/lead-machine/outreach/campaigns', emailMarketingGuard, emailHandler(listOutreachCampaigns));
  app.get('/lead-machine/outreach/campaigns/:id', emailMarketingGuard, emailHandler(getOutreachCampaign));
  app.post('/lead-machine/outreach/campaigns', emailMarketingGuard, emailHandler(createOutreachCampaign));
  app.patch('/lead-machine/outreach/campaigns/:id', emailMarketingGuard, emailHandler(updateOutreachCampaign));
  app.delete('/lead-machine/outreach/campaigns/:id', emailMarketingGuard, emailHandler(deleteOutreachCampaign));
  app.post('/lead-machine/outreach/campaigns/:id/generate-drafts', emailMarketingGuard, emailHandler(generateOutreachDrafts));
  app.post('/lead-machine/outreach/campaigns/:id/sync-host-keywords', emailMarketingGuard, emailHandler(syncHostKeywords));

  // Outreach bulk-list send (Excel/CSV alıcı listesi → toplu mail)
  app.get   ('/lead-machine/outreach/lists',                 emailMarketingGuard, listBulkLists);
  app.post  ('/lead-machine/outreach/lists',                 emailMarketingGuard, uploadBulkList);        // multipart
  app.get   ('/lead-machine/outreach/lists/:id',             emailMarketingGuard, getBulkList);
  app.get   ('/lead-machine/outreach/lists/:id/recipients',  emailMarketingGuard, listBulkRecipients);
  app.post  ('/lead-machine/outreach/lists/:id/generate',    emailMarketingGuard, generateBulkDrafts);    // {subjectTemplate, bodyTemplate}
  app.post  ('/lead-machine/outreach/lists/:id/send',        emailMarketingGuard, sendBulkList);          // {ratePerMinute?}
  app.delete('/lead-machine/outreach/lists/:id',             emailMarketingGuard, deleteBulkList);

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
