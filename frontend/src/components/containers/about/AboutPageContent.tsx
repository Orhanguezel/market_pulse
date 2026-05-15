'use client';

import React, { useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/shared';
import { downgradeH1ToH2, pickPage, toCdnSrc } from '@/integrations/shared';

import { useLocaleShort, useUiSection } from '@/i18n';
import AuthorBio from '@/components/content/AuthorBio';
import { localizePath } from '@/integrations/shared';
import { getPublicAppName } from '@/lib/site-config';
import { injectAppName } from '@/lib/page-copy';

type AboutCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  founderTitle: string;
  founderParagraphs: string[];
  methodologyTitle: string;
  methodologyParagraphs: string[];
  experienceTitle: string;
  experienceParagraphs: string[];
  differentiatorsTitle: string;
  differentiators: Array<{ title: string; body: string }>;
  authorBio: string;
};

const ABOUT_COPY: Record<string, AboutCopy> = {
  tr: {
    eyebrow: '{{appName}} Hakkinda',
    title: "Amazon'da dogru kategoriye girmek icin veri odakli risk analizi.",
    lead: "{{appName}}, Amazon saticilarinin kategori giris kararlarinda net bir yol gosterir. Keepa kaynakli gercek piyasa verisi, 5 boyutlu risk skoru ve sade bir karar arayuzu ile 'Bu kategoriye girilir mi?' sorusunu dakikalar icinde yanitlar.",
    founderTitle: 'Nasil Ortaya Cikti?',
    founderParagraphs: [
      "{{appName}} fikri, Orhan Guzel'in Amazon pazarlama deneyimi ve yazilim gelistirme gecmisinin kesisiminde dogdu. Amazon'a yeni urun kategorileriyle girerken mevcut araclarin ya cok karmasi ya da cok pahali oldugunu gordu. Saticilar gercekte tek bir soruya cevap ariyordu: 'Bu kategoriye girilir mi, girilmez mi?'",
      "Bu soruyu yanitlamak icin Keepa'nin resmi API'sini temel alarak 5 kritik boyutu (kategori riski, SKU kaos skoru, fiyat savasi riski, marka guvenirliligi ve operasyonel risk) tek bir composite skorla sunan bir arac gelistirdi. Helium10 gibi araclarin sundugu yuzlerce metrik yerine, karari dogrudan etkileyen veriye odaklanmayi tercih etti.",
      "Uzun vadeli vizyon basittir: Amazon'a giris kararlarini herkes icin daha seffaf, daha hizli ve daha guvenilir hale getirmek. DE, UK ve US pazarlarindan baslayarak kuresel marketplace analizine genislemek.",
    ],
    methodologyTitle: 'Metodoloji',
    methodologyParagraphs: [
      "{{appName}} analizleri Amazon'un resmi veri saglayicisi Keepa'dan beslenir. Fiyat gecmisi, buy box volatilitesi ve satici hareketleri gibi gercek veriler tahmine dayali degil; piyasanin mevcut durumunu yansitan somut gostergelerdir.",
      '5 boyutlu risk skoru su metrikleri kapsar: Kategori Riski (rekabet yogunlugu), SKU Kaos Skoru (urun cesitliligi ve yeniden listeleme orani), Fiyat Savasi Riski (fiyat volatilitesi), Marka Guvenirliligi (marka hakimiyeti) ve Operasyonel Risk (lojistik ve stok sorunlari). Bu bes boyut agirlikli ortalama ile tek bir composite skora donusturulur.',
      "Sonuc her zaman net bir karara donusturulur: GIR (dusuk risk), DIKKATLI OL (orta risk) veya GIRME (yuksek risk). Kullanici karmasi grafikler yorumlamak zorunda kalmadan dogrudan karar alabilir.",
    ],
    experienceTitle: 'Teknoloji ve Altyapi',
    experienceParagraphs: [
      "{{appName}}, Next.js ve Fastify uzerine kurulu modern bir SaaS altyapisina sahiptir. Keepa API entegrasyonu gercek zamanli veri cekme ile desteklenir; her analiz istekte yeni veri alinir, cache'lenmez.",
      'DE, UK ve US Amazon marketplacelerini destekler. Turkce, Ingilizce ve Almanca arayuz secenekleri sunar. KVKK uyumlu veri yonetimi ile kullanici sorgulari ve analiz gecmisi yalnizca ilgili kullaniciya aittir.',
    ],
    differentiatorsTitle: 'Neden {{appName}}?',
    differentiators: [
      {
        title: 'Gercek Keepa verisi',
        body: "Tahmine dayali degil; Amazon'un resmi veri saglayicisi Keepa'dan alinan fiyat gecmisi, buy box volatilite ve satici hareketi verileri.",
      },
      {
        title: 'Net GIR / GIRME karari',
        body: 'Yuzlerce metrik yerine 5 kritik boyut ve tek composite skor. En onemli soruya dogrudan yanit.',
      },
      {
        title: 'Sade ve hizli',
        body: '5 ucretsiz analiz kayit olmadan. $9/ay baslangic plani. Kurulum gerektirmez, 2 dakikada kullanmaya baslayin.',
      },
    ],
    authorBio: '{{appName}}, Amazon saticilarinin kategori risk analizini hizli ve guvenilir bicimde yapmasini saglar.',
  },
  en: {
    eyebrow: 'About {{appName}}',
    title: 'Data-driven risk analysis for Amazon category decisions.',
    lead: '{{appName}} helps Amazon sellers make confident category entry decisions. Powered by real Keepa market data, a 5-dimension risk score, and a simple decision interface, it answers "Should I enter this category?" in minutes.',
    founderTitle: 'How It Started',
    founderParagraphs: [
      "{{appName}} was born from the intersection of Amazon marketing experience and software development. Existing tools were either too complex or too expensive. Sellers were looking for a single answer: 'Should I enter this category or not?'",
      "To answer that question, {{appName}} was built on Keepa's official API, presenting 5 critical dimensions (category risk, SKU chaos, price war risk, brand reliability, and operational risk) as a single composite score. Instead of hundreds of metrics, it focuses on the data that directly affects the decision.",
    ],
    methodologyTitle: 'Methodology',
    methodologyParagraphs: [
      "{{appName}} analysis is powered by Keepa, Amazon's official data provider. Price history, buy box volatility, and seller movements are real market data — not estimates.",
      'The 5-dimension risk score covers: Category Risk (competition intensity), SKU Chaos Score (product variety and relisting rate), Price War Risk (price volatility), Brand Reliability (brand dominance), and Operational Risk (logistics and stock issues). These five dimensions are combined into a single weighted composite score.',
    ],
    experienceTitle: 'Technology',
    experienceParagraphs: [
      "{{appName}} is built on a modern SaaS stack with Next.js and Fastify. Keepa API integration provides real-time data — each analysis fetches fresh data on request.",
      'Supports DE, UK and US Amazon marketplaces. Available in Turkish, English and German. GDPR-compliant data management: your queries and analysis history belong only to you.',
    ],
    differentiatorsTitle: 'Why {{appName}}?',
    differentiators: [
      { title: 'Real Keepa data', body: "Not estimates — actual price history, buy box volatility and seller movement data from Amazon's official data provider." },
      { title: 'Clear ENTER / AVOID decision', body: 'Instead of hundreds of metrics, 5 critical dimensions and a single composite score give you a direct answer.' },
      { title: 'Simple and fast', body: '5 free analyses without signing up. $9/mo starter plan. No setup needed — start in 2 minutes.' },
    ],
    authorBio: '{{appName}} helps Amazon sellers perform category risk analysis quickly and reliably.',
  },
  de: {
    eyebrow: 'Uber {{appName}}',
    title: 'Datengestutzte Risikoanalyse fur Amazon-Kategorieentscheidungen.',
    lead: '{{appName}} hilft Amazon-Verkaufern, fundierte Entscheidungen fur den Kategorieeinstieg zu treffen. Mit echten Keepa-Marktdaten, einem 5-dimensionalen Risiko-Score und einer klaren Entscheidungsansicht beantwortet es "Soll ich in diese Kategorie einsteigen?" in wenigen Minuten.',
    founderTitle: 'Wie es entstand',
    founderParagraphs: [
      "{{appName}} entstand aus Amazon-Marketing-Erfahrung und Software-Entwicklung. Bestehende Tools waren entweder zu komplex oder zu teuer. Verkaufer suchten eine einzige Antwort: 'Soll ich in diese Kategorie einsteigen oder nicht?'",
      "Um diese Frage zu beantworten, wurde {{appName}} auf Basis der offiziellen Keepa-API entwickelt. Funf kritische Dimensionen (Kategorierisiko, SKU-Chaos, Preiskampf-Risiko, Markenzuverlassigkeit und operationelles Risiko) werden zu einem einzigen Composite Score zusammengefasst.",
    ],
    methodologyTitle: 'Methodik',
    methodologyParagraphs: [
      "{{appName}}-Analysen basieren auf Keepa, dem offiziellen Amazon-Datenanbieter. Preisverlauf, Buy-Box-Volatilitat und Handlerbewegungen sind echte Marktdaten — keine Schatzungen.",
      'Der 5-dimensionale Risiko-Score umfasst: Kategorierisiko, SKU-Chaos-Score, Preiskampf-Risiko, Markenzuverlassigkeit und operationelles Risiko. Diese funf Dimensionen ergeben einen gewichteten Composite Score.',
    ],
    experienceTitle: 'Technologie',
    experienceParagraphs: [
      "{{appName}} basiert auf einem modernen SaaS-Stack mit Next.js und Fastify. Die Keepa-API-Integration liefert Echtzeit-Daten — jede Analyse ruft frische Daten ab.",
      'Unterstutzt DE, UK und US Amazon-Marktplatze. Verfugbar auf Turkisch, Englisch und Deutsch. DSGVO-konforme Datenverwaltung: Ihre Anfragen und Analysen gehoren nur Ihnen.',
    ],
    differentiatorsTitle: 'Warum {{appName}}?',
    differentiators: [
      { title: 'Echte Keepa-Daten', body: "Keine Schatzungen — echter Preisverlauf, Buy-Box-Volatilitat und Handlerbewegungsdaten vom offiziellen Amazon-Datenanbieter." },
      { title: 'Klare EINSTEIGEN / MEIDEN Entscheidung', body: 'Statt hunderten Metriken: 5 kritische Dimensionen und ein einziger Composite Score.' },
      { title: 'Einfach und schnell', body: '9 $/Monat Starter-Plan. Kein Setup notig — in 2 Minuten startklar.' },
    ],
    authorBio: '{{appName}} hilft Amazon-Verkaufern, Kategorierisiken schnell und zuverlassig zu analysieren.',
  },
};

