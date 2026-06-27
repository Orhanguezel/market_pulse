import type { HizmetSectionCards } from '@/lib/hizmet-content';

export default function SectionCards({ section }: { section: HizmetSectionCards }) {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {section.heading ? (
          <h2 className="font-serif text-2xl md:text-3xl font-light text-text-primary mb-3 text-center">
            {section.heading}
          </h2>
        ) : null}
        {section.intro ? (
          <p className="text-base leading-relaxed text-text-secondary mb-8 text-center max-w-3xl mx-auto">
            {section.intro}
          </p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-base font-semibold text-text-primary mb-2">{item.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
