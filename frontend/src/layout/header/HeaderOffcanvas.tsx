'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import { SiteLogo } from '@/layout/SiteLogo';
import { useLocaleShort, switchLocale, useActiveLocales } from '@/i18n';
import { normLocaleTag, localizePath, getLanguageLabel, type SupportedLocale } from '@/integrations/shared';
import SocialLinks from '@/components/common/public/SocialLinks';
import { IconGlobe, IconLogIn, IconMail, IconPhone, IconUserPlus } from '@/components/ui/icons';
import { useListMenuItemsQuery, useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import type { PublicMenuItemDto } from '@/integrations/shared';
import { useUiSection } from '@/i18n';
import { useAuthStore } from '@/features/auth/auth.store';
import { getPublicAppName } from '@/lib/site-config';

export type SimpleBrand = {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  socials?: Record<string, string>;
};

export type HeaderOffcanvasProps = {
  open: boolean;
  onClose: () => void;
  brand?: SimpleBrand;
  locale?: string;
};

type MenuItemWithChildren = PublicMenuItemDto & {
  children?: MenuItemWithChildren[];
};

const cleanHashLink = (href: string) => {
  if (!href) return href;
  if (href.startsWith('#')) return `/${href.substring(1)}`;
  if (href.startsWith('/#')) return `/${href.substring(2)}`;
  if (href.includes('#')) return `/${href.split('#')[1]}`;
  return href;
};

const HeaderOffcanvas: React.FC<HeaderOffcanvasProps> = ({ open, onClose, brand, locale: localeProp }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const asPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  const resolvedLocale = useLocaleShort(localeProp);
  const { locales: activeLocales, isLoading: localesLoading } = useActiveLocales();
  const { ui } = useUiSection('ui_header', resolvedLocale);

  const { data: contactInfoSetting } = useGetSiteSettingByKeyQuery({ key: 'contact_info', locale: resolvedLocale });
  const { data: socialsSetting } = useGetSiteSettingByKeyQuery({ key: 'socials', locale: resolvedLocale });
  const { data: companyBrandSetting } = useGetSiteSettingByKeyQuery({ key: 'company_brand', locale: resolvedLocale });

  const brandFromSettings = useMemo(() => {
    const contact = (contactInfoSetting?.value ?? {}) as any;
    const socials = (socialsSetting?.value ?? {}) as Record<string, string>;
    const brandVal = (companyBrandSetting?.value ?? {}) as any;
    const name = (brandVal?.name as string) || (contact?.companyName as string) || getPublicAppName();
    const website = (brandVal?.website as string) || (contact?.website as string) || '';
    const phones = Array.isArray(contact?.phones) ? contact.phones : [];
    const phone = (phones[0] as string | undefined) || (contact?.whatsappNumber as string | undefined) || (brandVal?.phone as string | undefined) || '';
    const email = (contact?.email as string) || (brandVal?.email as string) || '';
    const mergedSocials: Record<string, string> = { ...(brandVal?.socials as Record<string, string> | undefined), ...(socials ?? {}) };
    return { name, website, phone, email, socials: mergedSocials };
  }, [contactInfoSetting?.value, socialsSetting?.value, companyBrandSetting?.value]);

  const effectiveBrand = useMemo(() => ({
    ...brandFromSettings, ...(brand ?? {}),
    socials: { ...(brandFromSettings.socials ?? {}), ...(brand?.socials ?? {}) },
  }), [brandFromSettings, brand]);

  const webHost = useMemo(() => (effectiveBrand.website || '').replace(/^https?:\/\//, ''), [effectiveBrand.website]);
  const safePhone = (effectiveBrand.phone || '').replace(/\s+/g, '');

  const onLangChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = normLocaleTag(e.target.value);
    if (!next) return;
    await switchLocale(router, asPath, next as SupportedLocale, activeLocales);
    onClose();
  };

  const { data: menuData, isLoading: isMenuLoading } = useListMenuItemsQuery({
    location: 'header', is_active: true, locale: resolvedLocale, nested: true,
  });

  const headerMenuItems: MenuItemWithChildren[] = useMemo(() => {
    const raw = menuData as any;
    const list: MenuItemWithChildren[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    const sortRecursive = (items: MenuItemWithChildren[]): MenuItemWithChildren[] =>
      items.slice().sort((a, b) => ((a as any)?.order_num ?? 0) - ((b as any)?.order_num ?? 0))
        .map((it) => ({ ...it, children: it.children ? sortRecursive(it.children as MenuItemWithChildren[]) : undefined }));
    return sortRecursive(list);
  }, [menuData]);

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  useEffect(() => { if (!open) setOpenSubmenus({}); }, [open]);
  const toggleSubmenu = (id: string) => setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const renderMenuItem = (item: MenuItemWithChildren, depth = 0) => {
    const rawUrl = item.url || (item as any).href || '#';
    const href = localizePath(resolvedLocale, rawUrl);
    const hasChildren = !!item.children && item.children.length > 0;
    const id = String(item.id ?? rawUrl ?? `menu-${depth}-${href}`);
    const isOpen = !!openSubmenus[id];

    if (!hasChildren) {
      return (
        <li key={id} className="border-b border-border-light last:border-0">
          <Link href={localizePath(resolvedLocale, cleanHashLink(item.url || '#'))} onClick={onClose}
            className="block py-3.5 text-text-primary hover:text-brand-primary font-normal text-[0.95rem] transition-colors">
            {item.title || rawUrl}
          </Link>
        </li>
      );
    }

    return (
      <li key={id} className="border-b border-border-light last:border-0">
        <button type="button" onClick={() => toggleSubmenu(id)} aria-expanded={isOpen}
          className={`flex items-center justify-between w-full py-3.5 text-left font-normal text-[0.95rem] transition-colors ${isOpen ? 'text-brand-primary' : 'text-text-primary hover:text-brand-primary'}`}>
          <span>{item.title || rawUrl}</span>
          <svg className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {isOpen && (
          <ul className="pl-4 border-l border-border-light mb-2">
            {item.children!.map((child) => renderMenuItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const loginHref = localizePath(resolvedLocale, '/login');
  const registerHref = localizePath(resolvedLocale, '/register');
  const profileHref = localizePath(resolvedLocale, '/profile');
  const logoutHref = localizePath(resolvedLocale, '/logout');
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 z-[10000] transition-opacity duration-300 ${open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={onClose} aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-bg-primary z-[10001] shadow-medium transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto border-l border-border-light`}
        tabIndex={-1} aria-modal="true" role="dialog" aria-label="Navigation"
      >
        <div className="h-full overflow-y-auto p-8">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
              <SiteLogo variant="light" alt={effectiveBrand.name}
                wrapperClassName="w-16! h-16! max-w-16!" className="w-16! h-16! max-w-16! rounded-full object-cover border border-brand-primary/60" />
              <button type="button" onClick={onClose} aria-label={ui('ui_header_close', 'Close')}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-border-light text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Language */}
            <div className="flex flex-col gap-2 mb-8">
              <label htmlFor="lang-offcanvas" className="flex items-center gap-2 text-[0.72rem] tracking-[0.15em] uppercase text-brand-primary font-normal">
                <IconGlobe size={14} />
                <span>{ui('ui_header_language', 'Sprache')}</span>
              </label>
              <div className="relative">
                <select id="lang-offcanvas" value={resolvedLocale} onChange={onLangChange} disabled={localesLoading}
                  className="w-full p-3 border border-border-light bg-bg-card text-text-primary text-sm focus:outline-none focus:border-brand-primary appearance-none cursor-pointer transition-colors">
                  {activeLocales.map((loc) => (
                    <option key={loc} value={loc}>{getLanguageLabel(loc, String(loc).toUpperCase())}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Menu */}
            <nav className="mb-8 flex-1">
              <ul className="flex flex-col">
                {headerMenuItems.map((it) => renderMenuItem(it, 0))}
                {isMenuLoading && (
                  <li><span className="text-text-muted text-sm py-2 block">{ui('menu_loading', '...')}</span></li>
                )}
              </ul>
            </nav>

            {/* Auth */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {isAuthenticated ? (
                <>
                  <Link href={profileHref} onClick={onClose}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-border-light text-sm font-normal text-text-primary hover:text-brand-primary hover:border-brand-primary transition-all">
                    <IconUserPlus size={16} />
                    <span>{ui('ui_header_profile', 'Profil')}</span>
                  </Link>
                  <Link href={logoutHref} onClick={onClose}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-bg-primary text-sm font-medium hover:bg-brand-hover transition-all">
                    <IconLogIn size={16} />
                    <span>{ui('ui_header_logout', 'Logout')}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link href={loginHref} onClick={onClose}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-border-light text-sm font-normal text-text-primary hover:text-brand-primary hover:border-brand-primary transition-all">
                    <IconLogIn size={16} />
                    <span>{ui('ui_header_login', 'Login')}</span>
                  </Link>
                  <Link href={registerHref} onClick={onClose}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-bg-primary text-sm font-medium hover:bg-brand-hover transition-all">
                    <IconUserPlus size={16} />
                    <span>{ui('ui_header_register', 'Registrieren')}</span>
                  </Link>
                </>
              )}
            </div>

            {/* Contact */}
            <div className="mt-auto pt-6 border-t border-border-light">
              <p className="text-[0.72rem] tracking-[0.15em] uppercase text-brand-primary mb-4">
                {ui('ui_header_contact_info', 'Kontakt')}
              </p>
              <ul className="space-y-4">
                {effectiveBrand.website && (
                  <li className="flex items-center group">
                    <div className="w-10 h-10 rounded-full border border-border-light flex items-center justify-center text-text-muted mr-4 group-hover:border-brand-primary group-hover:text-brand-primary transition-all">
                      <IconGlobe size={16} />
                    </div>
                    <Link target="_blank" href={effectiveBrand.website}
                      className="text-sm text-text-secondary hover:text-brand-primary transition-colors">
                      {webHost}
                    </Link>
                  </li>
                )}
                {effectiveBrand.phone && (
                  <li className="flex items-center group">
                    <div className="w-10 h-10 rounded-full border border-border-light flex items-center justify-center text-text-muted mr-4 group-hover:border-brand-primary group-hover:text-brand-primary transition-all">
                      <IconPhone size={16} />
                    </div>
                    <Link href={safePhone ? `tel:${safePhone}` : localizePath(resolvedLocale, '/contact')}
                      className="text-sm text-text-secondary hover:text-brand-primary transition-colors">
                      {effectiveBrand.phone}
                    </Link>
                  </li>
                )}
                {effectiveBrand.email && (
                  <li className="flex items-center group">
                    <div className="w-10 h-10 rounded-full border border-border-light flex items-center justify-center text-text-muted mr-4 group-hover:border-brand-primary group-hover:text-brand-primary transition-all">
                      <IconMail size={16} />
                    </div>
                    <Link href={`mailto:${effectiveBrand.email}`}
                      className="text-sm text-text-secondary hover:text-brand-primary transition-colors">
                      {effectiveBrand.email}
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            <div className="mt-6">
              <SocialLinks socials={effectiveBrand.socials} size="md" onClickItem={onClose} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeaderOffcanvas;
