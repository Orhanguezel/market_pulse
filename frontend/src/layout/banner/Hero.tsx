'use client';

import React from 'react';
import Link from 'next/link';
import { useUiSection, useResolvedLocale } from '@/i18n';
import { localizePath } from '@/integrations/shared';

const Hero: React.FC<{ locale?: string }> = ({ locale: explicitLocale }) => {
  const locale = useResolvedLocale(explicitLocale);
  const { ui } = useUiSection('ui_hero', locale);

  const heroSub = ui('ui_hero_subtitle', 'ANALİZ • KARAR • BÜYÜ');
  const heroHeadline = ui(
    'ui_hero_headline',
    'Amazon kategori <em>risk analizi</em>',
  );
  const heroTagline = ui(
    'ui_hero_tagline',
    'Keyword bazlı 5 boyutlu pazar analizi ile Amazon\'da doğru kategoriye girin.',
  );

  const ctaText = ui('ui_hero_cta', 'Konulara göz at');
  const secondaryText = ui('ui_hero_cta_secondary', 'Kayıt ol');

  const ctaHref = localizePath(locale, '/topics');
  const secondaryHref = localizePath(locale, '/register');

  // Decorative Stars
  const [stars, setStars] = React.useState<Array<{id: number, top: string, left: string, delay: string}>>([]);

  React.useEffect(() => {
    setStars(Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 4}s`,
    })));
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center overflow-hidden bg-[var(--gm-bg)]">
      {/* Decorative Orbits */}
      <div className="absolute top-[8%] left-[5%] w-72 h-72 opacity-40 pointer-events-none rotate-slow">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="99" stroke="var(--gm-gold)" strokeWidth="0.5" strokeDasharray="4 4" />
          <circle cx="10" cy="100" r="3" fill="var(--gm-gold)" />
        </svg>
      </div>
      <div className="absolute bottom-[12%] right-[6%] w-56 h-56 opacity-30 pointer-events-none rotate-slow-reverse">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="99" stroke="var(--gm-gold)" strokeWidth="0.5" strokeDasharray="2 6" />
          <circle cx="190" cy="100" r="2" fill="var(--gm-gold)" />
        </svg>
      </div>

      {/* Twinkling Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute w-0.5 h-0.5 bg-[var(--gm-gold)] rounded-full twinkle"
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="hero-fade-up hero-fade-up-1 mb-8 inline-flex items-center gap-4 text-[var(--gm-gold-deep)]">
          <div className="w-8 h-[1px] bg-[var(--gm-gold)]" />
          <span className="font-display text-[11px] tracking-[0.42em] uppercase">{heroSub}</span>
          <div className="w-8 h-[1px] bg-[var(--gm-gold)]" />
        </div>

        <h1 className="hero-fade-up hero-fade-up-2 font-display text-[clamp(3rem,8vw,7.5rem)] text-[var(--gm-gold)] leading-none mb-2">
          {ui('ui_hero_title', 'MarketPulse')}
        </h1>

        <div className="hero-fade-up hero-fade-up-3 mb-14 flex items-center justify-center gap-6 text-[var(--gm-gold-deep)]">
          <div className="w-14 h-[1px] bg-[var(--gm-gold)]" />
          <span className="font-display text-[clamp(14px,1.6vw,18px)] tracking-[0.5em] uppercase">
            {ui('ui_hero_accent_word', 'ZİRAAT')}
          </span>
          <div className="w-14 h-[1px] bg-[var(--gm-gold)]" />
        </div>

        <h2 
          className="hero-fade-up hero-fade-up-4 font-serif text-[clamp(1.75rem,4.5vw,3.5rem)] italic font-light leading-[1.15] tracking-tight text-[var(--gm-text)] max-w-4xl mx-auto mb-8"
          dangerouslySetInnerHTML={{ __html: heroHeadline }}
        />

        <p className="hero-fade-up hero-fade-up-4 animation-delay-1000 text-[clamp(16px,1.4vw,19px)] text-[var(--gm-text-dim)] max-w-2xl mx-auto mb-12 leading-relaxed">
          {heroTagline}
        </p>

        <div className="hero-fade-up hero-fade-up-4 animation-delay-1200 flex flex-wrap gap-4 justify-center items-center">
          <Link href={ctaHref} className="btn-premium">
            {ctaText}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href={secondaryHref} className="btn-outline-premium">
            {secondaryText}
          </Link>
        </div>
      </div>

      {/* Scroll Hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-[var(--gm-muted)] opacity-0 animate-fade-in animation-delay-2000">
        <span className="font-display text-[10px] tracking-[0.4em] uppercase">SCROLL</span>
        <div className="w-px h-12 bg-gradient-to-b from-[var(--gm-gold)] to-transparent" />
      </div>
    </section>
  );
};

export default Hero;
