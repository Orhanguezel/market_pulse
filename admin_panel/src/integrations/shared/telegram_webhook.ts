// ===================================================================
// FILE: src/integrations/shared/telegram_webhook.ts
// Telegram webhook types
// ===================================================================

export type TelegramWebhookResponse = {
  ok: true;
};

export type TelegramUpdate = {
  update_id: number;

  message?: {
    message_id?: number;
    date?: number;
    text?: string;
    chat: {
      id: number | string;
      type?: string;
      title?: string;
      username?: string;
    };
    from?: {
      id?: number | string;
      is_bot?: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };

  edited_message?: TelegramUpdate['message'];

  callback_query?: {
    id?: string;
    data?: string;
    message?: TelegramUpdate['message'];
    from?: TelegramUpdate['message'] extends { from?: infer F } ? F : unknown;
  };
};
