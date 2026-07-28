'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { useMeQuery, useLogoutMutation } from '@/integrations/rtk/public/auth.endpoints';
import { useGetMyProfileQuery } from '@/integrations/rtk/public/profiles.endpoints';
import { tokenStore } from '@/integrations/rtk/token';
import { iyLoginHref, iyTeklifHref } from './iy-data';

function initials(name?: string | null, email?: string | null): string {
  const src = (name || email || '?').trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default function IyUserMenu({
  locale,
  layout = 'desktop',
  onNavigate,
  authEnabled = false,
}: {
  locale?: string;
  layout?: 'desktop' | 'mobile';
  onNavigate?: () => void;
  authEnabled?: boolean;
}) {
  const l = locale || 'tr';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: me, isLoading } = useMeQuery(undefined, { skip: !authEnabled });
  const user = me?.user;
  const { data: profile } = useGetMyProfileQuery(undefined, { skip: !user });
  const [logout] = useLogoutMutation();

  const name = profile?.full_name || user?.full_name || user?.email || '';
  const avatar = profile?.avatar_url || null;
  const [imgOk, setImgOk] = useState(true);

  async function handleLogout() {
    try { await logout().unwrap(); } catch { /* yoksay */ }
    tokenStore.set(null);
    if (typeof window !== 'undefined') window.localStorage.removeItem('user');
    setOpen(false);
    onNavigate?.();
    window.location.href = `/${l}`;
  }

  // Pazarlama yüzeyinde oturum sorgusu yapılmaz; giriş yalnızca login sayfasına bağlantıdır.
  if (!user) {
    if (authEnabled && isLoading) return <div className="h-10 w-24" aria-hidden />;
    if (layout === 'mobile') {
      return (
        <div className="flex flex-col gap-2">
          <Link href={iyLoginHref(l)} onClick={onNavigate}
            className="rounded-lg border border-[#111827]/15 px-4 py-2.5 text-center text-[14px] font-semibold text-[#111827]">
            Giriş Yap
          </Link>
          <Link href={iyTeklifHref(l)} onClick={onNavigate}
            className="block rounded-lg bg-[#1e40af] px-4 py-2.5 text-center text-[14px] font-semibold text-white">
            Teklif Al
          </Link>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Link href={iyLoginHref(l)}
          className="rounded-lg border border-[#111827]/15 px-4 py-2 text-[14px] font-semibold text-[#111827] hover:border-[#1e40af] hover:text-[#1e40af]">
          Giriş Yap
        </Link>
        <Link href={iyTeklifHref(l)}
          className="rounded-lg bg-[#1e40af] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#15317f]">
          Teklif Al
        </Link>
      </div>
    );
  }

  const avatarEl = avatar && imgOk ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatar} alt={name} onError={() => setImgOk(false)}
      className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" />
  ) : (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#1e40af] text-[13px] font-bold text-white">
      {initials(name, user.email)}
    </span>
  );

  const menuItems = (
    <>
      <Link href={`/${l}/dashboard`} onClick={() => { setOpen(false); onNavigate?.(); }}
        className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-[#1e293b] hover:bg-[#eff6ff]">
        <LayoutDashboard className="h-4 w-4 text-[#1e40af]" /> Panelim
      </Link>
      <Link href={`/${l}/profile`} onClick={() => { setOpen(false); onNavigate?.(); }}
        className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-[#1e293b] hover:bg-[#eff6ff]">
        <UserIcon className="h-4 w-4 text-[#1e40af]" /> Profilim
      </Link>
      <button type="button" onClick={handleLogout}
        className="flex w-full items-center gap-2.5 border-t border-[#f1f5f9] px-4 py-2.5 text-left text-[14px] text-[#dc2626] hover:bg-[#fef2f2]">
        <LogOut className="h-4 w-4" /> Çıkış Yap
      </button>
    </>
  );

  if (layout === 'mobile') {
    return (
      <div className="border-t border-[#f1f5f9] pt-3">
        <div className="flex items-center gap-3 px-1 pb-2">
          {avatarEl}
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[#0f172a]">{name}</p>
            <p className="truncate text-[12px] text-[#64748b]">{user.email}</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#edf0f4]">{menuItems}</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-[#edf0f4] py-1 pl-1 pr-2.5 hover:border-[#1e40af]/40">
        {avatarEl}
        <span className="hidden max-w-[120px] truncate text-[13.5px] font-semibold text-[#0f172a] sm:block">
          {name.split(' ')[0]}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#64748b] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[#edf0f4] bg-white py-1 shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
            <div className="border-b border-[#f1f5f9] px-4 py-3">
              <p className="truncate text-[14px] font-semibold text-[#0f172a]">{name}</p>
              <p className="truncate text-[12px] text-[#64748b]">{user.email}</p>
            </div>
            {menuItems}
          </div>
        </>
      )}
    </div>
  );
}
