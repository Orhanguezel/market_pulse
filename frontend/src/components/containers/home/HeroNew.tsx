'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import homeHero from '@/config/pages/home-hero.json';
import { injectAppName } from '@/lib/page-copy';
import {
  getPublicAppName,
  getWordMarkLine1,
  getWordMarkLine2,
} from '@/lib/site-config';
import { localizePath } from '@/integrations/shared';

type LocaleKey = 'tr' | 'en' | 'de';

type HeroMetric = { value: string; label: string };

type HeroJson = {
  eyebrow: string;
  title: string;
  subtitle: string;
  headline: string;
  tagline: string;
  primaryCTA: string;
  secondaryCTA: string;
  scrollHint: string;
  heroTitleLine1?: string;
  heroTitleGradient?: string;
  lead?: string;
  socialProof?: string;
  metrics?: HeroMetric[];
  showcaseTopic?: string;
  showcaseProgress?: string;
  showcaseQuestion?: string;
  showcaseOptionA?: string;
  showcaseOptionB?: string;
  showcaseOptionC?: string;
  showcaseOptionD?: string;
  showcaseXpLabel?: string;
  showcaseXpValue?: string;
  showcaseStreak?: string;
  showcaseStreakSuffix?: string;
  showcaseStreakSub?: string;
  showcaseBadgeTitle?: string;
  showcaseBadgeSub?: string;
  showcaseXpGain?: string;
};

function pickLocaleKey(locale: string): LocaleKey {
  const k = locale.split('-')[0]?.toLowerCase();
  if (k === 'de') return 'de';
  if (k === 'en') return 'en';
  return 'tr';
}

