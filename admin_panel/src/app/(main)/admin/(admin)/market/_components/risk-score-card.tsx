'use client';

import * as React from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock,
  DollarSign,
  ExternalLink,
  Info,
  MessageSquare,
  Printer,
  Radar as RadarIcon,
  Star,
  TrendingUp,
  Users,
  ShieldAlert
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AmazonDimensionScore, AmazonRiskReport } from '@/integrations/endpoints/admin/market_admin.endpoints';
import { cn } from '@/lib/utils';

const DECISION_LABELS: Record<string, string> = {
  GUVENLI: 'Güvenli — Girilebilir',
  DIKKATLI_OL: 'Dikkatli Ol',
  GIRME: 'Girme — Yüksek Risk',
  MIXED_SIGNAL: 'Karışık Sinyal',
  INSUFFICIENT_DATA: 'Yetersiz Veri',
};

const DIMENSION_LABELS: Record<keyof AmazonRiskReport['scores'], string> = {
  category_risk: 'Kategori Riski',
  sku_chaos: 'SKU Karmaşası',
  price_war_risk: 'Fiyat Savaşı',
  brand_reliability: 'Marka Güveni',
  operational_risk: 'Operasyonel Risk',
};

const DIMENSION_DESC: Record<keyof AmazonRiskReport['scores'], string> = {
  category_risk: 'Kaç rakip var, kategori ne kadar dolu',
  sku_chaos: 'Fiyat aralığı, varyant baskısı, sigma',
  price_war_risk: 'Fiyat kırılımı, düşük fiyat kümesi',
  brand_reliability: 'Marka tutarlılığı, listing kalitesi',
  operational_risk: 'Yorum şikayetleri, iade oranı',
};

function decisionClass(decision: string) {
  if (decision === 'GUVENLI') return 'border-gm-success/40 bg-gm-success/10 text-gm-success';
  if (decision === 'DIKKATLI_OL' || decision === 'MIXED_SIGNAL') return 'border-gm-warning/40 bg-gm-warning/10 text-gm-warning';
  if (decision === 'GIRME') return 'border-gm-error/40 bg-gm-error/10 text-gm-error';
  return 'border-gm-border-soft bg-gm-surface/20 text-gm-muted';
}

function decisionBg(decision: string) {
  if (decision === 'GUVENLI') return 'bg-gm-success/5 border-gm-success/10';
  if (decision === 'DIKKATLI_OL' || decision === 'MIXED_SIGNAL') return 'bg-gm-warning/5 border-gm-warning/10';
  if (decision === 'GIRME') return 'bg-gm-error/5 border-gm-error/10';
  return 'bg-gm-surface/10 border-gm-border-soft/20';
}

function scoreBarColor(score: number) {
  if (score <= 3) return 'var(--color-risk-safe)';
  if (score <= 6) return 'var(--color-risk-warn)';
  return 'var(--color-risk-high)';
}

function scoreStatus(score: number): 'GUVENLI' | 'DIKKATLI_OL' | 'GIRME' {
  if (score <= 3) return 'GUVENLI';
  if (score <= 6) return 'DIKKATLI_OL';
  return 'GIRME';
}

function scoreStatusClass(status: 'GUVENLI' | 'DIKKATLI_OL' | 'GIRME') {
  if (status === 'GUVENLI') return 'border-gm-success/40 bg-gm-success/10 text-gm-success';
  if (status === 'DIKKATLI_OL') return 'border-gm-warning/40 bg-gm-warning/10 text-gm-warning';
  return 'border-gm-error/40 bg-gm-error/10 text-gm-error';
}

function flagLabel(flag: string) {
  const labels: Record<string, string> = {
    return: 'İade şikayeti',
    quality: 'Kalite sorunu',
    broke: 'Kırılma sorunu',
    fit: 'Uyum problemi',
    slippery: 'Kayma problemi',
    smell: 'Koku şikayeti',
    thin: 'İnce malzeme',
    loose: 'Gevşek ürün',
    cheap: 'Ucuz kalite algısı',
    disappointed: 'Memnuniyetsizlik',
  };
  return labels[flag] ?? flag;
}

