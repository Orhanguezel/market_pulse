'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

import SocialLinks from '@/components/common/public/SocialLinks';
import { Apple, Play, ShieldCheck, Lock } from 'lucide-react';
import {
  useGetSiteSettingByKeyQuery,
  useListFooterSectionsQuery,
  useListMenuItemsQuery,
} from '@/integrations/rtk/hooks';

import type { FooterSectionDto, PublicMenuItemDto } from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import {
  getCopyrightHolder,
  getFooterFallbackSections,
  getWordMarkLine1,
  getWordMarkLine2,
} from '@/lib/site-config';

const isExternalHref = (href: string) =>
  /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href);

function pickLocalized<T extends Record<string, string>>(labels: T, loc: string): string {
  const k = loc.split('-')[0]?.toLowerCase() || 'tr';
  const raw = labels as Record<string, string>;
  return raw[k] || raw.tr || raw.en || Object.values(raw)[0] || '';
}

const cleanHashLink = (href: string) => {
  if (!href) return href;
  if (href === '/') return href;
  if (href.startsWith('#')) return `/${href.substring(1)}`;
  if (href.startsWith('/#')) return `/${href.substring(2)}`;
  if (href.includes('#')) return `/${href.split('#')[1]}`;
  return href;
};

/** Backend boşsa src/config/site-defaults.json içindeki footer fallback kullanılır */
const FALLBACK_SECTIONS = getFooterFallbackSections();

type FooterRenderSection = {
  id: string;
  title: string;
  items: Array<{ id: string; url: string; title: string }>;
};

