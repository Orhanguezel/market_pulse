import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/middleware/auth';
import { requireAdmin } from '@/middleware/roles';
import {
  createTenantRole,
  getTenant,
  listTenantRoles,
  listTenants,
  onboardTenant,
  updateTenantProfile,
} from './controller';

export async function registerTenants(app: FastifyInstance) {
  app.get('/tenants', listTenants);
  app.get('/tenants/:key', getTenant);
  app.post<{ Body: unknown }>('/tenants/admin/onboard', { preHandler: [requireAuth, requireAdmin] }, onboardTenant);
  app.patch<{ Params: { key: string }; Body: unknown }>('/tenants/admin/:key/profile', { preHandler: [requireAuth, requireAdmin] }, updateTenantProfile);
  app.get<{ Params: { key: string } }>('/tenants/admin/:key/roles', { preHandler: [requireAuth, requireAdmin] }, listTenantRoles);
  app.post<{ Params: { key: string }; Body: unknown }>('/tenants/admin/:key/roles', { preHandler: [requireAuth, requireAdmin] }, createTenantRole);
}
