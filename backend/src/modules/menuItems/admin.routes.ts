// ===================================================================
// FILE: src/modules/menuItems/admin.routes.ts
// ===================================================================

import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth";
import {
  adminListMenuItems,
  adminGetMenuItemById,
  adminCreateMenuItem,
  adminUpdateMenuItem,
  adminDeleteMenuItem,
  adminReorderMenuItems,
} from "./admin.controller";

const BASE = "/menu_items";

export async function registerMenuItemsAdmin(app: FastifyInstance) {
  app.get(BASE, { preHandler: [requireAuth] }, adminListMenuItems);
  app.get(
    `${BASE}/:id`,
    { preHandler: [requireAuth] },
    adminGetMenuItemById,
  );
  app.post(
    BASE,
    { preHandler: [requireAuth] },
    adminCreateMenuItem,
  );
  app.patch(
    `${BASE}/:id`,
    { preHandler: [requireAuth] },
    adminUpdateMenuItem,
  );
  app.delete(
    `${BASE}/:id`,
    { preHandler: [requireAuth] },
    adminDeleteMenuItem,
  );
  app.post(
    `${BASE}/reorder`,
    { preHandler: [requireAuth] },
    adminReorderMenuItems,
  );
}
