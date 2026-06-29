import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/middleware/auth';
import { requireModule } from '@/modules/entitlements';
import {
  dashboardSummaryHandler,
  listAccountsHandler,
  getAccountHandler,
  listContactsHandler,
  getContactHandler,
  listDealsHandler,
  getDealHandler,
  listActivitiesHandler,
} from './controller';

/**
 * Tenant (giriş yapmış müşteri — admin DEĞİL) CRM okuma uçları.
 * `/api/v1/crm/...` — requireAuth + requireModule('crm'), tenant context'ten scope.
 * Admin uçları (`/api/v1/admin/crm/...`, registerCrmAdmin) ayrı; bunlar yalnızca okuma.
 * Hook sızıntısını önlemek için per-route preHandler kullanılır (addHook YOK).
 */
export async function registerCrmTenant(app: FastifyInstance) {
  const guard = { preHandler: [requireAuth, requireModule('crm')] };

  app.get('/crm/dashboard/summary', guard, dashboardSummaryHandler);
  app.get('/crm/accounts', guard, listAccountsHandler);
  app.get('/crm/accounts/:id', guard, getAccountHandler);
  app.get('/crm/contacts', guard, listContactsHandler);
  app.get('/crm/contacts/:id', guard, getContactHandler);
  app.get('/crm/deals', guard, listDealsHandler);
  app.get('/crm/deals/:id', guard, getDealHandler);
  app.get('/crm/activities', guard, listActivitiesHandler);
}
