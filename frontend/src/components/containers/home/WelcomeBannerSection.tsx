'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLocaleShort } from '@/i18n';
import { getPublicAppName } from '@/lib/site-config';
import { localizePath } from '@/integrations/shared';

type WelcomeCopy = {
  title: string;
  subtitle: string;
  cta: string;
};

const CTA_BY_LOCALE: Record<string, Omit<WelcomeCopy, 'title'>> = {
  tr: {
    subtitle: 'Amazon\'da doğru kategoriye girmek <em>veri gerektirir</em>, tahmin değil.',
    cta: 'ÜCRETSİZ DENE',
  },
  en: {
    subtitle: 'Entering the right Amazon category requires <em>data</em>, not guesswork.',
    cta: 'TRY FOR FREE',
  },
  de: {
    subtitle: 'Die richtige Amazon-Kategorie zu wählen erfordert <em>Daten</em>, keine Vermutungen.',
    cta: 'KOSTENLOS TESTEN',
  },
};

export default function WelcomeBannerSection({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale) || 'tr';
  const app = getPublicAppName();
  const copy = useMemo((): WelcomeCopy & { title: string } => {
    const brandUpper = app.replace(/\s+/g, '').toUpperCase();
    const base = CTA_BY_LOCALE[locale] ?? CTA_BY_LOCALE.tr;
    const title =
      locale === 'en'
        ? `WELCOME TO ${brandUpper}`
        : locale === 'de'
          ? `WILLKOMMEN BEI ${brandUpper}`
          : `${brandUpper}'YA HOŞ GELDİNİZ`;
    return { title, ...base };
  }, [app, locale]);

  return (
    <section className="py-24 px-6 md:py-32 overflow-hidden bg-[var(--gm-bg-deep)] border-y border-[var(--gm-border-soft)] relative">
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-[var(--gm-gold-light)]/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col items-start text-left reveal">
            <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] tracking-[0.1em] text-[var(--gm-text)] mb-6">
              {copy.title}
            </h2>
            <p
              className="font-serif text-[clamp(1.1rem,1.5vw,1.4rem)] italic text-[var(--gm-text-dim)] mb-10 max-w-lg leading-relaxed [&>em]:text-[var(--gm-gold)] [&>em]:font-normal [&>em]:not-italic"
              dangerouslySetInnerHTML={{ __html: copy.subtitle }}
            />
            <Link href={localizePath(locale, '/register')} className="btn-premium group shadow-soft py-4 px-10">
              {copy.cta}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="relative hidden lg:flex items-center justify-center reveal reveal-delay-2">
            <div className="relative w-[420px] h-[420px] flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl border border-[var(--gm-gold-deep)]/15" />
              <div className="absolute inset-[12%] rounded-2xl border border-[var(--gm-gold-deep)]/10" />
              <div className="absolute inset-[24%] rounded-2xl border border-[var(--gm-gold-deep)]/8" />
              <div className="grid grid-cols-2 gap-4 z-10 p-8">
                {[
                  { label: locale === 'tr' ? 'Risk Skoru' : locale === 'de' ? 'Risikowert' : 'Risk Score', val: '23/100', color: 'text-emerald-500' },
                  { label: 'SKU Kaos', val: '7/10', color: 'text-yellow-500' },
                  { label: locale === 'tr' ? 'Fiyat Savaşı' : locale === 'de' ? 'Preiskampf' : 'Price War', val: '4/10', color: 'text-emerald-500' },
                  { label: 'Keepa', val: '↑ 12m', color: 'text-[var(--gm-gold)]' },
                ].map((item) => (
                  <div key={item.label} className="bg-[var(--gm-bg)]/80 border border-[var(--gm-border-soft)] rounded-lg p-3 text-center">
                    <div className={`font-display text-xl font-bold ${item.color}`}>{item.val}</div>
                    <div className="text-[9px] tracking-widest text-[var(--gm-muted)] uppercase mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
