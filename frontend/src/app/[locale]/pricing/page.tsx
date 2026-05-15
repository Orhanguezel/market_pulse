import type { Metadata } from 'next';
import { Suspense } from 'react';

import PricingPageClient from './PricingPageClient';

type Props = {
  params: Promise<{ locale: string }>;
};

import { buildMetadataFromSeo, fetchSeoObject, fetchSeoPageObject, mergeSeoPageIntoSeo } from '@/seo/server';
import { normPath } from '@/integrations/shared';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  let seo = await fetchSeoObject(locale);
  const pageSeo = await fetchSeoPageObject(locale, 'pricing');
  seo = mergeSeoPageIntoSeo(seo, pageSeo);

  return buildMetadataFromSeo(seo, { locale, pathname: normPath('/pricing') });
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;

  return (
    <Suspense fallback={null}>
      <PricingPageClient locale={locale} />
    </Suspense>
  );
}
