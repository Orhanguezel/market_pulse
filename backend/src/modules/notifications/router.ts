// ===================================================================
// FILE: src/modules/notifications/router.ts
// ===================================================================

import type { FastifyInstance } from "fastify";
import { requireAuth } from '../../middleware/auth';
import {
  listNotifications,
  getUnreadCount,
  createNotificationHandler,
  markNotificationRead,
  markAllRead,
  deleteNotification,
} from "./controller";

const B = "/notifications";

export async function registerNotifications(app: FastifyInstance) {
  // Liste + unread sayısı
  app.get(B, { preHandler: [requireAuth] }, listNotifications);
  app.get(
    `${B}/unread-count`,
    { preHandler: [requireAuth] },
    getUnreadCount,
  );

  // CRUD / aksiyonlar
  app.post(B, { preHandler: [requireAuth] }, createNotificationHandler);
  app.patch(
    `${B}/:id`,
    { preHandler: [requireAuth] },
    markNotificationRead,
  );
  app.post(
    `${B}/mark-all-read`,
    { preHandler: [requireAuth] },
    markAllRead,
  );
  app.delete(
    `${B}/:id`,
    { preHandler: [requireAuth] },
    deleteNotification,
  );
}
