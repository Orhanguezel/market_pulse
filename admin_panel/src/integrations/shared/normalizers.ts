// src/integrations/shared/normalizers.ts

import {
  NewsletterAdminSubscriber,
  NewsletterPublicSubscriber,
  NotificationType,
  NotificationView,
} from '@/integrations/shared';

import { toBool } from '@/integrations/shared';

// ----------------------------- Helpers -----------------------------

const safeStr = (v: unknown) => String(v ?? '').trim();

const asNullableString = (v: unknown): string | null => {
  const s = safeStr(v);
  return s ? s : null;
};

const asMeta = (v: unknown): Record<string, any> | null => {
  if (!v) return null;
  if (typeof v === 'object' && !Array.isArray(v)) return v as any;
  // tolerate string JSON (in case some endpoints return raw)
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    try {
      const parsed = JSON.parse(s);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as any;
      return null;
    } catch {
      return null;
    }
  }
  return null;
};

// ----------------------------- Normalizers -----------------------------

export const normalizeNewsletterPublicSubscriber = (raw: unknown): NewsletterPublicSubscriber => {
  const r = (raw ?? {}) as any;

  return {
    id: safeStr(r.id),
    email: safeStr(r.email),

    is_verified: toBool(r.is_verified),
    meta: asMeta(r.meta),

    created_at: safeStr(r.created_at),
    updated_at: safeStr(r.updated_at),
    unsubscribed_at: asNullableString(r.unsubscribed_at),

    // backend includes these aliases; keep if present
    ...(typeof r.subscribeDate !== 'undefined' ? { subscribeDate: safeStr(r.subscribeDate) } : {}),
    ...(typeof r.unsubscribeDate !== 'undefined'
      ? { unsubscribeDate: asNullableString(r.unsubscribeDate) }
      : {}),
  };
};

export const normalizeNewsletterAdminSubscriber = (raw: unknown): NewsletterAdminSubscriber => {
  const r = (raw ?? {}) as any;

  return {
    id: safeStr(r.id),
    email: safeStr(r.email),

    is_verified: toBool(r.is_verified),
    is_subscribed: toBool(r.is_subscribed),

    meta: asMeta(r.meta),

    created_at: safeStr(r.created_at),
    updated_at: safeStr(r.updated_at),
    unsubscribed_at: asNullableString(r.unsubscribed_at),
  };
};

export const normalizeNewsletterAdminList = (raw: unknown): NewsletterAdminSubscriber[] =>
  Array.isArray(raw) ? raw.map(normalizeNewsletterAdminSubscriber) : [];

// ----------------------------- Helpers -----------------------------

const asType = (v: unknown): NotificationType => {
  const s = safeStr(v);
  return (s || 'system') as NotificationType;
};

// ----------------------------- Normalizers -----------------------------

export const normalizeNotification = (raw: unknown): NotificationView => {
  const r = (raw ?? {}) as any;

  return {
    id: safeStr(r.id),
    user_id: safeStr(r.user_id),

    title: safeStr(r.title),
    message: String(r.message ?? ''),

    type: asType(r.type),

    is_read: toBool(r.is_read),

    created_at: safeStr(r.created_at),
  };
};

export const normalizeNotificationsList = (raw: unknown): NotificationView[] =>
  Array.isArray(raw) ? raw.map(normalizeNotification) : [];
