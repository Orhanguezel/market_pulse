// ===================================================================
// FILE: src/integrations/shared/notifications.ts
// FINAL — Notifications types + normalizers (Auth-required)
// Backend routes (all requireAuth):
// - GET    /notifications
// - GET    /notifications/unread-count
// - POST   /notifications
// - PATCH  /notifications/:id
// - POST   /notifications/mark-all-read
// - DELETE /notifications/:id     (returns { ok: true })
// Notes:
// - is_read DB: 0/1, API returns number (likely) -> normalized boolean in view
// - type DB: free string; DX union provided
// ===================================================================

import type { BoolLike } from '@/integrations/shared';
import { toBool } from '@/integrations/shared';

export type NotificationType =
  | 'order_created'
  | 'order_paid'
  | 'order_failed'
  | 'booking_created'
  | 'booking_status_changed'
  | 'system'
  | 'custom'
  | (string & {});

/** DB/API ham satır (tolerant) */
export type NotificationRow = {
  id: string;
  user_id: string;

  title: string;
  message: string;

  type: string;

  is_read: BoolLike;

  created_at: string;
};

/** FE view (normalize edilmiş) */
export type NotificationView = {
  id: string;
  user_id: string;

  title: string;
  message: string;

  type: NotificationType;

  is_read: boolean;

  created_at: string;
};

// ----------------------------- Requests / Responses -----------------------------

export type NotificationsListParams = {
  is_read?: BoolLike;
  type?: string;

  limit?: number;
  offset?: number;
};

export type UnreadCountResp = { count: number };

export type CreateNotificationBody = {
  /** optional: admin sends to another user; default auth user */
  user_id?: string;
  title: string;
  message: string;
  type: NotificationType;
};

export type UpdateNotificationBody = {
  is_read?: boolean;
};

export type MarkAllReadBody = Record<string, never>;

export type OkResp = { ok: true };

export type PushCampaignTargetSegment =
  | 'all'
  | 'users'
  | 'consultants'
  | 'users_without_booking'
  | 'inactive_7d';

export type PushCampaignView = {
  id: string;
  slug: string;
  title: string;
  body: string;
  target_segment: PushCampaignTargetSegment;
  deep_link: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PushCampaignSendResult = {
  success: boolean;
  campaign_slug: string;
  target_segment: PushCampaignTargetSegment;
  target_count: number;
  sent_count: number;
  failed_count: number;
};

// ----------------------------- Mappers -----------------------------

export const toNotificationsListQuery = (p: NotificationsListParams = {}): Record<string, any> => {
  const out: Record<string, any> = {};

  if (typeof p.is_read !== 'undefined') out.is_read = toBool(p.is_read) ? '1' : '0';
  if (p.type) out.type = p.type;

  if (typeof p.limit === 'number') out.limit = p.limit;
  if (typeof p.offset === 'number') out.offset = p.offset;

  return out;
};

export const toCreateNotificationBody = (b: CreateNotificationBody): Record<string, any> => ({
  ...(b.user_id ? { user_id: b.user_id } : {}),
  title: b.title,
  message: b.message,
  type: b.type,
});

export const toUpdateNotificationBody = (b: UpdateNotificationBody): Record<string, any> => {
  const out: Record<string, any> = {};
  if (typeof b.is_read !== 'undefined') out.is_read = b.is_read;
  return out;
};

export function normalizePushCampaign(row: any): PushCampaignView {
  return {
    id: String(row?.id ?? ''),
    slug: String(row?.slug ?? ''),
    title: String(row?.title ?? ''),
    body: String(row?.body ?? ''),
    target_segment: String(row?.target_segment ?? 'all') as PushCampaignTargetSegment,
    deep_link: row?.deep_link ? String(row.deep_link) : null,
    is_active: toBool(row?.is_active),
    created_at: row?.created_at ? String(row.created_at) : undefined,
    updated_at: row?.updated_at ? String(row.updated_at) : undefined,
  };
}

export function normalizePushCampaignsList(res: unknown): PushCampaignView[] {
  const r = (res ?? {}) as any;
  const rows = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
  return rows.map(normalizePushCampaign);
}
