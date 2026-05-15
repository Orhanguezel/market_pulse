import React from 'react';

export type LandingIntroSection = {
  title: string;
  paragraphs: string[];
};

export type LandingIntroProps = {
  eyebrow: string;
  title: string;
  lead: string;
  summary: string;
  sections: LandingIntroSection[];
};

export default function LandingIntro({
  eyebrow,
  title,
  lead,
  summary,
  sections,
}: LandingIntroProps) {
  return (
    <section className="mx-auto mb-12 max-w-5xl px-4">
      <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/60 p-6 md:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--gm-gold-dim)]">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-[var(--gm-text)] md:text-5xl">{title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-[var(--gm-text-dim)]">{lead}</p>
      </div>

      <div data-speakable className="mt-6 rounded-2xl border border-[var(--gm-gold)]/20 bg-[var(--gm-gold)]/10 p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--gm-gold)]">Özetle</p>
        <p className="mt-3 text-base leading-relaxed text-[var(--gm-text)]">{summary}</p>
      </div>

      <div className="mt-6 grid gap-5">
        {sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/45 p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-[var(--gm-text)]">{section.title}</h2>
            <div className="mt-4 space-y-4">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="leading-relaxed text-[var(--gm-text-dim)]">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
