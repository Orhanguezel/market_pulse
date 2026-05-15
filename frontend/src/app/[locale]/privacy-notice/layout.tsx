import type { Metadata } from 'next';
import type React from 'react';

import { normPath } from '@/integrations/shared';
import { buildMetadataFromSeo, fetchSeoObject, fetchUiSectionObject, readUiText } from '@/seo/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const [seo, ui] = await Promise.all([
    fetchSeoObject(locale),
    fetchUiSectionObject('ui_privacy_notice', locale),
  ]);

  const base = await buildMetadataFromSeo(seo, { locale, pathname: normPath('/privacy-notice') });

  const pageTitle =
    readUiText(ui, 'ui_privacy_notice_meta_title') ||
    readUiText(ui, 'ui_privacy_notice_page_title', 'Privacy Notice');
  const pageDescription =
    readUiText(ui, 'ui_privacy_notice_meta_description') ||
    readUiText(ui, 'ui_privacy_notice_page_description', '');

  return {
    ...base,
    title: pageTitle,
    ...(pageDescription ? { description: pageDescription } : {}),
    openGraph: {
      ...(base.openGraph || {}),
      title: pageTitle,
      ...(pageDescription ? { description: pageDescription } : {}),
    },
  };
}

export default function PrivacyNoticeLayout({ children }: { children: React.ReactNode }) {
  return children;
}

