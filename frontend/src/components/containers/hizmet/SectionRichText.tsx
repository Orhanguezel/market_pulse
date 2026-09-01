import type { HizmetSectionRichText } from '@/lib/hizmet-content';

export default function SectionRichText({ section }: { section: HizmetSectionRichText }) {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {section.heading ? (
          <h2 className="font-serif text-2xl md:text-3xl font-light text-text-primary mb-5">
            {section.heading}
          </h2>
        ) : null}
        <div className="space-y-4">
          {section.body.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-text-secondary">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