function extractBrand(title: string): string {
  const words = title.trim().split(/\s+/);
  const brand: string[] = [];
  for (const w of words.slice(0, 3)) {
    if (/^[A-Z]/.test(w) && w.length > 1 && !/^\d/.test(w)) {
      brand.push(w);
      if (brand.length >= 2) break;
    } else break;
  }
  return brand.join(' ') || words[0] || '?';
}

function buildBrandData(products: AmazonRiskReport['products']) {
  if (!products?.length) return [];
  const map = new Map<string, { count: number; prices: number[]; ratings: number[] }>();
  for (const p of products) {
    const brand = extractBrand(p.title);
    if (!map.has(brand)) map.set(brand, { count: 0, prices: [], ratings: [] });
    const e = map.get(brand)!;
    e.count++;
    if (p.price != null) e.prices.push(p.price);
    if (p.rating != null) e.ratings.push(p.rating);
  }
  return Array.from(map.entries())
    .map(([name, d]) => ({
      name,
      productCount: d.count,
      avgPrice: d.prices.length ? +(d.prices.reduce((a, b) => a + b, 0) / d.prices.length).toFixed(2) : null,
      avgRating: d.ratings.length ? +(d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(1) : null,
    }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 8);
}

const PRICE_BUCKETS = [
  { label: '$0–15', min: 0, max: 15 },
  { label: '$15–30', min: 15, max: 30 },
  { label: '$30–60', min: 30, max: 60 },
  { label: '$60–100', min: 60, max: 100 },
  { label: '$100+', min: 100, max: Infinity },
];

function buildPriceHistogram(products: AmazonRiskReport['products']) {
  if (!products?.length) return [];
  return PRICE_BUCKETS.map(b => ({
    label: b.label,
    count: products.filter(p => p.price != null && p.price >= b.min && p.price < b.max).length,
  }));
}

function priceStats(products: AmazonRiskReport['products']) {
  const prices = (products ?? []).filter(p => p.price != null).map(p => p.price as number);
  if (!prices.length) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const filtered = sorted.filter(p => p >= lowerBound && p <= upperBound);
  const outlierCount = sorted.length - filtered.length;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const trimmedAvg = filtered.length ? filtered.reduce((a, b) => a + b, 0) / filtered.length : null;
  const median = sorted[Math.floor(sorted.length / 2)];
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: +avg.toFixed(2),
    median: +median.toFixed(2),
    trimmedAvg: trimmedAvg !== null ? +trimmedAvg.toFixed(2) : null,
    outlierCount,
    lowerBound: +lowerBound.toFixed(2),
    upperBound: +upperBound.toFixed(2),
  };
}

function buildRatingDistribution(products: AmazonRiskReport['products']) {
  const buckets = [
    { label: '4.5–5.0', min: 4.5, max: 5.01 },
    { label: '4.0–4.5', min: 4.0, max: 4.5 },
    { label: '3.5–4.0', min: 3.5, max: 4.0 },
    { label: '< 3.5',  min: 0,   max: 3.5 },
  ];
  if (!products?.length) return [];
  return buckets.map(b => ({
    label: b.label,
    count: products.filter(p => p.rating != null && p.rating >= b.min && p.rating < b.max).length,
  })).filter(b => b.count > 0);
}

function DimensionRow({ dimKey, label, item, flags }: { dimKey: string; label: string; item: AmazonDimensionScore; flags?: string[] }) {
  const [open, setOpen] = React.useState(false);
  const width = `${Math.min(100, Math.max(0, item.score * 10))}%`;
  const state = scoreStatus(item.score);
  const barColor = scoreBarColor(item.score);
  const desc = DIMENSION_DESC[dimKey as keyof AmazonRiskReport['scores']] ?? '';
  return (
    <div className={cn('rounded-2xl border transition-all duration-300', open ? 'border-gm-border-soft bg-gm-surface/20' : 'border-gm-border-soft/50 bg-gm-surface/5 hover:bg-gm-surface/10')}>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-serif text-base text-gm-text">{label}</p>
            <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', scoreStatusClass(state))}>
              {state === 'GUVENLI' ? 'Güvenli' : state === 'DIKKATLI_OL' ? 'Dikkat' : 'Girme'}
            </Badge>
            <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-bg-deep/50 text-[9px] text-gm-muted">
              {item.confidence}
            </Badge>
          </div>
          {!open && <p className="mt-0.5 text-[11px] text-gm-muted/70">{desc}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-lg font-bold" style={{ color: barColor }}>{item.score.toFixed(1)}</span>
          <ChevronDown className={cn('size-4 text-gm-muted transition-transform duration-300', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="space-y-3 px-4 pb-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-gm-bg-deep">
            <div className="h-full rounded-full transition-all duration-700" style={{ width, backgroundColor: barColor }} />
          </div>
          <p className="text-sm leading-6 text-gm-muted">{item.reason}</p>
          {flags && flags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {flags.map((flag) => (
                <Badge key={flag} variant="outline" className="rounded-full border-gm-error/20 bg-gm-error/5 text-[10px] text-gm-error">
                  <AlertTriangle className="mr-1 size-3" />
                  {flagLabel(flag)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RiskScoreCard({ report, compact }: { report: AmazonRiskReport; compact?: boolean }) {
  const Icon = report.decision === 'GUVENLI' ? CheckCircle2 : report.decision === 'GIRME' ? CircleAlert : AlertTriangle;
  const radarData = (Object.entries(report.scores) as Array<[keyof AmazonRiskReport['scores'], AmazonDimensionScore]>).map(([key, item]) => ({
    subject: DIMENSION_LABELS[key],
    A: item.score,
    fullMark: 10,
  }));
  const keepaTrend = report.keepa_trend;
  const brandData = buildBrandData(report.products);
  const hasSellers = (report.top_sellers?.length ?? 0) > 0;
  const priceHistogram = buildPriceHistogram(report.products);
  const pStats = priceStats(report.products);
  const ratingDist = buildRatingDistribution(report.products);

  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-gm-border-soft bg-gm-surface/10 p-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-gm-gold" />
          <span className="text-xs font-bold text-gm-text">{report.composite_score?.toFixed(1) ?? '—'}</span>
        </div>
        <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', decisionClass(report.decision))}>
          <Icon className="mr-1 size-3" />
          {DECISION_LABELS[report.decision] ?? report.decision}
        </Badge>
        <span className="text-[10px] text-gm-muted">Data: {report.data_points}</span>
      </div>
    );
  }

  return (
    <Card className={cn('rounded-[28px] border shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700', decisionBg(report.decision))}>
      <CardContent className="space-y-8 p-8">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gm-gold/10 p-2 text-gm-gold">
                <RadarIcon className="size-6" />
              </div>
              <h2 className="font-serif text-3xl text-gm-text">Amazon Ticari Karar Motoru</h2>
            </div>
            <p className="text-base italic leading-7 text-gm-muted">{report.summary}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/10 py-1 text-xs text-gm-muted">
                <Users className="mr-1.5 size-3.5" />
                {report.data_points} veri noktası
              </Badge>
              <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/10 py-1 text-xs text-gm-muted">
                <Clock className="mr-1.5 size-3.5" />
                {new Date(report.scanned_at).toLocaleString('tr-TR')}
              </Badge>
              {pStats && (
                <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/10 py-1 text-xs text-gm-muted">
                  <DollarSign className="mr-1 size-3.5" />
                  ${pStats.min.toFixed(0)} – ${pStats.max.toFixed(0)}
                  {pStats.trimmedAvg !== null && <> · temiz ort. <span className="text-gm-gold font-semibold">${pStats.trimmedAvg}</span></>}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-muted hover:bg-gm-surface print:hidden"
            >
              <Printer className="mr-2 size-4" />
              PDF / Yazdır
            </Button>
            <div className={cn('flex min-w-52 flex-col items-center justify-center rounded-[2rem] border p-8 shadow-inner', decisionBg(report.decision))}>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gm-muted">Composite Score</p>
              <p className="mt-2 font-serif text-6xl tracking-tighter text-gm-text">
                {report.composite_score?.toFixed(1) ?? '—'}
              </p>
              <Badge variant="outline" className={cn('mt-6 scale-110 rounded-full px-4 py-1.5 text-[10px] font-bold tracking-widest', decisionClass(report.decision))}>
                <Icon className="mr-2 size-4" />
                {DECISION_LABELS[report.decision] ?? report.decision}
              </Badge>
            </div>
          </div>
        </div>

        {/* Mixed signal warning */}
        {report.decision === 'MIXED_SIGNAL' && (
          <div className="flex gap-4 rounded-3xl border border-gm-warning/30 bg-gm-warning/10 p-5 text-sm leading-7 text-gm-warning shadow-lg">
            <AlertTriangle className="mt-1 size-5 shrink-0" />
            <div>
              <p className="font-bold">Karışık Sinyal Tespit Edildi</p>
              <p className="opacity-90">Risk boyutları arasında belirgin tutarsızlık var. Manuel inceleme önerilir.</p>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative h-80 overflow-hidden rounded-[2.5rem] border border-gm-border-soft bg-muted/30 p-6 shadow-xl">
            <p className="absolute left-6 top-6 z-10 text-xs font-bold uppercase tracking-widest text-gm-muted">Risk Profili (5 Boyut)</p>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} />
                <Radar name="Risk" dataKey="A" stroke="var(--color-brand-gold)" fill="var(--color-brand-gold)" fillOpacity={0.35} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: 'var(--color-brand-gold)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <p className="px-2 text-xs font-bold uppercase tracking-widest text-gm-muted">Risk Boyutları Detay <span className="normal-case font-normal opacity-60">— detay için tıkla</span></p>
            {(Object.entries(report.scores) as Array<[keyof AmazonRiskReport['scores'], AmazonDimensionScore]>).map(([key, item]) => (
              <DimensionRow
                key={key}
                dimKey={key}
                label={DIMENSION_LABELS[key]}
                item={item}
                flags={key === 'operational_risk' ? report.problem_flags : undefined}
              />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-4 rounded-full bg-gm-bg-deep p-1">
            <TabsTrigger value="products" className="rounded-full data-[state=active]:bg-gm-gold data-[state=active]:text-black">Ürün Kanıtları</TabsTrigger>
            <TabsTrigger value="sellers" className="rounded-full data-[state=active]:bg-gm-gold data-[state=active]:text-black">Markalar</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-full data-[state=active]:bg-gm-gold data-[state=active]:text-black">Fiyat Analizi</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-full data-[state=active]:bg-gm-gold data-[state=active]:text-black">Yorumlar</TabsTrigger>
          </TabsList>

          {/* Ürün Kanıtları */}
          <TabsContent value="products" className="mt-6">
            <div className="overflow-hidden rounded-[2rem] border border-gm-border-soft bg-gm-surface/5 shadow-xl">
              <Table>
                <TableHeader className="bg-gm-bg-deep/50">
                  <TableRow className="border-gm-border-soft hover:bg-transparent">
                    <TableHead className="text-xs uppercase text-gm-muted">Ürün</TableHead>
                    <TableHead className="text-xs uppercase text-gm-muted">Fiyat</TableHead>
                    <TableHead className="text-xs uppercase text-gm-muted">Rating</TableHead>
                    <TableHead className="text-xs uppercase text-gm-muted">Yorum</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.products?.map((p, idx) => (
                    <TableRow
                      key={idx}
                      className="cursor-pointer border-gm-border-soft transition-colors hover:bg-gm-surface/10"
                      onClick={() => p.product_url && window.open(p.product_url, '_blank')}
                    >
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm font-medium text-gm-text">{p.title}</p>
                        <p className="font-mono text-[10px] uppercase text-gm-muted">{p.asin}</p>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gm-text">{p.price ? `$${p.price.toFixed(2)}` : '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="size-3 fill-gm-gold text-gm-gold" />
                          <span className="text-sm">{p.rating?.toFixed(1) ?? '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gm-muted">{p.review_count?.toLocaleString('tr-TR')}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {p.product_url && (
                          <a href={p.product_url} target="_blank" rel="noopener noreferrer" className="text-gm-muted transition-colors hover:text-gm-gold">
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Markalar */}
          <TabsContent value="sellers" className="mt-6 space-y-4">
            <p className="text-xs text-gm-muted">
              {hasSellers
                ? 'Kategorideki ana satıcılar ve fiyat pozisyonları.'
                : 'Ürün başlıklarından çıkarılan marka analizi — bu pazardaki ana oyuncular.'}
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {(hasSellers ? report.top_sellers! : brandData).map((s, idx) => {
                const name = 'seller_name' in s ? s.seller_name : s.name;
                const count = 'product_count' in s ? s.product_count : s.productCount;
                const price = 'avg_price' in s ? s.avg_price : s.avgPrice;
                const rating = 'avgRating' in s ? s.avgRating : null;
                return (
                  <Card key={idx} className="overflow-hidden rounded-3xl border-gm-border-soft bg-gm-surface/5 transition-all hover:border-gm-gold/30">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between">
                        <div className="rounded-full bg-gm-gold/10 p-2 text-gm-gold">
                          <Users className="size-4" />
                        </div>
                        <Badge variant="outline" className="rounded-full border-gm-gold/20 text-[9px] text-gm-gold">#{idx + 1}</Badge>
                      </div>
                      <h4 className="truncate font-serif text-base text-gm-text">{name}</h4>
                      <p className="text-[10px] uppercase tracking-wider text-gm-muted">{count} ürün</p>
                      <div className="flex items-center justify-between border-t border-gm-border-soft pt-2">
                        <span className="text-xs text-gm-muted">Ort. Fiyat</span>
                        <span className="font-mono text-sm text-gm-text">{price != null ? `$${Number(price).toFixed(2)}` : '—'}</span>
                      </div>
                      {rating != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gm-muted">Ort. Rating</span>
                          <span className="flex items-center gap-1 font-mono text-sm text-gm-text">
                            <Star className="size-3 fill-gm-gold text-gm-gold" />{rating}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {!hasSellers && brandData.length > 0 && (
              <p className="mt-2 text-[10px] italic text-gm-muted/60">
                * Scraper satıcı bilgisi sağlamadığından markalar ürün başlıklarından çıkarıldı.
              </p>
            )}
          </TabsContent>

          {/* Fiyat Analizi */}
          <TabsContent value="trends" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">

              {/* Fiyat Dağılımı Histogram */}
              {priceHistogram.some(b => b.count > 0) && (
                <div className="rounded-[2.5rem] border border-gm-border-soft bg-muted/30 p-6 shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gm-muted">Fiyat Dağılımı</h3>
                      {pStats && (
                        <p className="mt-1 text-[10px] text-gm-muted/70">
                          Medyan: ${pStats.median} · Ortalama: ${pStats.avg}
                        </p>
                      )}
                    </div>
                    <DollarSign className="size-4 text-gm-gold" />
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priceHistogram} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '12px', fontSize: '12px' }}
                          formatter={(v) => [`${v} ürün`, 'Adet']}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {priceHistogram.map((entry, i) => (
                            <Cell key={i} fill={entry.count === Math.max(...priceHistogram.map(b => b.count)) ? 'var(--color-brand-gold)' : 'var(--color-muted)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-3 text-[10px] italic text-gm-muted/60">
                    En yoğun fiyat bandı: girmek istediğiniz bölge burası
                  </p>
                </div>
              )}

              {/* Keepa Trendi */}
              {Array.isArray(keepaTrend) && keepaTrend.length > 1 ? (
                <div className="rounded-[2.5rem] border border-gm-border-soft bg-muted/30 p-6 shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gm-muted">Fiyat Geçmişi (Keepa)</h3>
                      {report.buy_box_change_count !== undefined && (
                        <p className="mt-1 text-[10px] text-gm-gold">Buy Box Değişimi: {report.buy_box_change_count}</p>
                      )}
                    </div>
                    <TrendingUp className="size-4 text-gm-gold" />
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={keepaTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '12px' }} />
                        <Line type="monotone" dataKey="price" stroke="var(--color-brand-gold)" strokeWidth={3} dot={{ r: 5, fill: 'var(--color-brand-gold)', strokeWidth: 0 }} activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : null}

              {/* Pazar Özeti */}
              <Card className="rounded-[2.5rem] border-gm-border-soft bg-gm-surface/5 p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Info className="size-5 text-gm-gold" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gm-text">Pazar Özeti</h3>
                </div>
                <div className="space-y-3 text-sm text-gm-muted">
                  {pStats && (
                    <>
                      <div className="flex justify-between">
                        <span>En düşük fiyat</span>
                        <span className="font-mono text-gm-success">${pStats.min.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>En yüksek fiyat</span>
                        <span className="font-mono text-gm-error">${pStats.max.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Genel ortalama</span>
                        <span className="font-mono text-gm-muted">${pStats.avg}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medyan</span>
                        <span className="font-mono text-gm-text">${pStats.median}</span>
                      </div>
                      {pStats.trimmedAvg !== null && (
                        <div className="flex flex-col gap-1 rounded-xl border border-gm-warning/20 bg-gm-warning/5 p-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gm-warning">Temiz ortalama</span>
                            <span className="font-mono font-bold text-gm-warning">${pStats.trimmedAvg}</span>
                          </div>
                          {pStats.outlierCount > 0 && (
                            <p className="text-[10px] text-gm-muted/70">
                              {pStats.outlierCount} aşırı fiyat çıkarıldı
                              (${pStats.lowerBound.toFixed(0)}–${pStats.upperBound.toFixed(0)} aralığı dışı)
                            </p>
                          )}
                          <p className="text-[10px] italic text-gm-muted/60">
                            Giriş fiyatınızı bu değer etrafında konumlandırın
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between border-t border-gm-border-soft pt-2">
                    <span>Analiz edilen ürün</span>
                    <span className="font-mono text-gm-text">{report.products?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tespit edilen marka</span>
                    <span className="font-mono text-gm-text">{brandData.length}</span>
                  </div>
                  {report.problem_flags && report.problem_flags.length > 0 && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-gm-error/10 p-3 text-gm-error">
                      <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                      <p className="text-xs font-bold uppercase">Kritik müşteri şikayetleri tespit edildi.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
          {/* Yorumlar */}
          <TabsContent value="reviews" className="mt-6 space-y-5">
            {/* Rating dağılımı */}
            {ratingDist.length > 0 && (
              <div className="rounded-[2rem] border border-gm-border-soft bg-muted/30 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Star className="size-4 text-gm-gold fill-gm-gold" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gm-muted">Rating Dağılımı</h3>
                </div>
                <div className="space-y-2">
                  {ratingDist.map(b => {
                    const total = ratingDist.reduce((a, c) => a + c.count, 0);
                    const pct = total ? Math.round((b.count / total) * 100) : 0;
                    const color = b.label.startsWith('4.5') ? 'var(--color-gm-success)' : b.label.startsWith('4.0') ? 'var(--color-gm-primary)' : b.label.startsWith('3.5') ? 'var(--color-gm-warning)' : 'var(--color-gm-error)';
                    return (
                      <div key={b.label} className="flex items-center gap-3">
                        <span className="w-16 text-right text-xs text-gm-muted">{b.label}</span>
                        <div className="flex-1 h-5 overflow-hidden rounded-full bg-gm-bg-deep/30">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                        <span className="w-16 text-xs text-gm-muted">{b.count} ürün <span className="text-[10px] opacity-60">({pct}%)</span></span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11px] text-gm-muted/70 italic">
                  Yüksek ratingli ürün oranı fazlaysa tüketici beklentisi yüksek — kalite tutarsızlığı risk oluşturur.
                </p>
              </div>
            )}

            {/* Problem flags */}
            {report.problem_flags && report.problem_flags.length > 0 && (
              <div className="rounded-[2rem] border border-gm-error/20 bg-gm-error/5 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldAlert className="size-4 text-gm-error" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gm-error">AI Tespit Ettiği Şikayetler</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.problem_flags.map(flag => (
                    <Badge key={flag} variant="outline" className="rounded-full border-gm-error/30 bg-gm-error/10 text-sm text-gm-error">
                      <AlertTriangle className="mr-1.5 size-3" />
                      {flagLabel(flag)}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gm-muted leading-5">
                  Bu şikayetler ürün başlıkları ve meta verilerinden AI tarafından tespit edildi. Gerçek yorum metinleri analizi için Amazon'daki ürünlere tıklayıp yorumları inceleyebilirsiniz.
                </p>
              </div>
            )}

            {/* Neden yorum metni yok */}
            <div className="rounded-[2rem] border border-gm-border-soft bg-gm-surface/5 p-6">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="size-4 text-gm-gold" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gm-muted">Gerçek Yorum Metinleri</h3>
              </div>
              <p className="text-sm text-gm-muted leading-6">
                Şu an elimizde yalnızca <strong className="text-gm-text">yorum sayısı</strong> ve <strong className="text-gm-text">rating puanı</strong> bulunuyor.
                Gerçek yorum metinlerini görmek için {report.products?.slice(0, 3).map((p, i) => p.product_url ? (
                  <a key={i} href={p.product_url} target="_blank" rel="noopener noreferrer" className="text-gm-gold underline underline-offset-2 hover:text-gm-gold-light mx-1">
                    {extractBrand(p.title)} ürününe
                  </a>
                ) : null)} tıklayıp Amazon yorumlarını inceleyebilirsiniz.
              </p>
              <p className="mt-3 text-xs text-gm-muted/70 italic">
                İleride planlanan: review scraping modülü ile gerçek yorum sentezi (en çok tekrar eden şikayetler, olumlu temalar, rakip zayıflıkları).
              </p>
            </div>

            {/* Ürün bazlı review sayıları */}
            <div className="overflow-hidden rounded-[2rem] border border-gm-border-soft bg-gm-surface/5 shadow-xl">
              <Table>
                <TableHeader className="bg-gm-bg-deep/50">
                  <TableRow className="border-gm-border-soft hover:bg-transparent">
                    <TableHead className="text-xs uppercase text-gm-muted">Ürün</TableHead>
                    <TableHead className="text-xs uppercase text-gm-muted">Rating</TableHead>
                    <TableHead className="text-xs uppercase text-gm-muted">Yorum Sayısı</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(report.products ?? [])].sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0)).slice(0, 10).map((p, idx) => (
                    <TableRow key={idx} className="border-gm-border-soft cursor-pointer hover:bg-gm-surface/10" onClick={() => p.product_url && window.open(p.product_url, '_blank')}>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm text-gm-text">{p.title}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="size-3 fill-gm-gold text-gm-gold" />
                          <span className="text-sm">{p.rating?.toFixed(1) ?? '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-gm-text">{p.review_count?.toLocaleString('tr-TR')}</span>
                      </TableCell>
                      <TableCell>
                        {p.product_url && (
                          <a href={p.product_url} target="_blank" rel="noopener noreferrer" className="text-gm-muted hover:text-gm-gold">
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
