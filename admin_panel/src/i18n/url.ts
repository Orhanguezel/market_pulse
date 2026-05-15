// =============================================================
// FILE: src/i18n/url.ts  (DYNAMIC)
//  - No SUPPORTED_LOCALES / LOCALE_SET dependency
//  - Strip/localize uses runtime activeLocales if provided
//  - Has safe heuristic fallback when activeLocales is not available yet
//  - ✅ Default locale prefixless support
// =============================================================

export type RuntimeLocale = string;

function toShortLocale(v: unknown): string {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();
}

function splitPath(asPath: string) {
  const s = String(asPath || '/');
  const [pathAndQuery, hash = ''] = s.split('#');
  const [pathname = '/', query = ''] = pathAndQuery.split('?');
  return {
    pathname: pathname || '/',
    query: query ? `?${query}` : '',
    hash: hash ? `#${hash}` : '',
  };
}

function buildActiveSet(activeLocales?: string[]) {
  return new Set((activeLocales || []).map((x) => toShortLocale(x)).filter(Boolean));
}

function looksLikeLocale(seg: string): boolean {
  const s = toShortLocale(seg);
  if (/^[a-z]{2}$/.test(s)) return true;
  if (/^[a-z]{3}$/.test(s)) return true;
  return false;
}

function hasLcQuery(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const usp = new URLSearchParams(window.location.search || '');
    return !!usp.get('__lc');
  } catch {
    return false;
  }
}

/**
 * Strips "/{locale}" prefix from a pathname.
 * - If activeLocales provided, only strips if prefix exists in activeLocales (strict).
 * - Otherwise strips ONLY when "__lc" query exists (rewrite mode) and prefix looks like locale.
 */
export function stripLocalePrefix(pathname: string, activeLocales?: string[]): string {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const seg = p.replace(/^\/+/, '').split('/')[0] || '';
  const cand = toShortLocale(seg);

  if (!cand) return p;

  const activeSet = buildActiveSet(activeLocales);

  const shouldStrip =
    activeSet.size > 0 ? activeSet.has(cand) : hasLcQuery() ? looksLikeLocale(cand) : false;

  if (!shouldStrip) return p;

  const rest = p.replace(new RegExp(`^/${seg}(?=/|$)`), '');
  return rest ? (rest.startsWith('/') ? rest : `/${rest}`) : '/';
}

export type LocalizePathOptions = {
  defaultLocale?: string;
  defaultPrefixless?: boolean;
};

/**
 * Localizes a path using URL-prefix routing with optional default-locale prefixless rule.
 * - Removes existing locale prefix first (strict if activeLocales provided).
 */
export function localizePath(
  locale: RuntimeLocale,
  asPath: string,
  activeLocales?: string[],
  opts?: LocalizePathOptions,
): string {
  const { pathname, query, hash } = splitPath(asPath);

  const clean = stripLocalePrefix(pathname, activeLocales);
  const base = clean === '/' ? '' : clean;

  const target = toShortLocale(locale) || '';

  const defFromOpts = toShortLocale(opts?.defaultLocale);
  const defFromActives = toShortLocale(activeLocales?.[0]);
  const def = defFromOpts || defFromActives || 'tr';

  const defaultPrefixless = opts?.defaultPrefixless !== false;

  const path =
    defaultPrefixless && target && target === def ? `${base || '/'}` : `/${target || def}${base}`;

  return `${path}${query}${hash}`;
}
