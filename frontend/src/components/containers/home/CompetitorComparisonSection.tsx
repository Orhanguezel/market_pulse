'use client';

import React from 'react';
import Link from 'next/link';
import { Check, X, Minus } from 'lucide-react';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';

type LocaleKey = 'tr' | 'en' | 'de';
type CellVal = 'yes' | 'no' | 'partial' | string;

interface Row {
  feature: string;
  marketpulse: CellVal;
  helium10: CellVal;
  satisanaliz: CellVal;
}

interface Copy {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  highlight: string;
  rows: Row[];
  colLabels: { marketpulse: string; helium10: string; satisanaliz: string };
}

const COPY: Record<LocaleKey, Copy> = {
  tr: {
    eyebrow: 'KARŞILAŞTIRMA',
    title: 'Piyasadaki en sade Amazon risk aracı',
    subtitle: 'Karmaşık araçlar için ödeme yapmak zorunda değilsiniz. İhtiyacınız olan tek şey: "Bu kategoriye girilir mi?"',
    cta: 'Ücretsiz Deneyin',
    highlight: 'En İyi Değer',
    colLabels: { marketpulse: 'MarketPulse', helium10: 'Helium10', satisanaliz: 'SatisAnaliz' },
    rows: [
      { feature: 'Ücretsiz plan', marketpulse: '5 analiz/gün', helium10: 'Yok', satisanaliz: 'Sınırlı' },
      { feature: 'Aylık ücret (başlangıç)', marketpulse: '$9', helium10: '$99+', satisanaliz: '₺199+' },
      { feature: '5 boyutlu risk skoru', marketpulse: 'yes', helium10: 'partial', satisanaliz: 'no' },
      { feature: 'Keepa fiyat geçmişi', marketpulse: 'yes', helium10: 'yes', satisanaliz: 'no' },
      { feature: 'Türkçe arayüz', marketpulse: 'yes', helium10: 'no', satisanaliz: 'yes' },
      { feature: 'Global marketplace (DE, UK, US…)', marketpulse: 'yes', helium10: 'yes', satisanaliz: 'no' },
      { feature: 'Net GİR / GIRME kararı', marketpulse: 'yes', helium10: 'no', satisanaliz: 'partial' },
      { feature: 'Kurulum / öğrenme süresi', marketpulse: '< 2 dakika', helium10: 'Saatler', satisanaliz: '~30 dk' },
    ],
  },
  en: {
    eyebrow: 'COMPARISON',
    title: 'The simplest Amazon risk tool on the market',
    subtitle: "You don't need to pay for complex tools. All you need: 'Should I enter this category?'",
    cta: 'Try For Free',
    highlight: 'Best Value',
    colLabels: { marketpulse: 'MarketPulse', helium10: 'Helium10', satisanaliz: 'SatisAnaliz' },
    rows: [
      { feature: 'Free plan', marketpulse: '5 analyses/day', helium10: 'None', satisanaliz: 'Limited' },
      { feature: 'Monthly price (starter)', marketpulse: '$9', helium10: '$99+', satisanaliz: '₺199+' },
      { feature: '5-dimension risk score', marketpulse: 'yes', helium10: 'partial', satisanaliz: 'no' },
      { feature: 'Keepa price history', marketpulse: 'yes', helium10: 'yes', satisanaliz: 'no' },
      { feature: 'Turkish interface', marketpulse: 'yes', helium10: 'no', satisanaliz: 'yes' },
      { feature: 'Global marketplaces (DE, UK, US…)', marketpulse: 'yes', helium10: 'yes', satisanaliz: 'no' },
      { feature: 'Clear ENTER / AVOID decision', marketpulse: 'yes', helium10: 'no', satisanaliz: 'partial' },
      { feature: 'Setup / learning time', marketpulse: '< 2 minutes', helium10: 'Hours', satisanaliz: '~30 min' },
    ],
  },
  de: {
    eyebrow: 'VERGLEICH',
    title: 'Das einfachste Amazon-Risikotool auf dem Markt',
    subtitle: 'Sie müssen keine komplizierten Tools kaufen. Alles, was Sie brauchen: „Soll ich in diese Kategorie einsteigen?"',
    cta: 'Kostenlos testen',
    highlight: 'Bestes Preis-Leistungs-Verhältnis',
    colLabels: { marketpulse: 'MarketPulse', helium10: 'Helium10', satisanaliz: 'SatisAnaliz' },
    rows: [
      { feature: 'Kostenloser Plan', marketpulse: '5 Analysen/Tag', helium10: 'Keiner', satisanaliz: 'Begrenzt' },
      { feature: 'Monatspreis (Starter)', marketpulse: '$9', helium10: '$99+', satisanaliz: '₺199+' },
      { feature: '5-dimensionaler Risiko-Score', marketpulse: 'yes', helium10: 'partial', satisanaliz: 'no' },
      { feature: 'Keepa-Preisverlauf', marketpulse: 'yes', helium10: 'yes', satisanaliz: 'no' },
      { feature: 'Türkische Benutzeroberfläche', marketpulse: 'yes', helium10: 'no', satisanaliz: 'yes' },
      { feature: 'Globale Marktplätze (DE, UK, US…)', marketpulse: 'yes', helium10: 'yes', satisanaliz: 'no' },
      { feature: 'Klare EINSTEIGEN / MEIDEN-Entscheidung', marketpulse: 'yes', helium10: 'no', satisanaliz: 'partial' },
      { feature: 'Einrichtungs-/Lernzeit', marketpulse: '< 2 Minuten', helium10: 'Stunden', satisanaliz: '~30 Min.' },
    ],
  },
};

