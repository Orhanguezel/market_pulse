import type { Metadata } from 'next';
import Link from 'next/link';

import Banner from '@/layout/banner/Breadcrum';
import HizmetIcon from '@/components/containers/hizmet/HizmetIcon';
import { getHizmetIndex, type HizmetIndexItem } from '@/lib/hizmet-content';
import { getPublicAppName } from '@/lib/site-config';
import { injectAppName } from '@/lib/page-copy';
import { localizePath } from '@/integrations/shared';

type RouteParams = { locale: string };

const CATEGORY_LABELS_TR: Record<string, string> = {
  'urun-modulleri': 'Ürün Modülleri',
  'ihracat-musteri-bulma': 'İhracat & Müşteri Bulma',
  'e-ticaret-pazaryeri': 'E-Ticaret & Pazaryeri',
  egitim: 'Eğitimler',
  'crm-satis': 'CRM & Satış',
  'mail-outreach': 'Mail & İletişim',
  kurumsal: 'Kurumsal',
};

// Kategori gösterim sırası
const CATEGORY_ORDER = [
  'urun-modulleri',
  'ihracat-musteri-bulma',
  'e-ticaret-pazaryeri',
  'crm-satis',
  'egitim',
  'mail-outreach',
  'kurumsal',
];

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  await params;
  const appName = getPublicAppName();
  return {
    title: 'Hizmetler',
    description: `${appName} hizmetleri: ihracat müşteri bulma, e-ticaret ve pazaryeri yönetimi, CRM, satış ve dijital pazarlama eğitimleriyle şirketinizi büyütün.`,
  };
}

function groupByCategory(items: HizmetIndexItem[]): Record<string, HizmetIndexItem[]> {
  const groups: Record<string, HizmetIndexItem[]> = {};
  for (const item of items) {
    (groups[item.category] ??= []).push(item);
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.order - b.order);
  }
  return groups;
}

export default async function HizmetlerHubPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { locale } = await params;
  const appName = getPublicAppName();
  const items = getHizmetIndex();
  const groups = groupByCategory(items);

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => groups[c]?.length),
    ...Object.keys(groups).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <>
      <Banner title="Hizmetler" />

      <div className="bg-bg-primary">
        {orderedCategories.map((category) => {
          const label = CATEGORY_LABELS_TR[category] ?? category;
          return (
            <section key={category} className="container mx-auto px-4 py-12">
              <h2 className="font-serif text-2xl md:text-3xl font-light text-text-primary mb-8">
                {label}
              </h2>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {groups[category].map((item) => (
                  <Link
                    key={item.slug}
                    href={localizePath(locale, `/hizmetler/${item.slug}`)}
                    className="group flex flex-col rounded-2xl border border-border bg-card p-6 no-underline shadow-sm transition-shadow hover:shadow-md"
                  >
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-bg-secondary text-brand-primary">
                      <HizmetIcon name={item.icon} className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-semibold text-text-primary mb-2 transition-colors group-hover:text-brand-primary">
                      {injectAppName(item.title, appName)}
                    </h3>
                    <p className="text-sm leading-relaxed text-text-secondary line-clamp-3">
                      {injectAppName(item.summary, appName)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
