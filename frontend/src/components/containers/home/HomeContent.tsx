// HomeContent — DB-driven layout. /api/home/layout'tan gelen sıraya/aktiflere göre render.
// Yeni section eklemek için: 1) REGISTRY'e component ekle, 2) DB'ye row ekle (admin paneli).
import React from 'react';
import { fetchHomeLayout, fetchFeaturesNewImageUrls } from './fetchHomeLayout.server';
import HomeLayoutRenderer from './HomeLayoutRenderer';

type Props = { locale?: string };

export default async function HomeContent({ locale }: Props) {
  const layout = await fetchHomeLayout();
  const loc = (locale || 'tr').trim();
  const needsFeatureImages = layout.some((s) => s.component_key === 'FeaturesNew');
  const featuresImageUrls = needsFeatureImages ? await fetchFeaturesNewImageUrls(loc) : undefined;

  return (
    <main className="flex flex-col w-full bg-[var(--gm-bg)]">
      <HomeLayoutRenderer layout={layout} locale={locale} featuresImageUrls={featuresImageUrls} />
    </main>
  );
}
