'use client';

import * as React from 'react';
import { BarChart3, ChevronDown, ChevronUp, Loader2, Play, Trophy } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetBulkAmazonRiskScoresMutation,
  useStartAmazonScanMutation,
  type AmazonRiskReport,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

const MARKETPLACES = [
  { value: 'com',   label: '🇺🇸 US' },
  { value: 'de',    label: '🇩🇪 DE' },
  { value: 'co_uk', label: '🇬🇧 UK' },
  { value: 'fr',    label: '🇫🇷 FR' },
  { value: 'it',    label: '🇮🇹 IT' },
  { value: 'es',    label: '🇪🇸 ES' },
  { value: 'nl',    label: '🇳🇱 NL' },
  { value: 'pl',    label: '🇵🇱 PL' },
];

const DECISION_CFG: Record<string, { label: string; cls: string }> = {
  safe:    { label: 'GÜVENLİ',   cls: 'border-gm-success/40 bg-gm-success/10 text-gm-success' },
  caution: { label: 'DİKKATLİ', cls: 'border-gm-warning/40 bg-gm-warning/10 text-gm-warning' },
  avoid:   { label: 'GİRME',    cls: 'border-gm-error/40 bg-gm-error/10 text-gm-error' },
};

const DIM_LABELS: Array<{ key: keyof AmazonRiskReport['scores']; short: string }> = [
  { key: 'category_risk',    short: 'Kat.' },
  { key: 'sku_chaos',        short: 'SKU' },
  { key: 'price_war_risk',   short: 'Fiyat' },
  { key: 'brand_reliability',short: 'Marka' },
  { key: 'operational_risk', short: 'Op.' },
];

type ResultRow = {
  keyword: string;
  marketplace: string;
  report: AmazonRiskReport | null;
};

function ScoreBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gm-muted/40 text-[9px]">—</span>;
  const pct = Math.max(0, Math.min(100, value * 10));
  const cls = value <= 4 ? 'bg-gm-success' : value <= 7 ? 'bg-gm-warning' : 'bg-gm-error';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-12 rounded-full bg-gm-surface/30 overflow-hidden">
        <div className={cn('h-full rounded-full', cls)} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[9px] text-gm-muted">{value.toFixed(1)}</span>
    </div>
  );
}

