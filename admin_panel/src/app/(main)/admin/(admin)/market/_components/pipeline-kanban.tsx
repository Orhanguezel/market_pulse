'use client';

import * as React from 'react';
import { ArrowRight, Check, ExternalLink, Globe, RefreshCw, TrendingUp, Users, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetConversionStatsQuery,
  useListMarketLeadsQuery,
  useUpdateMarketLeadMutation,
  type MarketLead,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

export type PipelineStage = 'new' | 'contacted' | 'qualified' | 'negotiating' | 'converted' | 'rejected';

const STAGES: Array<{ key: PipelineStage; label: string; cls: string; headerCls: string }> = [
  { key: 'new',         label: 'İletişim Kurulmadı', cls: 'border-gm-border-soft bg-gm-surface/5',   headerCls: 'text-gm-muted' },
  { key: 'contacted',   label: 'Yazıştık',            cls: 'border-gm-primary/20 bg-gm-primary/5',   headerCls: 'text-gm-primary-light' },
  { key: 'qualified',   label: 'Görüşme',             cls: 'border-gm-warning/20 bg-gm-warning/5',   headerCls: 'text-gm-warning' },
  { key: 'negotiating', label: 'Teklif',              cls: 'border-gm-gold/20 bg-gm-gold/5',         headerCls: 'text-gm-gold' },
  { key: 'converted',   label: 'Müşteri',             cls: 'border-gm-success/20 bg-gm-success/5',   headerCls: 'text-gm-success' },
  { key: 'rejected',    label: 'Kayıp',               cls: 'border-gm-error/20 bg-gm-error/5',       headerCls: 'text-gm-error' },
];

const STAGE_ORDER = STAGES.map((s) => s.key);

function nextStage(current: PipelineStage): PipelineStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STAGE_ORDER.length - 2) return null; // converted/rejected have no "next"
  return STAGE_ORDER[idx + 1] ?? null;
}

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-gm-error',
  medium: 'bg-gm-warning',
  low:    'bg-gm-muted',
};

