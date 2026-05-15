// =============================================================
// FILE: src/i18n/routing.ts  (DYNAMIC)
// =============================================================
"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import type { NextRouter } from "next/router";

import { normLocaleTag } from "./localeUtils";

export { Link };

/** SEO-dostu path sabitleri (bu kısım locale ile ilgili değil) */
export const pathnames = {
  "/": "/",
  "/about": "/about",
  "/contact": "/contact",

  "/library": "/library",
  "/library/[slug]": "/library/[slug]",

  "/references": "/references",
  "/references/[slug]": "/references/[slug]",

  "/products": "/products",
  "/products/[slug]": "/products/[slug]",

  "/spare-parts": "/spare-parts",
  "/spare-parts/[slug]": "/spare-parts/[slug]",

  "/blog": "/blog",
  "/blog/[slug]": "/blog/[slug]",

  "/news": "/news",
  "/news/[slug]": "/news/[slug]",

  "/search": "/search",
} as const;

function normalizeActive(activeLocales?: string[]) {
  const list = (activeLocales || []).map(normLocaleTag).filter(Boolean);
  return Array.from(new Set(list));
}

function pickRuntimeDefault(activeLocales?: string[], defaultLocale?: string) {
  const active = normalizeActive(activeLocales);

  const candDefault = normLocaleTag(defaultLocale);
  if (candDefault && active.includes(candDefault)) return candDefault;

  return normLocaleTag(active[0]) || normLocaleTag(defaultLocale) || "tr";
}

function isActiveLocale(locale: string | undefined, activeLocales?: string[]) {
  const l = normLocaleTag(locale);
  if (!l) return false;
  const active = normalizeActive(activeLocales);
  return active.length ? active.includes(l) : true; // active yoksa, doğrulama yapma (boot aşaması)
}

/**
 * ✅ /{locale}/... kalıbı üretir; slug varsa doldurur
 *
 * - activeLocales + defaultLocale runtime parametreleriyle çalışır.
 * - locale verilirse: aktif listede değilse ignore edip runtime default'a düşer.
 */
export function localePath(
  pathname: keyof typeof pathnames | string,
  locale?: string,
  params?: Record<string, string | number>,
  activeLocales?: string[],
  defaultLocale?: string,
) {
  const p = typeof pathname === "string" ? pathname : pathnames[pathname];

  const runtimeDefault = pickRuntimeDefault(activeLocales, defaultLocale);

  const l = isActiveLocale(locale, activeLocales) ? normLocaleTag(locale) : runtimeDefault;

  let filled = p;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      filled = filled.replace(`[${k}]`, String(v));
    }
  }

  return filled === "/" ? `/${l}` : `/${l}${filled}`;
}

/** Kendi custom hook'un: hook içinde hook kullanımı OK */
export function usePathname() {
  const r = useRouter();
  return r.asPath;
}

/**
 * Hook OLMAYAN, SSR-safe yardımcı: hook çağırmaz.
 */
export function getPathnameFrom(router?: Pick<NextRouter, "asPath">) {
  if (router?.asPath) return router.asPath;
  if (typeof window !== "undefined") {
    const { pathname, search, hash } = window.location;
    return `${pathname}${search}${hash}`;
  }
  return "/";
}

/** Basit redirect helper (client tarafı) */
export function redirect(href: string) {
  if (typeof window !== "undefined") window.location.assign(href);
}
