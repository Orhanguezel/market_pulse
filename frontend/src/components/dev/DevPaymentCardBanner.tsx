// =============================================================
// DEV ONLY — Iyzipay sandbox test kartı bilgileri.
// Sadece NODE_ENV=development'ta render olur. Prod build'da tree-shake edilir.
// Kaldırma: bu dosyayı sil + ClientLayout.tsx'teki import + usage satırını sil.
// =============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, CreditCard, Copy, Check } from 'lucide-react';

const TEST_CARD = {
  number: '5528790000000008',
  cvc: '123',
  expiry: '12/30',
  holder: 'Test Kullanici',
};

// Ödeme akışı sayfalarında göster — kullanıcı Iyzipay'e yönlendirilmeden ÖNCE
// kart bilgilerini görsün (Iyzipay 3rd party sayfasında widget görünmez).
const PAYMENT_PATH_RE = /\/(checkout|odeme|pricing|me\/credits)(?:\/|$|\?)/i;

export default function DevPaymentCardBanner() {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Client-only render — SSR'da pathname boş, mismatch'i önle
  useEffect(() => setMounted(true), []);

  // Hook order korumak için TÜM hook'lar üstte; guard'lar burada.
  if (!mounted) return null;
  if (process.env.NODE_ENV !== 'development') return null;
  if (!PAYMENT_PATH_RE.test(pathname)) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Test kart bilgilerini göster"
        className="fixed bottom-4 right-4 z-[9999] w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-2xl flex items-center justify-center transition-colors"
      >
        <CreditCard size={20} />
      </button>
    );
  }

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* noop */
    }
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-amber-100/80 font-mono">{label}</span>
      <button
        type="button"
        onClick={() => copy(label, value)}
        className="flex items-center gap-1.5 font-mono text-white hover:text-amber-200 transition-colors"
        title={`${label} kopyala`}
      >
        <span>{value}</span>
        {copied === label ? (
          <Check className="w-3 h-3 text-emerald-300" />
        ) : (
          <Copy className="w-3 h-3 opacity-50" />
        )}
      </button>
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-72 rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-700 to-amber-900 shadow-2xl backdrop-blur p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-amber-200" />
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-amber-100">
            Iyzipay Sandbox · DEV
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-amber-100/70 hover:text-white transition-colors"
          title="Gizle"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-2">
        <Row label="Kart" value={TEST_CARD.number} />
        <Row label="CVC" value={TEST_CARD.cvc} />
        <Row label="Tarih" value={TEST_CARD.expiry} />
        <Row label="Sahip" value={TEST_CARD.holder} />
      </div>

      <p className="mt-3 pt-3 border-t border-amber-400/30 text-[10px] text-amber-100/70 leading-relaxed">
        Sadece dev build'da görünür. Prod'a çıkmadan bu component'i kaldır.
      </p>
    </div>
  );
}
