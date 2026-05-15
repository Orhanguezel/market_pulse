'use client';

import * as React from 'react';
import { BarChart3, ChevronDown, ChevronUp, Loader2, Play, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useGetBulkPublicRiskScoresMutation,
  useStartPublicScanMutation,
  type BulkScoreRow,
  type RiskReport,
} from '@/integrations/rtk/hooks';

const MARKETPLACES = [
  { value: 'com',   label: '🇺🇸 US' },
  { value: 'de',    label: '🇩🇪 DE' },
  { value: 'co.uk', label: '🇬🇧 UK' },
  { value: 'fr',    label: '🇫🇷 FR' },
  { value: 'it',    label: '🇮🇹 IT' },
  { value: 'es',    label: '🇪🇸 ES' },
  { value: 'nl',    label: '🇳🇱 NL' },
  { value: 'pl',    label: '🇵🇱 PL' },
];

const DIM_KEYS = [
  'category_risk', 'sku_chaos', 'price_war_risk', 'brand_reliability', 'operational_risk',
] as const;
type DimKey = typeof DIM_KEYS[number];

const DIM_SHORT: Record<DimKey, string> = {
  category_risk: 'Kat.',
  sku_chaos: 'SKU',
  price_war_risk: 'Fiyat',
  brand_reliability: 'Marka',
  operational_risk: 'Op.',
};

function getDecisionCls(decision: string | undefined) {
  if (decision === 'GUVENLI') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500';
  if (decision === 'GIRME') return 'border-red-500/40 bg-red-500/10 text-red-500';
  return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500';
}

function getDecisionLabel(decision: string | undefined) {
  if (decision === 'GUVENLI') return 'GÜVENLİ';
  if (decision === 'GIRME') return 'GİRME';
  if (decision === 'DIKKATLI_OL') return 'DİKKATLİ';
  if (decision === 'MIXED_SIGNAL') return 'KARMA';
  if (decision === 'INSUFFICIENT_DATA') return 'VERİ YOK';
  return '—';
}

function ScoreBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[9px] text-(--gm-muted)/40">—</span>;
  const pct = Math.max(0, Math.min(100, value * 10));
  const cls = value <= 4 ? 'bg-emerald-500' : value <= 7 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-10 rounded-full bg-(--gm-surface)/30 overflow-hidden">
        <div className={cn('h-full rounded-full', cls)} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[9px] text-(--gm-muted)">{value.toFixed(1)}</span>
    </div>
  );
}

function getDimScore(report: RiskReport, key: DimKey): number | null {
  return report.dimensions?.[key]?.score ?? null;
}

interface Props {
  onScanRequested?: (keyword: string, marketplace: string) => void;
}

