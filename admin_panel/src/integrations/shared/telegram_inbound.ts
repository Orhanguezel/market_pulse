// ===================================================================
// FILE: src/integrations/shared/telegram_inbound.ts
// Telegram inbound + auto-reply types
// ===================================================================

export type TelegramInboundMessage = {
  id: string;

  update_id: number;
  message_id: number | null;

  chat_id: string;
  chat_type: string | null;
  chat_title: string | null;
  chat_username: string | null;

  from_id: string | null;
  from_username: string | null;
  from_first_name: string | null;
  from_last_name: string | null;
  from_is_bot: boolean;

  text: string | null;
  telegram_date: number | null;

  created_at: string; // ISO
};

export type TelegramInboundListParams = {
  chat_id?: string;
  q?: string;
  limit?: number;
  cursor?: string;
};

export type TelegramInboundListResult = {
  items: TelegramInboundMessage[];
  next_cursor?: string | null;
};

export type TelegramAutoReplyMode = 'simple' | 'ai';

export type TelegramAutoReplyConfig = {
  enabled: boolean;
  mode: TelegramAutoReplyMode;
  template: string;
};

export type TelegramAutoReplyUpdateBody = {
  enabled?: boolean;
  mode?: TelegramAutoReplyMode;
  template?: string;
};
