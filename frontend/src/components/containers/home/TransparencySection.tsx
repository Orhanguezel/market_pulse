import React from 'react';
import Link from 'next/link';

type LocaleKey = 'tr' | 'en' | 'de';

const COPY: Record<LocaleKey, {
  label: string;
  headline: string;
  headlineAccent: string;
  free: { badge: string; tier: string; price: string; priceSub: string; tagline: string; features: string[]; cta: string };
  pro: { badge: string; tier: string; price: string; priceSub: string; tagline: string; features: string[]; cta: string };
  guarantee: { label: string; body: string };
}> = {
  tr: {
    label: 'Üyelik',
    headline: 'Şeffaf fiyat,',
    headlineAccent: 'saklı koşul yok.',
    free: {
      badge: 'Ücretsiz',
      tier: 'Ücretsiz',
      price: '0',
      priceSub: '/ ay',
      tagline: 'Kayıt olmadan başlayın.',
      features: ['5 analiz / gün', 'Temel risk skoru', 'DE · UK · US marketplace', 'Keepa özet verisi'],
      cta: 'Ücretsiz Başla',
    },
    pro: {
      badge: 'Önerilen',
      tier: 'Starter',
      price: '9',
      priceSub: '/ ay',
      tagline: 'Günlük analizler, tam veri.',
      features: ['Sınırsız analiz', '5 boyutlu risk skoru', 'Keepa fiyat geçmişi & volatilite', 'PDF rapor indirme', 'Net GİR / GIRME kararı', 'Tek tıkla iptal'],
      cta: 'Başla',
    },
    guarantee: {
      label: 'Şeffaflık Garantisi',
      body: 'Ücretli plana geçişi siz onaylarsınız — kimse izniniz olmadan ödeme almaz. Kredi kartı bilgisi ücretsiz planda istenmez.',
    },
  },
  en: {
    label: 'Membership',
    headline: 'Transparent pricing,',
    headlineAccent: 'no hidden terms.',
    free: {
      badge: 'Free',
      tier: 'Free',
      price: '0',
      priceSub: '/ mo',
      tagline: 'Start without signing up.',
      features: ['5 analyses / day', 'Basic risk score', 'DE · UK · US marketplace', 'Keepa summary data'],
      cta: 'Start for Free',
    },
    pro: {
      badge: 'Recommended',
      tier: 'Starter',
      price: '9',
      priceSub: '/ mo',
      tagline: 'Daily analyses, full data.',
      features: ['Unlimited analyses', '5-dimension risk score', 'Keepa price history & volatility', 'PDF report download', 'Clear ENTER / AVOID decision', '1-click cancel'],
      cta: 'Get Started',
    },
    guarantee: {
      label: 'Transparency Guarantee',
      body: 'You manually approve the switch to a paid plan — no charges without your consent. No credit card required on the free plan.',
    },
  },
  de: {
    label: 'Mitgliedschaft',
    headline: 'Transparente Preise,',
    headlineAccent: 'keine versteckten Bedingungen.',
    free: {
      badge: 'Kostenlos',
      tier: 'Kostenlos',
      price: '0',
      priceSub: '/ Monat',
      tagline: 'Ohne Anmeldung starten.',
      features: ['5 Analysen / Tag', 'Basis-Risikobewertung', 'DE · UK · US Marktplatz', 'Keepa-Zusammenfassung'],
      cta: 'Kostenlos starten',
    },
    pro: {
      badge: 'Empfohlen',
      tier: 'Starter',
      price: '9',
      priceSub: '/ Monat',
      tagline: 'Tägliche Analysen, volle Daten.',
      features: ['Unbegrenzte Analysen', '5-dimensionaler Risiko-Score', 'Keepa-Preisverlauf & Volatilität', 'PDF-Bericht herunterladen', 'Klare EINSTEIGEN / MEIDEN Entscheidung', 'Jederzeit kündigen'],
      cta: 'Loslegen',
    },
    guarantee: {
      label: 'Transparenz-Garantie',
      body: 'Sie genehmigen den Wechsel zum kostenpflichtigen Plan selbst — keine Abbuchung ohne Ihre Zustimmung. Für den kostenlosen Plan wird keine Kreditkarte benötigt.',
    },
  },
};