function personalizeAboutCopy(copy: AboutCopy, app: string): AboutCopy {
  const r = (s: string) => injectAppName(s, app);
  return {
    eyebrow: r(copy.eyebrow),
    title: r(copy.title),
    lead: r(copy.lead),
    founderTitle: r(copy.founderTitle),
    founderParagraphs: copy.founderParagraphs.map(r),
    methodologyTitle: r(copy.methodologyTitle),
    methodologyParagraphs: copy.methodologyParagraphs.map(r),
    experienceTitle: r(copy.experienceTitle),
    experienceParagraphs: copy.experienceParagraphs.map(r),
    differentiatorsTitle: r(copy.differentiatorsTitle),
    differentiators: copy.differentiators.map((d) => ({ title: r(d.title), body: r(d.body) })),
    authorBio: r(copy.authorBio),
  };
}

function getAboutCopy(locale: string): AboutCopy {
  const base = locale === 'en' || locale === 'de' ? ABOUT_COPY[locale] : ABOUT_COPY.tr;
  return personalizeAboutCopy(base, getPublicAppName());
}

const AboutPageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_about', locale as any);
  const copy = getAboutCopy(locale);

  const t = useCallback((key: string, fallback: any) => ui(key, fallback), [ui]);

  const readUi = useCallback(
    (key: string, fallback: any) => {
      const v = t(key, fallback);
      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return fallback;
        if (s === key) return fallback;
      }
      return v;
    },
    [t],
  );

  const { data, isLoading } = useListCustomPagesPublicQuery({
    module_key: 'about',
    locale,
    limit: 10,
    sort: 'created_at',
    orderDir: 'asc',
  });

  const page = useMemo<CustomPageDto | null>(
    () => pickPage(data?.items ?? []),
    [data],
  );

  const headerSubtitlePrefix = useMemo(
    () => String(readUi('ui_about_subprefix', 'Amazon Risk Analizi') || '').trim() || 'Amazon Risk Analizi',
    [readUi],
  );

  const headerSubtitleLabel = useMemo(() => {
    const v = String(readUi('ui_about_sublabel', '') || '').trim();
    return v;
  }, [readUi]);

  const headerTitle = useMemo(() => {
    const v = String(readUi('ui_about_page_title', '') || '').trim();
    if (v) return v;
    if (locale === 'de') return 'Uber uns';
    if (locale === 'tr') return 'Hakkimizda';
    return 'About';
  }, [readUi, locale]);

  const headerLead = useMemo(() => String(readUi('ui_about_page_lead', '') || '').trim(), [readUi]);

  const html = useMemo(() => {
    const raw = page?.content_html || page?.content || '';
    return raw ? downgradeH1ToH2(raw) : '';
  }, [page]);

  const featuredImageRaw = useMemo(
    () => (page?.featured_image ?? '').trim(),
    [page],
  );

  const imgSrc = useMemo(() => {
    if (!featuredImageRaw) return '';
    const cdn = toCdnSrc(featuredImageRaw, 1200, 800, 'fill');
    return (cdn || featuredImageRaw) as any;
  }, [featuredImageRaw]);

  const imgAlt = useMemo(() => {
    const alt = (page?.featured_image_alt ?? '').trim();
    return alt || 'about image';
  }, [page]);

  const galleryThumbs = useMemo(() => {
    const images = page?.images ?? [];
    const unique = Array.from(new Set(images.filter(Boolean)));
    return unique.filter((x) => x !== featuredImageRaw).slice(0, 3);
  }, [page, featuredImageRaw]);

  return (
    <section className="relative py-16 md:py-24 z-10 bg-[var(--gm-bg)] text-[var(--gm-text)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] opacity-50"
        style={{
          background:
            'radial-gradient(70% 60% at 50% 0%, color-mix(in srgb, var(--gm-primary) 16%, transparent) 0%, transparent 75%)',
        }}
      />

      <div className="container mx-auto px-4 relative">
        <div className="mb-12 text-center">
          <div className="mb-4">
            <span className="block text-[var(--gm-primary)] font-bold uppercase tracking-[0.32em] mb-3 text-[10px] md:text-xs">
              <span>{headerSubtitlePrefix}</span>
              {headerSubtitleLabel ? ` ${headerSubtitleLabel}` : null}
            </span>

            <h2 className="text-3xl md:text-5xl font-serif font-light text-[var(--gm-text)] leading-tight max-w-3xl mx-auto">
              {headerTitle}
            </h2>

            {headerLead ? (
              <p className="mt-5 mb-0 text-[var(--gm-text-dim)] max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-serif italic">{headerLead}</p>
            ) : null}

            <div className="mt-8 inline-flex items-center gap-3">
              <span className="h-px w-12 bg-[var(--gm-primary)]/40" />
              <span className="text-[var(--gm-primary)] text-xs">✦</span>
              <span className="h-px w-12 bg-[var(--gm-primary)]/40" />
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="mb-10 max-w-4xl mx-auto">
            <div className="h-4 bg-[var(--gm-bg-deep)] rounded w-full mb-2.5 animate-pulse" aria-hidden />
            <div className="h-4 bg-[var(--gm-bg-deep)] rounded w-4/5 mb-2.5 animate-pulse" aria-hidden />
            <div className="h-4 bg-[var(--gm-bg-deep)] rounded w-3/5 animate-pulse" aria-hidden />
          </div>
        )}

        {!!page && !isLoading && (
          <>
            {imgSrc && (
              <div className="mb-12 max-w-5xl mx-auto" data-aos="fade-up" data-aos-delay={100}>
                <div className="relative overflow-hidden shadow-medium bg-bg-secondary border border-border-light">
                  <div className="w-full aspect-16/7 md:aspect-16/6 relative">
                    <Image
                      src={imgSrc}
                      alt={imgAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1100px"
                      priority
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="max-w-3xl mx-auto mb-12" data-aos="fade-up" data-aos-delay={200}>
              {html ? (
                <div
                  className="prose prose-lg prose-rose text-text-secondary max-w-none
                    prose-h2:font-serif prose-h2:text-text-primary prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-0 prose-h2:mb-6
                    prose-h3:font-serif prose-h3:text-text-primary prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-10 prose-h3:mb-4
                    prose-p:leading-relaxed prose-p:mb-5
                    prose-li:leading-relaxed
                    prose-strong:text-text-primary
                    prose-em:text-brand-primary/80
                    prose-a:text-brand-primary"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <div>
                  <p className="mb-0">{readUi('ui_about_empty_text', 'Content will be published here.')}</p>
                </div>
              )}
            </div>

            {galleryThumbs.length > 0 && (
              <div className="max-w-5xl mx-auto" data-aos="fade-up" data-aos-delay={300}>
                <div className={`grid gap-4 md:gap-6 ${
                  galleryThumbs.length === 1
                    ? 'grid-cols-1 max-w-2xl mx-auto'
                    : galleryThumbs.length === 2
                      ? 'grid-cols-2 max-w-4xl mx-auto'
                      : 'grid-cols-2 md:grid-cols-3'
                }`}>
                  {galleryThumbs.map((src, i) => (
                    <div
                      key={src}
                      className={`relative overflow-hidden border border-border-light bg-bg-secondary shadow-soft
                        transition-transform duration-500 hover:scale-[1.02] hover:shadow-medium
                        ${galleryThumbs.length === 3 && i === 0 ? 'col-span-2 md:col-span-1' : ''}`}
                    >
                      <div className="aspect-4/3 relative">
                        <Image
                          src={src}
                          alt={`${imgAlt} ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 350px"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-[var(--gm-primary)]/25 bg-[var(--gm-surface)] p-7 md:p-12 shadow-[var(--gm-shadow-card)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--gm-primary)] via-[var(--gm-accent)] to-[var(--gm-gold)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--gm-primary)]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 text-3xl font-serif leading-tight text-[var(--gm-text)] md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--gm-text-dim)] font-serif italic">{copy.lead}</p>
          </div>

          <div className="mt-10 space-y-8">
            {[
              { title: copy.founderTitle, paragraphs: copy.founderParagraphs },
              { title: copy.methodologyTitle, paragraphs: copy.methodologyParagraphs },
              { title: copy.experienceTitle, paragraphs: copy.experienceParagraphs },
            ].map((section, idx) => (
              <section
                key={section.title}
                className="rounded-3xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-7 md:p-10 shadow-[var(--gm-shadow-soft)] hover:border-[var(--gm-primary)]/30 hover:shadow-[var(--gm-shadow-card)] transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--gm-primary)]/10 text-[var(--gm-primary)] font-serif text-lg font-bold">
                    {idx + 1}
                  </span>
                  <h2 className="text-2xl font-serif text-[var(--gm-text)]">{section.title}</h2>
                </div>
                <div className="space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-relaxed text-[var(--gm-text-dim)]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-12">
            <div className="text-center mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--gm-primary)] mb-2">
                ✦ {locale === 'tr' ? 'Farki' : locale === 'de' ? 'Unsere Starke' : 'Our Edge'} ✦
              </p>
              <h2 className="text-2xl md:text-3xl font-serif text-[var(--gm-text)]">{copy.differentiatorsTitle}</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {copy.differentiators.map((item) => (
                <article
                  key={item.title}
                  className="group rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-6 hover:border-[var(--gm-primary)]/40 hover:shadow-[var(--gm-shadow-gold)] hover:-translate-y-1 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--gm-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--gm-primary)]/20 transition-colors">
                    <span className="text-[var(--gm-primary)] text-lg">✦</span>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-[var(--gm-text)]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--gm-text-dim)]">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-12 rounded-3xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-7 md:p-10 shadow-[var(--gm-shadow-soft)]">
            <AuthorBio
              name="Orhan Guzel"
              title={
                locale === 'tr'
                  ? `${getPublicAppName()} Kurucusu`
                  : locale === 'de'
                    ? `Grunder von ${getPublicAppName()}`
                    : `Founder of ${getPublicAppName()}`
              }
              bio={copy.authorBio}
              expertise={['Amazon Analysis', 'E-commerce Risk', 'Keepa Data']}
            />
          </div>

          <div className="mt-10 text-center">
            <Link
              href={localizePath(locale, '/register')}
              className="inline-flex items-center gap-3 rounded-full bg-[var(--gm-primary)] hover:bg-[var(--gm-primary-dark)] px-8 py-4 text-xs font-bold uppercase tracking-[0.24em] text-white shadow-[var(--gm-shadow-card)] hover:shadow-[var(--gm-shadow-gold)] transition-all"
            >
              {locale === 'tr' ? 'Ucretsiz Deneyin' : locale === 'de' ? 'Kostenlos testen' : 'Try For Free'}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPageContent;
