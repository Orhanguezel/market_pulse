// src/modules/notifications/helpers/service.ts
import { randomUUID } from "crypto";
import type { NotificationInsert, NotificationRow, NotificationType } from "../schema";

export function createNotificationInsert(input: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
}): NotificationInsert {
  return {
    id: randomUUID(),
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? "system",
    is_read: false,
    created_at: new Date(),
  };
}

export function toNotificationRow(row: NotificationRow | undefined): NotificationRow {
  if (!row) {
    throw new Error("notification_create_failed");
  }

  return row;
}
