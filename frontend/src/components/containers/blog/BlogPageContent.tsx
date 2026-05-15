'use client';

import React, { useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import { safeStr, toCdnSrc, excerpt } from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { getPublicAppName } from '@/lib/site-config';

const FALLBACK_BLOG_POSTS = {
  tr: [
    {
      id: 'fallback-blog-1',
      title: 'Amazon kategorisine girmeden önce sorulması gereken 5 soru',
      slug: 'amazon-kategori-giris-sorulari',
      summary: 'Rekabetin yoğun olduğu bir kategoriye girmeden önce risk skorunu yorumlamak için pratik bir çerçeve.',
      featured_image: '/img/hero-bg.png',
      created_at: '2026-04-30T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-2',
      title: 'Keepa verisi neden önemli? Fiyat geçmişini okumak',
      slug: 'keepa-veri-analizi',
      summary: 'Buy box volatilitesi ve fiyat geçmişi grafikleri, kategori riskini tahmin etmek için güçlü bir sinyal sunar.',
      featured_image: '/support_ai.webp',
      created_at: '2026-04-23T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-3',
      title: 'SKU kaos skoru ne anlama gelir?',
      slug: 'sku-kaos-skoru-aciklamasi',
      summary: 'Bir kategorideki ürün çeşitliliği ve yoğunluğu, pazar girişinin ne kadar zor olacağını belirler.',
      featured_image: '/img/hero-bg.png',
      created_at: '2026-04-16T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-4',
      title: 'Amazon DE, UK ve US pazarları arasındaki temel farklar',
      slug: 'amazon-de-uk-us-karsilastirma',
      summary: 'Her marketplace için rekabet yoğunluğu, marka hakimiyeti ve fiyat dinamikleri farklıdır.',
      featured_image: '/img/hero-bg.png',
      created_at: '2026-04-09T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-5',
      title: 'Brand reliability skoru: marka hakimiyetini nasıl ölçeriz?',
      slug: 'brand-reliability-skoru',
      summary: 'Güçlü markaların hakim olduğu kategoriler, yeni satıcılar için daha yüksek risk taşır.',
      featured_image: '/img/hero-bg.png',
      created_at: '2026-04-02T09:00:00.000Z',
    },
  ],
  en: [
    {
      id: 'fallback-blog-1',
      title: '5 questions to ask before entering an Amazon category',
      slug: 'amazon-category-entry-questions',
      summary: 'A practical framework for interpreting risk scores before committing to a competitive category.',
      featured_image: '/img/hero-bg.png',
      created_at: '2026-04-30T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-2',
      title: 'Why Keepa data matters: reading price history',
      slug: 'keepa-data-analysis',
      summary: 'Buy box volatility and price history charts offer powerful signals for predicting category risk.',
      featured_image: '/support_ai.webp',
      created_at: '2026-04-23T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-3',
      title: 'What does SKU chaos score mean?',
      slug: 'sku-chaos-score-explained',
      summary: 'Product density and variety in a category determines how difficult market entry will be.',
      featured_image: '/img/hero-bg.png',
      created_at: '2026-04-16T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-4',
      title: 'Key differences between Amazon DE, UK, and US',
      slug: 'amazon-de-uk-us-comparison',
      summary: 'Competition intensity, brand dominance, and pricing dynamics vary significantly across marketplaces.',
      featured_image: '/img/hero-bg.png',
      created_at: '2026-04-09T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-5',
      title: 'Brand reliability score: how we measure brand dominance',
      slug: 'brand-reliability-score',
      summary: 'Categories dominated by strong brands carry higher risk for new sellers entering the market.',
      featured_image: '/img/hero-bg.png',
      created_at: '2026-04-02T09:00:00.000Z',
    },
  ],
  de: [
    {
      id: 'fallback-blog-1',
      title: '5 Fragen vor dem Einstieg in eine Amazon-Kategorie',
      slug: 'amazon-kategorie-einstieg-fragen',
      summary: 'Ein praktischer Rahmen zum Interpretieren von Risiko-Scores vor der Entscheidung für eine wettbewerbsintensive Kategorie.',
      featured_image: '/img/hero-bg.png',
      created_at: '2026-04-30T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-2',
      title: 'Warum Keepa-Daten wichtig sind: Preisverlauf lesen',
      slug: 'keepa-daten-analyse',
      summary: 'Buy-Box-Volatilität und Preisverlaufsgrafiken liefern starke Signale zur Vorhersage von Kategorierisiken.',
      featured_image: '/support_ai.webp',
      created_at: '2026-04-23T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-3',
      title: 'Was bedeutet der SKU-Chaos-Score?',
      slug: 'sku-chaos-score-erklaert',
      summary: 'Produktdichte und -vielfalt in einer Kategorie bestimmen, wie schwierig der Markteinstieg sein wird.',
      featured_image: '/img/hero-bg.png',
      created_at: '2026-04-16T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-4',
      title: 'Hauptunterschiede zwischen Amazon DE, UK und US',
      slug: 'amazon-de-uk-us-vergleich',
      summary: 'Wettbewerbsintensität, Markendominanz und Preisdynamiken unterscheiden sich je nach Marktplatz erheblich.',
      featured_image: '/img/hero-bg.png',
      created_at: '2026-04-09T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-5',
      title: 'Brand-Reliability-Score: Wie wir Markendominanz messen',
      slug: 'brand-reliability-score-erklaert',
      summary: 'Von starken Marken dominierte Kategorien tragen für neue Verkäufer ein höheres Einstiegsrisiko.',
      featured_image: '/img/hero-bg.png',
      created_at: '2026-04-02T09:00:00.000Z',
    },
  ],
};

function normalizeBlogImage(src: string): string {
  return src || '/img/hero-bg.png';
}

const BlogPageContent: React.FC = () => {
  const app = getPublicAppName();
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_blog', locale as any);
  const t = useCallback((k: string, fb: string) => ui(k, fb), [ui]);

  const { data, isLoading } = useListCustomPagesPublicQuery({
    module_key: 'blog', sort: 'created_at', order: 'desc', locale, limit: 12,
  } as any);

  const items = useMemo(() => {
    const raw = (data as any)?.items ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const renderedItems = useMemo(() => {
    if (items.length > 0) return items;
    return FALLBACK_BLOG_POSTS[locale as keyof typeof FALLBACK_BLOG_POSTS] ?? FALLBACK_BLOG_POSTS.en;
  }, [items, locale]);

  const blogListHref = useMemo(() => localizePath(locale, '/blog'), [locale]);

  const readMore = t('ui_blog_read_more',
    locale === 'de' ? 'Weiterlesen' : locale === 'tr' ? 'Devamini oku' : 'Read more'
  );

  return (
    <section className="bg-[var(--gm-bg)] min-h-screen relative" style={{ padding: '3rem 4% 7rem' }}>
      {/* Tema-aware accent glow — her preset'te primary rengi parlatır */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-50"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, var(--gm-primary) 18%, transparent) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-[1300px] mx-auto relative">
        {/* Hero header — eyebrow + lead */}
        <header className="text-center mb-14 md:mb-20">
          <p className="text-[10px] md:text-[11px] font-bold tracking-[0.32em] uppercase text-[var(--gm-primary)] mb-4">
            {t(
              'ui_blog_eyebrow',
              locale === 'tr'
                ? `${app} günlüğü`
                : locale === 'de'
                  ? `${app} Journal`
                  : `${app} journal`,
            )}
          </p>
          <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] text-[var(--gm-text)] max-w-3xl mx-auto mb-5">
            {t(
              'ui_blog_hero_title',
              locale === 'tr'
                ? 'Öğrenme, sembolik okumalar ve danışmanlık üzerine yazılar'
                : locale === 'de'
                  ? 'Artikel zu Lernen, symbolischen Lesungen und Beratung'
                  : 'Articles on learning, symbolic readings and consultation',
            )}
          </h1>
          <p className="text-base md:text-lg text-[var(--gm-text-dim)] max-w-2xl mx-auto leading-relaxed font-serif italic">
            {t(
              'ui_blog_hero_lead',
              locale === 'tr'
                ? 'Amazon kategori analizi, Keepa verisi ve pazar stratejisi hakkında rehberler.'
                : locale === 'de'
                  ? 'Anleitungen zu Amazon-Kategorieanalyse, Keepa-Daten und Marktstrategie.'
                  : 'Guides on Amazon category analysis, Keepa data and market strategy.',
            )}
          </p>
          <div className="mt-8 inline-flex items-center gap-3">
            <span className="h-px w-12 bg-[var(--gm-primary)]/40" />
            <span className="text-[var(--gm-primary)] text-xs">✦</span>
            <span className="h-px w-12 bg-[var(--gm-primary)]/40" />
          </div>
        </header>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-2xl overflow-hidden">
                <div className="h-56 bg-[var(--gm-bg-deep)] animate-pulse" />
                <div className="p-7 space-y-4">
                  <div className="h-5 bg-[var(--gm-bg-deep)] rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-[var(--gm-bg-deep)] rounded w-full animate-pulse" />
                  <div className="h-4 bg-[var(--gm-bg-deep)] rounded w-5/6 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {!isLoading && renderedItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderedItems.map((post: any, i: number) => {
              const title = safeStr(post.title) || t('ui_blog_untitled', 'Untitled');
              const summary = excerpt(safeStr(post.summary) || safeStr(post.content_html) || '', 120);
              const slug = safeStr(post.slug);
              const href = slug ? localizePath(locale, `/blog/${slug}`) : blogListHref;
              const imgRaw = normalizeBlogImage(safeStr(post.featured_image));
              const imgSrc = imgRaw ? toCdnSrc(imgRaw, 600, 400, 'fill') || imgRaw : '';
              const dateStr = post.created_at
                ? new Date(post.created_at).toLocaleDateString(locale === 'de' ? 'de-DE' : locale === 'tr' ? 'tr-TR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : '';

              return (
                <article
                  key={String(post.id ?? slug)}
                  className={`group bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-2xl overflow-hidden transition-all duration-500 hover:border-[var(--gm-primary)]/40 hover:shadow-[var(--gm-shadow-card)] hover:-translate-y-1 flex flex-col reveal reveal-delay-${(i % 3) + 1}`}
                >
                  {/* Image */}
                  <Link href={href} className="relative h-56 overflow-hidden bg-[var(--gm-bg-deep)] block no-underline">
                    {imgSrc ? (
                      <Image
                        src={imgSrc as any}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[var(--gm-muted)] text-sm">(No image)</div>
                    )}
                    {/* Mor gradient overlay — tema-aware (her preset'te primary tonunda) */}
                    <div
                      aria-hidden
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to top, color-mix(in srgb, var(--gm-primary) 35%, transparent) 0%, transparent 60%)',
                      }}
                    />
                  </Link>

                  {/* Content */}
                  <div className="flex flex-col grow p-7">
                    {dateStr && (
                      <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--gm-muted)] mb-3">{dateStr}</p>
                    )}

                    <h2 className="font-serif text-xl font-light leading-[1.3] mb-3 text-[var(--gm-text)] group-hover:text-[var(--gm-primary)] transition-colors">
                      <Link href={href} className="no-underline">{title}</Link>
                    </h2>

                    {summary && (
                      <p className="text-[0.9rem] text-[var(--gm-text-dim)] font-light leading-[1.7] mb-5 grow">{summary}</p>
                    )}

                    <div className="pt-4 border-t border-[var(--gm-border-soft)] mt-auto">
                      <Link
                        href={href}
                        className="text-[0.78rem] tracking-[0.15em] uppercase text-[var(--gm-primary)] hover:text-[var(--gm-primary-dark)] transition-colors inline-flex items-center gap-2 no-underline font-bold"
                      >
                        {readMore}
                        <span className="sr-only">: {title}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                          className="transition-transform group-hover:translate-x-1">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogPageContent;
