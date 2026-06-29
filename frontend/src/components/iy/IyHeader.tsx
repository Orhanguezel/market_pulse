'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { IY_MENU, iyLinkHref, iyTeklifHref, iyLoginHref, IY_SURFACE_STYLE } from './iy-data';

export default function IyHeader({ locale }: { locale?: string }) {
  const l = locale || 'tr';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const signInUrl = iyLoginHref(l);

  return (
    <header
      style={IY_SURFACE_STYLE}
      className="sticky top-0 z-50 w-full border-b border-[#edf0f4] bg-white"
    >
      <div className="mx-auto flex min-h-[72px] max-w-[1320px] items-center justify-between gap-4 px-5 py-3 lg:px-9">
        {/* Logo */}
        <Link href={`/${l}`} className="flex shrink-0 items-center">
          <Image
            src="/iy/logo.png"
            alt="İşletmeni Yönet"
            width={300}
            height={91}
            priority
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop menu */}
        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            href={`/${l}`}
            className="rounded-md px-3 py-2 text-[14px] font-medium text-[#111827] hover:text-[#1e40af]"
          >
            Anasayfa
          </Link>
          {IY_MENU.map((group) => (
            <div key={group.label} className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-3 py-2 text-[14px] font-medium text-[#111827] hover:text-[#1e40af]"
              >
                {group.label}
                <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:rotate-180" />
              </button>
              {/* Mega panel */}
              <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div
                  className="grid gap-6 rounded-2xl border border-[#edf0f4] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
                  style={{
                    gridTemplateColumns: `repeat(${group.columns.length}, minmax(220px, 1fr))`,
                  }}
                >
                  {group.columns.map((col) => (
                    <div key={col.title}>
                      <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[#1e40af]">
                        {col.title}
                      </p>
                      <ul className="space-y-1.5">
                        {col.links.map((link) => (
                          <li key={link.label}>
                            <Link
                              href={iyLinkHref(l, link)}
                              className="block rounded-md px-2 py-1.5 text-[13.5px] leading-snug text-[#475569] hover:bg-[#eff6ff] hover:text-[#1e40af]"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={signInUrl}
            className="rounded-lg border border-[#111827]/15 px-4 py-2 text-[14px] font-semibold text-[#111827] hover:border-[#1e40af] hover:text-[#1e40af]"
          >
            Giriş Yap
          </a>
          <Link
            href={iyTeklifHref(l)}
            className="rounded-lg bg-[#1e40af] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#15317f]"
          >
            Teklif Al
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Menü"
          onClick={() => setMobileOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-[#edf0f4] text-[#0f172a] lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="max-h-[80vh] overflow-y-auto border-t border-[#edf0f4] bg-white px-5 py-4 lg:hidden">
          <Link
            href={`/${l}`}
            onClick={() => setMobileOpen(false)}
            className="block rounded-md px-2 py-2 text-[15px] font-semibold text-[#0f172a]"
          >
            Anasayfa
          </Link>
          {IY_MENU.map((group) => (
            <div key={group.label} className="border-t border-[#f1f5f9]">
              <button
                type="button"
                onClick={() => setOpenGroup(openGroup === group.label ? null : group.label)}
                className="flex w-full items-center justify-between px-2 py-3 text-[15px] font-semibold text-[#0f172a]"
              >
                {group.label}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openGroup === group.label ? 'rotate-180' : ''}`}
                />
              </button>
              {openGroup === group.label && (
                <div className="pb-2">
                  {group.columns.map((col) => (
                    <div key={col.title} className="mb-2">
                      <p className="px-2 py-1 text-[12px] font-semibold uppercase tracking-wide text-[#1e40af]">
                        {col.title}
                      </p>
                      {col.links.map((link) => (
                        <Link
                          key={link.label}
                          href={iyLinkHref(l, link)}
                          onClick={() => setMobileOpen(false)}
                          className="block rounded-md px-3 py-1.5 text-[14px] text-[#475569] hover:text-[#1e40af]"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-[#f1f5f9] pt-3">
            <a
              href={signInUrl}
              className="rounded-lg border border-[#111827]/15 px-4 py-2.5 text-center text-[14px] font-semibold text-[#111827]"
            >
              Giriş Yap
            </a>
            <Link
              href={iyTeklifHref(l)}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-[#1e40af] px-4 py-2.5 text-center text-[14px] font-semibold text-white"
            >
              Teklif Al
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