const Footer: React.FC<{ locale?: string }> = ({ locale: localeProp }) => {
  const fallbackLocale = useLocaleShort();
  const locale = localeProp || fallbackLocale;
  const { ui } = useUiSection('ui_footer', locale);


  const { data: companyBrandSetting } = useGetSiteSettingByKeyQuery({ key: 'company_brand', locale });
  const { data: socialsSetting } = useGetSiteSettingByKeyQuery({ key: 'socials', locale });

  const { socials } = useMemo(() => {
    const brandVal = (companyBrandSetting?.value ?? {}) as any;
    const socialsVal = (socialsSetting?.value ?? {}) as Record<string, string>;
    const mergedSocials: Record<string, string> = { ...(brandVal.socials as Record<string, string> | undefined), ...socialsVal };
    return { socials: mergedSocials };
  }, [companyBrandSetting?.value, socialsSetting?.value]);

  const { data: footerSections } = useListFooterSectionsQuery({ is_active: true, order: 'display_order.asc', locale });
  const sections: FooterSectionDto[] = useMemo(() => {
    return (footerSections ?? []).slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)) as FooterSectionDto[];
  }, [footerSections]);

  const { data: footerMenuData } = useListMenuItemsQuery({ location: 'footer', is_active: true, locale });
  const footerMenuItems: PublicMenuItemDto[] = useMemo(() => footerMenuData?.items ?? [], [footerMenuData]);

  const itemsBySectionId = useMemo(() => {
    const m = new Map<string, PublicMenuItemDto[]>();
    for (const item of footerMenuItems) {
      const sid = ((item as any).section_id ?? (item as any).sectionId) as string | undefined;
      if (!sid) continue;
      const arr = m.get(sid) ?? [];
      arr.push(item);
      m.set(sid, arr);
    }
    return m;
  }, [footerMenuItems]);

  // Backend boş döndüyse fallback'e düş
  const renderSections: FooterRenderSection[] = useMemo(() => {
    const fromApi = sections
      .map<FooterRenderSection>((sec) => ({
        id: sec.id,
        title: sec.title || '',
        items: (itemsBySectionId.get(sec.id) ?? []).map((item) => ({
          id: item.id,
          url: item.url || '',
          title: item.title || '',
        })),
      }))
      .filter((sec) => sec.title && sec.items.length > 0);

    if (fromApi.length > 0) return fromApi;

    return FALLBACK_SECTIONS.map<FooterRenderSection>((sec) => ({
      id: sec.id,
      title: pickLocalized(sec.title, locale),
      items: sec.items.map((it) => ({
        id: it.id,
        url: it.url,
        title: pickLocalized(it.label, locale),
      })),
    }));
  }, [sections, itemsBySectionId, locale]);

  const homeHref = localizePath(locale, '/');

  return (
    <footer className="py-24 lg:py-32 bg-[var(--gm-bg)] border-t border-[var(--gm-border-soft)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          {/* Brand Info */}
          <div className="flex flex-col items-start text-center md:text-left">
            <Link href={homeHref} className="flex flex-col items-start no-underline mb-8 group">
              <span className="font-display font-semibold text-2xl tracking-[0.18em] text-[var(--gm-gold)] group-hover:text-[var(--gm-gold-light)] transition-colors">
                {getWordMarkLine1()}
              </span>
              {getWordMarkLine2() ? (
                <span className="font-display text-[10px] tracking-[0.32em] text-[var(--gm-gold-deep)] mt-1">
                  {getWordMarkLine2()}
                </span>
              ) : null}
            </Link>
            <p className="text-[var(--gm-text-dim)] font-light text-[15px] leading-relaxed mb-8 max-w-[260px]">
              {ui('ui_footer_tagline')}
            </p>
            <div className="mb-8">
              <SocialLinks socials={socials} size="sm" />
            </div>

            {/* App Download Links */}
            <div className="flex flex-col gap-3">
              <span className="font-display text-[9px] tracking-[0.3em] text-[var(--gm-gold-deep)] uppercase mb-1">
                {locale === 'tr' ? 'Mobil Uygulamamız' : 'Our Mobile App'}
              </span>
              <div className="flex gap-4">
                <a 
                  href="#" 
                  className="flex items-center gap-3 text-[var(--gm-text-dim)] hover:text-[var(--gm-gold)] hover:border-[var(--gm-gold)/30] transition-all duration-300 border border-[var(--gm-border-soft)] rounded-xl px-4 py-2 bg-[var(--gm-bg-surface)]/40 backdrop-blur-md shadow-sm group/store"
                  title="App Store"
                >
                  <Apple size={20} className="group-hover/store:scale-110 transition-transform" />
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[8px] uppercase tracking-wider opacity-60 mb-0.5">App Store</span>
                    <span className="text-[13px] font-semibold">iOS</span>
                  </div>
                </a>
                <a 
                  href="#" 
                  className="flex items-center gap-3 text-[var(--gm-text-dim)] hover:text-[var(--gm-gold)] hover:border-[var(--gm-gold)/30] transition-all duration-300 border border-[var(--gm-border-soft)] rounded-xl px-4 py-2 bg-[var(--gm-bg-surface)]/40 backdrop-blur-md shadow-sm group/store"
                  title="Google Play"
                >
                  <Play size={18} fill="currentColor" className="group-hover/store:scale-110 transition-transform" />
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[8px] uppercase tracking-wider opacity-60 mb-0.5">Google Play</span>
                    <span className="text-[13px] font-semibold">Android</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Columns */}
          {renderSections.map((sec) => (
            <div key={sec.id}>
              <div className="font-display text-[11px] tracking-[0.32em] text-[var(--gm-gold-deep)] uppercase mb-8">
                {sec.title}
              </div>
              <ul className="list-none p-0 m-0 space-y-4">
                {sec.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={isExternalHref(item.url) ? item.url : localizePath(locale, cleanHashLink(item.url))}
                      className="text-[var(--gm-text-dim)] hover:text-[var(--gm-gold)] transition-colors font-serif italic text-[16px]"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment & Security Section */}
        <div className="pt-12 mb-12 border-t border-[var(--gm-border-soft)] flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 opacity-60">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-[var(--gm-gold)]" />
              <span className="font-display text-[10px] tracking-[0.2em] text-[var(--gm-text-dim)] uppercase">
                {locale === 'tr' ? '256-bit SSL Güvenlik' : '256-bit SSL Security'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-[var(--gm-gold)]" />
              <span className="font-display text-[10px] tracking-[0.2em] text-[var(--gm-text-dim)] uppercase">
                {locale === 'tr' ? 'Güvenli Ödeme Altyapısı' : 'Secure Payment Gateway'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {/* Generic Payment Icons / Logos */}
            <div className="font-display text-[14px] font-bold tracking-widest text-[var(--gm-text-dim)]">VISA</div>
            <div className="font-display text-[14px] font-bold tracking-widest text-[var(--gm-text-dim)]">MASTERCARD</div>
            <div className="font-display text-[14px] font-bold tracking-widest text-[var(--gm-text-dim)]">IYZICO</div>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--gm-border-soft)] flex flex-col md:flex-row justify-between items-center gap-8 text-[11px] tracking-[0.1em] text-[var(--gm-muted)] uppercase">
          <p>
            &copy; {new Date().getFullYear()} {getCopyrightHolder()}. {ui('ui_footer_rights', 'TÜM HAKLARI SAKLIDIR.')}
          </p>
          <div className="flex gap-6">
            <a href="https://guezelwebdesign.com" target="_blank" rel="noopener" className="hover:text-[var(--gm-gold)] transition-colors">
              DESIGNED BY GUEZELEWEB
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
