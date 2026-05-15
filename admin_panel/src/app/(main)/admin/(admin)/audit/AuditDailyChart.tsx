'use client';

import React, { useMemo, useState } from 'react';
import type { AuditMetricsDailyRowDto } from '@/integrations/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

type Props = {
  rows: AuditMetricsDailyRowDto[];
  loading?: boolean;
  height?: number;
};

function n(v: unknown, fallback = 0) {
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function toYmd(input: unknown): string {
  const s = String(input ?? '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
}

function fmtDayLabel(isoOrDate: string) {
  const ymd = toYmd(isoOrDate);
  const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(isoOrDate || '');
  return `${m[3]}.${m[2]}`;
}

function fmtIsoNice(isoOrDate: string) {
  const ymd = toYmd(isoOrDate);
  const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(isoOrDate || '');
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export const AuditDailyChart: React.FC<Props> = ({ rows, loading, height = 220 }) => {
  const t = useAdminT('audit');
  const [showUnique, setShowUnique] = useState(true);
  const [showErrors, setShowErrors] = useState(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const data = useMemo(() => {
    const a = Array.isArray(rows) ? rows : [];
    return [...a]
      .map((r) => {
        const rawDate = (r as any).date ?? (r as any).day ?? (r as any).dt ?? (r as any).ts ?? (r as any).created_at ?? '';
        const date = toYmd(rawDate);

        return {
          date,
          label: fmtDayLabel(date),
          requests: n((r as any).requests ?? (r as any).count ?? (r as any).total_requests),
          unique_ips: n((r as any).unique_ips ?? (r as any).unique ?? (r as any).uniq_ips),
          errors: n((r as any).errors ?? (r as any).error_count ?? (r as any).fails),
        };
      })
      .filter((x) => !!x.date && /^\d{4}-\d{2}-\d{2}/.test(x.date))
      .sort((x, y) => String(x.date).localeCompare(String(y.date)));
  }, [rows]);

  const hasAny = data.length > 0;

  // SVG layout
  const W = 980;
  const H = Math.max(140, Math.min(360, height));
  const padL = 60;
  const padR = 20;
  const padT = 40;
  const padB = 40;

  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxRequests = useMemo(() => {
    const m = data.reduce((acc, r) => Math.max(acc, r.requests), 0);
    return Math.max(1, m);
  }, [data]);

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }).map((_, i) =>
    Math.round((maxRequests * (yTicks - i)) / yTicks),
  );

  const barGap = 8;
  const barCount = Math.max(1, data.length);
  const barW = Math.max(12, Math.floor((chartW - barGap * (barCount - 1)) / barCount));

  if (loading && !hasAny) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[220px] w-full rounded-[24px] bg-gm-surface/20" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32 bg-gm-surface/20" />
          <Skeleton className="h-4 w-64 bg-gm-surface/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setShowUnique(!showUnique)}>
            <Checkbox 
              id="show-unique" 
              checked={showUnique} 
              onCheckedChange={(checked) => setShowUnique(!!checked)}
              className="border-gm-primary/40 data-[state=checked]:bg-gm-primary data-[state=checked]:border-gm-primary"
            />
            <Label htmlFor="show-unique" className="text-[10px] font-bold text-gm-muted tracking-widest uppercase cursor-pointer group-hover:text-gm-primary transition-colors">
              {t('metrics.uniqueIp')}
            </Label>
          </div>
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setShowErrors(!showErrors)}>
            <Checkbox 
              id="show-errors" 
              checked={showErrors} 
              onCheckedChange={(checked) => setShowErrors(!!checked)}
              className="border-gm-error/40 data-[state=checked]:bg-gm-error data-[state=checked]:border-gm-error"
            />
            <Label htmlFor="show-errors" className="text-[10px] font-bold text-gm-muted tracking-widest uppercase cursor-pointer group-hover:text-gm-error transition-colors">
              {t('metrics.errors')}
            </Label>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-gm-gold font-serif italic text-xs">
            <Loader2 className="h-3 w-3 animate-spin" /> {t('common.loading')}
          </div>
        )}
      </div>

      {!hasAny && !loading ? (
        <div className="rounded-[24px] border border-gm-error/20 bg-gm-error/5 p-12 text-center font-serif italic text-gm-error/70">
          {t('metrics.noData', null, 'Veri bulunamadı')}
        </div>
      ) : (
        <div className="relative group/chart">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            {tickVals.map((tv, i) => {
              const y = padT + (chartH * i) / yTicks;
              return (
                <g key={`t-${i}`}>
                  <line 
                    x1={padL} 
                    y1={y} 
                    x2={W - padR} 
                    y2={y} 
                    stroke="var(--gm-border)" 
                    strokeWidth="1" 
                    strokeDasharray="4 4"
                    className="opacity-30"
                  />
                  <text 
                    x={padL - 15} 
                    y={y + 4} 
                    textAnchor="end" 
                    className="fill-gm-muted/60 font-mono text-[10px] tabular-nums"
                  >
                    {tv}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {data.map((r, idx) => {
              const x = padL + idx * (barW + barGap);
              const h = Math.round((r.requests / maxRequests) * chartH);
              const y = padT + (chartH - h);
              const isHover = hoverIdx === idx;

              return (
                <g
                  key={`${r.date}-${idx}`}
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible hit area */}
                  <rect
                    x={x - barGap / 2}
                    y={padT}
                    width={barW + barGap}
                    height={chartH}
                    fill="transparent"
                  />
                  
                  {/* Background track */}
                  <rect
                    x={x}
                    y={padT}
                    width={barW}
                    height={chartH}
                    rx="6"
                    className="fill-gm-surface/20"
                  />

                  {/* Main request bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    rx="6"
                    className={cn(
                      "transition-all duration-300",
                      isHover ? "fill-gm-gold shadow-lg" : "fill-gm-gold/60"
                    )}
                  />

                  {/* Error indicator dot */}
                  {showErrors && r.errors > 0 && (
                    <circle
                      cx={x + barW / 2}
                      cy={padT - 10}
                      r="3"
                      className="fill-gm-error animate-pulse"
                    />
                  )}

                  {/* X-Axis Labels */}
                  {(data.length <= 14 || idx % 2 === 0) && (
                    <text
                      x={x + barW / 2}
                      y={H - 10}
                      textAnchor="middle"
                      className="fill-gm-muted font-mono text-[10px]"
                    >
                      {r.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Tooltip */}
            {hoverIdx !== null && data[hoverIdx] && (
              <g className="pointer-events-none transition-all duration-200">
                {(() => {
                  const r = data[hoverIdx];
                  const xBar = padL + hoverIdx * (barW + barGap);
                  const boxW = 180;
                  const boxH = 100;
                  const px = xBar + barW + 20 + boxW <= W - padR ? xBar + barW + 20 : xBar - boxW - 20;
                  const py = padT;

                  return (
                    <g>
                      <rect
                        x={px}
                        y={py}
                        width={boxW}
                        height={boxH}
                        rx="16"
                        className="fill-gm-bg-deep/95 stroke-gm-gold/30 stroke-[1px] shadow-2xl backdrop-blur-md"
                      />
                      <text x={px + 20} y={py + 30} className="fill-gm-gold font-serif italic text-sm">
                        {fmtIsoNice(r.date)}
                      </text>
                      <text x={px + 20} y={py + 55} className="fill-gm-text text-xs font-bold">
                        {t('metrics.requests', null, 'Requests')}: <tspan className="fill-gm-gold">{r.requests}</tspan>
                      </text>
                      {showUnique && (
                        <text x={px + 20} y={py + 72} className="fill-gm-muted text-[10px] font-bold uppercase tracking-wider">
                          {t('metrics.unique', null, 'Unique')}: <tspan className="fill-gm-primary-light">{r.unique_ips}</tspan>
                        </text>
                      )}
                      {showErrors && (
                        <text x={px + 20} y={py + 85} className="fill-gm-muted text-[10px] font-bold uppercase tracking-wider">
                          {t('metrics.errors', null, 'Errors')}: <tspan className="fill-gm-error">{r.errors}</tspan>
                        </text>
                      )}
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Base line */}
            <line
              x1={padL}
              y1={padT + chartH}
              x2={W - padR}
              y2={padT + chartH}
              stroke="var(--gm-border)"
              strokeWidth="2"
              className="opacity-50"
            />
          </svg>
        </div>
      )}

      {hasAny && (
        <div className="flex items-center justify-between px-4 py-3 bg-gm-surface/20 rounded-2xl border border-gm-border-soft">
          <div className="text-[10px] font-bold text-gm-muted uppercase tracking-widest">
            {fmtIsoNice(data[data.length - 1].date)} {t('metrics.data', null, 'Verileri')}
          </div>
          <div className="flex gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gm-muted uppercase tracking-[0.1em] font-bold">{t('metrics.totalRequests', null, 'Total Requests')}</span>
              <span className="text-sm font-mono font-bold text-gm-gold">{data[data.length - 1].requests}</span>
            </div>
            {showUnique && (
              <div className="flex flex-col items-end border-l border-gm-border-soft/30 pl-6">
                <span className="text-[10px] text-gm-muted uppercase tracking-[0.1em] font-bold">{t('metrics.uniqueIp', null, 'Unique IP')}</span>
                <span className="text-sm font-mono font-bold text-gm-primary-light">{data[data.length - 1].unique_ips}</span>
              </div>
            )}
            {showErrors && (
              <div className="flex flex-col items-end border-l border-gm-border-soft/30 pl-6">
                <span className="text-[10px] text-gm-muted uppercase tracking-[0.1em] font-bold">{t('metrics.errors', null, 'Errors')}</span>
                <span className="text-sm font-mono font-bold text-gm-error">{data[data.length - 1].errors}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
