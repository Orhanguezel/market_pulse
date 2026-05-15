'use client';

import React from 'react';
import Link from 'next/link';
import { useResolvedLocale, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

type Props = { title: string };

const Banner: React.FC<Props> = ({ title }) => {
  const locale = useResolvedLocale();
  const { ui } = useUiSection('ui_banner', locale);
  const homeHref = localizePath(locale, '/');

  return (
    <section
      data-header-overlay="true"
      className="relative py-32 md:py-40 overflow-hidden bg-background"
    >
      {/* Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gold line top */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-20" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Section label */}
          <div className="section-label justify-center mb-6">
            <Link
              href={homeHref}
              className="text-muted-foreground hover:text-brand-primary transition-colors no-underline"
            >
              {ui('ui_breadcrumb_home', 'Home')}
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-brand-primary">{title}</span>
          </div>

          {/* Title — theme-aware (dark/light contrast) */}
          <h1 className="font-serif text-[clamp(2.4rem,5vw,4rem)] font-light leading-[1.1] tracking-[-0.01em] text-foreground">
            {title}
          </h1>
        </div>
      </div>

      {/* Gold line bottom */}
      <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-15" />
    </section>
  );
};

export default Banner;
