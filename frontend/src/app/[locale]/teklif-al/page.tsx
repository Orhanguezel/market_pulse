'use client';

import React, { useMemo } from 'react';

import { LayoutSeoBridge } from '@/seo';

import ContactPage from '@/components/containers/contact/ContactPage';
import IyPageHeader from '@/components/iy/IyPageHeader';
import { IY_SURFACE_STYLE } from '@/components/iy/iy-data';

import { useLocaleShort } from '@/i18n';
import { getPublicAppName, titleWithAppName } from '@/lib/site-config';

/**
 * /teklif-al — CTA hedef sayfası. ~66 hizmet sayfası bu route'a link verir.
 * İletişim formunu yeniden kullanır (ContactPage); yalnızca başlık + kısa
 * teklif/demo talep girişi farklıdır. Form mantığı tekrar edilmez.
 */
export default function TeklifAlPage() {
  const locale = useLocaleShort();

  const copy = useMemo(() => {
    if (locale === 'en') {
      return {
        bannerTitle: 'Get a Quote',
        intro:
          'Tell us about your business and what you need. Send us a message and our team will get back to you shortly with a quote or a demo.',
      };
    }
    if (locale === 'de') {
      return {
        bannerTitle: 'Angebot anfordern',
        intro:
          'Erzählen Sie uns von Ihrem Unternehmen und Ihren Anforderungen. Senden Sie uns eine Nachricht und unser Team meldet sich in Kürze mit einem Angebot oder einer Demo bei Ihnen.',
      };
    }
    return {
      bannerTitle: 'Teklif Al',
      intro:
        'İşletmenizi ve ihtiyaçlarınızı kısaca anlatın. Bize mesaj gönderin, ekibimiz kısa süre içinde teklif veya demo için size dönüş yapsın.',
    };
  }, [locale]);

  const appName = getPublicAppName();

  const seoDescription = useMemo(() => {
    if (locale === 'en')
      return `Request a quote or a demo from ${appName}. Tell us about your business and we will get back to you quickly.`;
    if (locale === 'de')
      return `Fordern Sie ein Angebot oder eine Demo von ${appName} an. Erzählen Sie uns von Ihrem Unternehmen und wir melden uns schnell bei Ihnen.`;
    return `${appName} için teklif veya demo talep edin. İşletmenizi ve ihtiyaçlarınızı paylaşın, ekibimiz kısa süre içinde size dönüş yapsın.`;
  }, [locale, appName]);

  return (
    <>
      <LayoutSeoBridge
        title={titleWithAppName(copy.bannerTitle)}
        description={seoDescription}
        noindex={false}
      />
      <IyPageHeader eyebrow="Teklif / Demo" title={copy.bannerTitle} subtitle={copy.intro} />

      <div style={IY_SURFACE_STYLE} className="bg-bg-primary">
        {/* İletişim formunu yeniden kullan */}
        <ContactPage />
      </div>
    </>
  );
}
