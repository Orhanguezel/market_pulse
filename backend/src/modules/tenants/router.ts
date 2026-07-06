import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/middleware/auth';
import { requireAdmin } from '@/middleware/roles';
import {
  createTenantRole,
  getTenant,
  listTenantSecrets,
  listTenantRoles,
  listTenants,
  listTenantsAdmin,
  listTenantMembersAdmin,
  listWorkspaceUsers,
  inviteWorkspaceUser,
  onboardTenant,
  removeWorkspaceUser,
  upsertTenantSecret,
  updateTenantProfile,
  updateWorkspaceUserRole,
} from './controller';

export async function registerTenants(app: FastifyInstance) {
  app.get('/tenants', listTenants);
  app.get('/tenants/:key', getTenant);
  app.get('/tenants/admin/list', { preHandler: [requireAuth, requireAdmin] }, listTenantsAdmin);
  app.get<{ Params: { key: string } }>('/tenants/admin/:key/members', { preHandler: [requireAuth, requireAdmin] }, listTenantMembersAdmin);
  app.get('/tenants/workspace/users', { preHandler: [requireAuth] }, listWorkspaceUsers);
  app.post<{ Body: unknown }>('/tenants/workspace/users/invite', { preHandler: [requireAuth] }, inviteWorkspaceUser);
  app.patch<{ Params: { userId: string }; Body: unknown }>('/tenants/workspace/users/:userId', { preHandler: [requireAuth] }, updateWorkspaceUserRole);
  app.delete<{ Params: { userId: string } }>('/tenants/workspace/users/:userId', { preHandler: [requireAuth] }, removeWorkspaceUser);
  app.post<{ Body: unknown }>('/tenants/admin/onboard', { preHandler: [requireAuth, requireAdmin] }, onboardTenant);
  app.patch<{ Params: { key: string }; Body: unknown }>('/tenants/admin/:key/profile', { preHandler: [requireAuth, requireAdmin] }, updateTenantProfile);
  app.get<{ Params: { key: string } }>('/tenants/admin/:key/roles', { preHandler: [requireAuth, requireAdmin] }, listTenantRoles);
  app.post<{ Params: { key: string }; Body: unknown }>('/tenants/admin/:key/roles', { preHandler: [requireAuth, requireAdmin] }, createTenantRole);
  app.get<{ Params: { key: string } }>('/tenants/admin/:key/secrets', { preHandler: [requireAuth, requireAdmin] }, listTenantSecrets);
  app.post<{ Params: { key: string }; Body: unknown }>('/tenants/admin/:key/secrets', { preHandler: [requireAuth, requireAdmin] }, upsertTenantSecret);
}
