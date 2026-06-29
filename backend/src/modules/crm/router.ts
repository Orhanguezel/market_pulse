import type { FastifyInstance } from 'fastify';
import { requireModule } from '@/modules/entitlements';
import {
  convertLeadHandler,
  createAccountHandler,
  createActivityHandler,
  createContactHandler,
  createDealHandler,
  createPipelineHandler,
  dashboardSummaryHandler,
  getAccountHandler,
  getContactHandler,
  getDealHandler,
  listAccountsHandler,
  listActivitiesHandler,
  listContactsHandler,
  listDealsHandler,
  listPipelinesHandler,
  moveDealStageHandler,
  updateAccountHandler,
  updateActivityHandler,
  updateContactHandler,
  updateDealHandler,
} from './controller';

export async function registerCrmAdmin(app: FastifyInstance) {
  app.addHook('preHandler', requireModule('crm'));

  app.get('/crm/dashboard/summary', dashboardSummaryHandler);

  app.get('/crm/accounts', listAccountsHandler);
  app.post('/crm/accounts', createAccountHandler);
  app.get('/crm/accounts/:id', getAccountHandler);
  app.patch('/crm/accounts/:id', updateAccountHandler);

  app.get('/crm/contacts', listContactsHandler);
  app.post('/crm/contacts', createContactHandler);
  app.get('/crm/contacts/:id', getContactHandler);
  app.patch('/crm/contacts/:id', updateContactHandler);

  app.get('/crm/pipelines', listPipelinesHandler);
  app.post('/crm/pipelines', createPipelineHandler);

  app.get('/crm/deals', listDealsHandler);
  app.post('/crm/deals', createDealHandler);
  app.get('/crm/deals/:id', getDealHandler);
  app.patch('/crm/deals/:id', updateDealHandler);
  app.patch('/crm/deals/:id/stage', moveDealStageHandler);

  app.get('/crm/activities', listActivitiesHandler);
  app.post('/crm/activities', createActivityHandler);
  app.patch('/crm/activities/:id', updateActivityHandler);

  app.post('/crm/convert/lead-candidate', convertLeadHandler);
}
