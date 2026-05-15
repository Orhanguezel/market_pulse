// =============================================================
// FILE: frontend/app/[locale]/blog/_components/blogView.helpers.ts
// FINAL — blog UI helpers (NO duplication)
// - Fix: NEVER show {"html": "..."} residue
// - Provides: extractHtmlFromPost + sanitizeBlogHtml
// =============================================================

import type { CustomPageView } from '@/integrations/shared';

export const BLOG_MODULE_KEY = 'blog' as const;

export const formatIsoDate = (iso?: string) => {
  if (!iso) return '—';
  return iso.slice(0, 10);
};

export const pickCover = (p?: CustomPageView | null) => {
  const fallback = '/assets/imgs/blog/blog-1/img-background.png';
  if (!p) return { src: fallback, alt: 'Blog cover' };

  const src =
    p.featured_image_effective_url ||
    p.image_effective_url ||
    p.featured_image ||
    p.image_url ||
    (p.images_effective_urls as any)?.[0] ||
    (p.images as any)?.[0] ||
    fallback;

  const alt = p.alt || p.title || 'Blog cover';
  return { src, alt };
};

export const pickCardImage = (p: CustomPageView, fallback: string) => {
  return (
    p.featured_image_effective_url ||
    p.image_effective_url ||
    p.featured_image ||
    p.image_url ||
    (p.images_effective_urls as any)?.[0] ||
    (p.images as any)?.[0] ||
    fallback
  );
};

export const isNotFoundError = (err: unknown) => {
  const status = (err as any)?.status ?? (err as any)?.originalStatus;
  return status === 404;
};

// ----------------------------- Content Helpers -----------------------------

export function isRecord(v: unknown): v is Record<string, any> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

export const tryParseJson = (v: unknown): unknown => {
  if (typeof v !== 'string') return v;
  const s0 = v.trim();
  if (!s0) return v;

  const looksJson =
    (s0.startsWith('{') && s0.endsWith('}')) || (s0.startsWith('[') && s0.endsWith(']'));
  if (!looksJson) return v;

  try {
    return JSON.parse(s0);
  } catch {
    return v;
  }
};

/**
 * Salvage extractor for strings that look like:
 * {"html":" ... "}   BUT JSON.parse may fail due to raw newlines / bad escaping.
 *
 * This will NEVER return the wrapper {"html":...} string.
 * It will return only the inner HTML if it can detect it.
 */
export const unwrapHtmlJsonLike = (raw: string): string => {
  const s = (raw || '').trim();
  if (!s) return '';

  // fast path: proper JSON parse
  if (s.startsWith('{') && s.includes('"html"')) {
    try {
      const parsed = JSON.parse(s);
      const html = (parsed as any)?.html;
      if (typeof html === 'string' && html.trim()) return html.trim();
    } catch {
      // fallback below
    }
  }

  // fallback: manual unwrap if string starts with {"html":" ... "}
  // We intentionally do NOT require valid JSON.
  const prefix = '{"html":"';
  if (s.startsWith(prefix)) {
    const end = s.lastIndexOf('"}');
    if (end > prefix.length) {
      let inner = s.slice(prefix.length, end);

      // unescape common JSON escapes
      inner = inner.replace(/\\"/g, '"');
      inner = inner.replace(/\\n/g, '\n');
      inner = inner.replace(/\\r/g, '\r');
      inner = inner.replace(/\\t/g, '\t');
      inner = inner.replace(/\\\\/g, '\\');

      return inner.trim();
    }
  }

  return s;
};

export const extractHtmlFromContent = (raw: unknown): string => {
  // object {html:"..."}
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const html = (raw as any)?.html;
    if (typeof html === 'string' && html.trim()) return html.trim();
  }

  // string (may be JSON-string or broken JSON-string or raw html)
  if (typeof raw === 'string') return unwrapHtmlJsonLike(raw);

  // parsed object already?
  const parsed = tryParseJson(raw);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const html = (parsed as any)?.html;
    if (typeof html === 'string' && html.trim()) return html.trim();
  }

  return '';
};

/**
 * Extract HTML from a post safely.
 * Supported:
 * 1) post.content_html (string)
 * 2) post.content (object { html })
 * 3) post.content (string JSON {"html":"..."}) even if broken JSON
 * 4) post.content (raw HTML string)
 */
export const extractHtmlFromPost = (post: CustomPageView | null): string => {
  if (!post) return '';

  const cHtml = (post as any)?.content_html;
  if (typeof cHtml === 'string' && cHtml.trim()) return cHtml.trim();

  const c = (post as any)?.content;
  return extractHtmlFromContent(c);
};

/**
 * Minimal safety guard that won't break your classes/styles.
 * (We DO NOT strip class="" or normal attributes.)
 */
export const sanitizeBlogHtml = (input: string): string => {
  if (!input) return '';
  let out = input;

  // remove scripts/iframes
  out = out.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  out = out.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // block javascript: in href/src
  out = out.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, ' $1="#"');

  // OPTIONAL: ensure we never leak wrapper text even if someone passes wrong string
  // (failsafe)
  if (out.trim().startsWith('{"html":"')) {
    out = unwrapHtmlJsonLike(out);
  }

  return out;
};