export default function PublicMultiKeyword({ onScanRequested }: Props) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [marketplace, setMarketplace] = React.useState('com');
  const [results, setResults] = React.useState<BulkScoreRow[]>([]);
  const [scanningKw, setScanningKw] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');

  const [fetchBulk, { isLoading }] = useGetBulkPublicRiskScoresMutation();
  const [startScan] = useStartPublicScanMutation();

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
    if (keywords.length < 2) { setError('En az 2 keyword girin'); return; }
    setError('');
    try {
      const data = await fetchBulk({ keywords, marketplace }).unwrap();
      setResults(data);
      setOpen(true);
    } catch {
      setError('Analiz alınamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleScan = async (kw: string) => {
    setScanningKw(kw);
    try {
      if (onScanRequested) {
        onScanRequested(kw, marketplace);
      } else {
        await startScan({ keyword: kw, marketplace }).unwrap();
      }
    } catch {
      // ignore
    } finally {
      setScanningKw(null);
    }
  };

  const best = sorted.find((r) => r.report);

  return (
    <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-(--gm-primary)" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-(--gm-muted)">
            Çoklu Keyword Karşılaştırma
          </span>
          {results.length > 0 && (
            <span className="rounded-full border border-(--gm-primary)/30 bg-(--gm-primary)/10 px-2 py-0.5 text-[9px] font-bold text-(--gm-primary)">
              {results.length}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="size-4 text-(--gm-muted)" /> : <ChevronDown className="size-4 text-(--gm-muted)" />}
      </button>

      {open && (
        <div className="border-t border-(--gm-border-soft) px-5 pb-5 pt-4 space-y-4">
          <p className="text-[10px] italic text-(--gm-muted)/70">
            5–15 keyword girin (her satıra bir tane veya virgülle). En düşük composite skor = en az riskli kategori.
          </p>

          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'yoga mat\nresistance bands\nfoam roller\nprotein shaker'}
              rows={5}
              className="flex-1 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/20 px-4 py-3 text-sm text-(--gm-text) placeholder:text-(--gm-muted)/40 focus:border-(--gm-primary) focus:outline-none resize-none"
            />
            <div className="flex flex-col gap-2 md:w-44">
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
                className="h-10 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/20 px-3 text-sm text-(--gm-text) focus:border-(--gm-primary) focus:outline-none"
              >
                {MARKETPLACES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={keywords.length < 2 || isLoading}
                className={cn(
                  'flex h-10 items-center justify-center gap-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all',
                  keywords.length >= 2 && !isLoading
                    ? 'bg-(--gm-primary) text-white hover:opacity-90'
                    : 'cursor-not-allowed bg-(--gm-surface) text-(--gm-muted)',
                )}
              >
                {isLoading
                  ? <Loader2 className="size-4 animate-spin" />
                  : <Play className="size-4" />}
                Karşılaştır
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-500">{error}</p>
          )}

          {sorted.length > 0 && (
            <div className="space-y-3 overflow-x-auto">
              <div className="flex items-center gap-2">
                <Trophy className="size-3.5 text-(--gm-gold)" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-(--gm-muted)">
                  Sıralama — En Düşük Risk En Üstte
                </span>
              </div>

              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-(--gm-border-soft)/50">
                    <th className="pb-2 pr-3 font-bold uppercase tracking-widest text-(--gm-muted)">#</th>
                    <th className="pb-2 pr-3 font-bold uppercase tracking-widest text-(--gm-muted)">Keyword</th>
                    <th className="pb-2 pr-3 font-bold uppercase tracking-widest text-(--gm-muted)">Composite</th>
                    <th className="pb-2 pr-3 font-bold uppercase tracking-widest text-(--gm-muted)">Karar</th>
                    {DIM_KEYS.map((k) => (
                      <th key={k} className="pb-2 pr-2 font-bold uppercase tracking-widest text-(--gm-muted)">{DIM_SHORT[k]}</th>
                    ))}
                    <th className="pb-2 font-bold uppercase tracking-widest text-(--gm-muted)">Aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => {
                    const isBest = row === best;
                    return (
                      <tr
                        key={row.keyword}
                        className={cn(
                          'border-b border-(--gm-border-soft)/30 transition-colors',
                          isBest && 'bg-emerald-500/5',
                        )}
                      >
                        <td className="py-2 pr-3">
                          <span className={cn(
                            'inline-flex size-5 items-center justify-center rounded-full font-mono font-bold',
                            isBest ? 'bg-emerald-500 text-black' : 'text-(--gm-muted)/50',
                          )}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={cn('font-medium', isBest ? 'text-emerald-500' : 'text-(--gm-text)')}>
                            {row.keyword}
                          </span>
                          {isBest && (
                            <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-500">
                              Önerilen
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {row.report ? (
                            <span className={cn(
                              'font-serif text-sm font-bold',
                              (row.report.composite_score ?? 10) <= 4 ? 'text-emerald-500'
                                : (row.report.composite_score ?? 10) <= 7 ? 'text-yellow-500'
                                : 'text-red-500',
                            )}>
                              {row.report.composite_score?.toFixed(1) ?? '—'}
                            </span>
                          ) : (
                            <span className="text-(--gm-muted)/40">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {row.report ? (
                            <span className={cn(
                              'rounded-full border px-2 py-0.5 text-[8px] font-bold',
                              getDecisionCls(row.report.decision),
                            )}>
                              {getDecisionLabel(row.report.decision)}
                            </span>
                          ) : (
                            <span className="text-[9px] text-(--gm-muted)/40">Veri yok</span>
                          )}
                        </td>
                        {DIM_KEYS.map((k) => (
                          <td key={k} className="py-2 pr-2">
                            <ScoreBar value={row.report ? getDimScore(row.report, k) : null} />
                          </td>
                        ))}
                        <td className="py-2">
                          {!row.report && (
                            <button
                              type="button"
                              onClick={() => handleScan(row.keyword)}
                              disabled={scanningKw === row.keyword}
                              className="h-6 rounded-full bg-(--gm-primary)/20 px-2.5 text-[9px] font-bold text-(--gm-primary) hover:bg-(--gm-primary) hover:text-white transition-colors"
                            >
                              {scanningKw === row.keyword
                                ? <Loader2 className="size-3 animate-spin" />
                                : 'Tara'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {best?.report && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-500">Öneri:</span>
                  <span className="ml-2 font-serif text-sm text-(--gm-text)">
                    <span className="font-bold text-emerald-500">{best.keyword}</span>
                    {' '}— composite skor{' '}
                    <span className="font-mono font-bold text-emerald-500">
                      {best.report.composite_score?.toFixed(1)}
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
