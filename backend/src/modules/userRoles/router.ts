import type { FastifyInstance } from "fastify";
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';
import {
  listUserRoles,
  createUserRole,
  deleteUserRole,
} from "./controller";

export async function registerUserRoles(app: FastifyInstance) {
  const B = "/user_roles";
  // Public list (nav bar check) - limit + rateLimit ekleyelim
  app.get(`${B}`,
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    listUserRoles
  );

  // Yönetim uçları: admin zorunlu
  app.post(`${B}`,
    { preHandler: [requireAuth, requireAdmin],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    createUserRole
  );

  app.delete(`${B}/:id`,
    { preHandler: [requireAuth, requireAdmin],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    deleteUserRole
  );
}
