// =============================================================
// FILE: src/integrations/types/bookings.types.ts
// =============================================================

export type BookingStatus =
  | 'pending_payment'
  | 'booked'
  | 'new'
  | 'confirmed'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'expired';

/** API: merged booking shape returned by admin list/get */
export interface BookingMergedDto {
  id: string;

  // customer
  name: string;
  email: string;
  phone: string;
  locale: string;

  customer_message: string | null;

  // relations
  service_id: string | null;
  resource_id: string;
  slot_id: string | null;

  appointment_date: string; // YYYY-MM-DD
  appointment_time: string | null; // HH:mm or null

  status: BookingStatus | string;
  is_read: number | boolean;

  admin_note: string | null;
  decided_at: string | Date | null;
  decided_by: string | null;
  decision_note: string | null;

  email_last_sent_at: string | Date | null;
  email_last_template_key: string | null;
  email_last_to: string | null;
  email_last_subject: string | null;
  email_last_error: string | null;

  created_at: string | Date;
  updated_at: string | Date;

  // merged labels
  resource_title: string | null;
  service_title: string | null;
}

/** API: raw booking row (admin create may return this if merged missing) */
export interface BookingDto {
  id: string;

  name: string;
  email: string;
  phone: string;

  locale: string;

  customer_message: string | null;

  service_id: string | null;
  resource_id: string;
  slot_id: string | null;

  appointment_date: string;
  appointment_time: string | null;

  status: BookingStatus | string;
  is_read: number | boolean;

  admin_note: string | null;
  decided_at: string | Date | null;
  decided_by: string | null;
  decision_note: string | null;

  email_last_sent_at: string | Date | null;
  email_last_template_key: string | null;
  email_last_to: string | null;
  email_last_subject: string | null;
  email_last_error: string | null;

  created_at: string | Date;
  updated_at: string | Date;
}

/** UI normalize edilmiş booking (merged) */
export interface BookingMerged {
  id: string;

  name: string;
  email: string;
  phone: string;
  locale: string;

  customer_message: string | null;

  service_id: string | null;
  resource_id: string;
  slot_id: string | null;

  appointment_date: string;
  appointment_time: string | null;

  status: BookingStatus | string;
  is_read: boolean;

  admin_note: string | null;
  decided_at: string | null;
  decided_by: string | null;
  decision_note: string | null;

  email_last_sent_at: string | null;
  email_last_template_key: string | null;
  email_last_to: string | null;
  email_last_subject: string | null;
  email_last_error: string | null;

  created_at: string;
  updated_at: string;

  resource_title: string | null;
  service_title: string | null;
}

function toIso(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  // Date-like
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (v as any)?.toISOString?.();
  return typeof d === 'string' ? d : '';
}

function toNullIso(v: unknown): string | null {
  const s = toIso(v);
  return s ? s : null;
}

function toBool01(v: unknown): boolean {
  if (v === true) return true;
  if (v === false) return false;
  const n = Number(v ?? 0);
  return n === 1;
}

function toStr(v: unknown): string {
  return String(v ?? '').trim();
}

function toNullStr(v: unknown): string | null {
  const s = toStr(v);
  return s ? s : null;
}

/** BookingMergedDto -> BookingMerged */
export const normalizeBookingMerged = (dto: BookingMergedDto): BookingMerged => ({
  id: toStr(dto.id),

  name: toStr(dto.name),
  email: toStr(dto.email),
  phone: toStr(dto.phone),
  locale: toStr(dto.locale) || 'de',

  customer_message: dto.customer_message ? toStr(dto.customer_message) : null,

  service_id: dto.service_id ? toStr(dto.service_id) : null,
  resource_id: toStr(dto.resource_id),
  slot_id: dto.slot_id ? toStr(dto.slot_id) : null,

  appointment_date: toStr(dto.appointment_date),
  appointment_time: dto.appointment_time ? toStr(dto.appointment_time) : null,

  status: toStr(dto.status),
  is_read: toBool01(dto.is_read),

  admin_note: dto.admin_note ? toStr(dto.admin_note) : null,
  decided_at: toNullIso(dto.decided_at),
  decided_by: toNullStr(dto.decided_by),
  decision_note: dto.decision_note ? toStr(dto.decision_note) : null,

  email_last_sent_at: toNullIso(dto.email_last_sent_at),
  email_last_template_key: toNullStr(dto.email_last_template_key),
  email_last_to: toNullStr(dto.email_last_to),
  email_last_subject: toNullStr(dto.email_last_subject),
  email_last_error: dto.email_last_error ? toStr(dto.email_last_error) : null,

  created_at: toIso(dto.created_at),
  updated_at: toIso(dto.updated_at),

  resource_title: dto.resource_title ? toStr(dto.resource_title) : null,
  service_title: dto.service_title ? toStr(dto.service_title) : null,
});

