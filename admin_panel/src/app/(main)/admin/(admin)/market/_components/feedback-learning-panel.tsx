'use client';

import * as React from 'react';
import { Ban, Brain, RefreshCw, TrendingUp, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetFeedbackApprovedStatsQuery,
  useGetFeedbackRejectionStatsQuery,
  useListIcpProfilesQuery,
  useListScanRulesQuery,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

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

export default function FeedbackLearningPanel() {
  const {
    data: rejectionStats,
    isLoading: isRejLoading,
    isFetching: isRejFetching,
    refetch: refetchRej,
  } = useGetFeedbackRejectionStatsQuery();

  const {
    data: approvedStats,
    isLoading: isApprLoading,
    isFetching: isApprFetching,
    refetch: refetchAppr,
  } = useGetFeedbackApprovedStatsQuery();

  const { data: icpProfiles = [] } = useListIcpProfilesQuery();
  const { data: scanRules = [] } = useListScanRulesQuery();

  const isFetching = isRejFetching || isApprFetching;

  const icpMap = React.useMemo(
    () => new Map(icpProfiles.map((p) => [p.id, p.name])),
    [icpProfiles],
  );

  // Group rejection stats by tag for bar chart
  const topTags = React.useMemo(() => {
    if (!rejectionStats) return [];
    const map = new Map<string, number>();
    for (const stat of rejectionStats) {
      map.set(stat.tag, (map.get(stat.tag) ?? 0) + stat.count);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [rejectionStats]);

  const maxTagCount = topTags[0]?.[1] ?? 1;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Lead Machine</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Öğrenme Raporu</h1>
          <p className="max-w-xl font-serif text-sm italic text-gm-muted">
            Red pattern analizi · Onaylanan adayların ortak özellikleri · Aktif tarama kuralları
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { void refetchRej(); void refetchAppr(); }}
          disabled={isFetching}
          className="h-12 rounded-full border-gm-border-soft bg-gm-surface/20 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface"
        >
          <RefreshCw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
          Yenile
        </Button>
      </div>

      {/* Özet metrik kartları */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: 'Aktif Kural',
            value: scanRules.length,
            icon: Ban,
            cls: 'text-gm-warning',
          },
          {
            label: 'Onaylanan Aday',
            value: approvedStats?.total_approved ?? '—',
            icon: TrendingUp,
            cls: 'text-gm-success',
          },
          {
            label: 'Favori',
            value: approvedStats?.total_favorite ?? '—',
            icon: Users,
            cls: 'text-gm-gold',
          },
          {
            label: 'Ort. Lead Skoru',
            value: approvedStats?.avg_lead_score !== null && approvedStats?.avg_lead_score !== undefined
              ? `${approvedStats.avg_lead_score}/10`
              : '—',
            icon: Brain,
            cls: 'text-gm-primary-light',
          },
        ].map(({ label, value, icon: Icon, cls }) => (
          <Card key={label} className="rounded-[24px] border-gm-border-soft bg-gm-bg-deep/50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn('rounded-2xl border border-current/20 bg-current/10 p-3', cls)}>
                <Icon className={cn('size-5', cls)} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gm-muted">{label}</div>
                {isApprLoading ? (
                  <Skeleton className="mt-1 h-6 w-16 bg-gm-surface/30" />
                ) : (
                  <div className={cn('font-serif text-2xl', cls)}>{value}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Red Pattern Raporu */}
        <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
          <CardContent className="space-y-5 p-6">
            <h2 className="font-serif text-xl text-gm-text">En Sık Red Nedenleri</h2>
            {isRejLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-48 bg-gm-surface/30" />
                  <Skeleton className="h-3 w-full bg-gm-surface/20" />
                </div>
              ))
            ) : topTags.length === 0 ? (
              <p className="text-sm italic text-gm-muted">Henüz reddedilen aday yok.</p>
            ) : (
              topTags.map(([tag, count]) => (
                <div key={tag} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gm-text">{tag}</span>
                    <span className="font-mono text-xs text-gm-muted">{count}x</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gm-surface/20">
                    <div
                      className="h-full rounded-full bg-gm-error/60 transition-all duration-500"
                      style={{ width: `${Math.round((count / maxTagCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}

            {/* Kanal bazlı dağılım */}
            {(rejectionStats?.length ?? 0) > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gm-muted">Kanal Bazlı</div>
                {(() => {
                  const byChannel = new Map<string, number>();
                  for (const stat of (rejectionStats ?? [])) {
                    byChannel.set(stat.channel, (byChannel.get(stat.channel) ?? 0) + stat.count);
                  }
                  return [...byChannel.entries()].sort((a, b) => b[1] - a[1]).map(([ch, cnt]) => (
                    <div key={ch} className="flex items-center gap-2 text-xs text-gm-muted">
                      <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold', CHANNEL_BADGE_CLS[ch] ?? 'border-gm-border-soft text-gm-muted')}>
                        {CHANNEL_LABELS[ch] ?? ch}
                      </Badge>
                      <span className="font-mono">{cnt} red</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Onaylanan Adayların Ortak Özellikleri */}
        <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
          <CardContent className="space-y-5 p-6">
            <h2 className="font-serif text-xl text-gm-text">Onaylanan Adayların Profili</h2>
            {isApprLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full bg-gm-surface/20" />)
            ) : !approvedStats || (approvedStats.total_approved + approvedStats.total_favorite === 0) ? (
              <p className="text-sm italic text-gm-muted">Henüz onaylanan veya favorilenen aday yok.</p>
            ) : (
              <>
                {approvedStats.by_channel.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gm-muted">Kanal Dağılımı</div>
                    <div className="flex flex-wrap gap-2">
                      {approvedStats.by_channel.map(({ channel, count }) => (
                        <span key={channel} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold', CHANNEL_BADGE_CLS[channel] ?? 'border-gm-border-soft text-gm-muted')}>
                          {CHANNEL_LABELS[channel] ?? channel}
                          <span className="font-mono opacity-70">{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {approvedStats.by_country.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gm-muted">Top Ülkeler</div>
                    <div className="flex flex-wrap gap-2">
                      {approvedStats.by_country.map(({ country, count }) => (
                        <span key={country} className="inline-flex items-center gap-1.5 rounded-full border border-gm-border-soft bg-gm-surface/20 px-3 py-1 text-xs text-gm-muted">
                          {country}
                          <span className="font-mono">{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {approvedStats.top_pain_points.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gm-muted">B2B Pain Points (Onaylananlar)</div>
                    <div className="flex flex-wrap gap-2">
                      {approvedStats.top_pain_points.map(({ pain_point, count }) => (
                        <span key={pain_point} className="inline-flex items-center gap-1.5 rounded-full border border-gm-warning/30 bg-gm-warning/5 px-3 py-1 text-xs font-medium text-gm-warning">
                          {pain_point}
                          <span className="font-mono opacity-70">{count}x</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aktif Tarama Kuralları özeti */}
      <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <Ban className="size-5 text-gm-warning" />
            <h2 className="font-serif text-xl text-gm-text">Aktif Tarama Kuralları</h2>
            <Badge variant="outline" className="rounded-full border-gm-warning/30 bg-gm-warning/10 text-[9px] font-bold text-gm-warning">
              {scanRules.length} kural
            </Badge>
          </div>
          {scanRules.length === 0 ? (
            <p className="text-sm italic text-gm-muted">
              Kural yok. Lead adaylarını reddederken &quot;Bu profil tipini bir daha getirme&quot; seçeneğiyle kural ekleyebilirsiniz.
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {scanRules.map((rule) => (
                <div key={rule.id} className="flex items-start gap-3 rounded-xl border border-gm-border-soft bg-gm-surface/10 p-3">
                  <Ban className="mt-0.5 size-3.5 shrink-0 text-gm-warning" />
                  <div className="min-w-0 space-y-1">
                    <div className="text-sm font-medium text-gm-text">{rule.value}</div>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-gm-muted">
                      {rule.channel && (
                        <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold', CHANNEL_BADGE_CLS[rule.channel] ?? 'border-gm-border-soft text-gm-muted')}>
                          {CHANNEL_LABELS[rule.channel] ?? rule.channel}
                        </Badge>
                      )}
                      {rule.icp_id && (
                        <span className="font-mono">{icpMap.get(rule.icp_id) ?? rule.icp_id.slice(0, 8)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-gm-muted/60">
            Her aktif kural, B2B taramalarında ilgili ICP+kanal kombinasyonu için lead skorunu 1 puan düşürür. Skor 3&apos;ün altına düşen adaylar taramaya dahil edilmez.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
