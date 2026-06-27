import Link from 'next/link';
import type { HizmetClosingCTA as HizmetClosingCTAData } from '@/lib/hizmet-content';

export default function HizmetClosingCTA({ cta }: { cta: HizmetClosingCTAData }) {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-bg-secondary p-8 md:p-12 text-center">
        {cta.heading ? (
          <h2 className="font-serif text-2xl md:text-3xl font-light text-text-primary mb-4">
            {cta.heading}
          </h2>
        ) : null}
        {cta.body ? (
          <p className="text-base leading-relaxed text-text-secondary mb-8 max-w-2xl mx-auto">
            {cta.body}
          </p>
        ) : null}
        {cta.button?.label ? (
          <Link
            href={cta.button.href || '#'}
            className="inline-flex items-center justify-center rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white no-underline transition-opacity hover:opacity-90"
          >
            {cta.button.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
