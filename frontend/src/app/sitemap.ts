import { MetadataRoute } from 'next';
import { getPublicSiteOrigin } from '@/lib/site-config';

const BASE_URL = getPublicSiteOrigin();

const LOCALES = ['tr', 'en', 'de'] as const;
const DEFAULT_LOCALE = 'tr';

const STATIC_PAGES = [
  '',
  '/pricing',
  '/about',
  '/faqs',
  '/contact',
  '/blog',
] as const;

function buildAlternates(path: string): { languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${BASE_URL}/${loc}${path}`;
  }
  languages['x-default'] = `${BASE_URL}/${DEFAULT_LOCALE}${path}`;
  return { languages };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return LOCALES.flatMap((locale) =>
    STATIC_PAGES.map((page) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1 : 0.8,
      alternates: buildAlternates(page),
    })),
  );
}
