// =============================================================
// FILE: src/integrations/shared/orders.ts
// Orders admin types + normalizers
// =============================================================

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';

export type OrderAdminView = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: string;
  currency: string;
  transaction_id: string | null;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  order_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type OrderItemView = {
  id: string;
  order_id: string;
  item_type: string;
  item_ref_id: string | null;
  title: string;
  quantity: number;
  price: string;
  currency: string;
  options: string | null;
  created_at: string | null;
};

export type PaymentView = {
  id: string;
  order_id: string;
  gateway_id: string;
  transaction_id: string | null;
  amount: string;
  currency: string;
  status: string;
  raw_response: string | null;
  created_at: string | null;
};

export type OrderAdminDetailView = OrderAdminView & {
  items: OrderItemView[];
  payments: PaymentView[];
};

export type OrdersListResp = {
  data: OrderAdminView[];
  page: number;
  limit: number;
  total: number;
};

export type OrdersListQuery = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  q?: string;
};

export type OrderUpdateBody = {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  admin_note?: string;
};

export type PaymentGatewayView = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_test_mode: boolean;
  config: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PaymentGatewayCreateBody = {
  name: string;
  slug: string;
  is_active?: number;
  is_test_mode?: number;
  config?: Record<string, unknown>;
};

export type PaymentGatewayUpdateBody = {
  name?: string;
  is_active?: number;
  is_test_mode?: number;
  config?: Record<string, unknown> | null;
};

// --- Normalizers ---

function toStr(v: unknown) {
  return String(v ?? '').trim();
}

function toNullableStr(v: unknown) {
  const s = toStr(v);
  return s ? s : null;
}

function toNum(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 1 || v === '1' || v === 'true') return true;
  return false;
}

function toOrderStatus(v: unknown): OrderStatus {
  const s = toStr(v);
  if (['processing', 'completed', 'cancelled', 'refunded'].includes(s)) return s as OrderStatus;
  return 'pending';
}

function toPaymentStatus(v: unknown): PaymentStatus {
  const s = toStr(v);
  if (['paid', 'failed', 'refunded'].includes(s)) return s as PaymentStatus;
  return 'unpaid';
}

export function normalizeOrderAdmin(raw: unknown): OrderAdminView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: toStr(r.id),
    order_number: toStr(r.order_number),
    status: toOrderStatus(r.status),
    payment_status: toPaymentStatus(r.payment_status),
    total_amount: toStr(r.total_amount || '0.00') || '0.00',
    currency: toStr(r.currency || 'EUR') || 'EUR',
    transaction_id: toNullableStr(r.transaction_id),
    user_id: toStr(r.user_id),
    user_email: toNullableStr(r.user_email),
    user_name: toNullableStr(r.user_name),
    order_notes: toNullableStr(r.order_notes),
    created_at: toNullableStr(r.created_at),
    updated_at: toNullableStr(r.updated_at),
  };
}

function normalizeOrderItem(raw: unknown): OrderItemView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: toStr(r.id),
    order_id: toStr(r.order_id),
    item_type: toStr(r.item_type || 'service'),
    item_ref_id: toNullableStr(r.item_ref_id),
    title: toStr(r.title),
    quantity: toNum(r.quantity, 1),
    price: toStr(r.price || '0.00') || '0.00',
    currency: toStr(r.currency || 'EUR') || 'EUR',
    options: toNullableStr(r.options),
    created_at: toNullableStr(r.created_at),
  };
}

function normalizePayment(raw: unknown): PaymentView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: toStr(r.id),
    order_id: toStr(r.order_id),
    gateway_id: toStr(r.gateway_id),
    transaction_id: toNullableStr(r.transaction_id),
    amount: toStr(r.amount || '0.00') || '0.00',
    currency: toStr(r.currency || 'EUR') || 'EUR',
    status: toStr(r.status),
    raw_response: toNullableStr(r.raw_response),
    created_at: toNullableStr(r.created_at),
  };
}

export function normalizeOrderAdminDetail(raw: unknown): OrderAdminDetailView {
  const r = (raw ?? {}) as Record<string, unknown>;
  const base = normalizeOrderAdmin(r);
  const items = Array.isArray(r.items) ? r.items.map(normalizeOrderItem) : [];
  const payments = Array.isArray(r.payments) ? r.payments.map(normalizePayment) : [];
  return { ...base, items, payments };
}

export function normalizeOrdersListResp(raw: unknown): OrdersListResp {
  const r = (raw ?? {}) as Record<string, unknown>;
  const data = Array.isArray(r.data) ? r.data.map(normalizeOrderAdmin) : [];
  return {
    data,
    page: toNum(r.page, 1),
    limit: toNum(r.limit, data.length || 20),
    total: toNum(r.total, data.length),
  };
}

export function normalizePaymentGateway(raw: unknown): PaymentGatewayView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: toStr(r.id),
    name: toStr(r.name),
    slug: toStr(r.slug),
    is_active: toBool(r.is_active),
    is_test_mode: toBool(r.is_test_mode),
    config: toNullableStr(r.config),
    created_at: toNullableStr(r.created_at),
    updated_at: toNullableStr(r.updated_at),
  };
}

export function toOrdersListQuery(q: OrdersListQuery): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (q.status) out.status = q.status;
  if (q.payment_status) out.payment_status = q.payment_status;
  if (q.q) out.q = q.q;
  if (typeof q.page === 'number') out.page = q.page;
  if (typeof q.limit === 'number') out.limit = q.limit;
  return out;
}
