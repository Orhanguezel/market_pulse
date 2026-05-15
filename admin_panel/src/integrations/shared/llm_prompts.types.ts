// =============================================================
// FILE: src/integrations/shared/llm_prompts.types.ts
// FAZ 19 / T19-3 — Admin LLM prompt CRUD shared types
// =============================================================

export type LlmProviderId = 'openai' | 'anthropic' | 'groq' | 'azure' | 'local';

export type LlmPromptDto = {
  id: string;
  key: string;
  locale: string;
  provider: LlmProviderId;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  user_template: string;
  safety_check: boolean;
  similarity_threshold: number;
  max_attempts: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LlmPromptListQueryParams = {
  search?: string;
  locale?: string;
  provider?: LlmProviderId;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'key';
  order?: 'asc' | 'desc';
};

export type LlmPromptListResponse = {
  items: LlmPromptDto[];
  total: number;
};

export type LlmPromptCreatePayload = Omit<
  LlmPromptDto,
  'id' | 'created_at' | 'updated_at'
>;

export type LlmPromptUpdatePayload = Partial<LlmPromptCreatePayload>;

export type LlmPromptTestPayload = {
  vars: Record<string, unknown>;
  recent_texts?: string[];
};

export type LlmPromptTestResult = {
  ok: boolean;
  prompt_id: string;
  prompt_key: string;
  output?: string;
  model?: string;
  provider?: string;
  attempts?: number;
  safety_flags?: string[];
  max_similarity?: number | null;
  error?: string;
};
