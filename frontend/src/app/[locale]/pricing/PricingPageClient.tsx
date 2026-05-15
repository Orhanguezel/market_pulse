'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Zap } from 'lucide-react';
import { localizePath } from '@/integrations/shared';

type Locale = 'tr' | 'en' | string;

interface PricingPlan {
  code: string;
  name: Record<string, string>;
  price: Record<string, string>;
  desc: Record<string, string>;
  features: Record<string, string[]>;
  cta: Record<string, string>;
  highlight?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    code: 'free',
    name: { tr: 'Ücretsiz', en: 'Free' },
    price: { tr: '₺0 / ay', en: '€0 / mo' },
    desc: { tr: 'Başlamak için ideal.', en: 'Ideal to get started.' },
    features: {
      tr: ['5 analiz / gün', 'Temel risk skoru', 'Son 3 analiz geçmişi'],
      en: ['5 analyses / day', 'Basic risk score', 'Last 3 search history'],
    },
    cta: { tr: 'Ücretsiz Başla', en: 'Start Free' },
  },
  {
    code: 'starter',
    name: { tr: 'Starter', en: 'Starter' },
    price: { tr: '₺299 / ay', en: '€14 / mo' },
    desc: { tr: 'Bireysel satıcılar için.', en: 'For individual sellers.' },
    features: {
      tr: ['30 analiz / gün', '5 boyutlu detaylı skor', 'Keepa fiyat geçmişi', 'CSV export', 'Tam analiz geçmişi'],
      en: ['30 analyses / day', '5-dimensional detailed score', 'Keepa price history', 'CSV export', 'Full search history'],
    },
    cta: { tr: 'Starter Al', en: 'Get Starter' },
    highlight: true,
  },
  {
    code: 'pro',
    name: { tr: 'Pro', en: 'Pro' },
    price: { tr: '₺599 / ay', en: '€28 / mo' },
    desc: { tr: 'Aktif FBA satıcıları için.', en: 'For active FBA sellers.' },
    features: {
      tr: ['Sınırsız analiz', 'Kar simülatörü', 'PDF rapor', 'Watchlist (haftalık otomatik tarama)', 'Çoklu keyword analizi', 'Öncelikli destek'],
      en: ['Unlimited analyses', 'Profit simulator', 'PDF report', 'Watchlist (weekly auto-scan)', 'Multi-keyword analysis', 'Priority support'],
    },
    cta: { tr: 'Pro Al', en: 'Get Pro' },
  },
  {
    code: 'agency',
    name: { tr: 'Ajans', en: 'Agency' },
    price: { tr: '₺1.499 / ay', en: '€69 / mo' },
    desc: { tr: 'Ajanslar ve e-ihracat ekipleri için.', en: 'For agencies and e-export teams.' },
    features: {
      tr: ['Sınırsız analiz', 'Çoklu kullanıcı (5 koltuk)', 'API erişimi', 'BYOK (kendi Keepa key\'in)', 'Özel onboarding', 'SLA desteği'],
      en: ['Unlimited analyses', 'Multi-user (5 seats)', 'API access', 'BYOK (bring your own Keepa key)', 'Custom onboarding', 'SLA support'],
    },
    cta: { tr: 'Satış Ekibiyle Konuş', en: 'Talk to Sales' },
  },
];

interface Props {
  locale: Locale;
}

export default function PricingPageClient({ locale }: Props) {
  const lang = (locale?.split('-')[0] || 'tr') as 'tr' | 'en';
  const l = lang === 'en' ? 'en' : 'tr';

  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-(--gm-primary)">
            {l === 'tr' ? 'Fiyatlandırma' : 'Pricing'}
          </p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold text-(--gm-text)">
            {l === 'tr' ? 'Analize başlamak için bir plan seçin' : 'Choose a plan to start analyzing'}
          </h1>
          <p className="text-(--gm-muted) max-w-xl mx-auto">
            {l === 'tr'
              ? 'Kredi kartı gerekmez. İstediğiniz zaman planınızı yükseltin veya iptal edin.'
              : 'No credit card required. Upgrade or cancel anytime.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.code}
              className={`relative flex flex-col rounded-4xl border p-8 transition-all ${
                plan.highlight
                  ? 'border-(--gm-primary) bg-(--gm-surface) shadow-[0_0_40px_rgba(var(--gm-primary-rgb),0.15)]'
                  : 'border-(--gm-border-soft) bg-(--gm-surface)/60'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-(--gm-primary) px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  <Zap className="size-3" />
                  {l === 'tr' ? 'En Popüler' : 'Most Popular'}
                </div>
              )}

              <div className="mb-6 space-y-2">
                <h2 className="font-display text-lg font-bold text-(--gm-text)">{plan.name[l]}</h2>
                <div className="font-display text-3xl font-extrabold text-(--gm-text)">{plan.price[l]}</div>
                <p className="text-sm text-(--gm-muted)">{plan.desc[l]}</p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features[l].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-(--gm-text)">
                    <Check className="mt-0.5 size-4 shrink-0 text-(--gm-primary)" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={localizePath(locale, plan.code === 'agency' ? '/contact' : '/register')}
                className={`block w-full rounded-full py-3 text-center text-[11px] font-bold uppercase tracking-widest transition-all ${
                  plan.highlight
                    ? 'bg-(--gm-primary) text-white hover:opacity-90'
                    : 'border border-(--gm-border-soft) text-(--gm-text) hover:bg-(--gm-surface-high)'
                }`}
              >
                {plan.cta[l]}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
