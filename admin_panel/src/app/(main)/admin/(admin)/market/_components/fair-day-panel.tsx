'use client';

import * as React from 'react';
import { CalendarDays, Download, ExternalLink, Mail, MapPin, RefreshCw, Search, Sparkles, Star, UserRound, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEnrichCandidateMutation,
  useGenerateOutreachDraftMutation,
  useListCandidateEnrichmentQuery,
  useListLeadCandidatesQuery,
  type LeadCandidate,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function rawRecord(candidate: LeadCandidate): Record<string, unknown> {
  return candidate.raw_data && typeof candidate.raw_data === 'object' ? candidate.raw_data : {};
}

function fairInfo(candidate: LeadCandidate) {
  return asRecord(rawRecord(candidate).fair_info);
}

function productGroups(candidate: LeadCandidate) {
  return asStringArray(asRecord(rawRecord(candidate).exhibitor).product_groups).slice(0, 3);
}

function matchReasons(candidate: LeadCandidate) {
  return asStringArray(asRecord(rawRecord(candidate).match).reasons).slice(0, 3);
}

function scoreOf(candidate: LeadCandidate) {
  const score = candidate.lead_score === null || candidate.lead_score === undefined ? null : Number(candidate.lead_score);
  return Number.isFinite(score) ? score : null;
}

function briefingUrl(candidateId: string) {
  return `/api/v1/admin/lead-machine/fair/brifing/${encodeURIComponent(candidateId)}.pdf`;
}

function FairDayCard({ candidate }: { candidate: LeadCandidate }) {
  const [enrichCandidate, enrichState] = useEnrichCandidateMutation();
  const [generateOutreachDraft, outreachState] = useGenerateOutreachDraftMutation();
  const { data: enrichmentRows = [] } = useListCandidateEnrichmentQuery(candidate.id, { pollingInterval: 30000 });
  const info = fairInfo(candidate);
  const groups = productGroups(candidate);
  const reasons = matchReasons(candidate);
  const score = scoreOf(candidate);
  const decisionMaker = asRecord(enrichmentRows[0]?.decision_maker);
  const booth = String(info.booth_number ?? info.booth ?? '-');
  const isNeighbor = info.is_neighbor === true;

  const handleEnrich = async () => {
    try {
      await enrichCandidate(candidate.id).unwrap();
      toast.success('Aday zenginleştirildi');
    } catch {
      toast.error('Zenginleştirme başarısız');
    }
  };

  const handleDraft = async () => {
    try {
      await generateOutreachDraft(candidate.id).unwrap();
      toast.success('Outreach taslağı üretildi');
    } catch {
      toast.error('Taslak üretilemedi');
    }
  };

  return (
    <Card className="overflow-hidden rounded-lg border-gm-border-soft bg-gm-bg-deep/70 shadow-lg">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="rounded-full border-gm-success/30 bg-gm-success/10 text-[9px] font-bold uppercase tracking-widest text-gm-success">
                {candidate.status === 'favorite' ? 'Favori' : 'Onaylı'}
              </Badge>
              {isNeighbor && (
                <Badge variant="outline" className="rounded-full border-gm-gold/40 bg-gm-gold/10 text-[9px] font-bold uppercase tracking-widest text-gm-gold">
                  Komşu
                </Badge>
              )}
              {score !== null && (
                <span className="inline-flex items-center gap-1 rounded-full border border-gm-border-soft bg-gm-surface/20 px-2 py-0.5 text-[10px] font-bold text-gm-text">
                  <Zap className="size-3" />
                  {score.toFixed(1)}
                </span>
              )}
            </div>
            <h2 className="break-words font-serif text-xl leading-tight text-gm-text">{candidate.name}</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gm-muted">
              <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{booth}</span>
              <span>{[candidate.country, candidate.city].filter(Boolean).join(' / ') || '-'}</span>
            </div>
          </div>
          <Button asChild size="icon" variant="outline" className="h-10 w-10 shrink-0 rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text">
            <a href={briefingUrl(candidate.id)} target="_blank" rel="noreferrer" aria-label="Brifing PDF indir">
              <Download className="size-4" />
            </a>
          </Button>
        </div>

        {candidate.ai_summary && (
          <p className="line-clamp-3 text-sm leading-6 text-gm-muted">{candidate.ai_summary}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {groups.map((group) => (
            <span key={group} className="rounded-full border border-gm-border-soft bg-gm-surface/20 px-2 py-0.5 text-[10px] text-gm-muted">
              {group}
            </span>
          ))}
          {reasons.map((reason) => (
            <span key={reason} className="rounded-full border border-gm-primary/25 bg-gm-primary/10 px-2 py-0.5 text-[10px] text-gm-primary-light">
              {reason.replace(/^sector:/, '').replace(/^firm_type:/, '')}
            </span>
          ))}
        </div>

        {(decisionMaker.name || decisionMaker.email || candidate.email) && (
          <div className="rounded-lg border border-gm-gold/20 bg-gm-gold/5 p-3 text-xs text-gm-muted">
            <div className="flex items-center gap-2 font-bold text-gm-text">
              <UserRound className="size-3.5 text-gm-gold" />
              {String(decisionMaker.name ?? candidate.contact_name ?? 'Karar verici')}
            </div>
            {decisionMaker.title ? <div className="mt-1">{String(decisionMaker.title)}</div> : null}
            {decisionMaker.email || candidate.email ? (
              <a href={`mailto:${String(decisionMaker.email ?? candidate.email)}`} className="mt-1 block text-gm-gold hover:underline">
                {String(decisionMaker.email ?? candidate.email)}
              </a>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {candidate.website && (
            <Button asChild variant="outline" size="sm" className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text">
              <a href={candidate.website} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 size-4" />
                Kaynak
              </a>
            </Button>
          )}
          <Button size="sm" onClick={handleEnrich} disabled={enrichState.isLoading}
            className="rounded-full bg-gm-primary/20 text-gm-primary-light hover:bg-gm-primary hover:text-black">
            <Sparkles className="mr-2 size-4" />
            Zenginleştir
          </Button>
          <Button size="sm" onClick={handleDraft} disabled={outreachState.isLoading}
            className="rounded-full bg-gm-gold/20 text-gm-gold hover:bg-gm-gold hover:text-black">
            <Mail className="mr-2 size-4" />
            Taslak
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text">
            <a href="/admin/market/lead-machine/outreach/drafts">
              <Mail className="mr-2 size-4" />
              Mail
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FairDayPanel() {
  const [query, setQuery] = React.useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);
  const approved = useListLeadCandidatesQuery({ channel: 'trade_fair', status: 'approved', limit: 100 });
  const favorites = useListLeadCandidatesQuery({ channel: 'trade_fair', status: 'favorite', limit: 100 });
  const isLoading = approved.isLoading || favorites.isLoading;
  const isFetching = approved.isFetching || favorites.isFetching;

  const candidates = React.useMemo(() => {
    const map = new Map<string, LeadCandidate>();
    for (const item of approved.data ?? []) map.set(item.id, item);
    for (const item of favorites.data ?? []) map.set(item.id, item);
    const normalized = query.trim().toLowerCase();
    return [...map.values()]
      .filter((candidate) => !showFavoritesOnly || candidate.status === 'favorite')
      .filter((candidate) => {
        if (!normalized) return true;
        return [candidate.name, candidate.country, candidate.city, String(fairInfo(candidate).booth_number ?? '')]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      })
      .sort((a, b) => Number(fairInfo(b).is_neighbor === true) - Number(fairInfo(a).is_neighbor === true) || (scoreOf(b) ?? 0) - (scoreOf(a) ?? 0));
  }, [approved.data, favorites.data, query, showFavoritesOnly]);

  const refetch = () => {
    void approved.refetch();
    void favorites.refetch();
  };

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500">
      <div className="sticky top-0 z-10 -mx-4 border-b border-gm-border-soft bg-gm-bg-deep/95 px-4 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">
              <CalendarDays className="size-4" />
              Fuar Günü
            </div>
            <h1 className="font-serif text-2xl leading-tight text-gm-text sm:text-4xl">Stand Paneli</h1>
            <p className="text-xs text-gm-muted">Onaylı ve favori Automechanika adayları</p>
          </div>
          <Button size="icon" variant="outline" onClick={refetch} disabled={isFetching}
            className="h-10 w-10 shrink-0 rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text">
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gm-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Firma, ülke, stand ara"
              className="h-11 rounded-full border-gm-border-soft bg-gm-surface/20 pl-9 text-gm-text"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFavoritesOnly((value) => !value)}
            className={cn('h-11 rounded-full border-gm-border-soft bg-gm-surface/20 px-4 text-gm-text', showFavoritesOnly && 'border-gm-gold bg-gm-gold text-black')}
          >
            <Star className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-gm-border-soft bg-gm-surface/10 p-3">
          <div className="text-[10px] uppercase tracking-widest text-gm-muted">Toplam</div>
          <div className="mt-1 font-serif text-2xl text-gm-text">{candidates.length}</div>
        </div>
        <div className="rounded-lg border border-gm-border-soft bg-gm-surface/10 p-3">
          <div className="text-[10px] uppercase tracking-widest text-gm-muted">Komşu</div>
          <div className="mt-1 font-serif text-2xl text-gm-gold">{candidates.filter((candidate) => fairInfo(candidate).is_neighbor === true).length}</div>
        </div>
        <div className="rounded-lg border border-gm-border-soft bg-gm-surface/10 p-3">
          <div className="text-[10px] uppercase tracking-widest text-gm-muted">Favori</div>
          <div className="mt-1 font-serif text-2xl text-gm-success">{candidates.filter((candidate) => candidate.status === 'favorite').length}</div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-lg border-gm-border-soft bg-gm-bg-deep/60">
              <CardContent className="space-y-4 p-5">
                <Skeleton className="h-7 w-2/3 bg-gm-surface/30" />
                <Skeleton className="h-20 w-full bg-gm-surface/20" />
              </CardContent>
            </Card>
          ))
        ) : candidates.length ? (
          candidates.map((candidate) => <FairDayCard key={candidate.id} candidate={candidate} />)
        ) : (
          <Card className="rounded-lg border-gm-border-soft bg-gm-bg-deep/60 lg:col-span-2">
            <CardContent className="py-16 text-center font-serif text-xl italic text-gm-muted">
              Fuar günü için aday bulunamadı.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
