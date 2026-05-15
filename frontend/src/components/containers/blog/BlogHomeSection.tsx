'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import { safeStr, toCdnSrc, excerpt, formatDate } from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

export default function BlogHomeSection({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale);
  const { ui } = useUiSection('ui_blog', locale as any);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data, isLoading } = useListCustomPagesPublicQuery({
    module_key: 'blog', locale, is_published: 1, featured: 1, limit: 3, order: 'display_order.asc',
  }, { skip: !mounted });

  const posts = useMemo(() => {
    const raw = (data as any)?.items ?? [];
    return (Array.isArray(raw) ? raw : []).filter((x: any) => !!x?.is_published);
  }, [data]);

  const featured = useMemo(() => posts.slice(0, 3), [posts]);
  const blogHref = useMemo(() => localizePath(locale, '/blog'), [locale]);

  const title = safeStr(ui('ui_blog_home_title', ''))
    || (locale === 'de' ? 'Aktuelle Beitraege' : locale === 'tr' ? 'Son Yazilar' : 'Latest Posts');
  const viewAll = safeStr(ui('ui_blog_home_view_all', ''))
    || (locale === 'de' ? 'Alle Beitraege' : locale === 'tr' ? 'Tumunu Gor' : 'View All');
  const readMore = safeStr(ui('ui_blog_home_read_more', ''))
    || (locale === 'de' ? 'Weiterlesen' : locale === 'tr' ? 'Devamini oku' : 'Read more');

  if (!isLoading && featured.length === 0) return null;

  return (
    <section className="bg-bg-secondary py-28 lg:py-36" style={{ padding: '7rem 4%' }}>
      {/* Header */}
      <div className="text-center max-w-[600px] mx-auto mb-16 reveal">
        <span className="section-label justify-center">
          {safeStr(ui('ui_blog_home_sublabel', '')) || 'Blog'}
        </span>
        <h2 className="font-serif text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.2] mb-5">
          {title}
        </h2>
      </div>

      {/* Cards */}
      <div className="max-w-[1300px] mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-card border border-border-light overflow-hidden">
                <div className="h-56 bg-bg-card-hover animate-pulse" />
                <div className="p-7 space-y-4">
                  <div className="h-5 bg-bg-card-hover rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-bg-card-hover rounded w-full animate-pulse" />
                  <div className="h-4 bg-bg-card-hover rounded w-5/6 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((post: any, i: number) => {
              const slug = safeStr(post.slug);
              const href = slug ? localizePath(locale, `/blog/${encodeURIComponent(slug)}`) : blogHref;
              const titleText = safeStr(post.title) || 'Untitled';
              const summaryText = excerpt(safeStr(post.summary) || safeStr(post.content_html) || '', 120);
              const dateStr = formatDate(locale, post.updated_at || post.created_at);
              const imgRaw = safeStr(post.featured_image);
              const imgSrc = imgRaw ? toCdnSrc(imgRaw, 600, 400, 'fill') || imgRaw : '';
              const imgAlt = safeStr(post.featured_image_alt) || titleText;

              return (
                <article
                  key={safeStr(post.id) || href}
                  className={`group bg-bg-card border border-border-light overflow-hidden transition-all duration-500 hover:border-border-hover reveal reveal-delay-${i + 1}`}
                >
                  {/* Image */}
                  <div className="relative h-56 bg-bg-card-hover overflow-hidden">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={imgAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
                        (No image)
                      </div>
                    )}
                    {/* Top gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                  </div>

                  {/* Content */}
                  <div className="p-7">
                    {dateStr && (
                      <p className="text-[0.7rem] tracking-[0.2em] uppercase text-text-muted mb-3">
                        {dateStr}
                      </p>
                    )}

                    <h2 className="font-serif text-xl font-light leading-[1.3] mb-3 text-text-primary group-hover:text-brand-primary transition-colors">
                      <Link href={href} className="no-underline">
                        {titleText}
                      </Link>
                    </h2>

                    {summaryText && (
                      <p className="text-[0.9rem] text-text-secondary font-light leading-[1.7] mb-5">
                        {summaryText}
                      </p>
                    )}

                    <div className="pt-4 border-t border-border-light">
                      <Link
                        href={href}
                        className="text-[0.78rem] tracking-[0.15em] uppercase text-brand-primary hover:text-brand-hover transition-colors inline-flex items-center gap-2 no-underline"
                      >
                        {readMore}
                        <span className="sr-only">: {titleText}</span>
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

        {/* View all button */}
        <div className="text-center mt-12">
          <Link href={blogHref} className="btn-outline-premium">
            {viewAll}
          </Link>
        </div>
      </div>
    </section>
  );
}
