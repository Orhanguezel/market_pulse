'use client';

import * as React from 'react';
import {
  ArrowUpDown,
  Check,
  ChevronUp,
  ChevronDown,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useListAmazonScanProductsQuery,
  useRescoreAmazonJobMutation,
  type AmazonProductEvidence,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

type SortCol = 'title' | 'price' | 'rating' | 'review_count' | 'seller_name';
type SortDir = 'asc' | 'desc';

interface Props {
  jobId: string;
  keyword: string;
  marketplace: string;
  onRescoreDone?: () => void;
}

// ---- Export helpers --------------------------------------------------------

function escCsv(v: unknown): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function downloadCsv(products: AmazonProductEvidence[], filename: string) {
  const headers = ['ASIN', 'Başlık', 'Fiyat (€)', 'Rating', 'Yorum Sayısı', 'Satıcı', 'Keepa', 'URL'];
  const rows = products.map((p) => [
    p.asin ?? '',
    p.title,
    p.price !== null ? String(p.price) : '',
    p.rating !== null ? String(p.rating) : '',
    String(p.review_count ?? ''),
    p.seller_name ?? '',
    p.has_keepa ? 'Evet' : 'Hayır',
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

function downloadJson(products: AmazonProductEvidence[], filename: string) {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Sort helpers ----------------------------------------------------------

function sortProducts(products: AmazonProductEvidence[], col: SortCol, dir: SortDir) {
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

// ---- Column header ---------------------------------------------------------

function ColHeader({
  label,
  col,
  sortCol,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  col: SortCol;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (c: SortCol) => void;
  className?: string;
}) {
  const active = sortCol === col;
  return (
    <th
      className={cn('cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-gm-muted hover:text-gm-text transition-colors', className)}
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

// ---- Main component --------------------------------------------------------

export default function EvidenceTable({ jobId, keyword, marketplace, onRescoreDone }: Props) {
  const { data: products = [], isLoading } = useListAmazonScanProductsQuery({ jobId, limit: 200 });
  const [rescoreJob, rescoreState] = useRescoreAmazonJobMutation();

  // Filters
  const [priceMin, setPriceMin] = React.useState('');
  const [priceMax, setPriceMax] = React.useState('');
  const [reviewMin, setReviewMin] = React.useState('');
  const [reviewMax, setReviewMax] = React.useState('');
  const [ratingMin, setRatingMin] = React.useState('');
  const [hasSeller, setHasSeller] = React.useState(false);

  // Sort
  const [sortCol, setSortCol] = React.useState<SortCol>('review_count');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');

  // Selection
  const [selectedAsins, setSelectedAsins] = React.useState<Set<string>>(() => new Set());

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('desc'); }
  };

  const filtered = React.useMemo(() => {
    let list = products as AmazonProductEvidence[];
    const pmn = priceMin !== '' ? Number(priceMin) : null;
    const pmx = priceMax !== '' ? Number(priceMax) : null;
    const rmn = reviewMin !== '' ? Number(reviewMin) : null;
    const rmx = reviewMax !== '' ? Number(reviewMax) : null;
    const rtmn = ratingMin !== '' ? Number(ratingMin) : null;

    if (pmn !== null) list = list.filter((p) => (p.price ?? -1) >= pmn);
    if (pmx !== null) list = list.filter((p) => (p.price ?? Infinity) <= pmx);
    if (rmn !== null) list = list.filter((p) => (p.review_count ?? 0) >= rmn);
    if (rmx !== null) list = list.filter((p) => (p.review_count ?? 0) <= rmx);
    if (rtmn !== null) list = list.filter((p) => (p.rating ?? 0) >= rtmn);
    if (hasSeller) list = list.filter((p) => !!p.seller_name);
    return sortProducts(list, sortCol, sortDir);
  }, [products, priceMin, priceMax, reviewMin, reviewMax, ratingMin, hasSeller, sortCol, sortDir]);

  // Keep selection in sync with filtered
  React.useEffect(() => {
    setSelectedAsins((prev) => {
      const visible = new Set(filtered.map((p) => p.asin ?? '').filter(Boolean));
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selectedAsins.has(p.asin ?? ''));

  const toggleAll = () => {
    if (allSelected) setSelectedAsins(new Set());
    else setSelectedAsins(new Set(filtered.map((p) => p.asin ?? '').filter(Boolean)));
  };

  const toggleRow = (asin: string) => {
    setSelectedAsins((prev) => {
      const next = new Set(prev);
      if (next.has(asin)) next.delete(asin); else next.add(asin);
      return next;
    });
  };

  const handleRescore = async () => {
    const asins = [...selectedAsins].filter(Boolean);
    if (!asins.length) { toast.error('Hariç tutulacak ürün seçin'); return; }
    try {
      const result = await rescoreJob({ jobId, exclude: { asins } }).unwrap();
      toast.success(
        `${result.excluded_count} ürün hariç tutuldu — yeni skor: ${result.report.composite_score?.toFixed(1) ?? '—'}`,
      );
      setSelectedAsins(new Set());
      onRescoreDone?.();
    } catch {
      toast.error('Yeniden puanlama başarısız');
    }
  };

  const filename = `market-pulse-${keyword.replace(/\s+/g, '-')}-${marketplace}`;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-2xl bg-gm-surface/20" />
        ))}
      </div>
    );
  }

  if (!products.length) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-gm-gold" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Ürün Kanıt Tablosu</span>
        <span className="text-[10px] text-gm-muted">{products.length} ürün</span>
      </div>

      {/* Filters */}
      <Card className="rounded-[24px] border-gm-border-soft bg-gm-bg-deep/50">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
            <div className="space-y-1">
              <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-gm-muted">Fiyat min (€)</Label>
              <Input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} type="number" min={0} placeholder="0"
                className="h-9 rounded-xl border-gm-border-soft bg-gm-surface/40 text-sm text-gm-text" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-gm-muted">Fiyat max (€)</Label>
              <Input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} type="number" min={0} placeholder="∞"
                className="h-9 rounded-xl border-gm-border-soft bg-gm-surface/40 text-sm text-gm-text" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-gm-muted">Yorum min</Label>
              <Input value={reviewMin} onChange={(e) => setReviewMin(e.target.value)} type="number" min={0} placeholder="0"
                className="h-9 rounded-xl border-gm-border-soft bg-gm-surface/40 text-sm text-gm-text" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-gm-muted">Yorum max</Label>
              <Input value={reviewMax} onChange={(e) => setReviewMax(e.target.value)} type="number" min={0} placeholder="∞"
                className="h-9 rounded-xl border-gm-border-soft bg-gm-surface/40 text-sm text-gm-text" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-gm-muted">Rating ≥</Label>
              <Input value={ratingMin} onChange={(e) => setRatingMin(e.target.value)} type="number" min={0} max={5} step={0.1} placeholder="0"
                className="h-9 rounded-xl border-gm-border-soft bg-gm-surface/40 text-sm text-gm-text" />
            </div>
            <div className="flex items-end pb-0.5 gap-2">
              <Checkbox id="hasSeller" checked={hasSeller} onCheckedChange={(v) => setHasSeller(v === true)}
                className="border-gm-border-soft data-[state=checked]:border-gm-gold data-[state=checked]:bg-gm-gold data-[state=checked]:text-black" />
              <Label htmlFor="hasSeller" className="text-[9px] font-bold uppercase tracking-[0.18em] text-gm-muted cursor-pointer">Satıcı var</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-gm-border-soft bg-gm-surface/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll}
            className="border-gm-border-soft data-[state=checked]:border-gm-gold data-[state=checked]:bg-gm-gold data-[state=checked]:text-black" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gm-muted">
            {selectedAsins.size > 0 ? `${selectedAsins.size} seçildi` : `${filtered.length} ürün gösteriliyor`}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedAsins.size > 0 && (
            <Button
              size="sm"
              disabled={rescoreState.isLoading}
              onClick={handleRescore}
              className="rounded-full bg-gm-error/90 px-5 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-error"
            >
              <RotateCcw className="mr-2 size-3.5" />
              Hariç Tut + Yeniden Puanla
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => downloadCsv(filtered, `${filename}.csv`)}
            className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface text-[10px] font-bold uppercase tracking-widest">
            <Download className="mr-2 size-3.5" />
            CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadJson(filtered, `${filename}.json`)}
            className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface text-[10px] font-bold uppercase tracking-widest">
            <FileJson className="mr-2 size-3.5" />
            JSON
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}
            className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface text-[10px] font-bold uppercase tracking-widest">
            <Printer className="mr-2 size-3.5" />
            PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[20px] border border-gm-border-soft bg-gm-bg-deep/50">
        <table className="w-full text-sm">
          <thead className="border-b border-gm-border-soft">
            <tr>
              <th className="w-10 px-3 py-2" />
              <th className="w-24 px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-gm-muted">ASIN</th>
              <ColHeader label="Başlık" col="title" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="min-w-[200px]" />
              <ColHeader label="Fiyat" col="price" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-24" />
              <ColHeader label="Rating" col="rating" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-20" />
              <ColHeader label="Yorum" col="review_count" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-24" />
              <ColHeader label="Satıcı" col="seller_name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="min-w-[120px]" />
              <th className="w-20 px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-gm-muted">Keepa</th>
              <th className="w-14 px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-gm-muted">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gm-border-soft/50">
            {filtered.map((p, i) => {
              const asin = p.asin ?? '';
              const selected = selectedAsins.has(asin);
              return (
                <tr
                  key={asin || i}
                  className={cn('transition-colors', selected ? 'bg-gm-gold/5' : 'hover:bg-gm-surface/10')}
                >
                  <td className="px-3 py-2">
                    {asin && (
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleRow(asin)}
                        className="border-gm-border-soft data-[state=checked]:border-gm-gold data-[state=checked]:bg-gm-gold data-[state=checked]:text-black"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-gm-muted">{asin || '—'}</td>
                  <td className="px-3 py-2 text-gm-text max-w-[280px]">
                    <span className="line-clamp-2 text-xs leading-5">{p.title}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-gm-text">
                    {p.price !== null ? `€${p.price.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {p.rating !== null ? (
                      <span className={cn('font-mono text-xs', p.rating >= 4 ? 'text-gm-success' : p.rating >= 3 ? 'text-gm-warning' : 'text-gm-error')}>
                        {p.rating.toFixed(1)}
                      </span>
                    ) : <span className="text-gm-muted">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-gm-text">
                    {p.review_count?.toLocaleString('tr-TR') ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gm-muted max-w-[140px] truncate">
                    {p.seller_name ?? <span className="italic">Bilinmiyor</span>}
                  </td>
                  <td className="px-3 py-2">
                    {p.has_keepa ? (
                      <Badge variant="outline" className="rounded-full border-gm-success/30 bg-gm-success/10 text-[9px] font-bold text-gm-success">
                        <Check className="mr-1 size-2.5" />
                        Var
                      </Badge>
                    ) : (
                      <span className="text-[9px] text-gm-muted/50">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {p.product_url ? (
                      <a href={p.product_url} target="_blank" rel="noreferrer"
                        className="text-gm-primary-light hover:text-gm-gold transition-colors">
                        <ExternalLink className="size-4" />
                      </a>
                    ) : <span className="text-gm-muted/30">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center font-serif text-sm italic text-gm-muted">
            Filtrelere uyan ürün bulunamadı.
          </div>
        )}
      </div>

      <p className="text-[10px] text-gm-muted/50">
        {filtered.length}/{products.length} ürün · {keyword} · Amazon {marketplace.toUpperCase()}
      </p>
    </div>
  );
}
