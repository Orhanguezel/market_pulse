// ===================================================================
// FILE: src/integrations/shared/chat.ts
// Chat module types
// ===================================================================

// ─── Enums ──────────────────────────────────────────────────

export type ChatContextType = 'job' | 'request';
export type ChatRole = 'buyer' | 'vendor' | 'admin';
export type ChatHandoffMode = 'ai' | 'admin';
export type ChatAiProvider = 'auto' | 'openai' | 'anthropic' | 'grok';

// ─── Entities ───────────────────────────────────────────────

export interface ChatThread {
  id: string;
  context_type: ChatContextType;
  context_id: string;
  handoff_mode: ChatHandoffMode;
  ai_provider_preference: ChatAiProvider;
  preferred_locale: string | null;
  assigned_admin_user_id: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatParticipant {
  id: string;
  thread_id: string;
  user_id: string;
  role: ChatRole;
  joined_at: string;
  last_read_at: string | null;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_user_id: string;
  client_id: string | null;
  text: string;
  created_at: string;
}

export interface ChatAiKnowledgeItem {
  id: string;
  locale: string;
  title: string;
  content: string;
  tags: string | null;
  is_active: number;
  priority: number;
  created_at: string;
  updated_at: string;
}

// ─── Request types ──────────────────────────────────────────

export interface ChatListThreadsParams {
  context_type?: ChatContextType;
  context_id?: string;
  handoff_mode?: ChatHandoffMode;
  limit?: number;
  offset?: number;
}

export interface ChatListMessagesParams {
  limit?: number;
  before?: string;
}

export interface ChatPostMessageBody {
  text: string;
  client_id?: string;
}

export interface ChatAdminTakeoverBody {
  admin_user_id?: string;
}

export interface ChatAdminReleaseToAiBody {
  provider?: ChatAiProvider;
}

export interface ChatAdminSetAiProviderBody {
  provider: ChatAiProvider;
}

export interface ChatAiKnowledgeListParams {
  locale?: string;
  is_active?: 0 | 1;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface ChatAiKnowledgeCreateBody {
  locale: string;
  title: string;
  content: string;
  tags?: string | null;
  priority?: number;
  is_active?: number;
}

export interface ChatAiKnowledgeUpdateBody {
  locale?: string;
  title?: string;
  content?: string;
  tags?: string | null;
  priority?: number;
  is_active?: number;
}

// ─── Response types ─────────────────────────────────────────

export interface ChatThreadsResponse {
  items: ChatThread[];
}

export interface ChatMessagesResponse {
  items: ChatMessage[];
}

export interface ChatThreadResponse {
  thread: ChatThread;
}

export interface ChatMessageResponse {
  message: ChatMessage;
}

export interface ChatAiKnowledgeListResponse {
  items: ChatAiKnowledgeItem[];
}

// ─── WebSocket types ────────────────────────────────────────

export type ChatWsServerEvent =
  | { type: 'hello'; thread_id: string }
  | { type: 'message'; message: ChatMessage }
  | { type: 'ack'; client_id: string; message_id: string; created_at: string }
  | { type: 'ai_meta'; provider: string; model: string; thread_id: string }
  | { type: 'handoff_requested'; thread_id: string; requested_by_user_id: string }
  | { type: 'error'; code: string };

export type ChatWsClientMessage = {
  type: 'message';
  text: string;
  client_id: string;
};
