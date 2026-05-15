// =============================================================
// FILE: src/seo/serverPageData.ts
// Server-only page data fetchers (for per-slug SEO in App Router)
// =============================================================
import 'server-only';

import { cache } from 'react';

import type {
  CustomPageDto,
  ApiCustomPage,
} from '@/integrations/shared';
import { mapApiCustomPageToDto } from '@/integrations/shared';
import { getDefaultLocale } from '@/i18n/server';
import { getServerApiBase } from '@/i18n/apiBase.server';
import { normLocaleShort } from '@/integrations/shared';

const API = getServerApiBase();

function apiUrl(path: string): string {
  const base = API.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function fetchApiJson<T>(path: string, opts?: { revalidate?: number }): Promise<T | null> {
  if (!API) return null;

  try {
    const res = await fetch(apiUrl(path), { next: { revalidate: opts?.revalidate ?? 300 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const fetchCustomPagePublicBySlug = cache(
  async (args: { slug: string; locale: string }): Promise<CustomPageDto | null> => {
    const slug = String(args.slug || '').trim();
    if (!slug) return null;

    const defaultLocale = await getDefaultLocale();
    const locale = normLocaleShort(args.locale, defaultLocale);

    const qs = new URLSearchParams({
      locale,
      default_locale: defaultLocale,
    });

    const raw = await fetchApiJson<ApiCustomPage>(
      `/custom-pages/by-slug/${encodeURIComponent(slug)}?${qs.toString()}`,
      { revalidate: 300 },
    );

    return raw ? mapApiCustomPageToDto(raw) : null;
  },
);
