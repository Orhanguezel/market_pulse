import type { FastifyInstance } from 'fastify';
import { requireModule } from '@/modules/entitlements';
import {
  convertLeadHandler,
  createAccountHandler,
  createActivityHandler,
  createContactHandler,
  createDealHandler,
  createDocumentHandler,
  createOrderHandler,
  createPipelineHandler,
  createProductHandler,
  createQuoteHandler,
  createReminderHandler,
  createTaskHandler,
  businessSummaryHandler,
  dashboardSummaryHandler,
  getAccountHandler,
  getContactHandler,
  getDealHandler,
  getDocumentHandler,
  getOrderHandler,
  getProductHandler,
  getQuoteHandler,
  getReminderHandler,
  getTaskHandler,
  listAccountsHandler,
  listActivitiesHandler,
  listContactsHandler,
  listDealsHandler,
  listDocumentsHandler,
  listOrdersHandler,
  listPipelinesHandler,
  listProductsHandler,
  listQuotesHandler,
  listRemindersHandler,
  mailSummaryHandler,
  reportsSummaryHandler,
  usersSummaryHandler,
  listTasksHandler,
  moveDealStageHandler,
  updateAccountHandler,
  updateActivityHandler,
  updateContactHandler,
  updateDealHandler,
  updateDocumentHandler,
  updateOrderHandler,
  updateProductHandler,
  updateQuoteHandler,
  updateReminderHandler,
  updateTaskHandler,
} from './controller';

export async function registerCrmAdmin(app: FastifyInstance) {
  app.addHook('preHandler', requireModule('crm'));

  app.get('/crm/dashboard/summary', dashboardSummaryHandler);
  app.get('/crm/mail/summary', mailSummaryHandler);
  app.get('/crm/reports/summary', reportsSummaryHandler);
  app.get('/crm/users/summary', usersSummaryHandler);
  app.get('/crm/business/summary', businessSummaryHandler);

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

  app.get('/crm/products', listProductsHandler);
  app.post('/crm/products', createProductHandler);
  app.get('/crm/products/:id', getProductHandler);
  app.patch('/crm/products/:id', updateProductHandler);

  app.get('/crm/quotes', listQuotesHandler);
  app.post('/crm/quotes', createQuoteHandler);
  app.get('/crm/quotes/:id', getQuoteHandler);
  app.patch('/crm/quotes/:id', updateQuoteHandler);

  app.get('/crm/orders', listOrdersHandler);
  app.post('/crm/orders', createOrderHandler);
  app.get('/crm/orders/:id', getOrderHandler);
  app.patch('/crm/orders/:id', updateOrderHandler);

  app.get('/crm/documents', listDocumentsHandler);
  app.post('/crm/documents', createDocumentHandler);
  app.get('/crm/documents/:id', getDocumentHandler);
  app.patch('/crm/documents/:id', updateDocumentHandler);

  app.get('/crm/tasks', listTasksHandler);
  app.post('/crm/tasks', createTaskHandler);
  app.get('/crm/tasks/:id', getTaskHandler);
  app.patch('/crm/tasks/:id', updateTaskHandler);

  app.get('/crm/reminders', listRemindersHandler);
  app.post('/crm/reminders', createReminderHandler);
  app.get('/crm/reminders/:id', getReminderHandler);
  app.patch('/crm/reminders/:id', updateReminderHandler);

  app.post('/crm/convert/lead-candidate', convertLeadHandler);
}
