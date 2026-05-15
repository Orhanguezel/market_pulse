import React from 'react';

const COPY = {
  tr: {
    eyebrow: 'GÜVENİLİR VERİ · ŞEFFAF KARAR',
    title: 'Neden <em>MarketPulse</em>?',
    promises: [
      {
        num: '01',
        title: 'Gerçek Keepa verisi, gerçek karar',
        text: 'Analizlerimiz Amazon\'un resmi veri sağlayıcısı Keepa\'dan beslenir. Tahmine dayalı değil; fiyat geçmişi, buy box volatilite ve satıcı hareketlerine dayalı somut veri.',
        target: 'GÜVEN'
      },
      {
        num: '02',
        title: 'Karmaşık araç değil, net yanıt',
        text: 'Helium10 gibi yüzlerce metric yerine, 5 kritik boyut ve tek composite skor. Amazon\'a girilir mi, girilmez mi — en önemli soruya doğrudan yanıt.',
        target: 'SADELİK'
      },
      {
        num: '03',
        title: 'KVKK uyumlu, veri sizin',
        text: 'Sorgularınız ve analizleriniz yalnızca size aittir. Verileriniz üçüncü taraflarla paylaşılmaz. Hesabınızı istediğiniz zaman silebilirsiniz.',
        target: 'GİZLİLİK'
      }
    ]
  },
  en: {
    eyebrow: 'TRUSTED DATA · CLEAR DECISION',
    title: 'Why <em>MarketPulse</em>?',
    promises: [
      {
        num: '01',
        title: 'Real Keepa data, real decisions',
        text: 'Our analysis is powered by Keepa, the official Amazon data provider. Not estimates — real price history, buy box volatility and seller movement data.',
        target: 'TRUST'
      },
      {
        num: '02',
        title: 'Not a complex tool, a clear answer',
        text: 'Instead of hundreds of metrics like Helium10, we offer 5 critical dimensions and a single composite score. A direct answer to the most important question: enter or not?',
        target: 'SIMPLICITY'
      },
      {
        num: '03',
        title: 'GDPR-compliant, your data is yours',
        text: 'Your queries and analyses belong only to you. Your data is never shared with third parties. You can delete your account at any time.',
        target: 'PRIVACY'
      }
    ]
  },
  de: {
    eyebrow: 'VERLÄSSLICHE DATEN · KLARE ENTSCHEIDUNG',
    title: 'Warum <em>MarketPulse</em>?',
    promises: [
      {
        num: '01',
        title: 'Echte Keepa-Daten, echte Entscheidungen',
        text: 'Unsere Analysen werden von Keepa, dem offiziellen Amazon-Datenanbieter, gespeist. Keine Schätzungen — echte Preisverlaufsdaten, Buy-Box-Volatilität und Händlerbewegungen.',
        target: 'VERTRAUEN'
      },
      {
        num: '02',
        title: 'Kein komplexes Tool, eine klare Antwort',
        text: 'Statt hunderten Metriken wie bei Helium10 bieten wir 5 kritische Dimensionen und einen einzigen Composite Score. Eine direkte Antwort: Einsteigen oder nicht?',
        target: 'EINFACHHEIT'
      },
      {
        num: '03',
        title: 'DSGVO-konform, Ihre Daten gehören Ihnen',
        text: 'Ihre Anfragen und Analysen gehören nur Ihnen. Keine Weitergabe an Dritte. Konto jederzeit löschbar.',
        target: 'DATENSCHUTZ'
      }
    ]
  }
};

export default function PromisesSection({ locale = 'tr' }: { locale?: string }) {
  const copy = COPY[locale as keyof typeof COPY] || COPY.tr;

  return (
    <section className="py-32 px-6 bg-[var(--gm-bg)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24 reveal">
          <span className="section-label">{copy.eyebrow}</span>
          <h2 
            className="font-serif text-[clamp(2.5rem,5vw,4rem)] italic font-light text-[var(--gm-text)] leading-tight"
            dangerouslySetInnerHTML={{ __html: copy.title }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--gm-border-soft)] border border-[var(--gm-border-soft)]">
          {copy.promises.map((p, i) => (
            <div key={i} className="bg-[var(--gm-bg)] p-12 hover:bg-[var(--gm-bg-deep)] transition-colors group reveal">
              <span className="font-display text-6xl text-[var(--gm-gold)] opacity-30 block mb-8 group-hover:opacity-50 transition-opacity">
                {p.num}
              </span>
              <h3 className="font-serif text-2xl text-[var(--gm-text)] mb-4">{p.title}</h3>
              <p className="text-[var(--gm-text-dim)] leading-relaxed mb-8">{p.text}</p>
              <span className="font-display text-[10px] tracking-[0.32em] text-[var(--gm-muted)] uppercase">
                {p.target}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
