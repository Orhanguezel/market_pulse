import React from 'react';

export type FaqAccordionItem = {
  question: string;
  answer: string;
};

export default function FaqAccordion({ items, title = 'Sıkça Sorulan Sorular' }: { items: FaqAccordionItem[]; title?: string }) {
  if (!items.length) return null;

  return (
    <section className="mx-auto mt-16 max-w-4xl rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/60 p-6 md:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--gm-gold-dim)]">FAQ</p>
      <h2 className="mt-2 text-2xl font-semibold text-[var(--gm-text)]">{title}</h2>
      <div className="mt-6 divide-y divide-[var(--gm-border-soft)]">
        {items.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-[var(--gm-text)]">
              {item.question}
              <span className="text-xl text-[var(--gm-gold)] transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-[var(--gm-text-dim)]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
