'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import { downgradeH1ToH2, safeStr, excerpt, toCdnSrc } from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText, localizePath } from '@/integrations/shared';

const SUMMARY_LEN = 320;

const AboutSection: React.FC<{ locale?: string }> = ({ locale: explicitLocale }) => {
  const locale = useLocaleShort(explicitLocale);
  const { ui } = useUiSection('ui_about', locale as any);

  const { data, isLoading } = useListCustomPagesPublicQuery({
    module_key: 'about', locale, limit: 10, sort: 'created_at', orderDir: 'asc',
  });

  const first = useMemo(() => {
    const items = data?.items ?? [];
    const published = items.filter((p) => p.is_published);
    return published.find((p) => p.featured) ?? published[0] ?? null;
  }, [data]);

  const aboutHref = useMemo(() => localizePath(locale as any, '/about'), [locale]);

  const firstTitle = useMemo(() => {
    const t = safeStr(first?.title);
    if (t) return t;
    return t || safeStr(ui('ui_about_fallback_title', 'Spiritüel Yolculuk')) || 'Spiritüel Yolculuk';
  }, [first?.title, ui]);

  const firstSummaryRaw = useMemo(() => {
    const raw = first?.content_html || first?.content || '';
    return raw ? downgradeH1ToH2(raw) : '';
  }, [first]);

  const firstSummary = useMemo(() => {
    return firstSummaryRaw ? excerpt(firstSummaryRaw, SUMMARY_LEN).trim() : '';
  }, [firstSummaryRaw]);

  const hasFirstSummary = !!safeStr(firstSummary);

  const heroSrc = useMemo(() => {
    const raw = safeStr(first?.featured_image);
    if (!raw) return '';
    const cdn = toCdnSrc(raw, 720, 960, 'fill');
    return (cdn || raw) as any;
  }, [first]);

  const heroAlt = useMemo(() => {
    return safeStr(first?.featured_image_alt) || firstTitle || 'about';
  }, [first, firstTitle]);

  const subLabel = useMemo(() => {
    const key = 'ui_about_sublabel';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;
    if (locale === 'de') return 'Über Mich';
    if (locale === 'tr') return 'Hakkimda';
    return 'About';
  }, [ui, locale]);

  const readMoreText = useMemo(() => {
    const key = 'ui_about_read_more';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;
    if (locale === 'de') return 'Mehr lesen';
    if (locale === 'tr') return 'Devami';
    return 'Read more';
  }, [ui, locale]);

  return (
    <section className="py-28 lg:py-36" style={{ padding: '7rem 4%' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-[1300px] mx-auto">
        {/* Image */}
        <div className="relative reveal">
          <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
            {heroSrc ? (
              <Image
                src={heroSrc as any}
                alt={heroAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover brightness-[0.85] contrast-[1.05] transition-transform duration-700 hover:scale-[1.04]"

              />
            ) : isLoading ? (
              <div className="w-full h-full bg-bg-card animate-pulse" />
            ) : (
              <div className="w-full h-full bg-bg-card flex items-center justify-center text-text-muted">
                <span className="text-sm">(No Image)</span>
              </div>
            )}
          </div>
          {/* Decorative accents */}
          <div className="absolute -top-6 -right-6 w-[120px] h-[120px] border border-brand-primary opacity-30 pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-[80px] h-[80px] border border-brand-primary opacity-15 pointer-events-none" />
        </div>

        {/* Content */}
        <div className="py-4 reveal reveal-delay-2">
          <span className="section-label">{subLabel}</span>

          <h2 className="font-serif text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.2] mb-5 tracking-[-0.01em]">
            {firstTitle}
          </h2>

          {isLoading ? (
            <div className="space-y-4 mb-8">
              <div className="h-4 bg-bg-card rounded w-full animate-pulse" />
              <div className="h-4 bg-bg-card rounded w-full animate-pulse" />
              <div className="h-4 bg-bg-card rounded w-3/4 animate-pulse" />
            </div>
          ) : hasFirstSummary ? (
            <p className="text-text-secondary font-light leading-[1.9] mb-6">{firstSummary}</p>
          ) : null}

          <Link
            href={aboutHref}
            className="btn-premium inline-flex"
          >
            <span>{readMoreText}</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
