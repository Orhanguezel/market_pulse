'use client';

import * as React from 'react';
import { AlertTriangle, Archive, Brain, Clipboard, ExternalLink, Globe, Mail, MessageCircle, MessageCircleOff, RefreshCw, Save, Search, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useGetCandidateByIdQuery,
  useListCandidateEnrichmentQuery,
  useListOutreachDraftsQuery,
  useUpdateOutreachDraftMutation,
  type OutreachDraft,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

const CHANNEL_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  b2b_directory: 'B2B Dizin',
  trade_fair: 'Fuar',
  icp_match: 'ICP',
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Taslak', cls: 'border-gm-gold/30 bg-gm-gold/10 text-gm-gold' },
  sent: { label: 'Gönderildi', cls: 'border-gm-success/30 bg-gm-success/10 text-gm-success' },
  archived: { label: 'Arşiv', cls: 'border-gm-muted/30 bg-gm-surface/20 text-gm-muted' },
};

const REPLY_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  replied: { label: 'Yanıt Aldı', cls: 'border-gm-success/40 bg-gm-success/10 text-gm-success' },
  no_reply: { label: 'Yanıt Yok', cls: 'border-gm-error/30 bg-gm-error/5 text-gm-error' },
};

function CandidateContext({ candidateId }: { candidateId: string }) {
  const { data: candidate, isLoading } = useGetCandidateByIdQuery(candidateId);
  const { data: enrichmentRows = [] } = useListCandidateEnrichmentQuery(candidateId);
  const latestEnrichment = enrichmentRows[0];
  const decisionMaker = latestEnrichment?.decision_maker && typeof latestEnrichment.decision_maker === 'object'
    ? latestEnrichment.decision_maker as Record<string, unknown>
    : null;

  const raw = candidate?.raw_data && typeof candidate.raw_data === 'object'
    ? candidate.raw_data as Record<string, unknown>
    : {};
  const analysis = raw.analysis && typeof raw.analysis === 'object'
    ? raw.analysis as Record<string, unknown>
    : null;
  const match = raw.match && typeof raw.match === 'object'
    ? raw.match as { score?: number; reasons?: string[] }
    : null;
  const painPoints: string[] = Array.isArray(analysis?.pain_points) ? analysis.pain_points as string[] : [];
  const sellsChina = analysis?.sells_china === true;
  const privateLabel = analysis?.private_label === true;

  if (isLoading) return (
    <div className="space-y-2 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4">
      <Skeleton className="h-4 w-40 bg-gm-surface/30" />
      <Skeleton className="h-3 w-64 bg-gm-surface/20" />
    </div>
  );

  if (!candidate) return null;

  return (
    <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/20 text-[9px] font-bold uppercase tracking-widest text-gm-muted">
          {CHANNEL_LABELS[candidate.channel] ?? candidate.channel}
        </Badge>
        {match?.score !== undefined && (
          <span className="inline-flex items-center gap-1 rounded-full border border-gm-gold/30 bg-gm-gold/10 px-2.5 py-0.5 text-[10px] font-bold text-gm-gold">
            <Zap className="size-3" />
            ICP {match.score}/10
          </span>
        )}
        <span className="font-serif text-base text-gm-text">{candidate.name}</span>
        {candidate.country && <span className="text-xs text-gm-muted">{candidate.country}</span>}
      </div>

      {candidate.website && (
        <a href={candidate.website} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-gm-gold hover:underline">
          <Globe className="size-3" />
          {candidate.website}
          <ExternalLink className="size-3" />
        </a>
      )}

      {candidate.ai_summary && (
        <p className="text-xs leading-5 text-gm-muted">{candidate.ai_summary}</p>
      )}

      {(sellsChina || privateLabel || painPoints.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {sellsChina && (
            <span className="inline-flex items-center gap-1 rounded-full border border-gm-warning/40 bg-gm-warning/10 px-2 py-0.5 text-[10px] font-bold text-gm-warning">
              <Globe className="size-3" />Çin&apos;e bağımlı
            </span>
          )}
          {privateLabel && (
            <span className="inline-flex items-center gap-1 rounded-full border border-gm-primary/40 bg-gm-primary/10 px-2 py-0.5 text-[10px] font-bold text-gm-primary-light">
              <Sparkles className="size-3" />Private label
            </span>
          )}
          {painPoints.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 rounded-full border border-gm-error/30 bg-gm-error/5 px-2 py-0.5 text-[10px] text-gm-error">
              <AlertTriangle className="size-3" />{p}
            </span>
          ))}
        </div>
      )}

      {decisionMaker && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-xl border border-gm-gold/20 bg-gm-gold/5 px-3 py-2 text-xs text-gm-muted">
          <span className="font-bold text-gm-text">{String(decisionMaker.name ?? '')}</span>
          {decisionMaker.title ? <span>{String(decisionMaker.title)}</span> : null}
          {decisionMaker.email ? (
            <a href={`mailto:${String(decisionMaker.email)}`} className="text-gm-gold hover:underline">
              {String(decisionMaker.email)}
            </a>
          ) : null}
        </div>
      )}

      {match?.reasons?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {(match.reasons as string[]).slice(0, 4).map((r) => (
            <span key={r} className="rounded-full border border-gm-border-soft bg-gm-surface/20 px-2 py-0.5 text-[10px] font-mono text-gm-muted">
              {r.startsWith('sector:') ? r.slice(7) : r.startsWith('firm_type:') ? r.slice(10) : r}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DraftEditor({ draft }: { draft: OutreachDraft }) {
  const [subject, setSubject] = React.useState(draft.subject);
  const [body, setBody] = React.useState(draft.body);
  const [updateDraft, updateState] = useUpdateOutreachDraftMutation();

  React.useEffect(() => {
    setSubject(draft.subject);
    setBody(draft.body);
  }, [draft.body, draft.subject]);

  const status = STATUS_CONFIG[draft.status] ?? STATUS_CONFIG.draft;
  const replyStatus = draft.reply_status ? REPLY_STATUS_CONFIG[draft.reply_status] : null;

  const handleSave = async (overrides?: Partial<Pick<OutreachDraft, 'status' | 'reply_status'>>) => {
    try {
      await updateDraft({ id: draft.id, body: { subject, body, status: draft.status, ...overrides } }).unwrap();
      toast.success('Taslak güncellendi');
    } catch {
      toast.error('Taslak güncellenemedi');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      toast.success('Taslak panoya kopyalandı');
    } catch {
      toast.error('Kopyalanamadı');
    }
  };

  return (
    <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/60 shadow-xl">
      <CardContent className="space-y-5 p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', status.cls)}>
                {status.label}
              </Badge>
              {replyStatus && (
                <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', replyStatus.cls)}>
                  {replyStatus.label}
                </Badge>
              )}
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {new Date(draft.created_at).toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="font-serif text-2xl text-gm-text">E-posta Taslağı</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}
              className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface">
              <Clipboard className="mr-2 size-4" />Kopyala
            </Button>
            <Button variant="outline" size="sm" disabled={updateState.isLoading}
              onClick={() => handleSave({ status: 'sent' })}
              className="rounded-full border-gm-success/30 bg-gm-success/5 text-gm-success hover:bg-gm-success/20">
              <Mail className="mr-2 size-4" />Gönderildi
            </Button>
            <Button size="sm" disabled={updateState.isLoading}
              onClick={() => handleSave({ reply_status: 'replied' })}
              className={cn('rounded-full px-4 text-xs font-bold',
                draft.reply_status === 'replied'
                  ? 'bg-gm-success text-black'
                  : 'bg-gm-success/20 text-gm-success hover:bg-gm-success hover:text-black'
              )}>
              <MessageCircle className="mr-2 size-4" />Yanıt Aldı
            </Button>
            <Button size="sm" variant="outline" disabled={updateState.isLoading}
              onClick={() => handleSave({ reply_status: 'no_reply' })}
              className={cn('rounded-full border px-4 text-xs font-bold',
                draft.reply_status === 'no_reply'
                  ? 'border-gm-error bg-gm-error text-black'
                  : 'border-gm-error/30 bg-gm-error/5 text-gm-error hover:bg-gm-error hover:text-black'
              )}>
              <MessageCircleOff className="mr-2 size-4" />Yanıt Yok
            </Button>
            <Button variant="outline" size="sm" disabled={updateState.isLoading}
              onClick={() => handleSave({ status: 'archived' })}
              className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface">
              <Archive className="mr-2 size-4" />Arşivle
            </Button>
            <Button size="sm" disabled={updateState.isLoading} onClick={() => handleSave()}
              className="rounded-full bg-gm-gold px-5 text-black hover:bg-gm-gold-light">
              <Save className="mr-2 size-4" />Kaydet
            </Button>
          </div>
        </div>

        {/* Firma bağlamı */}
        {draft.candidate_id && (
          <div className="space-y-1">
            <div className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gm-muted">
              <Brain className="mr-1 inline size-3" />Firma hakkında öğrenilenler
            </div>
            <CandidateContext candidateId={draft.candidate_id} />
          </div>
        )}

        {/* Editör */}
        <div className="space-y-3">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="Konu başlığı"
            className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/30 font-serif text-lg text-gm-text" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)}
            className="min-h-48 rounded-2xl border-gm-border-soft bg-gm-surface/30 text-sm leading-6 text-gm-text" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function OutreachDraftsPanel() {
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const { data, isLoading, isFetching, refetch } = useListOutreachDraftsQuery();

  const filtered = React.useMemo(() => {
    if (!data) return [];
    if (statusFilter === 'all') return data;
    if (statusFilter === 'replied') return data.filter((d) => d.reply_status === 'replied');
    if (statusFilter === 'no_reply') return data.filter((d) => d.reply_status === 'no_reply');
    return data.filter((d) => d.status === statusFilter);
  }, [data, statusFilter]);

  const stats = React.useMemo(() => {
    if (!data) return null;
    return {
      total: data.length,
      sent: data.filter((d) => d.status === 'sent').length,
      replied: data.filter((d) => d.reply_status === 'replied').length,
      no_reply: data.filter((d) => d.reply_status === 'no_reply').length,
    };
  }, [data]);

  const FILTER_TABS = [
    { key: 'all', label: `Tümü${stats ? ` (${stats.total})` : ''}` },
    { key: 'draft', label: 'Taslak' },
    { key: 'sent', label: `Gönderildi${stats ? ` (${stats.sent})` : ''}` },
    { key: 'replied', label: `Yanıt Aldı${stats ? ` (${stats.replied})` : ''}` },
    { key: 'no_reply', label: `Yanıt Yok${stats ? ` (${stats.no_reply})` : ''}` },
    { key: 'archived', label: 'Arşiv' },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Lead Machine</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Outreach Taslakları</h1>
          <p className="max-w-xl font-serif text-sm italic text-gm-muted">
            Firmaya özel e-posta taslakları — konu + gövde ayrı, yanıt takibi dahil.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}
          className="h-12 rounded-full border-gm-border-soft bg-gm-surface/20 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface">
          <RefreshCw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
          Yenile
        </Button>
      </div>

      {/* Filtre tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setStatusFilter(key)}
            className={cn('rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors',
              statusFilter === key
                ? 'border-gm-gold bg-gm-gold text-black'
                : 'border-gm-border-soft bg-gm-surface/20 text-gm-muted hover:bg-gm-surface'
            )}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/60">
              <CardContent className="p-6">
                <Skeleton className="mb-4 h-8 w-80 bg-gm-surface/30" />
                <Skeleton className="h-40 w-full bg-gm-surface/20" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length ? (
          filtered.map((draft) => <DraftEditor key={draft.id} draft={draft} />)
        ) : (
          <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <Search className="size-12 text-gm-gold/40" />
              <div className="font-serif text-xl italic text-gm-muted">
                {statusFilter === 'all' ? 'Henüz outreach taslağı yok.' : 'Bu filtrde taslak bulunamadı.'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
