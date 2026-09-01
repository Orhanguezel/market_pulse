import Link from 'next/link';
import type { HizmetHero as HizmetHeroData } from '@/lib/hizmet-content';

type Props = {
  hero: HizmetHeroData;
  icon?: string;
};

export default function HizmetHero({ hero }: Props) {
  return (
    <section className="container mx-auto px-4 pt-14 pb-6">
      <div className="max-w-3xl mx-auto text-center">
        {hero.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary mb-4">
            {hero.eyebrow}
          </p>
        ) : null}

        <h2 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] font-light leading-tight tracking-[-0.01em] text-text-primary mb-6">
          {hero.title}
        </h2>

        {hero.lead ? (
          <p className="text-base md:text-lg leading-relaxed text-text-secondary mb-8">
            {hero.lead}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {hero.primaryCTA?.label ? (
            <Link
              href={hero.primaryCTA.href || '#'}
              className="inline-flex items-center justify-center rounded-full bg-brand-primary px-7 py-3 text-sm font-semibold text-white no-underline transition-opacity hover:opacity-90"
            >
              {hero.primaryCTA.label}
            </Link>
          ) : null}

          {hero.secondaryCTA?.label ? (
            <Link
              href={hero.secondaryCTA.href || '#'}
              className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-medium text-text-primary no-underline transition-colors hover:border-brand-primary hover:text-brand-primary"
            >
              {hero.secondaryCTA.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
