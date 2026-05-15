import type { BoolLike } from '@/integrations/shared';
import { toBool } from '@/integrations/shared';

export type WalletStatus = 'active' | 'suspended' | 'closed';
export type WalletTxType = 'credit' | 'debit';
export type WalletPaymentMethod = 'paypal' | 'bank_transfer' | 'admin_manual';
export type WalletPaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type WalletAdminView = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  balance: string;
  total_earnings: string;
  total_withdrawn: string;
  currency: string;
  status: WalletStatus;
  created_at: string | null;
  updated_at: string | null;
};

export type WalletTransactionView = {
  id: string;
  wallet_id: string;
  user_id: string;
  type: WalletTxType;
  amount: string;
  currency: string;
  purpose: string;
  description: string | null;
  payment_method: WalletPaymentMethod;
  payment_status: WalletPaymentStatus;
  transaction_ref: string | null;
  provider_order_id: string | null;
  provider_capture_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  is_admin_created: boolean;
  created_at: string | null;
  user_email?: string | null;
  user_full_name?: string | null;
};

export type WalletListResp = {
  data: WalletAdminView[];
  page: number;
  limit: number;
  total: number;
};

export type WalletTxListResp = {
  data: WalletTransactionView[];
  page: number;
  limit: number;
  total?: number;
};

export type WalletDepositsListQuery = {
  payment_status?: WalletPaymentStatus;
  payment_method?: WalletPaymentMethod;
  user_id?: string;
  page?: number;
  limit?: number;
};

export type WalletAdjustBody = {
  user_id: string;
  type: WalletTxType;
  amount: number;
  purpose: string;
  description?: string;
  payment_status?: WalletPaymentStatus;
};

export type WalletPatchStatusBody = {
  status: WalletStatus;
};

export type WalletPatchTransactionStatusBody = {
  payment_status: WalletPaymentStatus;
};

export type WalletRejectDepositBody = {
  reason?: string;
};

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

function toWalletStatus(v: unknown): WalletStatus {
  const s = toStr(v);
  if (s === 'suspended' || s === 'closed') return s;
  return 'active';
}

function toWalletTxType(v: unknown): WalletTxType {
  const s = toStr(v);
  if (s === 'debit') return 'debit';
  return 'credit';
}

function toWalletMethod(v: unknown): WalletPaymentMethod {
  const s = toStr(v);
  if (s === 'paypal' || s === 'bank_transfer' || s === 'admin_manual') return s;
  return 'admin_manual';
}

function toWalletPayStatus(v: unknown): WalletPaymentStatus {
  const s = toStr(v);
  if (s === 'completed' || s === 'failed' || s === 'refunded') return s;
  return 'pending';
}

export function normalizeWalletAdmin(raw: unknown): WalletAdminView {
  const r = (raw ?? {}) as Record<string, unknown>;

  return {
    id: toStr(r.id),
    user_id: toStr(r.user_id),
    email: toNullableStr(r.email),
    full_name: toNullableStr(r.full_name),
    balance: toStr(r.balance || '0.00') || '0.00',
    total_earnings: toStr(r.total_earnings || '0.00') || '0.00',
    total_withdrawn: toStr(r.total_withdrawn || '0.00') || '0.00',
    currency: toStr(r.currency || 'EUR') || 'EUR',
    status: toWalletStatus(r.status),
    created_at: toNullableStr(r.created_at),
    updated_at: toNullableStr(r.updated_at),
  };
}

export function normalizeWalletTransaction(raw: unknown): WalletTransactionView {
  const r = (raw ?? {}) as Record<string, unknown>;

  return {
    id: toStr(r.id),
    wallet_id: toStr(r.wallet_id),
    user_id: toStr(r.user_id),
    type: toWalletTxType(r.type),
    amount: toStr(r.amount || '0.00') || '0.00',
    currency: toStr(r.currency || 'EUR') || 'EUR',
    purpose: toStr(r.purpose || ''),
    description: toNullableStr(r.description),
    payment_method: toWalletMethod(r.payment_method),
    payment_status: toWalletPayStatus(r.payment_status),
    transaction_ref: toNullableStr(r.transaction_ref),
    provider_order_id: toNullableStr(r.provider_order_id),
    provider_capture_id: toNullableStr(r.provider_capture_id),
    approved_by: toNullableStr(r.approved_by),
    approved_at: toNullableStr(r.approved_at),
    is_admin_created: toBool(r.is_admin_created),
    created_at: toNullableStr(r.created_at),
    user_email: toNullableStr(r.user_email),
    user_full_name: toNullableStr(r.user_full_name),
  };
}

export function normalizeWalletListResp(raw: unknown): WalletListResp {
  const r = (raw ?? {}) as Record<string, unknown>;
  const data = Array.isArray(r.data) ? r.data.map(normalizeWalletAdmin) : [];

  return {
    data,
    page: toNum(r.page, 1),
    limit: toNum(r.limit, data.length || 20),
    total: toNum(r.total, data.length),
  };
}

export function normalizeWalletTxListResp(raw: unknown): WalletTxListResp {
  const r = (raw ?? {}) as Record<string, unknown>;
  const data = Array.isArray(r.data) ? r.data.map(normalizeWalletTransaction) : [];

  return {
    data,
    page: toNum(r.page, 1),
    limit: toNum(r.limit, data.length || 20),
    total: typeof r.total !== 'undefined' ? toNum(r.total, data.length) : undefined,
  };
}

export function toWalletDepositsListQuery(q: WalletDepositsListQuery): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (q.payment_status) out.payment_status = q.payment_status;
  if (q.payment_method) out.payment_method = q.payment_method;
  if (q.user_id) out.user_id = q.user_id;
  if (typeof q.page === 'number') out.page = q.page;
  if (typeof q.limit === 'number') out.limit = q.limit;
  return out;
}
