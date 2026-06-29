'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Target, Building2, TrendingUp, FileText, ShoppingCart,
  Package, Folder, CalendarCheck, ListChecks, BellRing, Mail, Radar, BarChart3,
  Briefcase, Users, PieChart, User, Menu, X, Plus, Loader2,
} from 'lucide-react';
import { IY_APP_NAV, IY_SURFACE_STYLE } from './iy-data';
import IyUserMenu from './IyUserMenu';
import { useMeQuery } from '@/integrations/rtk/public/auth.endpoints';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Target, Building2, TrendingUp, FileText, ShoppingCart,
  Package, Folder, CalendarCheck, ListChecks, BellRing, Mail, Radar, BarChart3,
  Briefcase, Users, PieChart, User,
};

export default function AppShell({ children, locale }: { children: React.ReactNode; locale?: string }) {
  const l = locale || 'tr';
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: me, isLoading, isError } = useMeQuery();

  // Auth guard
  useEffect(() => {
    if (!isLoading && (isError || !me?.user)) {
      router.replace(`/${l}/login`);
    }
  }, [isLoading, isError, me, l, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eaeaea]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e40af]" />
      </div>
    );
  }
  if (!me?.user) return null;

  const isActive = (path?: string) => {
    if (!path) return false;
    return pathname === `/${l}${path}` || pathname?.startsWith(`/${l}${path}/`);
  };

  const sidebar = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      {IY_APP_NAV.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon] ?? LayoutDashboard;
              const active = isActive(item.path);
              const base =
                'flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors';
              if (item.soon || !item.path) {
                return (
                  <li key={item.key}>
                    <span className={`${base} cursor-not-allowed text-[#94a3b8]`} title="Yakında">
                      <Icon className="h-[18px] w-[18px]" />
                      <span className="flex-1">{item.label}</span>
                      <span className="rounded-full bg-[#f1f5f9] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[#94a3b8]">
                        yakında
                      </span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={item.key}>
                  <Link
                    href={`/${l}${item.path}`}
                    onClick={() => setMobileOpen(false)}
                    className={`${base} ${active ? 'bg-[#1e40af] text-white' : 'text-[#334155] hover:bg-[#eff6ff] hover:text-[#1e40af]'}`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div style={IY_SURFACE_STYLE} className="min-h-screen bg-[#eaeaea] text-[#0f172a]">
      {/* Topbar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-white px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-[#edf0f4] lg:hidden"
            aria-label="Menü"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href={`/${l}/dashboard`} className="flex items-center">
            <Image src="/iy/logo.png" alt="İşletmeni Yönet" width={260} height={79} priority className="h-8 w-auto" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${l}/teklif-al`}
            className="hidden items-center gap-1.5 rounded-lg bg-[#1e40af] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#15317f] sm:flex"
          >
            <Plus className="h-4 w-4" /> Hızlı Ekle
          </Link>
          <IyUserMenu locale={l} layout="desktop" />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-[#e2e8f0] bg-white lg:block">
          <div className="sticky top-16 h-[calc(100vh-4rem)]">{sidebar}</div>
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 top-16 z-30 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} />
            <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-[#e2e8f0] bg-white lg:hidden">
              {sidebar}
            </aside>
          </>
        )}

        {/* Content */}
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
