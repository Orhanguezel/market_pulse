// ===================================================================
// FILE: src/integrations/shared/newsletter.ts
// FINAL — Newsletter types + normalizers (Single Language)
// Backend aligned with:
// PUBLIC:
// - POST /newsletter/subscribe        -> returns mapped row (created/updated)
// - POST /newsletter/unsubscribe      -> { ok: true }
// ADMIN:
// - GET    /admin/newsletter          -> array of admin mapped rows + headers: x-total-count
// - GET    /admin/newsletter/:id      -> admin mapped row
// - PATCH  /admin/newsletter/:id      -> admin mapped row
// - DELETE /admin/newsletter/:id      -> 204
// Notes:
// - meta stored as JSON string in DB, backend returns meta parsed (object|null)
// - is_verified boolean in backend outputs
// - is_subscribed only exists in admin outputs
// ===================================================================

import type { BoolLike } from '@/integrations/shared';
import { toBool } from '@/integrations/shared';
// ----------------------------- Public Types -----------------------------

export type NewsletterPublicSubscribeBody = {
  email: string;
  meta?: Record<string, any>;
};

export type NewsletterPublicUnsubscribeBody = {
  email: string;
};

export type NewsletterPublicSubscriber = {
  id: string;
  email: string;

  is_verified: boolean;
  meta: Record<string, any> | null;

  created_at: string;
  updated_at: string;
  unsubscribed_at: string | null;

  // legacy-ish aliases (backend sends)
  subscribeDate?: string;
  unsubscribeDate?: string | null;
};

export type NewsletterUnsubscribeResp = { ok: true };

// ----------------------------- Admin Types -----------------------------

export type NewsletterAdminListParams = {
  q?: string; // email search
  email?: string;
  verified?: BoolLike; // is_verified
  subscribed?: BoolLike; // unsubscribed_at NULL / NOT NULL

  limit?: number;
  offset?: number;

  orderBy?: 'created_at' | 'updated_at' | 'email' | 'verified';
  order?: 'asc' | 'desc';
};

export type NewsletterAdminUpdateBody = {
  verified?: BoolLike;
  subscribed?: BoolLike; // true => active (unsubscribed_at null), false => unsubscribed_at now
  meta?: Record<string, any> | null;
};

export type NewsletterAdminSubscriber = {
  id: string;
  email: string;

  is_verified: boolean;
  is_subscribed: boolean;

  meta: Record<string, any> | null;

  created_at: string;
  updated_at: string;
  unsubscribed_at: string | null;
};

export type NewsletterAdminListResp = {
  data: NewsletterAdminSubscriber[];
  meta: { total: number | null; limit: number | null; offset: number | null };
};

// ----------------------------- Query/Body Mappers -----------------------------

/**
 * Map admin list params to backend query.
 * Backend accepts verified/subscribed as boolLike, but we send 1/0 for stability.
 */
export const toNewsletterAdminListQuery = (
  p: NewsletterAdminListParams = {},
): Record<string, any> => {
  const out: Record<string, any> = {};

  if (p.q) out.q = p.q;
  if (p.email) out.email = p.email;

  if (typeof p.verified !== 'undefined') out.verified = toBool(p.verified) ? '1' : '0';
  if (typeof p.subscribed !== 'undefined') out.subscribed = toBool(p.subscribed) ? '1' : '0';

  if (typeof p.limit !== 'undefined') out.limit = p.limit;
  if (typeof p.offset !== 'undefined') out.offset = p.offset;

  if (p.orderBy) out.orderBy = p.orderBy;
  if (p.order) out.order = p.order;

  return out;
};

/**
 * Admin update body mapper.
 * Backend accepts boolLike; we send booleans for stability.
 */
export const toNewsletterAdminUpdateBody = (b: NewsletterAdminUpdateBody): Record<string, any> => {
  const out: Record<string, any> = {};

  if (typeof b.verified !== 'undefined') out.verified = toBool(b.verified);
  if (typeof b.subscribed !== 'undefined') out.subscribed = toBool(b.subscribed);
  if (typeof b.meta !== 'undefined') out.meta = b.meta;

  return out;
};

/**
 * Public subscribe body mapper:
 * normalize email on client side is optional; backend already normalizes toLowerCase.
 */
export const toNewsletterSubscribeBody = (
  b: NewsletterPublicSubscribeBody,
): Record<string, any> => ({
  email: b.email,
  ...(typeof b.meta !== 'undefined' ? { meta: b.meta } : {}),
});

export const toNewsletterUnsubscribeBody = (
  b: NewsletterPublicUnsubscribeBody,
): Record<string, any> => ({
  email: b.email,
});
