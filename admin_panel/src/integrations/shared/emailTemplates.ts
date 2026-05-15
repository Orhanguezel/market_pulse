// =============================================================
// FILE: src/integrations/types/email_templates.types.ts
// Email Templates – Tipler (public + admin)
// =============================================================

import type { BoolLike } from "@/integrations/shared";

/* -------------------- PUBLIC DTO'lar -------------------- */

export interface EmailTemplatePublicDto {
  id: string;
  key: string;
  name: string;
  subject: string;
  content_html: string;
  variables: string[];
  is_active: boolean;
  locale: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface RenderedEmailTemplateDto {
  id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  required_variables: string[];
  missing_variables: string[];
  updated_at: string | Date;
  locale: string | null;
}

export interface EmailTemplatePublicListQueryParams {
  q?: string;
  locale?: string | null;
  is_active?: BoolLike;
}

export interface RenderEmailTemplateByKeyPayload {
  key: string;
  locale?: string | null;
  params?: Record<string, unknown>;
}

/* -------------------- ADMIN DTO'lar -------------------- */

export interface EmailTemplateAdminListItemDto {
  id: string;
  template_key: string;
  template_name: string | null;
  subject: string | null;
  content: string | null;
  locale: string | null;
  variables: string[] | null;
  detected_variables: string[];
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface EmailTemplateAdminTranslationDto {
  id: string;
  locale: string;
  template_name: string;
  subject: string;
  content: string;
  detected_variables: string[];
  created_at: string | Date;
  updated_at: string | Date;
}

export interface EmailTemplateAdminDetailDto {
  id: string;
  template_key: string;
  variables: string[] | null;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  translations: EmailTemplateAdminTranslationDto[];
}

export interface EmailTemplateAdminListQueryParams {
  q?: string;
  locale?: string | null;
  is_active?: BoolLike;
  template_key?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface EmailTemplateAdminCreatePayload {
  template_key: string;

  template_name: string;
  subject: string;
  content: string;

  variables?: string[] | string | null;
  is_active?: BoolLike;
  locale?: string | null;
}

export interface EmailTemplateAdminUpdatePayload {
  template_key?: string;
  variables?: string[] | string | null;
  is_active?: BoolLike;

  template_name?: string;
  subject?: string;
  content?: string;

  locale?: string | null;
}

export interface EmailTemplateAdminUpdateArgs {
  id: string;
  patch: EmailTemplateAdminUpdatePayload;
}

export type EmailTemplateAdminOrderBy = "updated_at" | "created_at" | "template_key" | "locale";

/* -------------------- UI FORM STATE (Admin Panel) -------------------- */
/**
 * EmailTemplateFormPage.tsx içinde kullanılan form state tipi.
 * API kontratı değil, admin UI form değerleri için export edilir.
 */
export type EmailTemplateFormValues = {
  template_key: string;
  is_active: boolean;

  locale: string;
  template_name: string;
  subject: string;
  content: string;

  variablesValue: unknown;
  detectedVariables: string[];

  parentCreatedAt?: string | Date;
  parentUpdatedAt?: string | Date;
  translationCreatedAt?: string | Date;
  translationUpdatedAt?: string | Date;
};

/* -------------------- Helper fonksiyonlar (endpoint'ler için) -------------------- */

/**
 * List query parametrelerini API formatına çevir
 */
export function toEmailTemplatesQuery(params: EmailTemplateAdminListQueryParams): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (params.q) result.q = params.q;
  if (params.locale) result.locale = params.locale;
  if (params.is_active !== undefined) result.is_active = params.is_active;
  if (params.template_key) result.template_key = params.template_key;
  if (params.order_by) result.order_by = params.order_by;
  if (params.order_dir) result.order_dir = params.order_dir;
  return result;
}

/**
 * Create/Update body hazırla
 */
export function toEmailTemplateWriteBody(
  payload: EmailTemplateAdminCreatePayload | EmailTemplateAdminUpdatePayload,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if ("template_key" in payload && payload.template_key) {
    result.template_key = payload.template_key;
  }
  if (payload.is_active !== undefined) result.is_active = payload.is_active;
  if (payload.locale) result.locale = payload.locale;
  if ("variables" in payload && payload.variables !== undefined) result.variables = payload.variables;
  if (payload.template_name) result.template_name = payload.template_name;
  if (payload.subject !== undefined) result.subject = payload.subject;
  if (payload.content !== undefined) result.content = payload.content;
  return result;
}

/**
 * List response normalizer
 */
export function normalizeEmailTemplateAdminList(res: unknown): EmailTemplateAdminListItemDto[] {
  if (!Array.isArray(res)) return [];
  return res.map((item: any) => ({
    id: String(item.id ?? ""),
    template_key: String(item.template_key ?? ""),
    is_active: Boolean(item.is_active),
    locale: String(item.locale ?? "tr"),
    template_name: String(item.template_name ?? ""),
    subject: String(item.subject ?? ""),
    content: item.content ?? null,
    variables: item.variables ?? null,
    detected_variables: Array.isArray(item.detected_variables) ? item.detected_variables : [],
    created_at: String(item.created_at ?? ""),
    updated_at: String(item.updated_at ?? ""),
  }));
}

/**
 * Detail response normalizer
 */
export function normalizeEmailTemplateAdminDetail(res: unknown): EmailTemplateAdminDetailDto {
  const item: any = res ?? {};
  return {
    id: String(item.id ?? ""),
    template_key: String(item.template_key ?? ""),
    is_active: Boolean(item.is_active),
    variables: item.variables ?? null,
    created_at: String(item.created_at ?? ""),
    updated_at: String(item.updated_at ?? ""),
    translations: Array.isArray(item.translations)
      ? item.translations.map((t: any) => ({
          id: String(t.id ?? ""),
          locale: String(t.locale ?? "tr"),
          template_name: String(t.template_name ?? ""),
          subject: String(t.subject ?? ""),
          content: String(t.content ?? ""),
          detected_variables: Array.isArray(t.detected_variables) ? t.detected_variables : [],
          created_at: String(t.created_at ?? ""),
          updated_at: String(t.updated_at ?? ""),
        }))
      : [],
  };
}
