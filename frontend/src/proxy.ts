// =============================================================
// FILE: src/proxy.ts (Next.js 16+ — eski middleware.ts deprecated)
// Locale prefix routing — kök URL `/` Türkçe içeriği gösterir
// (internal rewrite to /tr, URL bar'da `/` kalır).
// /en, /de gibi diğer dilleri olduğu gibi geçirir.
// =============================================================

import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_LOCALES = ['tr', 'en', 'de'] as const;
const DEFAULT_LOCALE = 'tr';

// Non-locale path prefixes (admin, api vs.)
const NON_LOCALE_PREFIXES = ['admin', 'api', 'uploads', 'public', 'static', 'images', 'assets'];

// Static file extensions — middleware'i atla
const STATIC_EXT_RE = /\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|otf|eot|css|js|map|txt|xml|json|webmanifest)$/i;

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Next.js internals + static dosyalar — atla
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/offline.html' ||
    STATIC_EXT_RE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // İlk path segment'i (boşsa root '/')
  const firstSeg = pathname.replace(/^\/+/, '').split('/')[0].toLowerCase();

  // Non-locale (admin/api/uploads) — olduğu gibi geç
  if (firstSeg && NON_LOCALE_PREFIXES.includes(firstSeg)) {
    return NextResponse.next();
  }

  // Locale prefix var ve destekli — olduğu gibi geç
  if (firstSeg && (SUPPORTED_LOCALES as readonly string[]).includes(firstSeg)) {
    return NextResponse.next();
  }

  // Locale prefix YOK → default locale'e internal rewrite (URL bar'da `/` kalır)
  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // _next/static, _next/image hariç her şeyde çalış
    '/((?!_next/static|_next/image).*)',
  ],
};
