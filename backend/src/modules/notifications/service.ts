// ===================================================================
// FILE: src/modules/notifications/service.ts
// ===================================================================

import { db } from "../../db/client";
import { eq } from "drizzle-orm";
import { createNotificationInsert, toNotificationRow } from "./helpers";
import {
  notifications,
  type NotificationRow,
  type NotificationType,
} from "./schema";

export async function createUserNotification(input: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
}): Promise<NotificationRow> {
  const insert = createNotificationInsert(input);

  await db.insert(notifications).values(insert);

  const [row] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, insert.id))
    .limit(1);

  return toNotificationRow(row);
}
