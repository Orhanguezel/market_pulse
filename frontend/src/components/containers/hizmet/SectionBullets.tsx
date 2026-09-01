import { Check } from 'lucide-react';
import type { HizmetSectionBullets } from '@/lib/hizmet-content';

export default function SectionBullets({ section }: { section: HizmetSectionBullets }) {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {section.heading ? (
          <h2 className="font-serif text-2xl md:text-3xl font-light text-text-primary mb-3">
            {section.heading}
          </h2>
        ) : null}
        {section.intro ? (
          <p className="text-base leading-relaxed text-text-secondary mb-6">{section.intro}</p>
        ) : null}

        <ul className="grid gap-3 sm:grid-cols-2">
          {section.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-primary"
                aria-hidden="true"
              />
              <span className="text-sm leading-relaxed text-text-secondary">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