export default function MultiKeywordPanel() {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [marketplace, setMarketplace] = React.useState('com');
  const [results, setResults] = React.useState<ResultRow[]>([]);
  const [scanningKw, setScanningKw] = React.useState<string | null>(null);

  const [fetchBulk, { isLoading }] = useGetBulkAmazonRiskScoresMutation();
  const [startScan] = useStartAmazonScanMutation();

  const keywords = React.useMemo(
    () =>
      text
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 15),
    [text],
  );

  const sorted = React.useMemo(
    () =>
      [...results].sort((a, b) => {
        const sa = a.report?.composite_score ?? Infinity;
        const sb = b.report?.composite_score ?? Infinity;
        return sa - sb;
      }),
    [results],
  );

  const handleAnalyze = async () => {
    if (keywords.length < 2) {
      toast.error('En az 2 keyword girin');
      return;
    }
    try {
      const data = await fetchBulk({ keywords, marketplace }).unwrap();
      setResults(data);
      setOpen(true);
      const missing = data.filter((r) => !r.report).length;
      if (missing > 0) {
        toast.info(`${keywords.length - missing} keyword hazır, ${missing} taranmamış`);
      }
    } catch {
      toast.error('Analiz alınamadı');
    }
  };

  const handleScanMissing = async (keyword: string) => {
    setScanningKw(keyword);
    try {
      await startScan({ keyword, marketplace }).unwrap();
      toast.success(`"${keyword}" taranıyor — tamamlanınca yeniden analiz edin`);
    } catch {
      toast.error('Tarama başlatılamadı');
    } finally {
      setScanningKw(null);
    }
  };

  const best = sorted.find((r) => r.report);

  return (
    <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-gm-primary-light" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gm-muted">
            Çoklu Keyword Analizi
          </span>
          {results.length > 0 && (
            <Badge variant="outline" className="rounded-full border-gm-primary/30 bg-gm-primary/10 px-2 text-[9px] font-bold text-gm-primary-light">
              {results.length} keyword
            </Badge>
          )}
        </div>
        {open ? <ChevronUp className="size-4 text-gm-muted" /> : <ChevronDown className="size-4 text-gm-muted" />}
      </button>

      {open && (
        <div className="border-t border-gm-border-soft px-5 pb-5 pt-4 space-y-4">
          <p className="text-[10px] italic text-gm-muted/70">
            5–15 keyword girin (her satıra bir tane veya virgülle ayırın). Composite risk skoruna göre sıralanır — en düşük skor = en güvenli kategori.
          </p>

          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"yoga mat\nresistance bands\nfoam roller\nprotein shaker"}
              rows={5}
              className="flex-1 rounded-2xl border-gm-border-soft bg-gm-bg-deep/50 text-sm text-gm-text placeholder:text-gm-muted/40 focus-visible:ring-gm-gold"
            />
            <div className="flex flex-col gap-2 md:w-44">
              <Select value={marketplace} onValueChange={setMarketplace}>
                <SelectTrigger className="h-10 rounded-2xl border-gm-border-soft bg-gm-bg-deep/50 text-sm text-gm-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARKETPLACES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAnalyze}
                disabled={keywords.length < 2 || isLoading}
                className="h-10 rounded-2xl bg-gm-primary hover:bg-gm-primary-light text-white font-bold text-[10px] uppercase tracking-widest"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Play className="mr-2 size-4" />
                )}
                Karşılaştır
              </Button>
            </div>
          </div>

          {sorted.length > 0 && (
            <div className="space-y-2 overflow-x-auto">
              <div className="mb-2 flex items-center gap-2">
                <Trophy className="size-3.5 text-gm-gold" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gm-muted">
                  Sıralama — En Düşük Risk En Üstte
                </span>
              </div>

              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-gm-border-soft/50">
                    <th className="pb-2 pr-3 font-bold uppercase tracking-widest text-gm-muted">#</th>
                    <th className="pb-2 pr-3 font-bold uppercase tracking-widest text-gm-muted">Keyword</th>
                    <th className="pb-2 pr-3 font-bold uppercase tracking-widest text-gm-muted">Composite</th>
                    <th className="pb-2 pr-3 font-bold uppercase tracking-widest text-gm-muted">Karar</th>
                    {DIM_LABELS.map((d) => (
                      <th key={d.key} className="pb-2 pr-2 font-bold uppercase tracking-widest text-gm-muted">{d.short}</th>
                    ))}
                    <th className="pb-2 font-bold uppercase tracking-widest text-gm-muted">Aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => {
                    const isBest = row === best;
                    const dec = row.report?.decision;
                    const decCfg = dec ? (DECISION_CFG[dec] ?? DECISION_CFG.caution) : null;
                    return (
                      <tr
                        key={row.keyword}
                        className={cn(
                          'border-b border-gm-border-soft/30 transition-colors',
                          isBest && 'bg-gm-success/5',
                        )}
                      >
                        <td className="py-2 pr-3">
                          <span className={cn(
                            'inline-flex size-5 items-center justify-center rounded-full font-mono font-bold',
                            isBest ? 'bg-gm-success text-black' : 'text-gm-muted/50',
                          )}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={cn('font-medium', isBest ? 'text-gm-success' : 'text-gm-text')}>
                            {row.keyword}
                          </span>
                          {isBest && (
                            <span className="ml-1.5 rounded-full bg-gm-success/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-gm-success">
                              Önerilen
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {row.report ? (
                            <span className={cn(
                              'font-serif text-sm font-bold',
                              (row.report.composite_score ?? 10) <= 4 ? 'text-gm-success'
                                : (row.report.composite_score ?? 10) <= 7 ? 'text-gm-warning'
                                : 'text-gm-error',
                            )}>
                              {row.report.composite_score?.toFixed(1) ?? '—'}
                            </span>
                          ) : (
                            <span className="text-gm-muted/40">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {decCfg ? (
                            <Badge variant="outline" className={cn('rounded-full px-2 text-[8px] font-bold', decCfg.cls)}>
                              {decCfg.label}
                            </Badge>
                          ) : (
                            <span className="text-gm-muted/40 text-[9px]">Veri yok</span>
                          )}
                        </td>
                        {DIM_LABELS.map((d) => (
                          <td key={d.key} className="py-2 pr-2">
                            <ScoreBar value={row.report?.scores[d.key]?.score ?? null} />
                          </td>
                        ))}
                        <td className="py-2">
                          {!row.report && (
                            <Button
                              size="sm"
                              onClick={() => handleScanMissing(row.keyword)}
                              disabled={scanningKw === row.keyword}
                              className="h-6 rounded-full bg-gm-primary/20 px-2.5 text-[9px] font-bold text-gm-primary hover:bg-gm-primary hover:text-black"
                            >
                              {scanningKw === row.keyword ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                'Tara'
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {best && (
                <div className="mt-3 rounded-2xl border border-gm-success/30 bg-gm-success/5 px-4 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gm-success">
                    Öneri:
                  </span>
                  <span className="ml-2 font-serif text-sm text-gm-text">
                    <span className="font-bold text-gm-success">{best.keyword}</span>
                    {' '}— composite skor{' '}
                    <span className="font-mono font-bold text-gm-success">
                      {best.report?.composite_score?.toFixed(1)}
                    </span>
                    {' '}ile bu listedeki en düşük riskli kategori.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
