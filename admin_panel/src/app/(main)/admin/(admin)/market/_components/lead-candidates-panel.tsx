'use client';

import * as React from 'react';
import { AlertTriangle, Ban, Check, ChevronDown, ChevronUp, ExternalLink, Filter, Globe, Mail, RefreshCw, Search, Sparkles, Star, Trash2, X, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useEnrichBatchMutation,
  useEnrichCandidateMutation,
  useApproveToLeadMutation,
  useCreateScanRuleMutation,
  useDeleteScanRuleMutation,
  useGenerateOutreachDraftMutation,
  useListCandidateEnrichmentQuery,
  useListIcpProfilesQuery,
  useListLeadCandidatesQuery,
  useListScanRulesQuery,
  useReviewCandidateMutation,
  type AmazonRiskDecision,
  type IcpProfile,
  type LeadCandidate,
  type LeadCandidateChannel,
  type LeadCandidateStatus,
  type ScanRule,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

const REJECT_TAGS = [
  'Kendi üretimi var',
  'Çok küçük',
  'Yanlış sektör',
  'Zaten müşterimiz',
  'Fiyat uyumsuz',
] as const;

const CHANNEL_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  b2b_directory: 'B2B Dizin',
  trade_fair: 'Fuar',
  icp_match: 'ICP',
};

const CHANNEL_BADGE_CLS: Record<string, string> = {
  amazon: 'border-gm-gold/40 bg-gm-gold/10 text-gm-gold',
  b2b_directory: 'border-gm-primary/40 bg-gm-primary/10 text-gm-primary-light',
  trade_fair: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  icp_match: 'border-gm-success/40 bg-gm-success/10 text-gm-success',
};

function channelBadgeCls(channel: string): string {
  return CHANNEL_BADGE_CLS[channel] ?? 'border-gm-border-soft bg-gm-surface/20 text-gm-muted';
}

const STATUS_CONFIG: Record<LeadCandidateStatus, { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning' },
  approved: { label: 'Onaylandı', cls: 'border-gm-success/30 bg-gm-success/10 text-gm-success' },
  rejected: { label: 'Reddedildi', cls: 'border-gm-error/30 bg-gm-error/10 text-gm-error' },
  favorite: { label: 'Favori', cls: 'border-gm-gold/30 bg-gm-gold/10 text-gm-gold' },
};

function rawRecord(candidate: LeadCandidate): Record<string, unknown> {
  const data = candidate.raw_data;
  return data && typeof data === 'object' ? data : {};
}

function decisionOf(candidate: LeadCandidate): AmazonRiskDecision {
  const raw = rawRecord(candidate);
  const value = candidate.decision ?? raw.decision;
  if (typeof value === 'string' && ['GUVENLI', 'DIKKATLI_OL', 'GIRME', 'MIXED_SIGNAL', 'INSUFFICIENT_DATA'].includes(value)) {
    return value as AmazonRiskDecision;
  }
  return 'INSUFFICIENT_DATA';
}

function compositeOf(candidate: LeadCandidate): number | null {
  const raw = rawRecord(candidate);
  const decision = decisionOf(candidate);
  if (decision === 'INSUFFICIENT_DATA') return null;

  const value = raw.composite_score ?? candidate.lead_score;
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (number === 0 && decision !== 'GUVENLI') return null; // 0 usually means insufficient data unless it's a very low risk score which is unlikely to be exactly 0
  return Number.isFinite(number) ? number : null;
}

function decisionBadgeClass(decision: string): string {
  if (decision === 'GUVENLI') return 'border-gm-success/40 bg-gm-success/10 text-gm-success';
  if (decision === 'DIKKATLI_OL') return 'border-gm-warning/40 bg-gm-warning/10 text-gm-warning';
  if (decision === 'GIRME') return 'border-gm-error/40 bg-gm-error/10 text-gm-error';
  if (decision === 'MIXED_SIGNAL') return 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning';
  return 'border-gm-border-soft bg-gm-surface/20 text-gm-muted/60';
}

