// =============================================================
// FILE: src/integrations/types/chat.types.ts
// — Chat module frontend types
// Backend: src/modules/chat/*
// =============================================================

/* ------------------------------------------------------------------
 * Core entities
 * ------------------------------------------------------------------ */

export type ChatThread = {
  id: string;
  context_type: 'job' | 'request';
  context_id: string;
  handoff_mode: 'ai' | 'admin';
  ai_provider_preference: 'auto' | 'openai' | 'anthropic' | 'grok';
  preferred_locale: string;
  assigned_admin_user_id: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  client_id: string | null;
  text: string;
  created_at: string;
};

export type ChatAiKnowledgeItem = {
  id: string;
  locale: string;
  title: string;
  content: string;
  tags: string | null;
  is_active: 0 | 1;
  priority: number;
  created_at: string;
  updated_at: string;
};

/* ------------------------------------------------------------------
 * API Responses
 * ------------------------------------------------------------------ */

export type ChatThreadsResponse = {
  items: ChatThread[];
};

export type ChatThreadResponse = {
  thread: ChatThread;
};

export type ChatMessagesResponse = {
  items: ChatMessage[];
};

export type ChatMessageResponse = {
  message: ChatMessage;
};

export type ChatAiKnowledgeListResponse = {
  items: ChatAiKnowledgeItem[];
};

/* ------------------------------------------------------------------
 * Query params
 * ------------------------------------------------------------------ */

export type ChatListThreadsParams = {
  context_type?: 'job' | 'request';
  context_id?: string;
  handoff_mode?: 'ai' | 'admin';
  limit?: number;
  offset?: number;
};

export type ChatListMessagesParams = {
  limit?: number;
  before?: string;
};

export type ChatAiKnowledgeListParams = {
  locale?: string;
  is_active?: 0 | 1;
  q?: string;
  limit?: number;
  offset?: number;
};

/* ------------------------------------------------------------------
 * Request bodies
 * ------------------------------------------------------------------ */

export type ChatCreateThreadBody = {
  context_type: 'job' | 'request';
  context_id: string;
};

export type ChatPostMessageBody = {
  text: string;
  client_id?: string;
};

export type ChatAdminTakeoverBody = {
  admin_user_id?: string;
};

export type ChatAdminReleaseToAiBody = {
  provider?: 'auto' | 'openai' | 'anthropic' | 'grok';
};

export type ChatAdminSetAiProviderBody = {
  provider: 'auto' | 'openai' | 'anthropic' | 'grok';
};

export type ChatAiKnowledgeCreateBody = {
  locale: string;
  title: string;
  content: string;
  tags?: string | null;
  priority?: number;
  is_active?: 0 | 1;
};

export type ChatAiKnowledgeUpdateBody = {
  locale?: string;
  title?: string;
  content?: string;
  tags?: string | null;
  priority?: number;
  is_active?: 0 | 1;
};
