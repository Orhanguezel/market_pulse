import type { FastifyInstance } from 'fastify';
import {
  listTargets, getTarget, createTarget, updateTarget, deleteTarget,
  listLeads, getLead, createLead, updateLead, deleteLead, getConversionStats,
  listSignals, createSignal, reviewSignal, deleteSignal,
  getMarketStats,
  listPaspasCustomers, listPaspasProducts, listPaspasCustomerOrders,
  recalculateTargetChurn,
  syncPaspasTargets,
  bulkImportTargets, downloadImportTemplate,
  scanCompetitor, scanAllCompetitors,
  previewWeeklyReport, sendWeeklyReport,
  listMarketTestRuns, createMarketTestRun, executeMarketTestRun,
  listMarketDeveloperNotes, createMarketDeveloperNote, updateMarketDeveloperNote, deleteMarketDeveloperNote,
} from './controller';

export async function registerMarketAdmin(app: FastifyInstance) {
  app.get('/market/stats',              getMarketStats);
  app.get('/market/targets',            listTargets);
  app.get('/market/targets/:id',        getTarget);
  app.post('/market/targets',           createTarget);
  app.patch('/market/targets/:id',      updateTarget);
  app.delete('/market/targets/:id',     deleteTarget);
  app.post('/market/targets/:id/recalculate-churn', recalculateTargetChurn);
  app.get('/market/leads',              listLeads);
  app.get('/market/leads/conversion-stats', getConversionStats);
  app.get('/market/leads/:id',          getLead);
  app.post('/market/leads',             createLead);
  app.patch('/market/leads/:id',        updateLead);
  app.delete('/market/leads/:id',       deleteLead);
  app.get('/market/signals',            listSignals);
  app.post('/market/signals',           createSignal);
  app.post('/market/signals/:id/review', reviewSignal);
  app.delete('/market/signals/:id',     deleteSignal);
  app.post('/market/sync-paspas',                         syncPaspasTargets);
  app.post('/market/targets/bulk-import',                 bulkImportTargets);
  app.get('/market/targets/import-template',              downloadImportTemplate);
  app.post('/market/targets/:id/scan-competitor',         scanCompetitor);
  app.post('/market/targets/scan-all-competitors',        scanAllCompetitors);
  app.get('/market/external/paspas/customers',            listPaspasCustomers);
  app.get('/market/external/paspas/products',             listPaspasProducts);
  app.get('/market/external/paspas/customers/:id/orders', listPaspasCustomerOrders);
  app.get('/market/reports/weekly/preview', previewWeeklyReport);
  app.post('/market/reports/weekly/send', sendWeeklyReport);
  app.get('/market/test-runs', listMarketTestRuns);
  app.post('/market/test-runs', createMarketTestRun);
  app.post('/market/test-runs/execute', executeMarketTestRun);
  app.get('/market/developer-notes', listMarketDeveloperNotes);
  app.post('/market/developer-notes', createMarketDeveloperNote);
  app.patch('/market/developer-notes/:id', updateMarketDeveloperNote);
  app.delete('/market/developer-notes/:id', deleteMarketDeveloperNote);
}
