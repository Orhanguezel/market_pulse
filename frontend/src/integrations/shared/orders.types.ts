// Orders public types

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
export type OrderPaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';

export type OrderView = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  total_amount: string;
  currency: string;
  transaction_id: string | null;
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

export type OrderDetailView = OrderView & {
  items: OrderItemView[];
};

export type PaymentGatewayPublic = {
  id: string;
  name: string;
  slug: string;
  is_test_mode: boolean;
};