function decisionLabel(decision: string): string {
  if (decision === 'GUVENLI') return 'GÜVENLİ';
  if (decision === 'DIKKATLI_OL') return 'DİKKATLİ OL';
  if (decision === 'GIRME') return 'GİRME';
  if (decision === 'MIXED_SIGNAL') return 'KARIŞIK SİNYAL';
  return 'VERİ YETERSİZ';
}

function rawValue(candidate: LeadCandidate, key: string) {
  const data = candidate.raw_data;
  const value = data && typeof data === 'object' ? data[key] : null;
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function b2bAnalysis(candidate: LeadCandidate) {
  const data = candidate.raw_data;
  if (!data || typeof data !== 'object') return null;
  const analysis = (data as Record<string, unknown>).analysis;
  if (!analysis || typeof analysis !== 'object') return null;
  return analysis as Record<string, unknown>;
}

function b2bMatch(candidate: LeadCandidate) {
  const data = candidate.raw_data;
  if (!data || typeof data !== 'object') return null;
  const match = (data as Record<string, unknown>).match;
  if (!match || typeof match !== 'object') return null;
  return match as { score: number; reasons: string[] };
}

function formatMatchReason(reason: string): string {
  if (reason.startsWith('sector:')) return reason.slice(7);
  if (reason.startsWith('firm_type:')) return reason.slice(10);
  if (reason === 'website') return 'Web sitesi';
  return reason;
}

function CandidateCard({
  candidate,
  icpProfiles,
  onApprove,
  onReject,
  onFavorite,
  onCreateRule,
  selected,
  onSelectedChange,
  isBusy,
}: {
  candidate: LeadCandidate;
  icpProfiles: IcpProfile[];
  onApprove: (candidate: LeadCandidate) => void;
  onReject: (candidate: LeadCandidate, tags: string[], saveAsRule: boolean) => void;
  onFavorite: (candidate: LeadCandidate) => void;
  onCreateRule: (candidate: LeadCandidate, tags: string[]) => void;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
  isBusy: boolean;
}) {
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [saveAsRule, setSaveAsRule] = React.useState(false);
  const icpName = candidate.icp_id ? (icpProfiles.find((p) => p.id === candidate.icp_id)?.name ?? null) : null;
  const { data: enrichment } = useListCandidateEnrichmentQuery(candidate.id, { pollingInterval: 15000 });
  const [enrichCandidate, enrichState] = useEnrichCandidateMutation();
  const [generateOutreachDraft, outreachState] = useGenerateOutreachDraftMutation();
  const status = STATUS_CONFIG[candidate.status] ?? STATUS_CONFIG.pending;
  const latestEnrichment = enrichment?.[0];
  const decisionMaker = latestEnrichment?.decision_maker && typeof latestEnrichment.decision_maker === 'object'
    ? latestEnrichment.decision_maker
    : null;
  const channelSpecific =
    candidate.channel === 'amazon'
      ? rawValue(candidate, 'problem_score') || rawValue(candidate, 'review_flags')
      : candidate.channel === 'trade_fair'
        ? rawValue(candidate, 'fair_info')
        : null;

  const analysis = candidate.channel === 'b2b_directory' ? b2bAnalysis(candidate) : null;
  const match = candidate.channel === 'b2b_directory' ? b2bMatch(candidate) : null;
  const painPoints: string[] = Array.isArray(analysis?.pain_points) ? analysis.pain_points as string[] : [];
  const sellsChina = analysis?.sells_china === true;
  const privateLabel = analysis?.private_label === true;

  return (
    <Card className="bg-gm-bg-deep/60 border-gm-border-soft rounded-[28px] overflow-hidden shadow-xl">
      <CardContent className="p-6 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelectedChange(checked === true)}
              className="mt-2 border-gm-border-soft data-[state=checked]:border-gm-gold data-[state=checked]:bg-gm-gold data-[state=checked]:text-black"
              aria-label={`${candidate.name} seç`}
            />
            <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', channelBadgeCls(candidate.channel))}>
                {CHANNEL_LABELS[candidate.channel] ?? candidate.channel}
              </Badge>
              {icpName && (
                <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/20 text-[9px] font-bold uppercase tracking-widest text-gm-muted">
                  {icpName}
                </Badge>
              )}
              <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', status.cls)}>
                {status.label}
              </Badge>
              {candidate.channel === 'amazon' && (
                <>
                  <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', decisionBadgeClass(decisionOf(candidate)))}>
                    {decisionLabel(decisionOf(candidate))}
                  </Badge>
                  <span className="rounded-full border border-gm-border-soft bg-gm-surface/20 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-gm-text/70">
                    SKOR: {compositeOf(candidate) !== null ? `${compositeOf(candidate)?.toFixed(1)} / 10` : '—'}
                  </span>
                </>
              )}
            </div>
            <div>
              <h2 className="font-serif text-2xl text-gm-text">{candidate.name}</h2>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-gm-muted">
                <span>{candidate.country || 'Ülke yok'}</span>
                <span>{candidate.city || 'Şehir yok'}</span>
                {candidate.phone && <span>{candidate.phone}</span>}
                {candidate.email && <span>{candidate.email}</span>}
              </div>
            </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {candidate.website && (
              <Button asChild variant="outline" size="sm" className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface">
                <a href={candidate.website} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Kaynak
                </a>
              </Button>
            )}
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await enrichCandidate(candidate.id).unwrap();
                  toast.success('Aday zenginleştirildi');
                } catch {
                  toast.error('Zenginleştirme başarısız');
                }
              }}
              disabled={isBusy || enrichState.isLoading}
              className="rounded-full bg-gm-primary/20 text-gm-primary-light hover:bg-gm-primary hover:text-black"
            >
              <Search className="mr-2 size-4" />
              Zenginleştir
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await generateOutreachDraft(candidate.id).unwrap();
                  toast.success('E-posta taslağı üretildi');
                } catch {
                  toast.error('Taslak üretilemedi');
                }
              }}
              disabled={isBusy || outreachState.isLoading || !latestEnrichment}
              className="rounded-full bg-gm-gold/20 text-gm-gold hover:bg-gm-gold hover:text-black disabled:opacity-40"
            >
              <Mail className="mr-2 size-4" />
              Taslak Üret
            </Button>
            <Button
              size="sm"
              onClick={() => onFavorite(candidate)}
              disabled={isBusy}
              className="rounded-full bg-gm-surface/40 text-gm-gold hover:bg-gm-gold hover:text-black"
            >
              <Star className="mr-2 size-4" />
              Favori
            </Button>
            <Button
              size="sm"
              onClick={() => onApprove(candidate)}
              disabled={isBusy}
              className="rounded-full bg-gm-success/90 text-black hover:bg-gm-success"
            >
              <Check className="mr-2 size-4" />
              Onayla
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRejectOpen((v) => !v)}
              disabled={isBusy}
              className="rounded-full border-gm-error/30 bg-gm-error/10 text-gm-error hover:bg-gm-error hover:text-black"
            >
              <X className="mr-2 size-4" />
              Reddet
            </Button>
          </div>
        </div>

        {candidate.ai_summary && (
          <p className="rounded-2xl border border-gm-border-soft bg-gm-surface/20 p-4 text-sm leading-6 text-gm-muted">
            {candidate.ai_summary}
          </p>
        )}

        {channelSpecific && (
          <div className="text-xs text-gm-muted">
            <span className="font-bold uppercase tracking-widest text-gm-text/50">Kanal verisi: </span>
            <span className="font-mono">{channelSpecific}</span>
          </div>
        )}

        {/* B2B: ICP eşleşme skoru + sinyaller */}
        {match && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gm-gold/30 bg-gm-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gm-gold">
              <Zap className="size-3" />
              ICP {match.score}/10
            </span>
            {match.reasons.slice(0, 4).map((r) => (
              <span key={r} className="rounded-full border border-gm-border-soft bg-gm-surface/20 px-2.5 py-0.5 text-[10px] font-mono text-gm-muted">
                {formatMatchReason(r)}
              </span>
            ))}
          </div>
        )}

        {/* B2B: Çin/private label uyarı rozetleri */}
        {(sellsChina || privateLabel || painPoints.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {sellsChina && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gm-warning/40 bg-gm-warning/10 px-2.5 py-0.5 text-[10px] font-bold text-gm-warning">
                <Globe className="size-3" />
                Çin'e bağımlı
              </span>
            )}
            {privateLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gm-primary/40 bg-gm-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-gm-primary-light">
                <Sparkles className="size-3" />
                Private label
              </span>
            )}
            {painPoints.map((p) => (
              <span key={p} className="inline-flex items-center gap-1 rounded-full border border-gm-error/30 bg-gm-error/5 px-2.5 py-0.5 text-[10px] font-medium text-gm-error">
                <AlertTriangle className="size-3" />
                {p}
              </span>
            ))}
          </div>
        )}

        {latestEnrichment && (
          <div className="grid gap-3 rounded-2xl border border-gm-gold/20 bg-gm-gold/5 p-4 md:grid-cols-4">
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gm-muted">Karar Verici</div>
              <div className="text-sm text-gm-text">
                {String(decisionMaker?.name ?? 'Tespit edilemedi')}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gm-muted">Unvan</div>
              <div className="text-sm text-gm-text">{String(decisionMaker?.title ?? 'Yok')}</div>
            </div>
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gm-muted">E-posta</div>
              <div className="text-sm text-gm-text">
                {decisionMaker?.email ? (
                  <a className="text-gm-gold hover:underline" href={`mailto:${String(decisionMaker.email)}`}>
                    {String(decisionMaker.email)}
                  </a>
                ) : 'Yok'}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gm-muted">LinkedIn</div>
              <div className="text-sm text-gm-text">
                {decisionMaker?.linkedin_url ? (
                  <a className="text-gm-gold hover:underline" href={String(decisionMaker.linkedin_url)} target="_blank" rel="noreferrer">
                    Profil
                  </a>
                ) : latestEnrichment.source_vendor ?? 'Yok'}
              </div>
            </div>
          </div>
        )}

        {rejectOpen && (
          <div className="space-y-3 rounded-2xl border border-gm-error/20 bg-gm-error/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gm-error/80">
              Red nedeni seçin (en az 1)
            </p>
            <div className="flex flex-wrap gap-2">
              {REJECT_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        active ? prev.filter((t) => t !== tag) : [...prev, tag],
                      )
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'border-gm-error bg-gm-error text-black'
                        : 'border-gm-error/30 bg-transparent text-gm-error hover:bg-gm-error/10',
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gm-warning/20 bg-gm-warning/5 px-3 py-2 text-xs text-gm-warning hover:bg-gm-warning/10">
              <input
                type="checkbox"
                checked={saveAsRule}
                onChange={(e) => setSaveAsRule(e.target.checked)}
                className="accent-gm-warning"
              />
              <Ban className="size-3" />
              Bu profil tipini bir daha getirme
              {icpName && <span className="text-gm-muted">({icpName})</span>}
            </label>
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={isBusy || selectedTags.length === 0}
                onClick={() => {
                  onReject(candidate, selectedTags, saveAsRule);
                  setSelectedTags([]);
                  setSaveAsRule(false);
                  setRejectOpen(false);
                }}
                className="rounded-full bg-gm-error text-black hover:bg-gm-error/80"
              >
                Reddi Kaydet
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LeadCandidatesPanel() {
  const [q, setQ] = React.useState('');
  const [channel, setChannel] = React.useState<LeadCandidateChannel | 'all'>('all');
  const [status, setStatus] = React.useState<LeadCandidateStatus | 'all'>('pending');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
  const [bulkRejectOpen, setBulkRejectOpen] = React.useState(false);
  const [bulkTags, setBulkTags] = React.useState<string[]>([]);
  const [rulesOpen, setRulesOpen] = React.useState(false);

  const { data, isLoading, isFetching, refetch } = useListLeadCandidatesQuery({
    channel,
    status,
    limit: 100,
    page: 1,
  });
  const { data: icpProfiles = [] } = useListIcpProfilesQuery();
  const { data: scanRules = [], refetch: refetchRules } = useListScanRulesQuery();
  const [reviewCandidate, reviewState] = useReviewCandidateMutation();
  const [approveToLead, approveState] = useApproveToLeadMutation();
  const [enrichBatch, enrichBatchState] = useEnrichBatchMutation();
  const [createScanRule] = useCreateScanRuleMutation();
  const [deleteScanRule] = useDeleteScanRuleMutation();

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((candidate) => {
      return [
        candidate.name,
        candidate.website,
        candidate.country,
        candidate.city,
        candidate.email,
        candidate.phone,
        candidate.ai_summary,
      ].some((value) => String(value ?? '').toLowerCase().includes(term));
    });
  }, [data, q]);

  const isBusy = reviewState.isLoading || approveState.isLoading || enrichBatchState.isLoading;

  React.useEffect(() => {
    setSelectedIds((current) => {
      const visible = new Set(filtered.map((candidate) => candidate.id));
      const next = new Set([...current].filter((id) => visible.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [filtered]);

  const handleApprove = async (candidate: LeadCandidate) => {
    try {
      await approveToLead(candidate.id).unwrap();
      toast.success("Aday lead pipeline'a aktarıldı");
    } catch {
      toast.error('Aday onaylanamadı');
    }
  };

  const handleReject = async (candidate: LeadCandidate, tags: string[], saveAsRule: boolean) => {
    try {
      await reviewCandidate({ id: candidate.id, action: 'reject', reject_tags: tags }).unwrap();
      if (saveAsRule && tags.length) {
        const icpName = candidate.icp_id ? (icpProfiles.find((p) => p.id === candidate.icp_id)?.name ?? null) : null;
        await Promise.allSettled(
          tags.map((tag) =>
            createScanRule({
              icp_id: candidate.icp_id,
              channel: candidate.channel,
              rule_type: 'exclude_reject_tag',
              value: tag,
              label: icpName ? `${icpName} — ${candidate.channel}` : null,
            }).unwrap(),
          ),
        );
        toast.success('Aday reddedildi ve kural kaydedildi');
      } else {
        toast.success('Aday reddedildi');
      }
    } catch {
      toast.error('Red işlemi kaydedilemedi');
    }
  };

  const handleCreateRule = async (candidate: LeadCandidate, tags: string[]) => {
    if (!tags.length) return;
    const icpName = candidate.icp_id ? (icpProfiles.find((p) => p.id === candidate.icp_id)?.name ?? null) : null;
    try {
      await Promise.allSettled(
        tags.map((tag) =>
          createScanRule({
            icp_id: candidate.icp_id,
            channel: candidate.channel,
            rule_type: 'exclude_reject_tag',
            value: tag,
            label: icpName ? `${icpName} — ${candidate.channel}` : null,
          }).unwrap(),
        ),
      );
      toast.success('Kural kaydedildi');
    } catch {
      toast.error('Kural kaydedilemedi');
    }
  };

  const handleFavorite = async (candidate: LeadCandidate) => {
    try {
      await reviewCandidate({ id: candidate.id, action: 'favorite' }).unwrap();
      toast.success('Aday favorilere alındı');
    } catch {
      toast.error('Favori işlemi kaydedilemedi');
    }
  };

  const handleBulkApprove = async () => {
    const selected = filtered.filter((candidate) => selectedIds.has(candidate.id));
    if (!selected.length) return;
    try {
      await Promise.all(selected.map((candidate) => approveToLead(candidate.id).unwrap()));
      setSelectedIds(new Set());
      toast.success(`${selected.length} aday pipeline'a aktarıldı`);
    } catch {
      toast.error('Seçili adaylardan bazıları onaylanamadı');
    }
  };

  const handleBulkEnrich = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    try {
      await enrichBatch(ids).unwrap();
      toast.success(`${ids.length} aday zenginleştirme kuyruğuna alındı`);
    } catch {
      toast.error('Toplu zenginleştirme başlatılamadı');
    }
  };

  const handleBulkReject = async () => {
    if (!bulkTags.length) {
      toast.error('En az 1 red nedeni seçin');
      return;
    }
    const selected = filtered.filter((c) => selectedIds.has(c.id));
    if (!selected.length) return;
    try {
      await Promise.all(selected.map((c) => reviewCandidate({ id: c.id, action: 'reject', reject_tags: bulkTags }).unwrap()));
      setSelectedIds(new Set());
      setBulkRejectOpen(false);
      setBulkTags([]);
      toast.success(`${selected.length} aday reddedildi`);
    } catch {
      toast.error('Toplu red başarısız');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Lead Machine</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Lead Adayları</h1>
          <p className="max-w-xl font-serif text-sm italic text-gm-muted">
            Otomatik kanallardan gelen firmaları inceleyin, uygun olanları satış pipeline'ına aktarın.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-12 rounded-full border-gm-border-soft bg-gm-surface/20 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface"
        >
          <RefreshCw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
          Yenile
        </Button>
      </div>

      <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
        <CardContent className="grid gap-5 p-6 md:grid-cols-[1fr_220px_220px]">
          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Arama</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted/60" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Firma, ülke, e-posta veya özet ara"
                className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 pl-12 text-gm-text placeholder:text-gm-text/25"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Kanal</label>
            <Select value={channel} onValueChange={(v) => setChannel(v as LeadCandidateChannel | 'all')}>
              <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-surface text-gm-text">
                <SelectItem value="all">Tüm Kanallar</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
                <SelectItem value="b2b_directory">B2B Dizin</SelectItem>
                <SelectItem value="trade_fair">Fuar</SelectItem>
                <SelectItem value="icp_match">ICP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Durum</label>
            <Select value={status} onValueChange={(v) => setStatus(v as LeadCandidateStatus | 'all')}>
              <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-surface text-gm-text">
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Bekliyor</SelectItem>
                <SelectItem value="favorite">Favori</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-[24px] border border-gm-border-soft bg-gm-surface/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onCheckedChange={(checked) => {
                setSelectedIds(checked === true ? new Set(filtered.map((candidate) => candidate.id)) : new Set());
              }}
              className="border-gm-border-soft data-[state=checked]:border-gm-gold data-[state=checked]:bg-gm-gold data-[state=checked]:text-black"
              aria-label="Tüm adayları seç"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
              {selectedIds.size ? `${selectedIds.size} aday seçildi` : `${filtered.length} aday listeleniyor`}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!selectedIds.size || isBusy}
              onClick={handleBulkEnrich}
              className="rounded-full bg-gm-primary/20 px-6 text-[10px] font-bold uppercase tracking-widest text-gm-primary-light hover:bg-gm-primary hover:text-black"
            >
              <Search className="mr-2 size-4" />
              Toplu Zenginleştir
            </Button>
            <Button
              size="sm"
              disabled={!selectedIds.size || isBusy}
              onClick={() => setBulkRejectOpen((v) => !v)}
              variant="outline"
              className="rounded-full border-gm-error/30 bg-gm-error/10 px-6 text-[10px] font-bold uppercase tracking-widest text-gm-error hover:bg-gm-error hover:text-black"
            >
              <X className="mr-2 size-4" />
              Toplu Reddet
            </Button>
            <Button
              size="sm"
              disabled={!selectedIds.size || isBusy}
              onClick={handleBulkApprove}
              className="rounded-full bg-gm-gold px-6 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light"
            >
              <Check className="mr-2 size-4" />
              Seçilenleri Onayla
            </Button>
          </div>
        </div>

        {bulkRejectOpen && selectedIds.size > 0 && (
          <div className="rounded-2xl border border-gm-error/20 bg-gm-error/5 p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gm-error/80">
              {selectedIds.size} aday için red nedeni seçin (en az 1)
            </p>
            <div className="flex flex-wrap gap-2">
              {REJECT_TAGS.map((tag) => {
                const active = bulkTags.includes(tag);
                return (
                  <button key={tag} type="button"
                    onClick={() => setBulkTags((prev) => active ? prev.filter((t) => t !== tag) : [...prev, tag])}
                    className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      active ? 'border-gm-error bg-gm-error text-black' : 'border-gm-error/30 bg-transparent text-gm-error hover:bg-gm-error/10')}
                  >{tag}</button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => { setBulkRejectOpen(false); setBulkTags([]); }}
                className="rounded-full border-gm-border-soft text-gm-muted hover:text-gm-text">İptal</Button>
              <Button size="sm" disabled={isBusy || bulkTags.length === 0} onClick={handleBulkReject}
                className="rounded-full bg-gm-error text-black hover:bg-gm-error/80">Toplu Reddi Kaydet</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/60">
              <CardContent className="p-6">
                <Skeleton className="mb-4 h-8 w-80 bg-gm-surface/30" />
                <Skeleton className="h-24 w-full bg-gm-surface/20" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length ? (
          filtered.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              icpProfiles={icpProfiles}
              onApprove={handleApprove}
              onReject={handleReject}
              onFavorite={handleFavorite}
              onCreateRule={handleCreateRule}
              selected={selectedIds.has(candidate.id)}
              onSelectedChange={(checked) => {
                setSelectedIds((current) => {
                  const next = new Set(current);
                  if (checked) next.add(candidate.id);
                  else next.delete(candidate.id);
                  return next;
                });
              }}
              isBusy={isBusy}
            />
          ))
        ) : (
          <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <Filter className="size-12 text-gm-gold/40" />
              <div className="font-serif text-xl italic text-gm-muted">Bu filtrelerde aday bulunamadı.</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tarama Kuralları */}
      <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
        <CardContent className="p-6 space-y-4">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setRulesOpen((v) => !v)}
          >
            <div className="flex items-center gap-3">
              <Ban className="size-5 text-gm-warning" />
              <h2 className="font-serif text-xl text-gm-text">Tarama Dışlama Kuralları</h2>
              {scanRules.length > 0 && (
                <Badge variant="outline" className="rounded-full border-gm-warning/30 bg-gm-warning/10 text-[9px] font-bold text-gm-warning">
                  {scanRules.length} kural
                </Badge>
              )}
            </div>
            {rulesOpen ? <ChevronUp className="size-4 text-gm-muted" /> : <ChevronDown className="size-4 text-gm-muted" />}
          </button>

          {rulesOpen && (
            <div className="space-y-2">
              {scanRules.length === 0 ? (
                <p className="text-sm italic text-gm-muted">
                  Henüz kural yok. Adayları reddederken &quot;Bu profil tipini bir daha getirme&quot; seçeneğini işaretleyerek kural ekleyebilirsiniz.
                </p>
              ) : (
                scanRules.map((rule: ScanRule) => (
                  <div key={rule.id} className="flex items-center justify-between rounded-xl border border-gm-border-soft bg-gm-surface/10 px-4 py-2">
                    <div className="space-y-0.5">
                      <div className="text-sm text-gm-text">{rule.value}</div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-gm-muted">
                        {rule.channel && (
                          <span className={cn('rounded-full px-2 py-0.5 border', channelBadgeCls(rule.channel))}>
                            {CHANNEL_LABELS[rule.channel] ?? rule.channel}
                          </span>
                        )}
                        {rule.label && <span>{rule.label}</span>}
                        <span className="font-mono">{new Date(rule.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteScanRule(rule.id).unwrap().catch(() => null);
                        void refetchRules();
                      }}
                      className="ml-4 rounded-lg p-1.5 text-gm-muted hover:bg-gm-error/10 hover:text-gm-error"
                      aria-label="Kuralı sil"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
