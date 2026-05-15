// =============================================================
// FILE: src/integrations/types/notifications.types.ts
// – Notifications types (frontend DTO / payloads)
// =============================================================

import { safeStr, toBool } from '@/integrations/shared';

/**
 * Bildirim türleri: backend schema.ts ile senkron
 * DB serbest string; burada union + geniş string.
 */
export type NotificationType =
  | 'order_created'
  | 'order_paid'
  | 'order_failed'
  | 'system'
  | 'custom'
  | (string & {
      _?: never;
    }); // genişletilebilir union

// Backend NotificationRow → FE DTO
export interface NotificationDto {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string; // ISO/string
}

// Liste endpoint'i query paramları
export interface NotificationListQueryParams {
  is_read?: boolean | '1' | '0' | 'true' | 'false' | 'yes' | 'no';
  type?: string;
  limit?: number;
  offset?: number;
}

// POST /notifications
export interface NotificationCreatePayload {
  user_id?: string; // verilmezse backend auth user'a yazar
  title: string;
  message: string;
  type: NotificationType;
}

// PATCH /notifications/:id
export interface NotificationUpdatePayload {
  id: string;
  is_read?: boolean;
}

// DELETE /notifications/:id
export interface NotificationDeletePayload {
  id: string;
}

// GET /notifications/unread-count
export interface NotificationUnreadCountResponse {
  count: number;
}

/* ------------------------------------------------------------------
 * Normalizer
 * ------------------------------------------------------------------ */

export const normalizeNotification = (n: any): NotificationDto => ({
  id: safeStr(n.id),
  user_id: safeStr(n.user_id),
  title: safeStr(n.title),
  message: safeStr(n.message),
  type: (n.type ?? 'system') as NotificationType,
  is_read: toBool(n.is_read),
  created_at: safeStr(n.created_at),
});
