'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Check, Lock, Sparkles, Package as PackageIcon } from 'lucide-react';
import { useMyPackagesQuery, type PackageItem } from '@/integrations/rtk/public/entitlements.endpoints';

function money(value: string | number, currency: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ${currency}`;
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
}

function periodLabel(p: string) {
  return p === 'yearly' ? 'yıl' : 'ay';
}

function PackageCard({ pkg, locale }: { pkg: PackageItem; locale: string }) {
  const price = Number(pkg.base_price) || 0;
  const state = pkg.owned ? 'owned' : pkg.free ? 'free' : 'locked';

  return (
    <div
      className={`flex flex-col rounded-2xl border p-5 transition-shadow hover:shadow-md ${
        state === 'owned' ? 'border-emerald-300 bg-emerald-50/40' : state === 'free' ? 'border-slate-200 bg-white' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">{pkg.name}</h3>
          <span className="text-[11px] uppercase tracking-wide text-slate-400">{pkg.category}</span>
        </div>
        {state === 'owned' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <Check className="size-3.5" /> Aktif
          </span>
        ) : state === 'free' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            <Sparkles className="size-3.5" /> Ücretsiz
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            <Lock className="size-3.5" /> Kilitli
          </span>
        )}
      </div>

      {pkg.description && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{pkg.description}</p>}

      <div className="mt-4 flex items-baseline gap-1">
        {pkg.free || price === 0 ? (
          <span className="text-2xl font-bold text-slate-900">Ücretsiz</span>
        ) : (
          <>
            <span className="text-2xl font-bold text-slate-900">{money(price, pkg.currency)}</span>
            <span className="text-sm text-slate-400">/ {periodLabel(pkg.billing_period)}</span>
          </>
        )}
      </div>

      <div className="mt-auto pt-5">
        {state === 'owned' ? (
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">
            Hesabınızda aktif
          </div>
        ) : state === 'free' ? (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-center text-sm text-slate-500">Herkese açık</div>
        ) : (
          <Link
            href={`/${locale}/contact`}
            className="block rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Havale ile satın al
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PackagesPage() {
  const params = useParams();
  const locale = (Array.isArray(params?.locale) ? params?.locale[0] : params?.locale) || 'tr';
  const { data, isLoading } = useMyPackagesQuery();
  const packages = data?.packages ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <PackageIcon className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paketler</h1>
          <p className="text-sm text-slate-500">
            Mail &amp; Takvim ücretsiz. Diğer paketleri havale ile satın alın; ödemeyi bildirdiğinizde hesabınıza tanımlarız.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-400">Yükleniyor…</div>
      ) : packages.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Paket bulunamadı.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.module_key} pkg={pkg} locale={locale} />
          ))}
        </div>
      )}

      <p className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Ödeme şu an <strong>havale ile manuel</strong> yapılmaktadır. Satın almak istediğiniz paket için bizimle iletişime geçin;
        ödemeniz onaylandığında ilgili paket hesabınıza açılır.
      </p>
    </div>
  );
}
