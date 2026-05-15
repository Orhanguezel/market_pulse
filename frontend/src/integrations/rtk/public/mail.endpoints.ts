// =============================================================
// FILE: src/integrations/rtk/endpoints/mail.endpoints.ts
// – Mail RTK Query Endpoints
//  - POST /mail/test
//  - POST /mail/send
//  - POST /mail/order-created
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  SendMailPayload,
  SendTestMailPayload,
  OrderCreatedMailPayload,
  MailOkResponse,
} from '@/integrations/shared';

export const mailApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * SMTP test maili
     *  - POST /mail/test
     *  - Body opsiyonel, boş gönderirsen backend req.user.email'i kullanır
     */
    sendTestMail: build.mutation<MailOkResponse, void | SendTestMailPayload>({
      query: (body) => ({
        url: '/mail/test',
        method: 'POST',
        body: body ?? {},
      }),
    }),

    /**
     * Genel amaçlı mail gönderimi
     *  - POST /mail/send
     *  - Sadece admin / panel tarafında kullanılacak
     */
    sendMail: build.mutation<MailOkResponse, SendMailPayload>({
      query: (body) => ({
        url: '/mail/send',
        method: 'POST',
        body,
      }),
    }),

    /**
     * Sipariş oluşturma maili
     *  - POST /mail/order-created
     *  - email_templates → "order_received" template'ini kullanır
     */
    sendOrderCreatedMail: build.mutation<MailOkResponse, OrderCreatedMailPayload>({
      query: (body) => ({
        url: '/mail/order-created',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useSendTestMailMutation, useSendMailMutation, useSendOrderCreatedMailMutation } =
  mailApi;
