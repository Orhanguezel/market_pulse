// src/modules/notifications/index.ts
// External module surface for notifications. Keep explicit; no export *.

export { registerNotifications } from './router';

export {
  listNotifications,
  getUnreadCount,
  createNotificationHandler,
  markNotificationRead,
  markAllRead,
  deleteNotification,
} from './controller';

export { createUserNotification } from './service';

export {
  parseNotificationListParams,
  buildNotificationListWhere,
  getNotificationsCreatedAtDesc,
  createNotificationInsert,
  toNotificationRow,
} from './helpers';

export {
  repoListNotifications,
  repoGetUnreadCount,
  repoGetNotificationById,
  repoMarkNotificationRead,
  repoMarkAllRead,
  repoDeleteNotification,
} from './repository';

export {
  notificationCreateSchema,
  notificationUpdateSchema,
  notificationMarkAllReadSchema,
} from './validation';

export {
  notifications,
} from './schema';
export type {
  NotificationRow,
  NotificationInsert,
  NotificationType,
} from './schema';
