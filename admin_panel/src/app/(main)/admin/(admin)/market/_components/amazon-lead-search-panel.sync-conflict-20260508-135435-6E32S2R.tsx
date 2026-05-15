'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Play, RefreshCw, Search } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { RiskScoreCard } from './risk-score-card';

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
  if (decision === 'GUVENLI') return 'border-gm-success/30 bg-gm-success/10 text-gm-success';
  if (decision === 'DIKKATLI_OL') return 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning';
  if (decision === 'GIRME') return 'border-gm-error/30 bg-gm-error/10 text-gm-error';
  if (decision === 'MIXED_SIGNAL') return 'border-orange-300 bg-orange-100 text-orange-700';
  return 'border-gm-border-soft bg-gm-surface/20 text-gm-muted';
}

function decisionLabel(decision: string): string {
  if (decision === 'GUVENLI') return 'Güvenli';
  if (decision === 'DIKKATLI_OL') return 'Dikkatli Ol';
  if (decision === 'GIRME') return 'Girme';
  if (decision === 'MIXED_SIGNAL') return 'Karışık Sinyal';
  return 'Yetersiz Veri';
}

function reportForJob(job: LeadSearchJob, fallback: AmazonRiskReport | undefined): AmazonRiskReport | null {
  if (job.risk_report) return job.risk_report;
  if (!fallback) return null;
  const params = paramsOf(job);
  const keyword = String(params.keyword ?? '').trim().toLowerCase();
  if (keyword && keyword === fallback.keyword.trim().toLowerCase()) return fallback;
  return null;
}

export default function AmazonLeadSearchPanel() {
  const [keyword, setKeyword] = React.useState('car floor mats');
  const [marketplace, setMarketplace] = React.useState('com');
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
  const { data: riskReport, isFetching: isRiskFetching, refetch: refetchRisk } = useGetAmazonRiskScoreQuery({
    keyword: keyword.trim() || 'car floor mats',
    marketplace,
  });
  const [startAmazonScan, startState] = useStartAmazonScanMutation();

  const activeKeyword = keyword.trim() || 'car floor mats';
  const comparedJobs = React.useMemo(() => {
    return (jobs ?? [])
      .map((job) => ({ job, params: paramsOf(job), report: reportForJob(job, riskReport) }))
      .filter((item) => item.job.status === 'done' && item.report)
      .slice(0, 8);
  }, [jobs, riskReport]);

  React.useEffect(() => {
    if (!jobs) return;
    const hasActive = jobs.some((j) => j.status === 'pending' || j.status === 'running');
    setPolling(hasActive);
    const keywordDone = jobs.some((j) => {
      const params = paramsOf(j);
      return String(params.keyword ?? '') === activeKeyword && j.status === 'done';
    });
    if (keywordDone) refetchRisk();
  }, [jobs, activeKeyword, refetchRisk]);

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
                    placeholder="car floor mats"
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
        <RiskScoreCard report={riskReport} />
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

      {comparedJobs.length > 0 && (
        <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl text-gm-text">Keyword Karşılaştırma</h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                Son {comparedJobs.length} tamamlanan arama
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-[10px] uppercase tracking-[0.16em] text-gm-muted">
                  <tr className="border-b border-gm-border-soft">
                    <th className="py-3 pr-4 font-semibold">Keyword</th>
                    <th className="py-3 pr-4 font-semibold">Marketplace</th>
                    <th className="py-3 pr-4 font-semibold">Karar</th>
                    <th className="py-3 pr-4 font-semibold">Skor</th>
                    <th className="py-3 pr-4 font-semibold">Veri</th>
                    <th className="py-3 pr-4 font-semibold">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gm-border-soft/70">
                  {comparedJobs.map(({ job, params, report }) => report && (
                    <tr key={job.id} className="text-gm-muted">
                      <td className="py-3 pr-4 font-serif text-base text-gm-text">{String(params.keyword ?? report.keyword)}</td>
                      <td className="py-3 pr-4 font-mono">{String(params.marketplace ?? 'com')}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', decisionBadgeClass(report.decision))}>
                          {decisionLabel(report.decision)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 font-mono">{report.composite_score?.toFixed(1) ?? '—'}</td>
                      <td className="py-3 pr-4 font-mono">{report.data_points}</td>
                      <td className="py-3 pr-4">{new Date(job.created_at).toLocaleString('tr-TR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
