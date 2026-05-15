// =============================================================
// FILE: src/modules/notifications/controller.ts
// =============================================================
import type { FastifyRequest, FastifyReply } from 'fastify';
import { getAuthUserId, handleRouteError, sendNotFound } from '../_shared';
import { parseNotificationListParams } from "./helpers";
import { notificationCreateSchema, notificationUpdateSchema } from './validation';
import { createUserNotification } from './service';
import {
  repoListNotifications,
  repoGetUnreadCount,
  repoGetNotificationById,
  repoMarkNotificationRead,
  repoMarkAllRead,
  repoDeleteNotification,
} from './repository';

import { notifications } from './schema';
import { db } from '../../db/client';
import { and, eq, sql } from 'drizzle-orm';
import { buildNotificationListWhere } from './helpers';

/** GET /notifications */
export async function listNotifications(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const q = (req.query ?? {}) as Record<string, string>;
    const params = parseNotificationListParams(q);
    const pageNum = Number(q.page) || 1;
    
    const where = buildNotificationListWhere(userId, params);
    
    const [rows, [countRow]] = await Promise.all([
      repoListNotifications(userId, params),
      db.select({ total: sql<number>`COUNT(*)` }).from(notifications).where(where)
    ]);

    return reply.send({
      data: rows,
      page: pageNum,
      limit: params.limit,
      total: Number(countRow?.total ?? 0)
    });
  } catch (e) {
    return handleRouteError(reply, req, e, 'notifications_list');
  }
}

/** GET /notifications/unread-count */
export async function getUnreadCount(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const count = await repoGetUnreadCount(userId);
    return reply.send({ count });
  } catch (e) {
    return handleRouteError(reply, req, e, 'notifications_unread_count');
  }
}

/** POST /notifications */
export async function createNotificationHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const authUserId = getAuthUserId(req);
    const body = notificationCreateSchema.parse(req.body ?? {});
    const targetUserId = body.user_id ?? authUserId;

    const row = await createUserNotification({
      userId: targetUserId,
      title: body.title,
      message: body.message,
      type: body.type,
    });

    return reply.code(201).send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'notification_create');
  }
}

/** PATCH /notifications/:id */
export async function markNotificationRead(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const { id } = req.params as { id: string };
    const patch = notificationUpdateSchema.parse(req.body ?? {});

    const existing = await repoGetNotificationById(id);
    if (!existing || existing.user_id !== userId) return sendNotFound(reply);

    const updated = await repoMarkNotificationRead(id, patch.is_read ?? true);
    return reply.send(updated);
  } catch (e) {
    return handleRouteError(reply, req, e, 'notification_update');
  }
}

/** POST /notifications/mark-all-read */
export async function markAllRead(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    await repoMarkAllRead(userId);
    return reply.send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'notifications_mark_all_read');
  }
}

/** DELETE /notifications/:id */
export async function deleteNotification(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const { id } = req.params as { id: string };

    const existing = await repoGetNotificationById(id);
    if (!existing || existing.user_id !== userId) return sendNotFound(reply);

    await repoDeleteNotification(id);
    return reply.send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'notification_delete');
  }
}
