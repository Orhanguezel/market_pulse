'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Target, Building2, TrendingUp, FileText, ShoppingCart,
  Package, Folder, CalendarCheck, CalendarDays, ListChecks, BellRing, Mail, Radar, BarChart3,
  Briefcase, Users, PieChart, User, Menu, X, Plus, Loader2, PanelLeftClose, PanelLeft, Bell, Lock,
} from 'lucide-react';
import { IY_APP_NAV, IY_SURFACE_STYLE } from './iy-data';
import IyUserMenu from './IyUserMenu';
import { useAuthStore } from '@/features/auth/auth.store';
import { useMyEntitlementsQuery } from '@/integrations/rtk/public/entitlements.endpoints';
import { useGetUnreadNotificationsCountQuery } from '@/integrations/rtk/public/notifications.endpoints';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Target, Building2, TrendingUp, FileText, ShoppingCart,
  Package, Folder, CalendarCheck, CalendarDays, ListChecks, BellRing, Mail, Radar, BarChart3,
  Briefcase, Users, PieChart, User,
};

const COLLAPSE_KEY = 'iy_sidebar_collapsed';

export default function AppShell({ children, locale }: { children: React.ReactNode; locale?: string }) {
  const l = locale || 'tr';
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, isLoading, isReady, isAuthenticated } = useAuthStore();
  const { data: entitlements } = useMyEntitlementsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: unread } = useGetUnreadNotificationsCountQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30000,
  });
  const activeModules = new Set(
    entitlements?.modules
      ?.filter((module) => module.status === 'active' || module.status === 'trial')
      .map((module) => module.module_key) ?? [],
  );
  const requiredModule = pathname?.match(/^\/[a-z-]+\/(firma-bulucu|amazon|listelerim)(?:\/|$)/) ? 'leads' : null;
  const accessDenied = Boolean(entitlements && requiredModule && !activeModules.has(requiredModule));

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1'); } catch { /* */ }
  }, []);
  const toggleCollapse = () => setCollapsed((v) => {
    const n = !v;
    try { localStorage.setItem(COLLAPSE_KEY, n ? '1' : '0'); } catch { /* */ }
    return n;
  });

  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace(`/${l}/login`);
  }, [isReady, isAuthenticated, l, router]);

  if (isLoading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eaeaea]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e40af]" />
      </div>
    );
  }
  if (!user) return null;

  const isActive = (path?: string) =>
    !!path && (pathname === `/${l}${path}` || pathname?.startsWith(`/${l}${path}/`));

  // collapsed=true sadece desktop; mobil drawer her zaman tam genişlik
  function NavList({ compact }: { compact: boolean }) {
    return (
      <nav className="flex h-full flex-col gap-5 overflow-y-auto px-2.5 py-4">
        {IY_APP_NAV.map((group) => (
          <div key={group.title}>
            {!compact && (
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                {group.title}
              </p>
            )}
            {compact && <div className="mx-2 mb-2 border-t border-[#f1f5f9]" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon] ?? LayoutDashboard;
                const active = isActive(item.path);
                // Izinsiz modul: entitlement YUKLENDIYSE ve kullanicida yoksa NAV'DAN GIZLE.
                const locked = Boolean(entitlements) && Boolean(item.module && !activeModules.has(item.module));
                if (locked) return null;
                const disabled = item.soon || !item.path;
                const row = `flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors ${compact ? 'justify-center' : ''}`;
                const tip = item.label + (item.soon ? ' (yakında)' : '');
                if (disabled) {
                  return (
                    <li key={item.key}>
                      <span className={`${row} cursor-not-allowed text-[#94a3b8]`} title={tip}>
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {!compact && <><span className="flex-1 truncate">{item.label}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-1.5 py-0.5 text-[8.5px] font-semibold uppercase text-[#94a3b8]">
                            yakında
                          </span></>}
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={item.key}>
                    <Link href={`/${l}${item.path}`} onClick={() => setMobileOpen(false)} title={tip}
                      className={`${row} ${active ? 'bg-[#1e40af] text-white' : 'text-[#334155] hover:bg-[#eff6ff] hover:text-[#1e40af]'}`}>
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!compact && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <div style={IY_SURFACE_STYLE} className="min-h-screen bg-[#eaeaea] text-[#0f172a]">
      {/* Topbar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-white px-3 lg:px-5">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMobileOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-[#edf0f4] lg:hidden" aria-label="Menü">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button type="button" onClick={toggleCollapse}
            className="hidden h-9 w-9 place-items-center rounded-lg border border-[#edf0f4] text-[#475569] hover:text-[#1e40af] lg:grid"
            aria-label="Menüyü daralt" title={collapsed ? 'Genişlet' : 'Daralt'}>
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <Link href={`/${l}/dashboard`} className="flex items-center">
            <Image src="/iy/logo.png" alt="İşletmeni Yönet" width={260} height={79} priority className="h-8 w-auto" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${l}/teklif-al`}
            className="hidden items-center gap-1.5 rounded-lg bg-[#1e40af] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#15317f] sm:flex">
            <Plus className="h-4 w-4" /> Hızlı Ekle
          </Link>
          <Link href={`/${l}/bildirimler`} className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#edf0f4] text-[#475569] hover:text-[#1e40af]" title="Bildirimler" aria-label="Bildirimler">
            <Bell className="h-5 w-5" />
            {unread?.count ? <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unread.count > 99 ? '99+' : unread.count}</span> : null}
          </Link>
          <IyUserMenu locale={l} layout="desktop" />
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar — collapsible */}
        <aside className={`hidden shrink-0 border-r border-[#e2e8f0] bg-white transition-[width] duration-200 lg:block ${collapsed ? 'w-[64px]' : 'w-60'}`}>
          <div className="sticky top-16 h-[calc(100vh-4rem)]"><NavList compact={collapsed} /></div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 top-16 z-30 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} />
            <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-[#e2e8f0] bg-white lg:hidden">
              <NavList compact={false} />
            </aside>
          </>
        )}

        {/* Content — full width */}
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-7">
          {accessDenied ? (
            <div className="mx-auto max-w-xl rounded-lg border border-[#dbeafe] bg-white p-8 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#eff6ff] text-[#1e40af]"><Lock className="h-5 w-5" /></span>
              <h1 className="mt-4 text-xl font-bold text-[#0f172a]">Firma Bulucu modülü gerekli</h1>
              <p className="mt-2 text-[13px] text-[#64748b]">Bu sayfayı kullanmak için Leads / Firma Bulucu paketini hesabınıza tanımlayın.</p>
              <Link href={`/${l}/paketler`} className="mt-5 inline-flex h-10 items-center rounded-md bg-[#1e40af] px-4 text-[13px] font-semibold text-white">Paketleri incele</Link>
            </div>
          ) : children}
        </main>
      </div>
    </div>
  );
}