function LeadCard({ lead, onStageChange }: { lead: MarketLead; onStageChange: (id: string, stage: PipelineStage) => void }) {
  const next = nextStage(lead.status as PipelineStage);
  return (
    <div className="rounded-2xl border border-gm-border-soft bg-gm-bg-deep/70 p-3 shadow space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={cn('size-2 shrink-0 rounded-full', PRIORITY_DOT[lead.priority] ?? 'bg-gm-muted')} />
            <span className="truncate font-serif text-sm text-gm-text">{lead.name}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {lead.score > 0 && (
              <span className="rounded-full border border-gm-gold/30 bg-gm-gold/10 px-1.5 py-0.5 text-[9px] font-bold text-gm-gold">
                {lead.score.toFixed(1)}
              </span>
            )}
            {lead.source && lead.source !== 'manual' && (
              <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/20 text-[9px] text-gm-muted">
                {lead.source}
              </Badge>
            )}
            {lead.city && (
              <span className="text-[9px] text-gm-muted">{lead.city}</span>
            )}
          </div>
        </div>
        {lead.website && (
          <a href={lead.website} target="_blank" rel="noreferrer"
            className="shrink-0 text-gm-muted hover:text-gm-gold">
            <Globe className="size-3.5" />
          </a>
        )}
      </div>

      {lead.contactName && (
        <div className="text-[10px] text-gm-muted">{lead.contactName}</div>
      )}

      <div className="flex gap-1.5">
        {next && (
          <Button size="sm" onClick={() => onStageChange(lead.id, next)}
            className="h-6 flex-1 rounded-full bg-gm-gold/20 px-2 text-[9px] font-bold text-gm-gold hover:bg-gm-gold hover:text-black">
            <ArrowRight className="mr-1 size-3" />
            {STAGES.find((s) => s.key === next)?.label}
          </Button>
        )}
        {lead.status !== 'converted' && lead.status !== 'rejected' && (
          <>
            <Button size="sm" onClick={() => onStageChange(lead.id, 'converted')}
              className="h-6 rounded-full bg-gm-success/20 px-2 text-[9px] font-bold text-gm-success hover:bg-gm-success hover:text-black">
              <Check className="size-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onStageChange(lead.id, 'rejected')}
              className="h-6 rounded-full border-gm-error/30 px-2 text-[9px] text-gm-error hover:bg-gm-error hover:text-black">
              <X className="size-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ConversionStatsBar() {
  const { data: stats } = useGetConversionStatsQuery();
  if (!stats) return null;

  const total = stats.stage_counts.reduce((s, r) => s + r.count, 0);
  const converted = stats.stage_counts.find((r) => r.status === 'converted')?.count ?? 0;
  const rate = total > 0 ? Math.round((converted / total) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gm-border-soft bg-gm-surface/10 px-5 py-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 text-gm-success" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gm-muted">Dönüşüm Oranı</span>
        <span className="font-serif text-xl text-gm-success">{rate}%</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="size-4 text-gm-gold" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gm-muted">Toplam</span>
        <span className="font-serif text-xl text-gm-text">{total}</span>
      </div>
      <div className="flex items-center gap-2">
        <Check className="size-4 text-gm-success" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gm-muted">Müşteri</span>
        <span className="font-serif text-xl text-gm-success">{converted}</span>
      </div>
      {stats.by_source.length > 0 && (
        <div className="ml-auto flex flex-wrap gap-2">
          {stats.by_source.slice(0, 4).map(({ source, count }) => (
            <span key={source} className="inline-flex items-center gap-1 rounded-full border border-gm-success/30 bg-gm-success/10 px-2.5 py-0.5 text-[9px] font-bold text-gm-success">
              {source} <span className="font-mono">{count}</span>
            </span>
          ))}
        </div>
      )}
      {stats.recent_conversions.length > 0 && (
        <div className="w-full border-t border-gm-border-soft/50 pt-2">
          <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-gm-muted">Son Dönüşümler</div>
          <div className="flex flex-wrap gap-2">
            {stats.recent_conversions.map((c) => (
              <span key={c.id} className="text-[10px] text-gm-muted">
                <span className="font-medium text-gm-text">{c.name}</span>
                {c.converted_at && <span className="ml-1 font-mono">({new Date(c.converted_at).toLocaleDateString('tr-TR')})</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PipelineKanban() {
  const { data, isLoading, isFetching, refetch } = useListMarketLeadsQuery({ limit: 500, sort: 'created_at', order: 'desc' });
  const [updateLead] = useUpdateMarketLeadMutation();

  const byStage = React.useMemo(() => {
    const map = new Map<PipelineStage, MarketLead[]>(STAGE_ORDER.map((k) => [k, []]));
    for (const lead of (data ?? [])) {
      const key = (lead.status as PipelineStage) in Object.fromEntries(STAGE_ORDER.map((k) => [k, true]))
        ? lead.status as PipelineStage
        : 'new';
      map.get(key)?.push(lead);
    }
    return map;
  }, [data]);

  const handleStageChange = async (id: string, stage: PipelineStage) => {
    try {
      await updateLead({ id, body: { status: stage } }).unwrap();
      const label = STAGES.find((s) => s.key === stage)?.label ?? stage;
      toast.success(`Lead → ${label}`);
    } catch {
      toast.error('Aşama değiştirilemedi');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Lead Machine</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Lead Pipeline</h1>
          <p className="max-w-xl font-serif text-sm italic text-gm-muted">
            Satış hunisi — İletişim Kurulmadı'dan Müşteri'ye aşama takibi.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}
          className="h-12 rounded-full border-gm-border-soft bg-gm-surface/20 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface">
          <RefreshCw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
          Yenile
        </Button>
      </div>

      <ConversionStatsBar />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((s) => (
            <div key={s.key} className="space-y-3">
              <Skeleton className="h-5 w-28 bg-gm-surface/30" />
              {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full bg-gm-surface/20 rounded-2xl" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((stage) => {
            const leads = byStage.get(stage.key) ?? [];
            return (
              <div key={stage.key} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className={cn('text-[10px] font-bold uppercase tracking-[0.15em]', stage.headerCls)}>
                    {stage.label}
                  </span>
                  <span className="text-[10px] font-mono text-gm-muted">{leads.length}</span>
                </div>
                <div className={cn('min-h-30 rounded-2xl border p-2 space-y-2', stage.cls)}>
                  {leads.length === 0 ? (
                    <div className="py-6 text-center text-[10px] italic text-gm-muted/50">Boş</div>
                  ) : (
                    leads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onStageChange={handleStageChange} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-[10px] text-gm-muted/50">
        <ExternalLink className="mr-1 inline size-3" />
        Detaylı liste görünümü için menüden &quot;Lead Pipeline&quot; → tablo moduna geçilebilir.
      </div>
    </div>
  );
}
