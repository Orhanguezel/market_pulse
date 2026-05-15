'use client';

import Image from 'next/image';
import React, { useMemo } from 'react';
import homeFeatures from '@/config/pages/home-features.json';
import { injectAppName } from '@/lib/page-copy';
import { getPublicAppName } from '@/lib/site-config';

type LocaleKey = 'tr' | 'en' | 'de';

type FeatureBlock = {
  num: string;
  title: string;
  body: string;
  meta: string[];
  settingKey: string;
  imageFallback: string;
  overlayLabel: string;
  imageAlt: string;
};

type FeaturesLocale = {
  eyebrow: string;
  title: string;
  features: FeatureBlock[];
};

function pickLocaleKey(locale: string): LocaleKey {
  const k = locale.split('-')[0]?.toLowerCase();
  if (k === 'de') return 'de';
  if (k === 'en') return 'en';
  return 'tr';
}

export default function FeaturesNew({
  locale = 'tr',
  imageUrls,
}: {
  locale?: string;
  /** HomeContent sunucuda doldurur; yoksa imageFallback kullanılır. */
  imageUrls?: string[];
}) {
  const app = getPublicAppName();
  const lk = pickLocaleKey(locale);
  const raw = homeFeatures as Record<LocaleKey, FeaturesLocale>;
  const base = raw[lk] || raw.en;
  const copy = useMemo(
    () => ({
      eyebrow: injectAppName(base.eyebrow, app),
      title: injectAppName(base.title, app),
      features: base.features,
    }),
    [base, app],
  );

  return (
    <section className="py-32 px-6 bg-[var(--gm-bg-deep)] relative border-t border-[var(--gm-border-soft)]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24 reveal">
          <span className="font-display text-[11px] tracking-[0.42em] text-[var(--gm-gold-deep)] uppercase mb-6 block">
            {copy.eyebrow}
          </span>
          <h2
            className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-tight text-[var(--gm-text)]"
            dangerouslySetInnerHTML={{ __html: copy.title }}
          />
        </div>

        <div className="space-y-32">
          {copy.features.map((feat, idx) => {
            const fromServer = imageUrls?.[idx]?.trim();
            const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
            const localFallback = feat.imageFallback?.startsWith('/') ? `${basePath}${feat.imageFallback}` : feat.imageFallback;
            const src = fromServer || localFallback;
            const isRtl = idx === 1;

            return (
              <div
                key={feat.settingKey}
                className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center reveal"
              >
                <div className={isRtl ? 'md:order-2' : ''}>
                  <div className="font-display text-[14px] tracking-[0.2em] text-[var(--gm-gold)] mb-6">{feat.num}</div>
                  <h3
                    className="font-serif text-3xl lg:text-4xl text-[var(--gm-text)] leading-snug mb-6 [&>em]:text-[var(--gm-gold)] [&>em]:italic"
                    dangerouslySetInnerHTML={{ __html: feat.title }}
                  />
                  <p className="text-[var(--gm-text-dim)] font-light leading-relaxed text-lg mb-8">{feat.body}</p>
                  <div className="flex flex-wrap gap-4 font-display text-[9px] tracking-[0.3em] uppercase text-[var(--gm-gold-deep)]">
                    {feat.meta.map((m, i) => (
                      <span key={i} className="border border-[var(--gm-gold)]/30 py-2 px-4 rounded-full">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  className={`flex justify-center w-full min-w-0 ${isRtl ? 'md:order-1 md:justify-start' : 'md:justify-end'}`}
                >
                  <div className="relative group w-full max-w-[440px]">
                    <div className="absolute -inset-4 bg-gradient-to-r from-[var(--gm-primary)]/20 to-[var(--gm-gold)]/20 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
                    <div className="relative w-full aspect-[4/3] min-h-[220px] max-h-[360px] overflow-hidden rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-bg-deep)] shadow-2xl">
                      <Image
                        src={src}
                        alt={feat.imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 440px"
                        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--gm-text)]/90 via-[var(--gm-text)]/40 to-transparent">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-[var(--gm-gold)] animate-pulse shadow-[0_0_10px_var(--gm-gold)]" />
                          <span className="font-display text-[10px] tracking-[0.25em] text-[var(--gm-gold)] uppercase font-medium">
                            {feat.overlayLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-[300px] pointer-events-none opacity-40 mix-blend-screen overflow-hidden"
        style={{
          backgroundImage: 'var(--gm-bg-image)',
          backgroundSize: 'contain',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
        }}
      />
    </section>
  );
}
