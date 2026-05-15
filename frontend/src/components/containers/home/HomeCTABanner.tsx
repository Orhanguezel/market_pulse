'use client';

import React from 'react';
import Link from 'next/link';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';

const COPY = {
  tr: {
    title: 'Amazon kategorinizi analiz etmeye hazır mısınız?',
    desc: 'Ücretsiz başlayın. Keyword yazın, riski ölçün, bilinçli karar alın.',
    cta: 'Ücretsiz Analiz Yap',
    secondary: 'Nasıl çalışır?',
  },
  en: {
    title: 'Ready to analyze your Amazon category?',
    desc: 'Start for free. Enter a keyword, measure the risk, make an informed decision.',
    cta: 'Start Free Analysis',
    secondary: 'How it works',
  },
  de: {
    title: 'Bereit, Ihre Amazon-Kategorie zu analysieren?',
    desc: 'Kostenlos starten. Keyword eingeben, Risiko messen, fundierte Entscheidung treffen.',
    cta: 'Kostenlos analysieren',
    secondary: 'Wie es funktioniert',
  },
};

export default function HomeCTABanner({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale) || 'tr';
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.tr;

  return (
    <section className="py-28 relative overflow-hidden" style={{ padding: '7rem 4%' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, var(--color-brand-primary) 0%, transparent 70%)',
          opacity: 0.07,
        }}
      />
      <div className="max-w-[700px] mx-auto text-center relative reveal">
        <h2 className="font-serif text-[clamp(2rem,4.5vw,3.6rem)] font-light leading-[1.15] mb-5">
          {copy.title}
        </h2>
        <p className="text-text-secondary font-light leading-[1.8] text-base mb-10 max-w-[480px] mx-auto">
          {copy.desc}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href={localizePath(locale, '/register')} className="btn-premium">
            <span>{copy.cta}</span>
          </Link>
          <Link href={localizePath(locale, '/faqs')} className="btn-outline-premium">
            {copy.secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
