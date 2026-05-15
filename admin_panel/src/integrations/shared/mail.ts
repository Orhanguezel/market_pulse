// =============================================================
// FILE: src/integrations/shared/mail.ts
// Mail-related DTOs (SMTP test)
// =============================================================

export type SendTestMailBody = {
  to?: string;
};

export type SendTestMailResponse = {
  ok: true;
};
