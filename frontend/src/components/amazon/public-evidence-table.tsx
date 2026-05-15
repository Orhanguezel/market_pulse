'use client';

import * as React from 'react';
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileJson,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetPublicScanProductsQuery } from '@/integrations/rtk/public/amazon_scan.endpoints';

interface ProductRow {
  asin: string | null;
  title: string;
  price: number | null;
  rating: number | null;
  review_count: number | null;
  seller_name: string | null;
  product_url: string | null;
  has_keepa?: boolean;
}

type SortCol = 'title' | 'price' | 'rating' | 'review_count' | 'seller_name';
type SortDir = 'asc' | 'desc';

function escCsv(v: unknown): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function downloadCsv(products: ProductRow[], filename: string) {
  const headers = ['ASIN', 'Başlık', 'Fiyat (€)', 'Rating', 'Yorum', 'Satıcı', 'URL'];
  const rows = products.map((p) => [
    p.asin ?? '',
    p.title,
    p.price !== null ? String(p.price) : '',
    p.rating !== null ? String(p.rating) : '',
    String(p.review_count ?? ''),
    p.seller_name ?? '',
    p.product_url ?? '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map(escCsv).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(products: ProductRow[], filename: string) {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sortProducts(products: ProductRow[], col: SortCol, dir: SortDir) {
  return [...products].sort((a, b) => {
    let va: number | string = 0;
    let vb: number | string = 0;
    if (col === 'price') { va = a.price ?? -1; vb = b.price ?? -1; }
    else if (col === 'rating') { va = a.rating ?? -1; vb = b.rating ?? -1; }
    else if (col === 'review_count') { va = a.review_count ?? 0; vb = b.review_count ?? 0; }
    else if (col === 'seller_name') { va = (a.seller_name ?? '').toLowerCase(); vb = (b.seller_name ?? '').toLowerCase(); }
    else { va = a.title.toLowerCase(); vb = b.title.toLowerCase(); }
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function ColHeader({
  label, col, sortCol, sortDir, onSort, className,
}: {
  label: string; col: SortCol; sortCol: SortCol; sortDir: SortDir;
  onSort: (c: SortCol) => void; className?: string;
}) {
  const active = sortCol === col;
  return (
    <th
      className={cn(
        'cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-(--gm-muted) hover:text-(--gm-text) transition-colors',
        className,
      )}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
        ) : (
          <ArrowUpDown className="size-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

interface Props {
  jobId: string;
  keyword: string;
  marketplace: string;
}

export default function PublicEvidenceTable({ jobId, keyword, marketplace }: Props) {
  const { data: rawProducts = [], isLoading } = useGetPublicScanProductsQuery(jobId);

  const products = rawProducts as ProductRow[];

  const [priceMin, setPriceMin] = React.useState('');
  const [priceMax, setPriceMax] = React.useState('');
  const [reviewMin, setReviewMin] = React.useState('');
  const [ratingMin, setRatingMin] = React.useState('');

  const [sortCol, setSortCol] = React.useState<SortCol>('review_count');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('desc'); }
  };

  const filtered = React.useMemo(() => {
    let list = products;
    const pmn = priceMin !== '' ? Number(priceMin) : null;
    const pmx = priceMax !== '' ? Number(priceMax) : null;
    const rmn = reviewMin !== '' ? Number(reviewMin) : null;
    const rtmn = ratingMin !== '' ? Number(ratingMin) : null;
    if (pmn !== null) list = list.filter((p) => (p.price ?? -1) >= pmn);
    if (pmx !== null) list = list.filter((p) => (p.price ?? Infinity) <= pmx);
    if (rmn !== null) list = list.filter((p) => (p.review_count ?? 0) >= rmn);
    if (rtmn !== null) list = list.filter((p) => (p.rating ?? 0) >= rtmn);
    return sortProducts(list, sortCol, sortDir);
  }, [products, priceMin, priceMax, reviewMin, ratingMin, sortCol, sortDir]);

  const filename = `market-pulse-${keyword.replace(/\s+/g, '-')}-${marketplace}`;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded-2xl bg-(--gm-surface)/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!products.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-(--gm-gold)" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-gold)">Ürün Kanıt Tablosu</span>
        <span className="text-[10px] text-(--gm-muted)">{products.length} ürün</span>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/10 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Fiyat min (€)', val: priceMin, set: setPriceMin, ph: '0' },
            { label: 'Fiyat max (€)', val: priceMax, set: setPriceMax, ph: '∞' },
            { label: 'Yorum min', val: reviewMin, set: setReviewMin, ph: '0' },
            { label: 'Rating ≥', val: ratingMin, set: setRatingMin, ph: '0' },
          ].map(({ label, val, set, ph }) => (
            <div key={label} className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-(--gm-muted)">{label}</label>
              <input
                type="number"
                min={0}
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder={ph}
                className="h-9 w-full rounded-xl border border-(--gm-border-soft) bg-(--gm-surface)/20 px-3 text-sm text-(--gm-text) placeholder:text-(--gm-muted)/40 focus:border-(--gm-primary) focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Export actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/10 px-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--gm-muted)">
          {filtered.length} / {products.length} ürün
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => downloadCsv(filtered, `${filename}.csv`)}
            className="inline-flex items-center gap-1.5 rounded-full border border-(--gm-border-soft) bg-(--gm-surface)/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-(--gm-text) hover:bg-(--gm-surface) transition-colors"
          >
            <Download className="size-3" /> CSV
          </button>
          <button
            type="button"
            onClick={() => downloadJson(filtered, `${filename}.json`)}
            className="inline-flex items-center gap-1.5 rounded-full border border-(--gm-border-soft) bg-(--gm-surface)/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-(--gm-text) hover:bg-(--gm-surface) transition-colors"
          >
            <FileJson className="size-3" /> JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/5">
        <table className="w-full text-sm">
          <thead className="border-b border-(--gm-border-soft)">
            <tr>
              <th className="w-24 px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-(--gm-muted)">ASIN</th>
              <ColHeader label="Başlık" col="title" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="min-w-[200px]" />
              <ColHeader label="Fiyat" col="price" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-24" />
              <ColHeader label="Rating" col="rating" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-20" />
              <ColHeader label="Yorum" col="review_count" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-24" />
              <ColHeader label="Satıcı" col="seller_name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="min-w-[120px]" />
              <th className="w-20 px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-(--gm-muted)">Keepa</th>
              <th className="w-14 px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-(--gm-muted)">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--gm-border-soft)]/50">
            {filtered.map((p, i) => (
              <tr key={p.asin ?? i} className="hover:bg-(--gm-surface)/10 transition-colors">
                <td className="px-3 py-2 font-mono text-[10px] text-(--gm-muted)">{p.asin || '—'}</td>
                <td className="px-3 py-2 text-(--gm-text) max-w-[280px]">
                  <span className="line-clamp-2 text-xs leading-5">{p.title}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-(--gm-text)">
                  {p.price !== null ? `€${p.price.toFixed(2)}` : '—'}
                </td>
                <td className="px-3 py-2 text-right">
                  {p.rating !== null ? (
                    <span className={cn(
                      'font-mono text-xs',
                      p.rating >= 4 ? 'text-emerald-500' : p.rating >= 3 ? 'text-yellow-500' : 'text-red-500',
                    )}>
                      {p.rating.toFixed(1)}
                    </span>
                  ) : <span className="text-(--gm-muted)">—</span>}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-(--gm-text)">
                  {p.review_count?.toLocaleString('tr-TR') ?? '—'}
                </td>
                <td className="px-3 py-2 text-xs text-(--gm-muted) max-w-[140px] truncate">
                  {p.seller_name ?? <span className="italic">Bilinmiyor</span>}
                </td>
                <td className="px-3 py-2">
                  {p.has_keepa ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500">
                      <Check className="size-2.5" /> Var
                    </span>
                  ) : (
                    <span className="text-[9px] text-(--gm-muted)/50">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {p.product_url ? (
                    <a href={p.product_url} target="_blank" rel="noreferrer"
                      className="text-(--gm-primary) hover:text-(--gm-gold) transition-colors">
                      <ExternalLink className="size-4" />
                    </a>
                  ) : <span className="text-(--gm-muted)/30">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center font-serif text-sm italic text-(--gm-muted)">
            Filtrelere uyan ürün bulunamadı.
          </div>
        )}
      </div>

      <p className="text-[10px] text-(--gm-muted)/50">
        {filtered.length}/{products.length} ürün · {keyword} · Amazon {marketplace.toUpperCase()}
      </p>
    </div>
  );
}
