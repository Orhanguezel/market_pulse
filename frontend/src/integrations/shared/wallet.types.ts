export type WalletStatus = 'active' | 'suspended' | 'closed';
export type WalletPaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type WalletPaymentMethod = 'paypal' | 'bank_transfer' | 'admin_manual';
export type WalletTxType = 'credit' | 'debit';

export type WalletDto = {
  id: string;
  user_id: string;
  balance: string;
  total_earnings: string;
  total_withdrawn: string;
  currency: string;
  status: WalletStatus;
  created_at: string;
  updated_at: string;
};

export type WalletTransactionDto = {
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
  created_at: string;
  updated_at: string;
};

export type WalletTransactionsResp = {
  data: WalletTransactionDto[];
  page: number;
  limit: number;
};

export type WalletDepositMethodsResp = {
  paypal: {
    enabled: boolean;
    mode: 'sandbox' | 'live' | string;
  };
  bank_transfer: {
    enabled: boolean;
    account_name: string | null;
    iban: string | null;
    bank_name: string | null;
    branch: string | null;
    swift: string | null;
  };
};

export type WalletCreateDepositBody = {
  amount: number;
  currency?: string;
  payment_method: 'paypal' | 'bank_transfer';
  description?: string;
  return_url?: string;
  cancel_url?: string;
  bank_transfer_reference?: string;
};

export type WalletCreateDepositResp = {
  success: boolean;
  transaction_id: string;
  payment_method: 'paypal' | 'bank_transfer';
  payment_status: WalletPaymentStatus;
  paypal?: {
    order_id: string;
    approve_url: string;
  };
  bank_transfer?: WalletDepositMethodsResp['bank_transfer'];
};