function Cell({ val, isHighlight }: { val: CellVal; isHighlight?: boolean }) {
  const base = isHighlight ? 'font-bold text-[var(--gm-text)]' : 'text-[var(--gm-text-dim)]';
  if (val === 'yes') {
    return (
      <td className={`px-4 py-4 text-center ${isHighlight ? 'bg-[var(--gm-gold)]/5' : ''}`}>
        <Check className={`mx-auto size-4 ${isHighlight ? 'text-[var(--gm-gold)]' : 'text-emerald-500'}`} />
      </td>
    );
  }
  if (val === 'no') {
    return (
      <td className={`px-4 py-4 text-center ${isHighlight ? 'bg-[var(--gm-gold)]/5' : ''}`}>
        <X className="mx-auto size-4 text-[var(--gm-text-dim)]/30" />
      </td>
    );
  }
  if (val === 'partial') {
    return (
      <td className={`px-4 py-4 text-center ${isHighlight ? 'bg-[var(--gm-gold)]/5' : ''}`}>
        <Minus className="mx-auto size-4 text-yellow-500/70" />
      </td>
    );
  }
  return (
    <td className={`px-4 py-4 text-center text-sm ${base} ${isHighlight ? 'bg-[var(--gm-gold)]/5' : ''}`}>
      {val}
    </td>
  );
}

export default function CompetitorComparisonSection({ locale: explicitLocale }: { locale?: string }) {
  const locale = (useLocaleShort(explicitLocale) || 'tr') as LocaleKey;
  const copy = COPY[locale] ?? COPY.tr;

  return (
    <section className="py-28 bg-[var(--gm-bg-deep)] border-y border-[var(--gm-border-soft)]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <span className="section-label">{copy.eyebrow}</span>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-light text-[var(--gm-text)] mb-4">
            {copy.title}
          </h2>
          <p className="text-[var(--gm-text-dim)] max-w-xl mx-auto leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--gm-border-soft)] reveal">
          <table className="w-full min-w-[580px] text-sm">
            <thead>
              <tr className="border-b border-[var(--gm-border-soft)]">
                <th className="px-4 py-4 text-left font-normal text-[var(--gm-muted)] w-1/3" />
                <th className="px-4 py-4 text-center bg-[var(--gm-gold)]/5 border-x border-[var(--gm-border-soft)]">
                  <span className="font-display font-bold text-[var(--gm-text)] text-base block">
                    {copy.colLabels.marketpulse}
                  </span>
                  <span className="mt-1 inline-block rounded-full bg-[var(--gm-gold)] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-black">
                    {copy.highlight}
                  </span>
                </th>
                <th className="px-4 py-4 text-center font-normal text-[var(--gm-muted)]">
                  {copy.colLabels.helium10}
                </th>
                <th className="px-4 py-4 text-center font-normal text-[var(--gm-muted)]">
                  {copy.colLabels.satisanaliz}
                </th>
              </tr>
            </thead>
            <tbody>
              {copy.rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--gm-border-soft)]/50 hover:bg-[var(--gm-bg-deep)]/50 transition-colors last:border-0"
                >
                  <td className="px-4 py-4 text-[var(--gm-text-dim)] font-medium">
                    {row.feature}
                  </td>
                  <Cell val={row.marketpulse} isHighlight />
                  <Cell val={row.helium10} />
                  <Cell val={row.satisanaliz} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 text-center">
          <Link href={localizePath(locale, '/register')} className="btn-premium">
            <span>{copy.cta}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