export default function TransparencySection({ locale = 'tr' }: { locale?: string }) {
  const lk = (locale.split('-')[0] as LocaleKey) || 'tr';
  const copy = COPY[lk] ?? COPY.tr;

  return (
    <section className="py-32 bg-[var(--gm-bg)] border-t border-[var(--gm-border-soft)]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <span className="section-label">{copy.label}</span>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-light leading-tight text-[var(--gm-text)]">
            {copy.headline}<br />
            <em className="text-[var(--gm-gold)] italic">{copy.headlineAccent}</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 reveal">
          {/* Free */}
          <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-sm p-12 relative transition-all duration-400 hover:-translate-y-1 hover:shadow-card hover:border-(--gm-gold)/40 group">
            <div className="absolute top-6 right-6 font-display text-[9px] tracking-[0.3em] uppercase py-1.5 px-3 border border-[var(--gm-gold)] text-[var(--gm-gold-deep)] rounded-full">
              {copy.free.badge}
            </div>
            <div className="font-display text-[14px] tracking-[0.32em] text-[var(--gm-gold-deep)] uppercase mb-6">
              {copy.free.tier}
            </div>
            <div className="font-serif font-light text-6xl leading-none mb-2 tracking-tight text-[var(--gm-text)]">
              <sup className="text-2xl font-normal text-[var(--gm-gold-deep)] mr-1 -top-7 relative">$</sup>
              {copy.free.price}
              <small className="text-base text-[var(--gm-muted)] font-normal tracking-wide ml-1">{copy.free.priceSub}</small>
            </div>
            <p className="italic text-[var(--gm-text-dim)] mb-8 text-base leading-relaxed">{copy.free.tagline}</p>
            <ul className="space-y-4 mb-10 text-[var(--gm-text-dim)]">
              {copy.free.features.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="text-[var(--gm-gold)]">✦</span> {f}
                </li>
              ))}
            </ul>
            <Link href={`/${lk}/register`} className="btn-outline-premium w-full justify-center">
              {copy.free.cta}
            </Link>
          </div>

          {/* Starter / Pro */}
          <div
            className="rounded-sm p-12 relative transition-all duration-400 hover:-translate-y-1 hover:shadow-glow group border border-gold-600/40 bg-sand-900 text-text-on-dark"
            style={{
              backgroundImage:
                'radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--color-gold-400) 10%, transparent), transparent 60%)',
            }}
          >
            <div className="absolute top-6 right-6 font-display text-[9px] tracking-[0.3em] uppercase py-1.5 px-3 border border-[var(--gm-gold)] text-[var(--gm-gold)] bg-[var(--gm-gold)]/15 rounded-full">
              {copy.pro.badge}
            </div>
            <div className="font-display text-[14px] tracking-[0.32em] text-[var(--gm-gold)] uppercase mb-6">
              {copy.pro.tier}
            </div>
            <div className="font-serif font-light text-6xl leading-none mb-2 tracking-tight text-text-on-dark">
              <sup className="text-2xl font-normal text-[var(--gm-gold)] mr-1 -top-7 relative">$</sup>
              {copy.pro.price}
              <small className="text-base font-normal tracking-wide ml-1 text-text-on-dark/65">{copy.pro.priceSub}</small>
            </div>
            <p className="italic mb-8 text-base leading-relaxed text-text-on-dark/85">{copy.pro.tagline}</p>
            <ul className="space-y-4 mb-10 text-text-on-dark">
              {copy.pro.features.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="text-[var(--gm-gold)]">✦</span> {f}
                </li>
              ))}
            </ul>
            <Link href={`/${lk}/register`} className="btn-premium w-full justify-center">
              {copy.pro.cta}
            </Link>
          </div>
        </div>

        <div className="mt-16 flex flex-col md:flex-row items-center gap-6 p-8 border border-[var(--gm-gold)]/20 bg-[var(--gm-gold)]/5 reveal">
          <div className="flex-shrink-0 text-[var(--gm-gold)]">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 3 L30 9 V18 C30 24, 25 30, 18 33 C11 30, 6 24, 6 18 V9 Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M13 18 L17 22 L24 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="font-display text-[11px] tracking-[0.2em] text-[var(--gm-gold-deep)] uppercase mb-2">
              {copy.guarantee.label}
            </div>
            <p className="text-[var(--gm-text-dim)] font-light leading-relaxed">
              {copy.guarantee.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
