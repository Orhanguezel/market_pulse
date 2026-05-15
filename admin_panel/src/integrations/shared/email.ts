// =============================================================
// FILE: src/integrations/shared/email.ts
// =============================================================

import type { BoolLike } from '@/integrations/shared';
import { toBool } from '@/integrations/shared';

export type EmailRow = {
  id: string;
  template_key: string; // BE anahtar adı
  template_name: string; // İnsan-okur adı
  subject: string;
  content?: unknown; // HTML string veya farklı form
  body_html?: string | null; // Bazı BE'ler bu adı kullanabilir
  variables?: unknown; // string[] | string (comma) | JSON-string | null
  is_active: BoolLike;
  locale?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type EmailView = {
  id: string;
  key: string;
  name: string;
  subject: string;
  content_html: string;
  variables: string[];
  is_active: boolean;
  locale: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

export const toArrayOfStrings = (v: unknown): string[] => {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === 'string');
  }
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === 'string');
      }
    } catch {
      /* ignored */
    }
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export const extractHtml = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (isObj(raw) && typeof raw['html'] === 'string') {
    return raw['html'] as string;
  }
  return '';
};

export const toView = (row: unknown): EmailView => {
  const r = (row ?? {}) as Partial<EmailRow>;
  const html = r.body_html ?? r.content;

  const created_at = typeof r.created_at === 'string' ? r.created_at : null;
  const updated_at = typeof r.updated_at === 'string' ? r.updated_at : null;

  const locale = typeof r.locale === 'string' || r.locale === null ? (r.locale ?? null) : null;

  return {
    id: String(r.id ?? ''),
    key: String(r.template_key ?? ''),
    name: String(r.template_name ?? ''),
    subject: String(r.subject ?? ''),
    content_html: extractHtml(html),
    variables: toArrayOfStrings(r.variables),
    is_active: toBool(r.is_active),
    locale,
    created_at,
    updated_at,
  };
};
