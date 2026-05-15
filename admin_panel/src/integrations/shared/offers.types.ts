// ===================================================================
// FILE: src/integrations/shared/offers.ts
// FINAL — Offers types + normalizers (Single Language, Service-only)
// Backend routes:
// PUBLIC:
// - POST   /offers
//
// ADMIN (auth+admin):
// - GET    /offers
// - GET    /offers/:id
// - POST   /offers
// - PATCH  /offers/:id
// - DELETE /offers/:id
// - POST   /offers/:id/pdf
// - POST   /offers/:id/email
// - POST   /offers/:id/send
// ===================================================================

import type { BoolLike } from '@/integrations/shared';
import { toBool, toNumber, parseJsonObject } from '@/integrations/shared';

export const OFFER_STATUSES = [
  'new',
  'in_review',
  'quoted',
  'sent',
  'accepted',
  'rejected',
  'cancelled',
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export type OfferListQuery = {
  // ordering
  order?: string; // e.g. created_at.desc
  sort?: 'created_at' | 'updated_at';
  orderDir?: 'asc' | 'desc';

  limit?: number;
  offset?: number;

  status?: OfferStatus;

  country_code?: string;
  q?: string;
  email?: string;
  service_id?: string;

  created_from?: string;
  created_to?: string;
};

export type OfferPublicCreateBody = {
  country_code?: string;

  customer_name: string;
  company_name?: string | null;

  email: string;
  phone?: string | null;

  subject?: string | null;
  message?: string | null;

  service_id?: string | null;

  // UI convenience; backend ignores for public if service_id exists (sets from DB)
  service_title?: string | null;

  form_data?: Record<string, any>;

  consent_marketing?: BoolLike;
  consent_terms?: BoolLike;
};

export type OfferAdminUpsertBody = OfferPublicCreateBody & {
  status?: OfferStatus;

  currency?: string; // default TRY (admin) / schema default EUR but controller sends TRY
  net_total?: number | string | null;
  vat_rate?: number | string | null;
  vat_total?: number | string | null;
  shipping_total?: number | string | null;
  gross_total?: number | string | null;

  offer_no?: string | null;
  valid_until?: string | null; // ISO

  admin_notes?: string | null;

  pdf_url?: string | null;
  pdf_asset_id?: string | null;

  email_sent_at?: string | null; // ISO
};

export type OfferAdminPatchBody = Partial<OfferAdminUpsertBody>;

export type OfferRowRaw = {
  id: string;
  offer_no?: string | null;
  status: string;

  country_code?: string | null;

  customer_name: string;
  company_name?: string | null;
  email: string;
  phone?: string | null;

  subject?: string | null;
  message?: string | null;

  service_id?: string | null;
  service_title?: string | null;

  form_data?: string | Record<string, unknown> | null;
  form_data_parsed?: Record<string, unknown> | null;

  consent_marketing?: number | boolean | null;
  consent_terms?: number | boolean | null;

  currency?: string | null;
  net_total?: number | string | null;
  vat_rate?: number | string | null;
  vat_total?: number | string | null;
  shipping_total?: number | string | null;
  gross_total?: number | string | null;

  valid_until?: string | Date | null;

  admin_notes?: string | null;

  pdf_url?: string | null;
  pdf_asset_id?: string | null;

  email_sent_at?: string | Date | null;

  created_at: string | Date;
  updated_at: string | Date;
};

export type OfferView = {
  id: string;
  offer_no: string | null;
  status: OfferStatus;

  country_code: string | null;

  customer_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;

  subject: string | null;
  message: string | null;

  service_id: string | null;
  service_title: string | null;

  form_data: Record<string, any> | null;

  consent_marketing: boolean;
  consent_terms: boolean;

  currency: string | null;
  net_total: number | null;
  vat_rate: number | null;
  vat_total: number | null;
  shipping_total: number | null;
  gross_total: number | null;

  valid_until: string | null;

  admin_notes: string | null;

  pdf_url: string | null;
  pdf_asset_id: string | null;

  email_sent_at: string | null;

  created_at: string;
  updated_at: string;
};

export type OfferAdminSendResult = OfferView; // controller returns final row

// ----------------------------- helpers -----------------------------

const s = (v: unknown) => String(v ?? '').trim();

export const toStatus = (v: unknown): OfferStatus => {
  const x = s(v) as OfferStatus;
  return (OFFER_STATUSES as readonly string[]).includes(x) ? x : 'new';
};

export const toIso = (v: unknown): string | null => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  const x = s(v);
  return x || null;
};

