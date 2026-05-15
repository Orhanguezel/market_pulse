import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  OrderView,
  OrderDetailView,
  PaymentGatewayPublic,
} from '@/integrations/shared';

const BASE = '/orders';

export const ordersPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listMyOrders: build.query<OrderView[], void>({
      query: () => ({ url: BASE, method: 'GET' }),
      providesTags: ['Profile'],
    }),

    getMyOrder: build.query<OrderDetailView, { id: string }>({
      query: ({ id }) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      providesTags: ['Profile'],
    }),

    listPaymentGateways: build.query<PaymentGatewayPublic[], void>({
      query: () => ({ url: `${BASE}/gateways`, method: 'GET' }),
    }),

    createForBooking: build.mutation<
      { success: boolean; order_id: string; order_number: string },
      { booking_id: string; payment_gateway_slug: string }
    >({
      query: (body) => ({ url: BASE, method: 'POST', body }),
    }),

    initIyzicoPayment: build.mutation<
      { success: boolean; checkout_url: string; token: string },
      { orderId: string; locale?: string }
    >({
      query: ({ orderId, locale }) => ({
        url: `${BASE}/${encodeURIComponent(orderId)}/init-iyzico`,
        method: 'POST',
        params: locale ? { locale } : undefined,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListMyOrdersQuery,
  useGetMyOrderQuery,
  useListPaymentGatewaysQuery,
  useCreateForBookingMutation,
  useInitIyzicoPaymentMutation,
} = ordersPublicApi;
