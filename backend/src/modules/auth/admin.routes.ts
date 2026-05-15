import type { FastifyInstance } from 'fastify';
import {
  adminListUsers,
  adminGetUser,
  adminUpdateUser,
  adminSetUserActive,
  adminSetUserRoles,
  adminSetUserPassword,
  adminDeleteUser,
} from './admin.controller';

export async function registerUserAdmin(app: FastifyInstance) {
  const B = '/users';

  app.get(`${B}`, adminListUsers);
  app.get(`${B}/:id`, adminGetUser);
  app.patch(`${B}/:id`, adminUpdateUser);
  app.post(`${B}/:id/active`, adminSetUserActive);
  app.post(`${B}/:id/roles`, adminSetUserRoles);
  app.post(`${B}/:id/password`, adminSetUserPassword);
  app.delete(`${B}/:id`, adminDeleteUser);
}
