// =============================================================
// FILE: src/integrations/types/mail.types.ts
// – Mail DTO & Payload Tipleri
// =============================================================

/**
 * Genel mail gönderim payload'ı
 *  POST /mail/send
 */
export interface SendMailPayload {
  to: string;
  subject: string;
  text?: string | null;
  html?: string | null;
}

/**
 * SMTP test mail payload'ı
 *  POST /mail/test
 *  - boş body de gönderebilirsin → backend user.email'den dolduruyor
 */
export interface SendTestMailPayload {
  to?: string;
}

/**
 * Sipariş oluşturma mail payload'ı
 *  POST /mail/order-created
 *  - email_templates → "order_received" şablonuna uygun
 */
export interface OrderCreatedMailPayload {
  to: string;
  customer_name: string;
  order_number: string;
  final_amount: string; // "199.90" gibi
  status: string; // "pending" | "processing" | ...
  site_name?: string;
  locale?: string;
}

/**
 * /mail/* handler'larının ortak response'u
 *  - sendTestMail → { ok: true }
 *  - sendMailHandler → { ok: true }
 *  - sendOrderCreatedMailHandler → { ok: true }
 */
export interface MailOkResponse {
  ok: boolean;
}
