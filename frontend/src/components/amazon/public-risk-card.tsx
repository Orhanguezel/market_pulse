'use client';

import * as React from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock,
  Printer,
  Users,
} from 'lucide-react';
import type { RiskReport, DimensionScore } from '@/integrations/rtk/public/amazon_scan.endpoints';
import { cn } from '@/lib/utils';

// ─── Labels ───────────────────────────────────────────────────────────────────

const DECISION_LABELS: Record<string, string> = {
  GUVENLI: 'Güvenli — Girebilirsiniz',
  DIKKATLI_OL: 'Dikkatli Olun',
  GIRME: 'Girmeyin — Yüksek Risk',
  MIXED_SIGNAL: 'Karışık Sinyal',
  INSUFFICIENT_DATA: 'Yetersiz Veri',
};

const DIMENSION_LABELS: Record<string, string> = {
  category_risk: 'Kategori Riski',
  sku_chaos: 'SKU Karmaşası',
  price_war_risk: 'Fiyat Savaşı',
  brand_reliability: 'Marka Güveni',
  operational_risk: 'Operasyonel Risk',
};

const DIMENSION_DESC: Record<string, string> = {
  category_risk: 'Kaç rakip var, kategori ne kadar dolu',
  sku_chaos: 'Fiyat aralığı, varyant baskısı, sigma',
  price_war_risk: 'Fiyat kırılımı, düşük fiyat kümesi',
  brand_reliability: 'Marka tutarlılığı, listing kalitesi',
  operational_risk: 'Yorum şikayetleri, iade oranı',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decisionClass(d: string) {
  if (d === 'GUVENLI') return 'border-emerald-500/30 bg-emerald-500/8 text-emerald-500';
  if (d === 'DIKKATLI_OL' || d === 'MIXED_SIGNAL') return 'border-yellow-500/30 bg-yellow-500/8 text-yellow-500';
  if (d === 'GIRME') return 'border-red-500/30 bg-red-500/8 text-red-500';
  return 'border-(--gm-border-soft) bg-(--gm-surface)/10 text-(--gm-muted)';
}

function decisionBg(d: string) {
  if (d === 'GUVENLI') return 'border-emerald-500/15 bg-emerald-500/5';
  if (d === 'DIKKATLI_OL' || d === 'MIXED_SIGNAL') return 'border-yellow-500/15 bg-yellow-500/5';
  if (d === 'GIRME') return 'border-red-500/15 bg-red-500/5';
  return 'border-(--gm-border-soft) bg-(--gm-surface)/5';
}

function scoreColor(score: number) {
  if (score <= 3) return 'var(--color-gm-success, #10b981)';
  if (score <= 6) return 'var(--color-gm-warning, #eab308)';
  return 'var(--color-gm-error, #ef4444)';
}

function scoreBarClass(score: number) {
  if (score <= 3) return 'bg-emerald-500';
  if (score <= 6) return 'bg-yellow-500';
  return 'bg-red-500';
}

function scoreTextClass(score: number) {
  if (score <= 3) return 'text-emerald-500';
  if (score <= 6) return 'text-yellow-500';
  return 'text-red-500';
}

function confidenceLabel(c?: string) {
  if (c === 'HIGH') return 'Güven: Yüksek';
  if (c === 'MEDIUM') return 'Güven: Orta';
  if (c === 'LOW') return 'Güven: Düşük';
  if (c === 'INSUFFICIENT_DATA') return 'Yetersiz Veri';
  return c ?? '';
}

// ─── SVG Radar ────────────────────────────────────────────────────────────────

const RADAR_KEYS = ['category_risk', 'sku_chaos', 'price_war_risk', 'brand_reliability', 'operational_risk'] as const;

function polarToCartesian(cx: number, cy: number, r: number, angleIndex: number, total: number) {
  // Start from top (-90°), go clockwise
  const angle = ((angleIndex / total) * 2 * Math.PI) - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function buildPolygon(cx: number, cy: number, r: number, values: number[], maxVal: number) {
  return values
    .map((v, i) => {
      const pt = polarToCartesian(cx, cy, r * (v / maxVal), i, values.length);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');
}

function SvgRadarChart({ dimensions }: { dimensions: RiskReport['dimensions'] }) {
  const cx = 120;
  const cy = 120;
  const r = 90;
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const values = RADAR_KEYS.map((k) => dimensions?.[k]?.score ?? 0);
  const dataPolygon = buildPolygon(cx, cy, r, values, 10);

  const axisPoints = RADAR_KEYS.map((_, i) => polarToCartesian(cx, cy, r, i, RADAR_KEYS.length));
  const labelPoints = RADAR_KEYS.map((_, i) => polarToCartesian(cx, cy, r + 22, i, RADAR_KEYS.length));

  const shortLabels: Record<string, string> = {
    category_risk: 'Kategori',
    sku_chaos: 'SKU',
    price_war_risk: 'Fiyat',
    brand_reliability: 'Marka',
    operational_risk: 'Operasyon',
  };

  return (
    <svg viewBox="0 0 240 260" className="w-full max-w-[280px]" aria-hidden>
      {/* Grid rings */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={buildPolygon(cx, cy, r, RADAR_KEYS.map(() => level * 10), 10)}
          fill="none"
          stroke="var(--color-gm-border-soft, #374151)"
          strokeWidth="0.5"
          opacity="0.5"
        />
      ))}

      {/* Axis lines */}
      {axisPoints.map((pt, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={pt.x}
          y2={pt.y}
          stroke="var(--color-gm-border-soft, #374151)"
          strokeWidth="0.5"
          opacity="0.5"
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill="var(--color-gm-primary, #6366f1)"
        fillOpacity="0.25"
        stroke="var(--color-gm-primary, #6366f1)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {values.map((v, i) => {
        const pt = polarToCartesian(cx, cy, r * (v / 10), i, values.length);
        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="3.5"
            fill="var(--color-gm-primary, #6366f1)"
            stroke="var(--color-gm-bg, #0f172a)"
            strokeWidth="1.5"
          />
        );
      })}

      {/* Axis labels */}
      {RADAR_KEYS.map((key, i) => {
        const pt = labelPoints[i];
        const anchor = pt.x < cx - 5 ? 'end' : pt.x > cx + 5 ? 'start' : 'middle';
        return (
          <text
            key={key}
            x={pt.x}
            y={pt.y + 4}
            textAnchor={anchor}
            fontSize="9"
            fill="var(--color-gm-muted, #9ca3af)"
            fontFamily="inherit"
          >
            {shortLabels[key]}
          </text>
        );
      })}
    </svg>
  );
}

// ─── DimensionRow ─────────────────────────────────────────────────────────────

function DimensionRow({ dimKey, dim }: { dimKey: string; dim: DimensionScore }) {
  const [open, setOpen] = React.useState(false);
  const pct = Math.min(100, Math.max(0, dim.score * 10));

  return (
    <div className={cn(
      'rounded-2xl border transition-all duration-300',
      open
        ? 'border-(--gm-border-soft) bg-(--gm-surface)/20'
        : 'border-(--gm-border-soft)/50 bg-(--gm-surface)/5 hover:bg-(--gm-surface)/10'
    )}>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-(--gm-text)">{DIMENSION_LABELS[dimKey] ?? dimKey}</p>
            <span className="text-[9px] font-bold uppercase tracking-widest text-(--gm-muted) opacity-70">
              {dim.confidence}
            </span>
          </div>
          {!open && (
            <p className="mt-0.5 text-[11px] text-(--gm-muted)/70">
              {DIMENSION_DESC[dimKey] ?? ''}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn('font-mono text-lg font-bold', scoreTextClass(dim.score))}>
            {dim.score.toFixed(1)}
          </span>
          <ChevronDown className={cn('size-4 text-(--gm-muted) transition-transform duration-300', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="space-y-3 px-4 pb-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-(--gm-surface)">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: scoreColor(dim.score) }}
            />
          </div>
          {dim.reasons.length > 0 && (
            <ul className="space-y-1">
              {dim.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-6 text-(--gm-muted)">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-(--gm-muted)/40" />
                  {reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PublicRiskCard ───────────────────────────────────────────────────────────

export interface PublicRiskCardProps {
  report: RiskReport;
  keyword: string;
  marketplace: string;
  /** Compact mode for history list items */
  compact?: boolean;
}

export function PublicRiskCard({ report, keyword, marketplace, compact }: PublicRiskCardProps) {
  const Icon =
    report.decision === 'GUVENLI'
      ? CheckCircle2
      : report.decision === 'GIRME'
        ? CircleAlert
        : AlertTriangle;

  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-(--gm-border-soft) bg-(--gm-surface)/10 p-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-(--gm-primary)" />
          <span className="font-mono text-xs font-bold text-(--gm-text)">
            {report.composite_score?.toFixed(1) ?? '—'}
          </span>
        </div>
        <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest', decisionClass(report.decision))}>
          <Icon className="mr-1 inline size-3" />
          {DECISION_LABELS[report.decision] ?? report.decision}
        </span>
        <span className="text-[10px] text-(--gm-muted)">{report.data_points} veri</span>
      </div>
    );
  }

  const hasDimensions = !!report.dimensions && Object.values(report.dimensions).some(Boolean);

  return (
    <div className={cn(
      'animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-3xl border p-6 space-y-6',
      decisionBg(report.decision)
    )}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-(--gm-muted)">Analiz Sonucu</p>
          <h2 className="text-xl font-bold text-(--gm-text)">{keyword}</h2>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="flex items-center gap-1 text-xs text-(--gm-muted)">
              <Users className="size-3" />
              {report.data_points} veri noktası
            </span>
            <span className="text-xs text-(--gm-muted)">amazon.{marketplace}</span>
            {report.confidence && (
              <span className="text-xs text-(--gm-muted)">{confidenceLabel(report.confidence)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full border border-(--gm-border-soft) bg-(--gm-surface)/20 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-(--gm-muted) transition-colors hover:bg-(--gm-surface) print:hidden"
          >
            <Printer className="size-3.5" />
            PDF
          </button>
          <div className={cn(
            'flex min-w-40 flex-col items-center justify-center rounded-3xl border p-5',
            decisionBg(report.decision)
          )}>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-(--gm-muted)">Score</p>
            <p className="mt-1 text-5xl font-extrabold tracking-tighter text-(--gm-text)">
              {report.composite_score?.toFixed(1) ?? '—'}
            </p>
            <p className="mt-0.5 text-[10px] text-(--gm-muted)/60">/ 10</p>
          </div>
        </div>
      </div>

      {/* Decision banner */}
      <div className={cn('flex items-center gap-3 rounded-2xl border px-5 py-4', decisionClass(report.decision))}>
        <Icon className="size-5 shrink-0" />
        <div>
          <p className="font-bold text-sm">{DECISION_LABELS[report.decision] ?? report.decision}</p>
          {report.decision === 'MIXED_SIGNAL' && (
            <p className="text-[11px] opacity-80 mt-0.5">
              Risk boyutları arasında tutarsızlık — manuel inceleme önerilir.
            </p>
          )}
        </div>
      </div>

      {/* Radar + Dimension rows */}
      {hasDimensions && (
        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
          {/* SVG Radar */}
          <div className="flex items-center justify-center rounded-2xl border border-(--gm-border-soft)/50 bg-(--gm-surface)/10 p-4">
            <div className="w-full">
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-muted)">
                Risk Profili
              </p>
              <SvgRadarChart dimensions={report.dimensions} />
            </div>
          </div>

          {/* Accordion rows */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-muted)">
              Boyut Detayları
              <span className="ml-1 normal-case font-normal opacity-60">— detay için tıkla</span>
            </p>
            {RADAR_KEYS.map((key) => {
              const dim = report.dimensions?.[key];
              if (!dim) return null;
              return <DimensionRow key={key} dimKey={key} dim={dim} />;
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      {report.summary && (
        <p className="border-t border-(--gm-border-soft) pt-4 text-sm italic text-(--gm-muted)">
          <Clock className="mr-1.5 inline size-3.5 shrink-0 align-middle" />
          {report.summary}
        </p>
      )}
    </div>
  );
}
