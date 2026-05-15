/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useMemo } from 'react';

import Banner from '@/layout/banner/Breadcrum';
import { LayoutSeoBridge } from '@/seo';

import ContactPage from '@/components/containers/contact/ContactPage';

import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText } from '@/integrations/shared';
import { safeStr } from '@/integrations/shared';
import { getPublicAppName, titleWithAppName } from '@/lib/site-config';

export default function ContactRoutePage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_contact', locale as any);

  const fbTitle = useMemo(() => {
    if (locale === 'tr') return 'İletişim';
    if (locale === 'de') return 'Kontakt';
    return 'Contact';
  }, [locale]);

  const bannerTitle = useMemo(() => {
    const key = 'ui_contact_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : fbTitle;
  }, [ui, fbTitle]);

  const seoTitle = useMemo(() => {
    const key = 'ui_contact_meta_title';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;
    return titleWithAppName(bannerTitle || fbTitle);
  }, [ui, bannerTitle, fbTitle]);

  const seoDescription = useMemo(() => {
    const key = 'ui_contact_meta_description';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    const app = getPublicAppName();
    if (locale === 'tr')
      return `${app} ile iletişime geçin: sorularınız ve destek talepleriniz için bize ulaşın.`;
    if (locale === 'de')
      return `Kontaktieren Sie ${app}: Fragen und Support-Anfragen.`;
    return `Contact ${app}: reach us with questions and support requests.`;
  }, [ui, locale]);

  return (
    <>
      <LayoutSeoBridge title={seoTitle} description={seoDescription} noindex={false} />
      <Banner title={bannerTitle} />
      <ContactPage />
    </>
  );
}