export default function HeroNew({ locale = 'tr' }: { locale?: string }) {
  const app = getPublicAppName();
  const word1 = getWordMarkLine1();
  const word2 = getWordMarkLine2();
  const localeKey = pickLocaleKey(locale);

  const copy = useMemo(() => {
    const raw = homeHero as Record<LocaleKey, HeroJson>;
    const base = raw[localeKey] || raw.en;
    const inj = (s: string) => injectAppName(s, app);
    const metrics = (base.metrics ?? []).map((m) => ({
      value: inj(m.value),
      label: inj(m.label),
    }));
    return {
      eyebrow: inj(base.eyebrow),
      headline: inj(base.headline),
      tagline: inj(base.tagline),
      lead: inj(base.lead ?? base.tagline),
      primaryCTA: inj(base.primaryCTA),
      secondaryCTA: inj(base.secondaryCTA),
      scrollHint: inj(base.scrollHint),
      socialProof: base.socialProof ? inj(base.socialProof) : '',
      metrics,
      titleLine1: base.heroTitleLine1
        ? inj(base.heroTitleLine1)
        : word1 || inj(base.title),
      titleGradient: base.heroTitleGradient
        ? inj(base.heroTitleGradient)
        : word2 || inj(base.subtitle),
      showcaseTopic: inj(base.showcaseTopic ?? ''),
      showcaseProgress: inj(base.showcaseProgress ?? ''),
      showcaseQuestion: inj(base.showcaseQuestion ?? ''),
      showcaseOptionA: inj(base.showcaseOptionA ?? ''),
      showcaseOptionB: inj(base.showcaseOptionB ?? ''),
      showcaseOptionC: inj(base.showcaseOptionC ?? ''),
      showcaseOptionD: inj(base.showcaseOptionD ?? ''),
      showcaseXpLabel: inj(base.showcaseXpLabel ?? 'XP'),
      showcaseXpValue: inj(base.showcaseXpValue ?? '320'),
      showcaseStreak: inj(base.showcaseStreak ?? '12'),
      showcaseStreakSuffix: inj(base.showcaseStreakSuffix ?? ''),
      showcaseStreakSub: inj(base.showcaseStreakSub ?? ''),
      showcaseBadgeTitle: inj(base.showcaseBadgeTitle ?? ''),
      showcaseBadgeSub: inj(base.showcaseBadgeSub ?? ''),
      showcaseXpGain: inj(base.showcaseXpGain ?? '+20 XP'),
    };
  }, [localeKey, app, word1, word2]);

  const exploreHref = localizePath(locale, '/register');

  const avatarMid = copy.metrics[1]?.value ?? '14';

  return (
    <section
      className="relative flex min-h-[88vh] flex-col overflow-hidden border-b border-slate-200/80"
      aria-labelledby="hero-title"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#fbfff8_0%,#ffffff_42%,#f7fff9_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(132,204,22,0.2),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(251,191,36,0.16),transparent_25%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.45] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.85),transparent_72%)] [background-image:linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] [background-size:42px_42px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-[140px] bottom-5 -z-10 h-[min(520px,90vw)] w-[min(520px,90vw)] max-w-[520px] rounded-full bg-[radial-gradient(circle,rgba(22,163,74,0.18),transparent_66%)]"
        aria-hidden
      />

      <div className="container relative z-10 flex flex-1 flex-col justify-center py-16 md:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(280px,0.96fr)] lg:gap-14">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <div className="hero-eyebrow-pill mx-auto lg:mx-0">
              <span className="hero-eyebrow-dot" aria-hidden />
              <span>{copy.eyebrow}</span>
            </div>

            <h1
              id="hero-title"
              className="font-display mt-6 text-[clamp(2.375rem,7vw,5.5rem)] font-extrabold leading-[0.94] tracking-[-0.075em] text-slate-900"
            >
              <span className="block">{copy.titleLine1}</span>
              <span className="text-gradient-brand">{copy.titleGradient}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-[640px] text-pretty text-[clamp(1rem,2vw,1.25rem)] leading-[1.75] text-slate-600 lg:mx-0">
              {copy.lead}
            </p>

            <h2
              className="font-sans mx-auto mt-6 max-w-3xl text-[clamp(1.05rem,2.2vw,1.35rem)] font-semibold leading-snug text-slate-700 lg:mx-0 [&>em]:text-emerald-700 [&>em]:not-italic [&>strong]:font-semibold [&>strong]:text-slate-800"
              dangerouslySetInnerHTML={{ __html: copy.headline }}
            />

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
              <Link href={exploreHref} className="btn-hero-primary min-w-[200px]">
                {copy.primaryCTA}
                <ArrowRight size={18} className="shrink-0" aria-hidden />
              </Link>
              <Link href={exploreHref} className="btn-hero-secondary min-w-[200px]">
                {copy.secondaryCTA}
              </Link>
            </div>

            {copy.socialProof ? (
              <div
                className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm font-extrabold text-slate-700 lg:justify-start"
                aria-label={copy.socialProof}
              >
                <div className="flex items-center -space-x-2.5" aria-hidden>
                  <div className="grid size-[34px] place-items-center rounded-full border-[3px] border-white bg-gradient-to-br from-emerald-100 to-emerald-500 text-[13px] font-black text-emerald-900 shadow-md first:ml-0">
                    {copy.showcaseXpLabel}
                  </div>
                  <div className="grid size-[34px] place-items-center rounded-full border-[3px] border-white bg-gradient-to-br from-emerald-100 to-emerald-500 text-[13px] font-black text-emerald-900 shadow-md">
                    {avatarMid}
                  </div>
                  <div className="grid size-[34px] place-items-center rounded-full border-[3px] border-white bg-gradient-to-br from-emerald-100 to-emerald-500 text-[13px] font-black text-emerald-900 shadow-md">
                    ✓
                  </div>
                </div>
                <span className="max-w-xs text-left lg:max-w-none">{copy.socialProof}</span>
              </div>
            ) : null}

            {copy.metrics.length > 0 ? (
              <div
                className="mt-9 grid max-w-[620px] grid-cols-1 gap-3.5 sm:grid-cols-3 lg:mx-0"
                aria-label={copy.scrollHint}
              >
                {copy.metrics.map((m) => (
                  <div key={`${m.value}-${m.label}`} className="hero-metric-card text-left">
                    <strong className="block text-3xl tracking-[-0.06em] text-slate-900">{m.value}</strong>
                    <span className="mt-2 block text-[13px] font-extrabold text-slate-500">{m.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div
            className="relative mx-auto hidden min-h-[420px] w-full max-w-[420px] place-items-center lg:grid"
            aria-hidden
          >
            <div className="absolute inset-x-0 bottom-8 mx-auto h-[min(520px,70vw)] w-[min(520px,95%)] animate-hero-float rounded-[46%_54%_55%_45%/55%_42%_58%_45%] bg-[radial-gradient(circle_at_34%_22%,rgba(255,255,255,0.9),transparent_22%),linear-gradient(135deg,#dcfce7,#86efac_48%,#16a34a)] opacity-[0.82] shadow-[0_24px_70px_rgba(22,163,74,0.24)]" />

            <div className="absolute right-0 top-[8%] z-[3] max-w-[140px] rotate-[-8deg] rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
              <div className="text-lg leading-none" aria-hidden>
                🔥
              </div>
              <div className="mt-1 text-xs font-extrabold leading-tight text-slate-800">
                {copy.showcaseStreak} {copy.showcaseStreakSuffix}
                <span className="mt-0.5 block text-[10px] font-bold text-slate-500">{copy.showcaseStreakSub}</span>
              </div>
            </div>

            <div className="relative z-[2] w-[min(380px,86vw)] rotate-[3deg] rounded-[42px] bg-gradient-to-br from-slate-900 to-slate-950 p-3.5 shadow-[0_32px_90px_rgba(2,6,23,0.28)]">
              <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-emerald-50 to-white px-4 pb-5 pt-12">
                <div className="absolute left-1/2 top-5 h-7 w-[92px] -translate-x-1/2 rounded-full bg-slate-900/90" />
                <div className="mb-3 flex items-center justify-between text-[11px] font-extrabold text-slate-700">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-900">
                    {copy.showcaseXpLabel} <strong className="tabular-nums">{copy.showcaseXpValue}</strong>
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-950">🔥 {copy.showcaseStreak}</span>
                </div>
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                  <div className="h-full w-[70%] rounded-full bg-emerald-500" />
                </div>
                <p className="text-[11px] font-bold text-slate-500">
                  {copy.showcaseTopic} · {copy.showcaseProgress}
                </p>
                <p className="mt-2 text-sm font-extrabold leading-snug text-slate-800">{copy.showcaseQuestion}</p>
                <ul className="mt-3 space-y-1.5 text-[11px] font-bold text-slate-600">
                  <li className="rounded-xl border border-slate-200/80 bg-white/80 px-2.5 py-2">{copy.showcaseOptionA}</li>
                  <li className="rounded-xl border border-emerald-400 bg-emerald-50 px-2.5 py-2 text-emerald-950">
                    {copy.showcaseOptionB}{' '}
                    <span className="float-right text-emerald-600" aria-hidden>
                      ✓
                    </span>
                  </li>
                  <li className="rounded-xl border border-slate-200/80 bg-white/80 px-2.5 py-2">{copy.showcaseOptionC}</li>
                  <li className="rounded-xl border border-slate-200/80 bg-white/80 px-2.5 py-2">{copy.showcaseOptionD}</li>
                </ul>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white">
                  <span>{copy.showcaseXpGain}</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-[6%] left-0 z-[3] max-w-[150px] rotate-[6deg] rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
              <div className="text-lg leading-none" aria-hidden>
                🏆
              </div>
              <div className="mt-1 text-xs font-extrabold leading-tight text-slate-800">
                {copy.showcaseBadgeTitle}
                <span className="mt-0.5 block text-[10px] font-bold text-slate-500">{copy.showcaseBadgeSub}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 font-display text-[10px] uppercase tracking-[0.35em] text-slate-400 opacity-70">
        <span>{copy.scrollHint}</span>
        <div className="relative h-12 w-px bg-gradient-to-b from-slate-300 to-transparent">
          <div className="absolute left-0 top-0 h-1/2 w-full origin-top animate-[scrollLine_2s_ease-in-out_infinite] bg-emerald-500" />
        </div>
      </div>
    </section>
  );
}