export const normalizeOffer = (raw: unknown): OfferView => {
  const r = (raw ?? {}) as OfferRowRaw;

  // repository list returns form_data_parsed; getOffer returns also parsed
  const formObj = parseJsonObject(r.form_data_parsed ?? r.form_data ?? null);

  return {
    id: s(r.id),
    offer_no: (r.offer_no ?? null) ? s(r.offer_no) : null,
    status: toStatus(r.status),

    country_code: (r.country_code ?? null) ? s(r.country_code) : null,

    customer_name: s(r.customer_name),
    company_name: r.company_name == null ? null : s(r.company_name),
    email: s(r.email),
    phone: r.phone == null ? null : s(r.phone),

    subject: r.subject == null ? null : s(r.subject),
    message: r.message == null ? null : String(r.message ?? ''),

    service_id: r.service_id == null ? null : s(r.service_id),
    service_title: r.service_title == null ? null : s(r.service_title),

    form_data: formObj,

    consent_marketing: toBool(r.consent_marketing),
    consent_terms: toBool(r.consent_terms),

    currency: r.currency == null ? null : s(r.currency),
    net_total: toNumber(r.net_total),
    vat_rate: toNumber(r.vat_rate),
    vat_total: toNumber(r.vat_total),
    shipping_total: toNumber(r.shipping_total),
    gross_total: toNumber(r.gross_total),

    valid_until: toIso(r.valid_until),

    admin_notes: r.admin_notes == null ? null : String(r.admin_notes ?? ''),

    pdf_url: r.pdf_url == null ? null : s(r.pdf_url),
    pdf_asset_id: r.pdf_asset_id == null ? null : s(r.pdf_asset_id),

    email_sent_at: toIso(r.email_sent_at),

    created_at: toIso(r.created_at) ?? '',
    updated_at: toIso(r.updated_at) ?? '',
  };
};

export const normalizeOfferList = (raw: unknown): OfferView[] =>
  Array.isArray(raw) ? raw.map(normalizeOffer) : [];

// ----------------------------- request mappers -----------------------------

export const toOfferListQueryParams = (q: OfferListQuery = {}): Record<string, any> => {
  const out: Record<string, any> = {};

  if (q.order) out.order = q.order;
  if (q.sort) out.sort = q.sort;
  if (q.orderDir) out.orderDir = q.orderDir;

  if (typeof q.limit === 'number') out.limit = q.limit;
  if (typeof q.offset === 'number') out.offset = q.offset;

  if (q.status) out.status = q.status;

  if (q.country_code) out.country_code = q.country_code;
  if (q.q) out.q = q.q;
  if (q.email) out.email = q.email;
  if (q.service_id) out.service_id = q.service_id;

  if (q.created_from) out.created_from = q.created_from;
  if (q.created_to) out.created_to = q.created_to;

  return out;
};

export const toOfferPublicCreateBody = (b: OfferPublicCreateBody): Record<string, any> => ({
  ...(b.country_code ? { country_code: b.country_code } : {}),
  customer_name: b.customer_name,
  company_name: b.company_name ?? null,
  email: b.email,
  phone: b.phone ?? null,
  subject: b.subject ?? null,
  message: b.message ?? null,
  service_id: b.service_id ?? null,
  service_title: b.service_title ?? null,
  form_data: b.form_data ?? {},
  ...(typeof b.consent_marketing !== 'undefined' ? { consent_marketing: b.consent_marketing } : {}),
  ...(typeof b.consent_terms !== 'undefined' ? { consent_terms: b.consent_terms } : {}),
});

export const toOfferAdminUpsertBody = (b: OfferAdminUpsertBody): Record<string, any> => ({
  ...toOfferPublicCreateBody(b),
  ...(b.status ? { status: b.status } : {}),
  ...(b.currency ? { currency: b.currency } : {}),
  ...(typeof b.net_total !== 'undefined' ? { net_total: b.net_total } : {}),
  ...(typeof b.vat_rate !== 'undefined' ? { vat_rate: b.vat_rate } : {}),
  ...(typeof b.vat_total !== 'undefined' ? { vat_total: b.vat_total } : {}),
  ...(typeof b.shipping_total !== 'undefined' ? { shipping_total: b.shipping_total } : {}),
  ...(typeof b.gross_total !== 'undefined' ? { gross_total: b.gross_total } : {}),
  ...(typeof b.offer_no !== 'undefined' ? { offer_no: b.offer_no } : {}),
  ...(typeof b.valid_until !== 'undefined' ? { valid_until: b.valid_until } : {}),
  ...(typeof b.admin_notes !== 'undefined' ? { admin_notes: b.admin_notes } : {}),
  ...(typeof b.pdf_url !== 'undefined' ? { pdf_url: b.pdf_url } : {}),
  ...(typeof b.pdf_asset_id !== 'undefined' ? { pdf_asset_id: b.pdf_asset_id } : {}),
  ...(typeof b.email_sent_at !== 'undefined' ? { email_sent_at: b.email_sent_at } : {}),
});

export const toOfferAdminPatchBody = (b: OfferAdminPatchBody): Record<string, any> =>
  toOfferAdminUpsertBody(b as any);

// ----------------------------- meta/header helpers -----------------------------

export type ListMeta = {
  total: number | null;
  contentRange: string | null;
};

export const readListMeta = (meta: any): ListMeta => {
  const headers = meta?.response?.headers;
  const totalRaw = headers?.get?.('x-total-count') ?? headers?.get?.('X-Total-Count') ?? null;
  const cr = headers?.get?.('content-range') ?? headers?.get?.('Content-Range') ?? null;
  const total = totalRaw != null ? Number(totalRaw) : NaN;
  return {
    total: Number.isFinite(total) ? total : null,
    contentRange: cr ? String(cr) : null,
  };
};
