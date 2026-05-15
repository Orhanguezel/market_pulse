'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Play, RadarIcon, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetAmazonRiskScoreQuery,
  useListAmazonJobsQuery,
  useStartAmazonScanMutation,
  type AmazonRiskReport,
  type LeadSearchJob,
} from '@/integrations/hooks';
import type { AmazonRiskDecision } from '@/integrations/endpoints/admin/market_admin.endpoints';
import { cn } from '@/lib/utils';
import { RiskScoreCard } from './risk-score-card';
import ProfitCalculator from './profit-calculator';
import EvidenceTable from './evidence-table';
import SavedSearchesPanel from './saved-searches-panel';
import MultiKeywordPanel from './multi-keyword-panel';

const MARKETPLACES = [
  { value: 'com', label: 'US', domain: 'amazon.com' },
  { value: 'de', label: 'DE', domain: 'amazon.de' },
  { value: 'co.uk', label: 'UK', domain: 'amazon.co.uk' },
  { value: 'fr', label: 'FR', domain: 'amazon.fr' },
  { value: 'it', label: 'IT', domain: 'amazon.it' },
];

const JOB_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'border-gm-muted/30 bg-gm-surface/20 text-gm-muted' },
  running: { label: 'Çalışıyor', cls: 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning' },
  done: { label: 'Tamamlandı', cls: 'border-gm-success/30 bg-gm-success/10 text-gm-success' },
  failed: { label: 'Hata', cls: 'border-gm-error/30 bg-gm-error/10 text-gm-error' },
};

function numberInputValue(value: number) {
  return Number.isFinite(value) ? String(value) : '';
}

function paramsOf(job: LeadSearchJob) {
  return job.params ?? {};
}

function statusBadge(job: LeadSearchJob) {
  const cfg = JOB_STATUS[job.status] ?? JOB_STATUS.pending;
  return (
    <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', cfg.cls)}>
      {cfg.label}
    </Badge>
  );
}

function decisionBadgeClass(decision: string): string {
  if (decision === 'GUVENLI') return 'border-gm-success/40 bg-gm-success/10 text-gm-success font-bold';
  if (decision === 'DIKKATLI_OL') return 'border-gm-warning/40 bg-gm-warning/10 text-gm-warning font-bold';
  if (decision === 'GIRME') return 'border-gm-error/40 bg-gm-error/10 text-gm-error font-bold';
  if (decision === 'MIXED_SIGNAL') return 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning font-bold';
  return 'border-gm-border-soft bg-gm-surface/20 text-gm-muted';
}

function decisionLabel(decision: string): string {
  if (decision === 'GUVENLI') return 'GÜVENLİ';
  if (decision === 'DIKKATLI_OL') return 'DİKKATLİ OL';
  if (decision === 'GIRME') return 'GİRME';
  if (decision === 'MIXED_SIGNAL') return 'KARIŞIK SİNYAL';
  return 'VERİ YETERSİZ';
}

function reportForJob(job: LeadSearchJob, fallback: AmazonRiskReport | undefined): AmazonRiskReport | null {
  if (job.risk_report) return job.risk_report;
  if (!fallback) return null;
  const params = paramsOf(job);
  const keyword = String(params.keyword ?? '').trim().toLowerCase();
  if (keyword && keyword === fallback.keyword.trim().toLowerCase()) return fallback;
  return null;
}