/** BookingDto -> BookingMerged (resource/service titles yoksa null) */
export const normalizeBookingRowToMerged = (dto: BookingDto): BookingMerged => ({
  id: toStr(dto.id),

  name: toStr(dto.name),
  email: toStr(dto.email),
  phone: toStr(dto.phone),
  locale: toStr(dto.locale) || 'de',

  customer_message: dto.customer_message ? toStr(dto.customer_message) : null,

  service_id: dto.service_id ? toStr(dto.service_id) : null,
  resource_id: toStr(dto.resource_id),
  slot_id: dto.slot_id ? toStr(dto.slot_id) : null,

  appointment_date: toStr(dto.appointment_date),
  appointment_time: dto.appointment_time ? toStr(dto.appointment_time) : null,

  status: toStr(dto.status),
  is_read: toBool01(dto.is_read),

  admin_note: dto.admin_note ? toStr(dto.admin_note) : null,
  decided_at: toNullIso(dto.decided_at),
  decided_by: toNullStr(dto.decided_by),
  decision_note: dto.decision_note ? toStr(dto.decision_note) : null,

  email_last_sent_at: toNullIso(dto.email_last_sent_at),
  email_last_template_key: toNullStr(dto.email_last_template_key),
  email_last_to: toNullStr(dto.email_last_to),
  email_last_subject: toNullStr(dto.email_last_subject),
  email_last_error: dto.email_last_error ? toStr(dto.email_last_error) : null,

  created_at: toIso(dto.created_at),
  updated_at: toIso(dto.updated_at),

  resource_title: null,
  service_title: null,
});

/** LIST query params — listBookingsQuerySchema ile uyumlu */
export interface BookingListQueryParams {
  q?: string;
  status?: string;
  is_read?: boolean;

  appointment_date?: string; // YYYY-MM-DD
  appointment_time?: string; // HH:mm

  service_id?: string;
  resource_id?: string;

  locale?: string;

  limit?: number;
  offset?: number;
}

/** PUBLIC create payload — publicCreateBookingSchema ile uyumlu */
export interface BookingPublicCreatePayload {
  locale?: string;

  name: string;
  email: string;
  phone: string;

  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm

  resource_id: string;
  service_id?: string;

  message?: string;

  customer_message?: string;
}

/** PUBLIC create result — controller { ok, id, status } */
export interface BookingPublicCreateResult {
  ok: boolean;
  id: string;
  status: BookingStatus | string;
}

/** ADMIN create payload — adminCreateBookingSchema ile uyumlu */
export interface BookingAdminCreatePayload extends BookingPublicCreatePayload {
  status?: BookingStatus | string;
  is_read?: boolean;
  admin_note?: string;
}

/** ADMIN update payload — adminUpdateBookingSchema ile uyumlu */
export interface BookingAdminUpdatePayload {
  name?: string;
  email?: string;
  phone?: string;

  locale?: string;

  customer_message?: string | null;

  service_id?: string | null;
  resource_id?: string | null;

  appointment_date?: string;
  appointment_time?: string | null;

  status?: BookingStatus | string;
  is_read?: boolean;

  admin_note?: string | null;
  decision_note?: string | null;
}
