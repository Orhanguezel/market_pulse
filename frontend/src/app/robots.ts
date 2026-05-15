// frontend/src/app/robots.ts
//
// AI crawler explicit allow politikası — T31-A2
// AI sistemleri (ChatGPT, Claude, Perplexity, Google AI Overviews, Bing Copilot)
// için marka içeriğinin alıntılanabilir olduğunu net olarak belirtir.

import { MetadataRoute } from 'next';
import { getPublicSiteOrigin } from '@/lib/site-config';

const BASE_URL = getPublicSiteOrigin();

const COMMON_DISALLOW = ['/api/', '/admin/', '/_next/', '/dashboard', '/me/'];

/** AI crawler bot listesi — explicit allow ile site içeriğine erişim onaylanır. */
const AI_BOTS = [
  // OpenAI
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Anthropic
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // Google AI (Gemini, AI Overviews — Google-Extended ayrı bir token, Googlebot ile birlikte gelir)
  'Google-Extended',
  // Common Crawl (LLM eğitim verisi kaynağı)
  'CCBot',
  // Apple Intelligence
  'Applebot-Extended',
  // Meta AI
  'FacebookBot',
  'Meta-ExternalAgent',
  // Cohere
  'cohere-ai',
];

/** Geleneksel arama motoru bot'ları — explicit listede tutulması SEO sinyali için faydalı. */
const SEARCH_BOTS = ['Googlebot', 'Googlebot-Image', 'Bingbot', 'Slurp', 'DuckDuckBot', 'YandexBot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default catch-all — diğer tüm crawler'lar
      {
        userAgent: '*',
        allow: '/',
        disallow: COMMON_DISALLOW,
      },
      ...SEARCH_BOTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: COMMON_DISALLOW,
      })),
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: COMMON_DISALLOW,
      })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
