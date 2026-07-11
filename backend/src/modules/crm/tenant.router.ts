import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/middleware/auth';
import { requireModule } from '@/modules/entitlements';
import {
  dashboardSummaryHandler,
  businessSummaryHandler,
  convertLeadHandler,
  createAccountHandler,
  createActivityHandler,
  createContactHandler,
  createDealHandler,
  createDocumentHandler,
  createOrderHandler,
  createProductHandler,
  createQuoteHandler,
  createReminderHandler,
  createTaskHandler,
  deleteAccountHandler,
  deleteActivityHandler,
  deleteContactHandler,
  deleteDealHandler,
  deleteDocumentHandler,
  deleteOrderHandler,
  deleteProductHandler,
  deleteQuoteHandler,
  deleteReminderHandler,
  deleteTaskHandler,
  mailSummaryHandler,
  reportsSummaryHandler,
  usersSummaryHandler,
  listAccountsHandler,
  getAccountHandler,
  listContactsHandler,
  getContactHandler,
  listDealsHandler,
  getDealHandler,
  getDocumentHandler,
  getOrderHandler,
  getProductHandler,
  getQuoteHandler,
  getReminderHandler,
  getTaskHandler,
  listPipelinesHandler,
  listActivitiesHandler,
  listProductsHandler,
  listQuotesHandler,
  listOrdersHandler,
  listDocumentsHandler,
  listTasksHandler,
  listRemindersHandler,
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

/**
 * Tenant (giriş yapmış müşteri — admin DEĞİL) CRM okuma uçları.
 * `/api/v1/crm/...` — requireAuth + requireModule('crm'), tenant context'ten scope.
 * Admin uçları (`/api/v1/admin/crm/...`, registerCrmAdmin) ayrı; bunlar yalnızca okuma.
 * Hook sızıntısını önlemek için per-route preHandler kullanılır (addHook YOK).
 */
export async function registerCrmTenant(app: FastifyInstance) {
  // ownerScope: 'user' ZORUNLU — controller ownerForRequest→ownerScopeForRequest(req) owner'i
  // bu bayraktan cozer. Bayrak olmazsa owner=null (tenant-geneli) → kullanicilar arasi sizinti.
  const guard = { preHandler: [requireAuth, requireModule('crm')], config: { ownerScope: 'user' as const } };

  app.get('/crm/dashboard/summary', guard, dashboardSummaryHandler);
  app.get('/crm/mail/summary', guard, mailSummaryHandler);
  app.get('/crm/reports/summary', guard, reportsSummaryHandler);
  app.get('/crm/users/summary', guard, usersSummaryHandler);
  app.get('/crm/business/summary', guard, businessSummaryHandler);
  app.get('/crm/accounts', guard, listAccountsHandler);
  app.post('/crm/accounts', guard, createAccountHandler);
  app.get('/crm/accounts/:id', guard, getAccountHandler);
  app.patch('/crm/accounts/:id', guard, updateAccountHandler);
  app.delete('/crm/accounts/:id', guard, deleteAccountHandler);
  app.get('/crm/contacts', guard, listContactsHandler);
  app.post('/crm/contacts', guard, createContactHandler);
  app.get('/crm/contacts/:id', guard, getContactHandler);
  app.patch('/crm/contacts/:id', guard, updateContactHandler);
  app.delete('/crm/contacts/:id', guard, deleteContactHandler);
  app.get('/crm/pipelines', guard, listPipelinesHandler);
  app.get('/crm/deals', guard, listDealsHandler);
  app.post('/crm/deals', guard, createDealHandler);
  app.get('/crm/deals/:id', guard, getDealHandler);
  app.patch('/crm/deals/:id', guard, updateDealHandler);
  app.patch('/crm/deals/:id/stage', guard, moveDealStageHandler);
  app.delete('/crm/deals/:id', guard, deleteDealHandler);
  app.get('/crm/activities', guard, listActivitiesHandler);
  app.post('/crm/activities', guard, createActivityHandler);
  app.patch('/crm/activities/:id', guard, updateActivityHandler);
  app.delete('/crm/activities/:id', guard, deleteActivityHandler);

  // İş kayıtları (okuma) — Codex business-records modülü
  app.get('/crm/products', guard, listProductsHandler);
  app.post('/crm/products', guard, createProductHandler);
  app.get('/crm/products/:id', guard, getProductHandler);
  app.patch('/crm/products/:id', guard, updateProductHandler);
  app.delete('/crm/products/:id', guard, deleteProductHandler);
  app.get('/crm/quotes', guard, listQuotesHandler);
  app.post('/crm/quotes', guard, createQuoteHandler);
  app.get('/crm/quotes/:id', guard, getQuoteHandler);
  app.patch('/crm/quotes/:id', guard, updateQuoteHandler);
  app.delete('/crm/quotes/:id', guard, deleteQuoteHandler);
  app.get('/crm/orders', guard, listOrdersHandler);
  app.post('/crm/orders', guard, createOrderHandler);
  app.get('/crm/orders/:id', guard, getOrderHandler);
  app.patch('/crm/orders/:id', guard, updateOrderHandler);
  app.delete('/crm/orders/:id', guard, deleteOrderHandler);
  app.get('/crm/documents', guard, listDocumentsHandler);
  app.post('/crm/documents', guard, createDocumentHandler);
  app.get('/crm/documents/:id', guard, getDocumentHandler);
  app.patch('/crm/documents/:id', guard, updateDocumentHandler);
  app.delete('/crm/documents/:id', guard, deleteDocumentHandler);
  app.get('/crm/tasks', guard, listTasksHandler);
  app.post('/crm/tasks', guard, createTaskHandler);
  app.get('/crm/tasks/:id', guard, getTaskHandler);
  app.patch('/crm/tasks/:id', guard, updateTaskHandler);
  app.delete('/crm/tasks/:id', guard, deleteTaskHandler);
  app.get('/crm/reminders', guard, listRemindersHandler);
  app.post('/crm/reminders', guard, createReminderHandler);
  app.get('/crm/reminders/:id', guard, getReminderHandler);
  app.patch('/crm/reminders/:id', guard, updateReminderHandler);
  app.delete('/crm/reminders/:id', guard, deleteReminderHandler);
  app.post('/crm/convert/lead-candidate', guard, convertLeadHandler);
}
