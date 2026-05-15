// =============================================================
// FILE: src/lib/header/menu.runtime.ts
// FINAL — header menu runtime helpers (client-safe)
// - No "2-letter locale" limitation (supports 20+ locales)
// - Locale source priority: pathname -> <html lang> -> fallback
// - DB URLs are locale-less: "/services", "/#contact", "#contact", "/"
// =============================================================

import { trimStr, isRemoteUrl } from '@/integrations/shared';
import { normLocaleTag } from '../../i18n/localeUtils';

export function readHtmlLang(): string {
  if (typeof document === 'undefined') return '';
  return normLocaleTag(document.documentElement.getAttribute('lang'));
}

export function readLocaleFromPathname(pathname: string): string {
  const seg = trimStr(pathname).replace(/^\/+/, '').split('/')[0] || '';
  return normLocaleTag(seg);
}

export function resolveLocaleForLinks(pathname: string, fallback = 'de'): string {
  return readLocaleFromPathname(pathname) || readHtmlLang() || normLocaleTag(fallback) || 'de';
}

export function resolveLocaleForApi(pathname: string): string | undefined {
  const l = readLocaleFromPathname(pathname) || readHtmlLang();
  const n = normLocaleTag(l);
  return n ? n : undefined;
}

function isSpecialScheme(url: string): boolean {
  const s = url.toLowerCase();
  return s.startsWith('mailto:') || s.startsWith('tel:');
}

/**
 * DB url localsiz:
 * - "/services" | "/#contact" | "#contact" | "/" | "" | "services"
 * FE:
 * - "/{locale}/services" | "/{locale}/#contact" | "/{locale}"
 */
export function withLocalePrefix(locale: string, rawUrl: unknown, fallback = 'de'): string {
  const loc = normLocaleTag(locale) || normLocaleTag(fallback) || 'de';
  const url = trimStr(rawUrl);

  if (!url || url === '/') return `/${loc}`;

  if (isRemoteUrl(url) || isSpecialScheme(url)) return url;

  if (url.startsWith('#')) return `/${loc}/${url}`;
  if (url.startsWith('/#')) return `/${loc}${url}`;

  if (url.startsWith('/')) return `/${loc}${url}`;

  return `/${loc}/${url.replace(/^\/+/, '')}`;
}

export function splitHash(href: string): { path: string; hash: string } {
  const i = href.indexOf('#');
  if (i === -1) return { path: href, hash: '' };
  return { path: href.slice(0, i) || '/', hash: href.slice(i) };
}

export function isActiveLink(pathname: string, currentHash: string, href: string): boolean {
  if (isRemoteUrl(href) || href.startsWith('mailto:') || href.startsWith('tel:')) return false;

  const { path, hash } = splitHash(href);

  const a = (pathname || '/').replace(/\/+$/, '') || '/';
  const b = (path || '/').replace(/\/+$/, '') || '/';

  if (hash) return a === b && currentHash === hash;
  return a === b;
}
