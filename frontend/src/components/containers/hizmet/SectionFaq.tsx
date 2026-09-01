'use client';

import { ChevronDown } from 'lucide-react';
import type { HizmetSectionFaq } from '@/lib/hizmet-content';

/**
 * FAQ akordeonu — projedeki shadcn Accordion Bootstrap sınıfları kullandığı için
 * Tailwind tasarımıyla tutarlı kalmak adına native <details>/<summary> tercih edildi.
 * 'use client' yalnızca tutarlı etkileşim sınırı için; <details> JS gerektirmez.
 */
export default function SectionFaq({ section }: { section: HizmetSectionFaq }) {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {section.heading ? (
          <h2 className="font-serif text-2xl md:text-3xl font-light text-text-primary mb-6 text-center">
            {section.heading}
          </h2>
        ) : null}

        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {section.items.map((item, i) => (
            <details key={i} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left text-base font-medium text-text-primary">
                <span>{item.q}</span>
                <ChevronDown
                  className="h-5 w-5 flex-shrink-0 text-brand-primary transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
