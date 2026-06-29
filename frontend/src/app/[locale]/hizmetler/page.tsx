import type { Metadata } from 'next';
import Link from 'next/link';

import HizmetIcon from '@/components/containers/hizmet/HizmetIcon';
import { getHizmetIndex, type HizmetIndexItem } from '@/lib/hizmet-content';
import { getPublicAppName } from '@/lib/site-config';
import { injectAppName } from '@/lib/page-copy';
import { localizePath } from '@/integrations/shared';
import { IY_SURFACE_STYLE } from '@/components/iy/iy-data';

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
    <div style={IY_SURFACE_STYLE} className="bg-[#eaeaea] text-[#0f172a]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0f172a] to-[#1e40af] py-16 text-white">
        <div className="mx-auto max-w-[1320px] px-5 lg:px-9">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-semibold text-[#93c5fd]">
            Hizmetlerimiz
          </span>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold text-white sm:text-4xl">
            Şirketinizin Büyüme Sürecine Uygun Çözümler
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/80">
            İhracat, CRM, B2B müşteri bulma, e-ticaret, kurumsal eğitim, DYS ve dijital dönüşüm hizmetlerini şirketinizin genel büyüme sistemi içinde birlikte değerlendiriyoruz.
          </p>
        </div>
      </section>

      <div className="py-12">
        {orderedCategories.map((category) => {
          const label = CATEGORY_LABELS_TR[category] ?? category;
          return (
            <section key={category} className="mx-auto max-w-[1320px] px-5 py-8 lg:px-9">
              <h2 className="mb-7 text-2xl font-bold text-[#0f172a]">{label}</h2>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {groups[category].map((item) => (
                  <Link
                    key={item.slug}
                    href={localizePath(locale, `/hizmetler/${item.slug}`)}
                    className="group flex flex-col rounded-2xl border border-[#edf0f4] bg-white p-6 no-underline transition-all hover:-translate-y-1 hover:border-[#1e40af]/30 hover:shadow-xl"
                  >
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#eff6ff] text-[#1e40af] group-hover:bg-[#1e40af] group-hover:text-white">
                      <HizmetIcon name={item.icon} className="h-5 w-5" />
                    </span>
                    <h3 className="mb-2 text-[16px] font-bold text-[#0f172a] transition-colors group-hover:text-[#1e40af]">
                      {injectAppName(item.title, appName)}
                    </h3>
                    <p className="line-clamp-3 text-[13.5px] leading-relaxed text-[#64748b]">
                      {injectAppName(item.summary, appName)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
