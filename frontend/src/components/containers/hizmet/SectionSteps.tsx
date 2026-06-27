import type { HizmetSectionSteps } from '@/lib/hizmet-content';

export default function SectionSteps({ section }: { section: HizmetSectionSteps }) {
  return (
    <section id={section.id} className="container mx-auto px-4 py-10 scroll-mt-28">
      <div className="max-w-3xl mx-auto">
        {section.heading ? (
          <h2 className="font-serif text-2xl md:text-3xl font-light text-text-primary mb-3 text-center">
            {section.heading}
          </h2>
        ) : null}
        {section.intro ? (
          <p className="text-base leading-relaxed text-text-secondary mb-8 text-center">
            {section.intro}
          </p>
        ) : null}

        <ol className="space-y-4">
          {section.steps.map((step, i) => (
            <li
              key={i}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white">
                {step.n}
              </span>
              <div>
                <h3 className="text-base font-semibold text-text-primary mb-1">{step.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
