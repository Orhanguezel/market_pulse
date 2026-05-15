// =============================================================
// FILE: src/modules/notifications/repository.ts
// =============================================================
import { db } from '../../db/client';
import { and, eq, sql } from 'drizzle-orm';
import {
  buildNotificationListWhere,
  getNotificationsCreatedAtDesc,
  type NotificationListParams,
} from './helpers';
import { notifications } from './schema';

export async function repoListNotifications(userId: string, params: NotificationListParams) {
  return db
    .select()
    .from(notifications)
    .where(buildNotificationListWhere(userId, params))
    .orderBy(getNotificationsCreatedAtDesc())
    .limit(params.limit)
    .offset(params.offset);
}

export async function repoGetUnreadCount(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.user_id, userId), eq(notifications.is_read, false)));
  return Number(row?.count ?? 0);
}

export async function repoGetNotificationById(id: string) {
  const [row] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return row ?? null;
}

export async function repoMarkNotificationRead(id: string, isRead: boolean) {
  await db.update(notifications).set({ is_read: isRead }).where(eq(notifications.id, id));
  const [updated] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return updated ?? null;
}

export async function repoMarkAllRead(userId: string) {
  await db
    .update(notifications)
    .set({ is_read: true })
    .where(and(eq(notifications.user_id, userId), eq(notifications.is_read, false)));
}

export async function repoDeleteNotification(id: string) {
  await db.delete(notifications).where(eq(notifications.id, id));
}
