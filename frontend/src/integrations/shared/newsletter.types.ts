// =============================================================
// FILE: src/integrations/types/newsletter.types.ts
// =============================================================

import { BoolLike } from '@/integrations/shared';

/* ---------- PUBLIC DTO (controller mapRow) ---------- */

export interface NewsletterPublicDto {
  id: string;
  email: string;
  is_verified: boolean;
  locale: string | null;
  meta: any | null;
  created_at: string | Date;
  updated_at: string | Date;
  unsubscribed_at: string | Date | null;
  subscribeDate: string | Date;
  unsubscribeDate: string | Date | null;
}

export interface NewsletterPublic {
  id: string;
  email: string;
  is_verified: boolean;
  locale: string | null;
  meta: any | null;
  created_at: string;
  updated_at: string;
  unsubscribed_at: string | null;
  subscribeDate: string;
  unsubscribeDate: string | null;
}

export const normalizeNewsletterPublic = (dto: NewsletterPublicDto): NewsletterPublic => ({
  id: dto.id,
  email: dto.email,
  is_verified: !!dto.is_verified,
  locale: dto.locale ?? null,
  meta: typeof dto.meta === 'undefined' ? null : dto.meta,
  created_at:
    typeof dto.created_at === 'string' ? dto.created_at : (dto.created_at?.toISOString?.() ?? ''),
  updated_at:
    typeof dto.updated_at === 'string' ? dto.updated_at : (dto.updated_at?.toISOString?.() ?? ''),
  unsubscribed_at:
    dto.unsubscribed_at == null
      ? null
      : typeof dto.unsubscribed_at === 'string'
        ? dto.unsubscribed_at
        : (dto.unsubscribed_at.toISOString?.() ?? null),
  subscribeDate:
    typeof dto.subscribeDate === 'string'
      ? dto.subscribeDate
      : (dto.subscribeDate?.toISOString?.() ?? ''),
  unsubscribeDate:
    dto.unsubscribeDate == null
      ? null
      : typeof dto.unsubscribeDate === 'string'
        ? dto.unsubscribeDate
        : (dto.unsubscribeDate.toISOString?.() ?? null),
});

/* ---------- ADMIN DTO (admin.controller mapRowAdmin) ---------- */

export interface NewsletterAdminDto {
  id: string;
  email: string;
  is_verified: boolean;
  is_subscribed: boolean;
  locale: string | null;
  meta: any | null;
  created_at: string | Date;
  updated_at: string | Date;
  unsubscribed_at: string | Date | null;
}

export interface NewsletterAdmin {
  id: string;
  email: string;
  is_verified: boolean;
  is_subscribed: boolean;
  locale: string | null;
  meta: any | null;
  created_at: string;
  updated_at: string;
  unsubscribed_at: string | null;
}

export const normalizeNewsletterAdmin = (dto: NewsletterAdminDto): NewsletterAdmin => ({
  id: dto.id,
  email: dto.email,
  is_verified: !!dto.is_verified,
  is_subscribed: !!dto.is_subscribed,
  locale: dto.locale ?? null,
  meta: typeof dto.meta === 'undefined' ? null : dto.meta,
  created_at:
    typeof dto.created_at === 'string' ? dto.created_at : (dto.created_at?.toISOString?.() ?? ''),
  updated_at:
    typeof dto.updated_at === 'string' ? dto.updated_at : (dto.updated_at?.toISOString?.() ?? ''),
  unsubscribed_at:
    dto.unsubscribed_at == null
      ? null
      : typeof dto.unsubscribed_at === 'string'
        ? dto.unsubscribed_at
        : (dto.unsubscribed_at.toISOString?.() ?? null),
});

/* ---------- PUBLIC payload tipleri ---------- */

export interface NewsletterSubscribePayload {
  email: string;
  locale?: string;
  meta?: Record<string, any>;
}

export interface NewsletterUnsubscribePayload {
  email: string;
}

/* ---------- ADMIN list query & update payload ---------- */

export type NewsletterOrderBy = 'created_at' | 'updated_at' | 'email' | 'verified' | 'locale';

export interface NewsletterListQueryParams {
  q?: string;
  email?: string;
  verified?: BoolLike;
  subscribed?: BoolLike;
  locale?: string;

  limit?: number;
  offset?: number;
  orderBy?: NewsletterOrderBy;
  order?: 'asc' | 'desc';
}

export interface NewsletterAdminUpdatePayload {
  verified?: BoolLike;
  subscribed?: BoolLike;
  locale?: string | null;
  meta?: Record<string, any> | null;
}
