// =============================================================
// FILE: src/integrations/types/email_templates.types.ts
// Email Templates – Tipler (public + admin)
// =============================================================

import { BoolLike } from '@/integrations/shared';

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

export type EmailTemplateAdminOrderBy = 'updated_at' | 'created_at' | 'template_key' | 'locale';

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
