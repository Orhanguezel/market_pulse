import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Banner from '@/layout/banner/Breadcrum';
import HizmetHero from '@/components/containers/hizmet/HizmetHero';
import HizmetSections from '@/components/containers/hizmet/HizmetSections';
import HizmetClosingCTA from '@/components/containers/hizmet/HizmetClosingCTA';
import { getHizmetContent } from '@/lib/hizmet-content';
import { getPublicAppName, getPublicSiteOrigin } from '@/lib/site-config';

type RouteParams = { locale: string; slug: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const appName = getPublicAppName();
  const content = await getHizmetContent(slug, locale, appName);

  if (!content) {
    return { title: appName };
  }

  const origin = getPublicSiteOrigin().replace(/\/+$/, '');
  const ogImage = content.image
    ? content.image.startsWith('http')
      ? content.image
      : `${origin}${content.image}`
    : undefined;

  return {
    title: content.seo.title || content.hero.title,
    description: content.seo.description,
    openGraph: {
      title: content.seo.ogTitle || content.seo.title || content.hero.title,
      description: content.seo.ogDescription || content.seo.description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function HizmetDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { locale, slug } = await params;
  const appName = getPublicAppName();
  const content = await getHizmetContent(slug, locale, appName);

  if (!content) {
    notFound();
  }

  return (
    <>
      <Banner title={content.hero.title} />

      <div className="bg-bg-primary">
        <HizmetHero hero={content.hero} icon={content.icon} />
        <HizmetSections sections={content.sections} />
        <HizmetClosingCTA cta={content.closingCTA} />
      </div>
    </>
  );
}
