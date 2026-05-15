// ===================================================================
// FILE: src/modules/menuItems/router.ts
// ===================================================================

import type { FastifyInstance } from "fastify";
import { listMenuItems, getMenuItemById } from "./controller";

const BASE = "/menu_items";

export async function registerMenuItems(app: FastifyInstance) {
  app.get(`${BASE}`, { config: { public: true } }, listMenuItems);
  app.get(`${BASE}/:id`, { config: { public: true } }, getMenuItemById);
}