function compareRowsFromJobs(jobs: LeadSearchJob[] | undefined, fallback: AmazonRiskReport | undefined) {
  if (!jobs?.length) return [];
  return jobs
    .map((job) => {
      const report = reportForJob(job, fallback);
      if (!report) return null;
      const params = paramsOf(job);
      return {
        jobId: job.id,
        keyword: String(params.keyword ?? report.keyword ?? '—'),
        decision: report.decision,
        composite: report.composite_score,
        dataPoints: report.data_points,
        createdAt: job.created_at,
      };
    })
    .filter((row): row is {
      jobId: string;
      keyword: string;
      decision: AmazonRiskDecision;
      composite: number | null;
      dataPoints: number;
      createdAt: string;
    } => row !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function AmazonLeadSearchPanel() {
  const [keyword, setKeyword] = React.useState('');
  const [marketplace, setMarketplace] = React.useState('com');
  const didAutoSet = React.useRef(false);
  const [reviewMin, setReviewMin] = React.useState(50);
  const [reviewMax, setReviewMax] = React.useState(500);
  const [ratingMin, setRatingMin] = React.useState(4);
  const [ratingMax, setRatingMax] = React.useState(4.5);
  const [priceMin, setPriceMin] = React.useState(15);
  const [priceMax, setPriceMax] = React.useState(100);

  const [polling, setPolling] = React.useState(false);

  const { data: jobs, isLoading, isFetching, refetch } = useListAmazonJobsQuery(undefined, {
    pollingInterval: polling ? 6000 : 0,
  });
  const { data: riskReport, isFetching: isRiskFetching, refetch: refetchRisk } = useGetAmazonRiskScoreQuery(
    { keyword: keyword.trim(), marketplace },
    { skip: !keyword.trim() },
  );
  const [startAmazonScan, startState] = useStartAmazonScanMutation();

  const activeKeyword = keyword.trim();
  const compareRows = React.useMemo(
    () => compareRowsFromJobs(jobs, riskReport),
    [jobs, riskReport],
  );

  const latestDoneJobId = React.useMemo(() => {
    if (!jobs || !activeKeyword) return null;
    const job = jobs.find((j) => {
      const p = paramsOf(j);
      return (
        String(p.keyword ?? '').toLowerCase() === activeKeyword.toLowerCase() &&
        String(p.marketplace ?? 'com') === marketplace &&
        j.status === 'done'
      );
    });
    return job?.id ?? null;
  }, [jobs, activeKeyword, marketplace]);

  React.useEffect(() => {
    if (!jobs?.length) return;
    if (!didAutoSet.current) {
      const latestDone = jobs.find((j) => j.status === 'done');
      if (latestDone) {
        const p = paramsOf(latestDone);
        const kw = String(p.keyword ?? '').trim();
        if (kw) {
          setKeyword(kw);
          setMarketplace(String(p.marketplace ?? 'com'));
        }
      }
      didAutoSet.current = true;
    }
    const hasActive = jobs.some((j) => j.status === 'pending' || j.status === 'running');
    setPolling(hasActive);
    if (activeKeyword) {
      const keywordDone = jobs.some((j) => {
        const params = paramsOf(j);
        return String(params.keyword ?? '') === activeKeyword && j.status === 'done';
      });
      if (keywordDone) refetchRisk();
    }
  }, [jobs, activeKeyword, refetchRisk]);

  function loadJobReport(job: LeadSearchJob) {
    const p = paramsOf(job);
    const kw = String(p.keyword ?? '').trim();
    if (kw) {
      setKeyword(kw);
      setMarketplace(String(p.marketplace ?? 'com'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!keyword.trim()) {
      toast.error('Keyword gerekli');
      return;
    }
    try {
      await startAmazonScan({
        keyword: keyword.trim(),
        marketplace,
        review_min: reviewMin,
        review_max: reviewMax,
        rating_min: ratingMin,
        rating_max: ratingMax,
        price_min: priceMin,
        price_max: priceMax,
      }).unwrap();
      setPolling(true);
      toast.success('Amazon risk taraması başladı — sonuç hazır olunca otomatik yüklenecek');
    } catch {
      toast.error('Amazon risk taraması başlatılamadı');
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
          <h1 className="font-serif text-4xl text-gm-text">Amazon Arama</h1>
          <p className="max-w-xl font-serif text-sm italic text-gm-muted">
            Amazon ürün havuzunu 5 boyutlu ticari risk raporuna dönüştürün.
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

      <form onSubmit={handleSubmit}>
        <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
          <CardContent className="space-y-7 p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Keyword</Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted/60" />
                  <Input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="örn. cable organizer, surge protector..."
                    className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 pl-12 text-gm-text placeholder:text-gm-muted/70"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Marketplace</Label>
                <Select value={marketplace} onValueChange={setMarketplace}>
                  <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                    {MARKETPLACES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label} - {item.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-3 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Review Aralığı</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" min={0} value={numberInputValue(reviewMin)} onChange={(e) => setReviewMin(Number(e.target.value))} className="h-11 rounded-xl border-gm-border-soft bg-gm-bg-deep/60 text-gm-text" />
                  <Input type="number" min={0} value={numberInputValue(reviewMax)} onChange={(e) => setReviewMax(Number(e.target.value))} className="h-11 rounded-xl border-gm-border-soft bg-gm-bg-deep/60 text-gm-text" />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Rating Aralığı</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" min={0} max={5} step={0.1} value={numberInputValue(ratingMin)} onChange={(e) => setRatingMin(Number(e.target.value))} className="h-11 rounded-xl border-gm-border-soft bg-gm-bg-deep/60 text-gm-text" />
                  <Input type="number" min={0} max={5} step={0.1} value={numberInputValue(ratingMax)} onChange={(e) => setRatingMax(Number(e.target.value))} className="h-11 rounded-xl border-gm-border-soft bg-gm-bg-deep/60 text-gm-text" />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Fiyat Aralığı</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" min={0} value={numberInputValue(priceMin)} onChange={(e) => setPriceMin(Number(e.target.value))} className="h-11 rounded-xl border-gm-border-soft bg-gm-bg-deep/60 text-gm-text" />
                  <Input type="number" min={0} value={numberInputValue(priceMax)} onChange={(e) => setPriceMax(Number(e.target.value))} className="h-11 rounded-xl border-gm-border-soft bg-gm-bg-deep/60 text-gm-text" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={startState.isLoading}
                className="h-12 rounded-full bg-gm-gold px-8 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light"
              >
                <Play className="mr-2 size-4" />
                Risk Taraması Başlat
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {riskReport ? (
        <>
          <RiskScoreCard report={riskReport} />
          <ProfitCalculator />
          {latestDoneJobId && (
            <EvidenceTable
              jobId={latestDoneJobId}
              keyword={activeKeyword}
              marketplace={marketplace}
              onRescoreDone={() => { void refetchRisk(); }}
            />
          )}
        </>
      ) : (
        <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h2 className="font-serif text-2xl text-gm-text">5 Boyutlu Risk Raporu</h2>
              <p className="mt-2 text-sm leading-6 text-gm-muted">
                Bu keyword için henüz kayıtlı risk raporu yok. Tarama tamamlandıktan sonra composite skor ve boyut açıklamaları burada görünür.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchRisk()}
              disabled={isRiskFetching}
              className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface"
            >
              <RefreshCw className={cn('mr-2 size-4', isRiskFetching && 'animate-spin')} />
              Raporu Kontrol Et
            </Button>
          </CardContent>
        </Card>
      )}

      <SavedSearchesPanel
        currentKeyword={activeKeyword}
        currentMarketplace={marketplace}
        onJobStarted={() => setPolling(true)}
      />

      <MultiKeywordPanel />

      <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl text-gm-text">Arama Geçmişi</h2>
              {polling && (
                <Badge variant="outline" className="rounded-full border-gm-warning/30 bg-gm-warning/10 text-gm-warning text-[9px] font-bold uppercase tracking-widest animate-pulse">
                  <RefreshCw className="mr-1 size-3 animate-spin" />
                  İşleniyor
                </Badge>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">{jobs?.length ?? 0} Job</span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4">
                  <Skeleton className="h-7 w-80 bg-gm-surface/30" />
                </div>
              ))
            ) : jobs?.length ? (
              jobs.map((job) => {
                const params = paramsOf(job);
                const report = reportForJob(job, riskReport);
                return (
                  <div key={job.id} className="grid gap-4 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {statusBadge(job)}
                        <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-bg-deep/40 text-[9px] font-bold uppercase tracking-widest text-gm-muted">
                          {String(params.marketplace ?? 'com')}
                        </Badge>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                          {new Date(job.created_at).toLocaleString('tr-TR')}
                        </span>
                        {report && (
                          <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', decisionBadgeClass(report.decision))}>
                            {decisionLabel(report.decision)}
                          </Badge>
                        )}
                      </div>
                      <div className="font-serif text-xl text-gm-text">{String(params.keyword ?? 'Amazon araması')}</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-gm-muted">
                        <span>Review {String(params.review_min ?? 50)}-{String(params.review_max ?? 500)}</span>
                        <span>Rating {String(params.rating_min ?? 4)}-{String(params.rating_max ?? 4.5)}</span>
                        <span>Aday {job.result_count}</span>
                        {report && <span>Composite {report.composite_score?.toFixed(1) ?? '—'}</span>}
                        {report && <span>Data {report.data_points}</span>}
                        {job.error_msg && <span className="text-gm-error">{job.error_msg}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {job.status === 'done' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadJobReport(job)}
                          className="rounded-full border-gm-warning/40 bg-gm-warning/10 text-gm-warning hover:bg-gm-warning/20 hover:text-gm-warning/80"
                        >
                          <RadarIcon className="mr-2 size-4" />
                          Risk Raporu
                        </Button>
                      )}
                      <Button asChild variant="outline" size="sm" className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface">
                        <Link href={`/admin/market/lead-machine/candidates?channel=amazon&job_id=${job.id}`}>
                          İncele
                          <ArrowRight className="ml-2 size-4" />
                        </Link>
                      </Button>
                      {job.status === 'done' && (
                        <Button asChild variant="ghost" size="sm" className="rounded-full text-gm-gold hover:bg-gm-gold/10 hover:text-gm-gold">
                          <Link href="/admin/market/lead-machine/candidates?channel=amazon">
                            <ExternalLink className="mr-2 size-4" />
                            Adaylar
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 py-16 text-center font-serif text-lg italic text-gm-muted">
                Henüz Amazon araması yok.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {compareRows.length > 0 ? (
        <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-serif text-2xl text-gm-text">Keyword Karşılaştırma</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-170 text-left text-sm">
                <thead className="text-[10px] uppercase tracking-[0.16em] text-gm-muted">
                  <tr className="border-b border-gm-border-soft">
                    <th className="py-3 pr-4 font-semibold">Keyword</th>
                    <th className="py-3 pr-4 font-semibold">Skor</th>
                    <th className="py-3 pr-4 font-semibold">Karar</th>
                    <th className="py-3 pr-4 font-semibold">Veri Noktası</th>
                    <th className="py-3 pr-4 font-semibold">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gm-border-soft/70">
                  {compareRows.map((row) => (
                    <tr key={row.jobId} className="text-gm-muted">
                      <td className="py-3 pr-4 text-gm-text">{row.keyword}</td>
                      <td className="py-3 pr-4 font-mono">{row.composite?.toFixed(1) ?? '—'}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', decisionBadgeClass(row.decision))}>
                          {row.decision}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 font-mono">{row.dataPoints}</td>
                      <td className="py-3 pr-4">{new Date(row.createdAt).toLocaleString('tr-TR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
