// src/modules/notifications/helpers/repository.ts
import { and, desc, eq } from "drizzle-orm";
import { notifications, type NotificationType } from "../schema";

export type NotificationListParams = {
  is_read?: boolean;
  type?: string;
  limit: number;
  offset: number;
};

export function parseNotificationListParams(query: Record<string, string>) {
  let is_read: boolean | undefined;

  if (query.is_read !== undefined) {
    is_read = ["1", "true", "yes"].includes(String(query.is_read).toLowerCase());
  }

  return {
    is_read,
    type: query.type,
    limit: Math.min(Number(query.limit) || 50, 200),
    offset: Math.max(Number(query.offset) || 0, 0),
  } satisfies NotificationListParams;
}

export function buildNotificationListWhere(userId: string, params: NotificationListParams) {
  const conditions = [eq(notifications.user_id, userId)];

  if (params.type) {
    conditions.push(eq(notifications.type, params.type as NotificationType));
  }
  if (params.is_read !== undefined) {
    conditions.push(eq(notifications.is_read, params.is_read));
  }

  return and(...conditions);
}

export function getNotificationsCreatedAtDesc() {
  return desc(notifications.created_at);
}
