// =============================================================
// FILE: src/middleware.ts
// Locale validation — prevents /admin and other non-locale paths
// from being caught by the [locale] dynamic segment.
// Locales are short codes (2-3 chars): de, tr, en, fr, ...
// Any first path segment longer than that (e.g. "admin", "api")
// is NOT a locale and should be handled here.
// =============================================================

import { NextRequest, NextResponse } from 'next/server';

// Known non-locale path prefixes — redirect to root so the
// [locale] default (DB default) takes over.
const NON_LOCALE_PREFIXES = [
  'admin',
  'api',
  'uploads',
  'public',
  'static',
  'images',
  'assets',
];

// Static file extensions — skip middleware entirely.
const STATIC_EXT_RE = /\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|otf|eot|css|js|map|txt|xml|json)$/i;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    STATIC_EXT_RE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // First path segment (e.g. "de", "admin", "about")
  const firstSeg = pathname.replace(/^\/+/, '').split('/')[0].toLowerCase();

  if (firstSeg && NON_LOCALE_PREFIXES.includes(firstSeg)) {
    // Redirect to root — Next.js will serve the default locale
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run for everything except _next/static, _next/image
    '/((?!_next/static|_next/image).*)',
  ],
};
