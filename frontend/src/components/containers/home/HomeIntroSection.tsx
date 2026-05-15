'use client';

import React, { useMemo } from 'react';
import { BookOpen, PlayCircle, BarChart3, type LucideIcon } from 'lucide-react';
import processJson from '@/config/pages/home-intro-process.json';

type LocaleKey = 'tr' | 'en' | 'de';

type Step = { icon: string; title: string; desc: string };

type Bundle = {
  eyebrow: string;
  titleBefore: string;
  titleAccent: string;
  lead: string;
  steps: Step[];
};

const ICONS: Record<string, LucideIcon> = {
  bookOpen: BookOpen,
  circlePlay: PlayCircle,
  playCircle: PlayCircle,
  chartColumn: BarChart3,
};

function pickLocaleKey(locale: string): LocaleKey {
  const k = locale.split('-')[0]?.toLowerCase();
  if (k === 'de') return 'de';
  if (k === 'en') return 'en';
  return 'tr';
}

export default function HomeIntroSection({ locale = 'tr' }: { locale?: string }) {
  const copy = useMemo(() => {
    const lk = pickLocaleKey(locale);
    const raw = processJson as Record<LocaleKey, Bundle>;
    return raw[lk] || raw.tr;
  }, [locale]);

  return (
    <section className="py-32 bg-[var(--gm-bg-deep)] border-y border-[var(--gm-border-soft)] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--gm-gold)] opacity-[0.03] blur-[120px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="font-display text-[10px] tracking-[0.5em] text-[var(--gm-gold-deep)] uppercase mb-4 block">
            {copy.eyebrow}
          </span>
          <h2 className="font-display text-3xl md:text-5xl text-[var(--gm-text)] mb-6">
            {copy.titleBefore}
            <span className="text-[var(--gm-gold)]">{copy.titleAccent}</span>
          </h2>
          <p className="font-serif italic text-[var(--gm-text-dim)] max-w-2xl mx-auto">
            {copy.lead}
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[var(--gm-border-soft)] to-transparent -translate-y-12" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
            {copy.steps.map((step, idx) => {
              const Icon = ICONS[step.icon] || BookOpen;
              return (
                <div
                  key={idx}
                  className="reveal text-center flex flex-col items-center group"
                  style={{ transitionDelay: `${idx * 120}ms` }}
                >
                  <div className="relative mb-10">
                    <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] text-[var(--gm-gold)] text-[10px] font-bold flex items-center justify-center shadow-md">
                      {idx + 1}
                    </div>

                    <div className="w-24 h-24 rounded-[2rem] bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] flex items-center justify-center text-[var(--gm-gold)] shadow-xl group-hover:border-[var(--gm-gold)]/40 transition-all duration-500 transform group-hover:rotate-[10deg]">
                      <Icon size={36} strokeWidth={1.5} />
                    </div>
                  </div>

                  <h3 className="font-serif text-2xl text-[var(--gm-text)] mb-4 group-hover:text-[var(--gm-gold)] transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-[var(--gm-text-dim)] text-sm leading-relaxed max-w-[280px]">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
