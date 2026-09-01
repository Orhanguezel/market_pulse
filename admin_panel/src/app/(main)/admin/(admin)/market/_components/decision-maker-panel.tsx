'use client';

import * as React from 'react';
import { Download, ExternalLink, LinkIcon, Play, RefreshCw, Search, UserRoundCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetDecisionMakerPresetsQuery,
  useListDecisionMakerCompanyPoolQuery,
  useListDecisionMakerJobsQuery,
  useListDecisionMakerResultsQuery,
  usePromoteDecisionMakersToCandidatesMutation,
  usePromoteDecisionMakersToCrmMutation,
  useReviewDecisionMakerMutation,
  useStartDecisionMakerJobMutation,
  useUpdateCompanyPoolStatusMutation,
  type CompanyQualityStatus,
  type DecisionMakerConfidence,
  type DecisionMakerReviewStatus,
  type LeadSearchJob,
} from '@/integrations/hooks';
import { BASE_URL } from '@/integrations/apiBase';
import { getSelectedTenantKey } from '@/integrations/core/tenant';
import { tokenStore } from '@/integrations/core/token';
import { cn } from '@/lib/utils';

const DEFAULT_CITIES = ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa', 'Kocaeli', 'Konya', 'Adana'];

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'border-gm-muted/30 bg-gm-surface/20 text-gm-muted' },
  running: { label: 'Çalışıyor', cls: 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning' },
  done: { label: 'Tamamlandı', cls: 'border-gm-success/30 bg-gm-success/10 text-gm-success' },
  failed: { label: 'Hata', cls: 'border-gm-error/30 bg-gm-error/10 text-gm-error' },
};

const CONFIDENCE_CONFIG: Record<DecisionMakerConfidence, { label: string; cls: string }> = {
  A: { label: 'A', cls: 'border-gm-success/30 bg-gm-success/10 text-gm-success' },
  B: { label: 'B', cls: 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning' },
  C: { label: 'C', cls: 'border-gm-border-soft bg-gm-surface/20 text-gm-muted' },
};

const QUALITY_CONFIG: Record<CompanyQualityStatus, { label: string; cls: string }> = {
  qualified: { label: 'Qualified', cls: 'border-gm-success/30 bg-gm-success/10 text-gm-success' },
  possible: { label: 'Possible', cls: 'border-gm-gold/30 bg-gm-gold/10 text-gm-gold' },
  manual_review: { label: 'Manual', cls: 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning' },
  excluded: { label: 'Excluded', cls: 'border-gm-error/30 bg-gm-error/10 text-gm-error' },
};

const REVIEW_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'border-gm-border-soft bg-gm-surface/20 text-gm-muted' },
  verified: { label: 'Doğrulandı', cls: 'border-gm-success/30 bg-gm-success/10 text-gm-success' },
  rejected: { label: 'Reddedildi', cls: 'border-gm-error/30 bg-gm-error/10 text-gm-error' },
  manual_review: { label: 'Manuel', cls: 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning' },
};

function reviewBadge(value?: string) {
  const cfg = REVIEW_CONFIG[value ?? 'pending'] ?? REVIEW_CONFIG.pending;
  return <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', cfg.cls)}>{cfg.label}</Badge>;
}

const ACTION_BTN = 'inline-flex h-7 items-center rounded-full border px-3 text-[9px] font-bold uppercase tracking-widest transition-colors';

function statusBadge(job: LeadSearchJob) {
  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
  return <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', cfg.cls)}>{cfg.label}</Badge>;
}

function confidenceBadge(value: DecisionMakerConfidence) {
  const cfg = CONFIDENCE_CONFIG[value];
  return <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', cfg.cls)}>{cfg.label}</Badge>;
}

function qualityBadge(value: CompanyQualityStatus) {
  const cfg = QUALITY_CONFIG[value];
  return <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', cfg.cls)}>{cfg.label}</Badge>;
}

function paramsOf(job: LeadSearchJob) {
  return job.params ?? {};
}

function exportUrl(jobId: string | undefined, confidence: string, format: 'csv' | 'xlsx') {
  const params = new URLSearchParams();
  if (jobId) params.set('job_id', jobId);
  if (confidence !== 'all') params.set('confidence', confidence);
  const qs = params.toString();
  return `${BASE_URL}/admin/lead-machine/decision-makers/export.${format}${qs ? `?${qs}` : ''}`;
}

export default function DecisionMakerPanel() {
  const { data: presets } = useGetDecisionMakerPresetsQuery();
  const { data: jobs = [], isFetching, refetch } = useListDecisionMakerJobsQuery(undefined, { pollingInterval: 10000 });
  const [startJob, startState] = useStartDecisionMakerJobMutation();
  const [promoteToCandidates, promoteState] = usePromoteDecisionMakersToCandidatesMutation();
  const [promoteToCrm, promoteCrmState] = usePromoteDecisionMakersToCrmMutation();
  const [reviewDecisionMaker] = useReviewDecisionMakerMutation();
  const [updateCompanyPoolStatus] = useUpdateCompanyPoolStatusMutation();

  const [sector, setSector] = React.useState('fitness');
  const [cities, setCities] = React.useState<string[]>(['Istanbul', 'Ankara', 'Izmir']);
  const [targetCount, setTargetCount] = React.useState(50);
  const [perCityLimit, setPerCityLimit] = React.useState(5);
  const [selectedJobId, setSelectedJobId] = React.useState<string | undefined>();
  const [confidence, setConfidence] = React.useState<DecisionMakerConfidence | 'all'>('all');
  const [includeExcluded, setIncludeExcluded] = React.useState(false);
  const [poolStatus, setPoolStatus] = React.useState<CompanyQualityStatus | 'all'>('all');
  const [apolloFallback, setApolloFallback] = React.useState(false);

  const businessTypes = presets?.business_types?.[sector] ?? [];
  const latestJobId = jobs[0]?.id;
  const activeJobId = selectedJobId ?? latestJobId;
  const { data: results, isFetching: isResultsFetching, refetch: refetchResults } = useListDecisionMakerResultsQuery({
    job_id: activeJobId,
    confidence,
    limit: 500,
  }, { skip: !activeJobId, pollingInterval: jobs.some((j) => j.id === activeJobId && (j.status === 'pending' || j.status === 'running')) ? 10000 : 0 });
  const { data: companyPool, isFetching: isPoolFetching, refetch: refetchPool } = useListDecisionMakerCompanyPoolQuery({
    job_id: activeJobId,
    status: poolStatus,
    include_excluded: includeExcluded,
    limit: 500,
  }, { skip: !activeJobId, pollingInterval: jobs.some((j) => j.id === activeJobId && (j.status === 'pending' || j.status === 'running')) ? 10000 : 0 });

  React.useEffect(() => {
    if (!selectedJobId && latestJobId) setSelectedJobId(latestJobId);
  }, [latestJobId, selectedJobId]);

  const toggleCity = (city: string) => {
    setCities((prev) => prev.includes(city) ? prev.filter((item) => item !== city) : [...prev, city]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cities.length) {
      toast.error('En az bir şehir seçin');
      return;
    }
    try {
      const job = await startJob({
        sector,
        businessTypes,
        cities,
        country: 'TR',
        targetCount,
        perCityLimit,
        excludeKeywords: presets?.default_exclude_keywords,
        apolloFallback,
      }).unwrap();
      setSelectedJobId(job.id);
      toast.success('Karar verici araması başladı');
    } catch {
      toast.error('Karar verici araması başlatılamadı');
    }
  };

  const handleDownload = async (format: 'csv' | 'xlsx' = 'csv') => {
    if (!activeJobId) return;
    try {
      const token = tokenStore.get();
      const tenantKey = getSelectedTenantKey();
      const res = await fetch(exportUrl(activeJobId, confidence, format), {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tenantKey ? { 'X-Tenant': tenantKey } : {}),
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('export_failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `decision-makers-${activeJobId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(`${format.toUpperCase()} indirilemedi`);
    }
  };

  const handlePromote = async () => {
    if (!activeJobId || !rows.length) return;
    try {
      const result = await promoteToCandidates({
        job_id: activeJobId,
        confidence,
        limit: 500,
      }).unwrap();
      toast.success(`${result.created} aday Lead Candidate listesine aktarıldı`);
    } catch {
      toast.error('Lead Candidate aktarımı başarısız');
    }
  };

  const handlePromoteCrm = async () => {
    if (!activeJobId || !rows.length) return;
    try {
      const result = await promoteToCrm({
        job_id: activeJobId,
        confidence,
        limit: 500,
      }).unwrap();
      toast.success(`${result.accounts} hesap ve ${result.contacts} kontak CRM'e aktarıldı`);
    } catch {
      toast.error('CRM aktarımı başarısız');
    }
  };

  const handleReview = async (id: string | undefined, status: DecisionMakerReviewStatus) => {
    if (!id) {
      toast.error('Satır kimliği yok (yeniden arama gerekebilir)');
      return;
    }
    try {
      await reviewDecisionMaker({ id, status }).unwrap();
      toast.success(status === 'rejected' ? 'Karar verici reddedildi' : status === 'verified' ? 'Manuel doğrulandı' : 'Manuel kontrole alındı');
      refetchResults();
    } catch {
      toast.error('Durum güncellenemedi');
    }
  };

  const handlePoolStatus = async (id: string | undefined, status: CompanyQualityStatus) => {
    if (!id) {
      toast.error('Satır kimliği yok (yeniden arama gerekebilir)');
      return;
    }
    try {
      await updateCompanyPoolStatus({ id, status }).unwrap();
      toast.success(status === 'excluded' ? 'Şirket hariç tutuldu' : status === 'qualified' ? 'Qualified olarak işaretlendi' : 'Manuel kontrole alındı');
      refetchPool();
    } catch {
      toast.error('Durum güncellenemedi');
    }
  };

  const rows = results?.rows ?? [];
  const poolRows = companyPool?.rows ?? [];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Lead Machine</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Karar Verici Bulma</h1>
          <p className="max-w-2xl font-serif text-sm italic text-gm-muted">
            Sektör ve şehirlerden işletme havuzu çıkarır, LinkedIn doğrulamalı karar vericileri A/B/C kaliteyle listeler.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetch(); refetchResults(); refetchPool(); }}
          disabled={isFetching || isResultsFetching || isPoolFetching}
          className="h-12 rounded-full border-gm-border-soft bg-gm-surface/20 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface"
        >
          <RefreshCw className={cn('mr-2 size-4', (isFetching || isResultsFetching || isPoolFetching) && 'animate-spin')} />
          Yenile
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-5 lg:grid-cols-[260px_1fr_140px_140px_auto] lg:items-end">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Sektör</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                    {(presets?.sectors ?? ['fitness']).map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">İşletme Tipleri</Label>
                <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-2xl border border-gm-border-soft bg-gm-surface/20 px-3 py-2">
                  {businessTypes.map((item) => (
                    <Badge key={item} variant="outline" className="rounded-full border-gm-border-soft bg-gm-bg-deep/40 text-[10px] text-gm-muted">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Hedef</Label>
                <Input type="number" min={10} max={200} value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text" />
              </div>

              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Şehir Başı</Label>
                <Input type="number" min={1} max={10} value={perCityLimit}
                  onChange={(e) => setPerCityLimit(Number(e.target.value))}
                  className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text" />
              </div>

              <Button
                type="submit"
                disabled={startState.isLoading || !cities.length}
                className="h-12 rounded-full bg-gm-gold px-8 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light"
              >
                <Play className="mr-2 size-4" />
                Başlat
              </Button>
            </div>

            <div className="space-y-3">
              <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Şehirler</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    className={cn(
                      'inline-flex h-9 items-center rounded-full border px-4 text-xs font-medium transition-colors',
                      cities.includes(city)
                        ? 'border-gm-gold bg-gm-gold text-black'
                        : 'border-gm-border-soft bg-gm-surface/20 text-gm-muted hover:text-gm-text',
                    )}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <Label htmlFor="apollo-fallback" className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                  Kredi Koruması
                </Label>
                <p className="mt-1 text-xs text-gm-muted">
                  Araştırma modu Google Places + Serper ile çalışır. Apollo fallback kapalıysa Apollo kredisi harcanmaz.
                </p>
              </div>
              <label htmlFor="apollo-fallback" className="flex cursor-pointer items-center gap-3 text-xs font-bold uppercase tracking-widest text-gm-text">
                <Checkbox
                  id="apollo-fallback"
                  checked={apolloFallback}
                  onCheckedChange={(value) => setApolloFallback(value === true)}
                />
                Ücretli Apollo fallback
              </label>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-gm-text">Joblar</h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">{jobs.length}</span>
            </div>
            <div className="space-y-3">
              {jobs.length ? jobs.map((job) => {
                const params = paramsOf(job);
                const active = activeJobId === job.id;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJobId(job.id)}
                    className={cn(
                      'w-full rounded-2xl border p-4 text-left transition-colors',
                      active ? 'border-gm-gold bg-gm-gold/10' : 'border-gm-border-soft bg-gm-surface/10 hover:border-gm-gold/40',
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {statusBadge(job)}
                      <span className="text-[10px] font-mono text-gm-muted">{job.result_count} kayıt</span>
                    </div>
                    <div className="font-serif text-base text-gm-text">{String(params.sector ?? 'decision-maker')}</div>
                    <div className="mt-1 line-clamp-1 text-xs text-gm-muted">
                      {Array.isArray(params.cities) ? params.cities.join(', ') : 'Şehir yok'}
                    </div>
                  </button>
                );
              }) : (
                <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 py-12 text-center">
                  <UserRoundCheck className="mx-auto mb-3 size-10 text-gm-gold/40" />
                  <div className="font-serif text-sm italic text-gm-muted">Henüz arama yok.</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-serif text-2xl text-gm-text">Şirket Havuzu</h2>
                <p className="mt-1 text-xs text-gm-muted">
                  {companyPool ? `${companyPool.stats.total} şirket · ${companyPool.stats.qualified} qualified · ${companyPool.stats.possible} possible · ${companyPool.stats.excluded} excluded` : 'Bir job seçin.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={poolStatus} onValueChange={(value) => setPoolStatus(value as CompanyQualityStatus | 'all')}>
                  <SelectTrigger className="h-10 w-40 rounded-full border-gm-border-soft bg-gm-surface/40 text-gm-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                    <SelectItem value="all">Tüm şirketler</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="possible">Possible</SelectItem>
                    <SelectItem value="manual_review">Manual</SelectItem>
                    <SelectItem value="excluded">Excluded</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIncludeExcluded((value) => !value)}
                  className={cn(
                    'h-10 rounded-full border-gm-border-soft px-5 text-[10px] font-bold uppercase tracking-widest',
                    includeExcluded ? 'bg-gm-error/10 text-gm-error' : 'bg-gm-surface/20 text-gm-muted',
                  )}
                >
                  Excluded {includeExcluded ? 'Açık' : 'Gizli'}
                </Button>
              </div>
            </div>

            {poolRows.length ? (
              <div className="overflow-hidden rounded-2xl border border-gm-border-soft">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="border-b border-gm-border-soft bg-gm-surface/20 text-[10px] uppercase tracking-[0.18em] text-gm-muted">
                      <tr>
                        <th className="px-4 py-3">Firma</th>
                        <th className="px-4 py-3">Şehir</th>
                        <th className="px-4 py-3">Tür</th>
                        <th className="px-4 py-3">Skor</th>
                        <th className="px-4 py-3">Durum</th>
                        <th className="px-4 py-3">Kaynak</th>
                        <th className="px-4 py-3">Not</th>
                        <th className="px-4 py-3 text-right">Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gm-border-soft">
                      {poolRows.map((row) => (
                        <tr key={`${row.company_name}-${row.city}`} className="bg-gm-bg-deep/20 text-gm-text">
                          <td className="px-4 py-3">
                            <div className="font-serif text-base">{row.company_name}</div>
                            <div className="mt-1 max-w-[260px] truncate text-xs text-gm-muted">{row.address ?? 'Adres yok'}</div>
                          </td>
                          <td className="px-4 py-3 text-gm-muted">{row.city ?? '—'}</td>
                          <td className="px-4 py-3 text-gm-muted">{row.business_type ?? '—'}</td>
                          <td className="px-4 py-3 font-mono text-gm-text">{row.quality_score}</td>
                          <td className="px-4 py-3">{qualityBadge(row.quality_status)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {row.website && (
                                <a href={row.website} target="_blank" rel="noreferrer" className="inline-flex size-8 items-center justify-center rounded-full border border-gm-border-soft text-gm-muted hover:text-gm-text" title="Website">
                                  <ExternalLink className="size-4" />
                                </a>
                              )}
                              {row.google_maps_url && (
                                <a href={row.google_maps_url} target="_blank" rel="noreferrer" className="inline-flex size-8 items-center justify-center rounded-full border border-gm-border-soft text-gm-gold hover:bg-gm-gold hover:text-black" title="Google Maps">
                                  <LinkIcon className="size-4" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="max-w-[220px] px-4 py-3 text-xs text-gm-muted">{row.exclude_reason ?? 'Uygun görünüyor'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button type="button" disabled={!row.id || row.quality_status === 'qualified'} onClick={() => handlePoolStatus(row.id, 'qualified')} className={cn(ACTION_BTN, 'border-gm-success/30 text-gm-success hover:bg-gm-success/10 disabled:opacity-30')} title="Qualified işaretle">Onayla</button>
                              <button type="button" disabled={!row.id || row.quality_status === 'manual_review'} onClick={() => handlePoolStatus(row.id, 'manual_review')} className={cn(ACTION_BTN, 'border-gm-warning/30 text-gm-warning hover:bg-gm-warning/10 disabled:opacity-30')} title="Manuel kontrol">Manuel</button>
                              <button type="button" disabled={!row.id || row.quality_status === 'excluded'} onClick={() => handlePoolStatus(row.id, 'excluded')} className={cn(ACTION_BTN, 'border-gm-error/30 text-gm-error hover:bg-gm-error/10 disabled:opacity-30')} title="Hariç tut">Reddet</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 py-10 text-center">
                <Search className="mx-auto mb-3 size-10 text-gm-gold/40" />
                <div className="font-serif text-sm italic text-gm-muted">Şirket havuzu henüz oluşmadı.</div>
              </div>
            )}

            <div className="border-t border-gm-border-soft" />

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-serif text-2xl text-gm-text">Karar Vericiler</h2>
                <p className="mt-1 text-xs text-gm-muted">
                  {results ? `${results.stats.companies} şirket · ${results.stats.withDecisionMaker} karar verici` : 'Bir job seçin.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={confidence} onValueChange={(v) => setConfidence(v as DecisionMakerConfidence | 'all')}>
                  <SelectTrigger className="h-10 w-32 rounded-full border-gm-border-soft bg-gm-surface/40 text-gm-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                    <SelectItem value="all">Tüm skorlar</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  disabled={!activeJobId || !rows.length}
                  onClick={() => handleDownload('csv')}
                  className="h-10 rounded-full bg-gm-gold px-5 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light"
                >
                  <Download className="mr-2 size-4" />
                  CSV
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!activeJobId || !rows.length}
                  onClick={() => handleDownload('xlsx')}
                  className="h-10 rounded-full bg-gm-gold px-5 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light"
                >
                  XLSX
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!activeJobId || !rows.length || promoteState.isLoading}
                  onClick={handlePromote}
                  className="h-10 rounded-full border-gm-border-soft bg-gm-surface/20 px-5 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface"
                >
                  Lead Candidate'a Aktar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!activeJobId || !rows.length || promoteCrmState.isLoading}
                  onClick={handlePromoteCrm}
                  className="h-10 rounded-full border-gm-border-soft bg-gm-surface/20 px-5 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface"
                >
                  CRM'e Aktar
                </Button>
              </div>
            </div>

            {rows.length ? (
              <div className="overflow-hidden rounded-2xl border border-gm-border-soft">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="border-b border-gm-border-soft bg-gm-surface/20 text-[10px] uppercase tracking-[0.18em] text-gm-muted">
                      <tr>
                        <th className="px-4 py-3">Firma</th>
                        <th className="px-4 py-3">Şehir</th>
                        <th className="px-4 py-3">Karar Verici</th>
                        <th className="px-4 py-3">Unvan</th>
                        <th className="px-4 py-3">Skor</th>
                        <th className="px-4 py-3">Durum</th>
                        <th className="px-4 py-3">Kaynak</th>
                        <th className="px-4 py-3 text-right">Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gm-border-soft">
                      {rows.map((row) => (
                        <tr key={`${row.company_name}-${row.city}`} className="bg-gm-bg-deep/20 text-gm-text">
                          <td className="px-4 py-3">
                            <div className="font-serif text-base">{row.company_name}</div>
                            <div className="mt-1 text-xs text-gm-muted">{row.business_type ?? 'Tür yok'}</div>
                          </td>
                          <td className="px-4 py-3 text-gm-muted">{row.city ?? '—'}</td>
                          <td className="px-4 py-3">{row.decision_maker_name ?? 'Manuel araştırma'}</td>
                          <td className="px-4 py-3 text-gm-muted">{row.title ?? '—'}</td>
                          <td className="px-4 py-3">{confidenceBadge(row.confidence_score)}</td>
                          <td className="px-4 py-3">{reviewBadge(row.review_status)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {row.linkedin_profile_url && (
                                <a href={row.linkedin_profile_url} target="_blank" rel="noreferrer" className="inline-flex size-8 items-center justify-center rounded-full border border-gm-border-soft text-gm-gold hover:bg-gm-gold hover:text-black" title="LinkedIn">
                                  <LinkIcon className="size-4" />
                                </a>
                              )}
                              {row.company_website && (
                                <a href={row.company_website} target="_blank" rel="noreferrer" className="inline-flex size-8 items-center justify-center rounded-full border border-gm-border-soft text-gm-muted hover:text-gm-text" title="Website">
                                  <ExternalLink className="size-4" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button type="button" disabled={!row.id || row.review_status === 'verified'} onClick={() => handleReview(row.id, 'verified')} className={cn(ACTION_BTN, 'border-gm-success/30 text-gm-success hover:bg-gm-success/10 disabled:opacity-30')} title="Manuel doğrula">Doğrula</button>
                              <button type="button" disabled={!row.id || row.review_status === 'manual_review'} onClick={() => handleReview(row.id, 'manual_review')} className={cn(ACTION_BTN, 'border-gm-warning/30 text-gm-warning hover:bg-gm-warning/10 disabled:opacity-30')} title="Manuel araştırma kuyruğu">Manuel</button>
                              <button type="button" disabled={!row.id || row.review_status === 'rejected'} onClick={() => handleReview(row.id, 'rejected')} className={cn(ACTION_BTN, 'border-gm-error/30 text-gm-error hover:bg-gm-error/10 disabled:opacity-30')} title="Reddet (export dışı)">Reddet</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 py-16 text-center">
                <Search className="mx-auto mb-4 size-12 text-gm-gold/40" />
                <div className="font-serif text-lg italic text-gm-muted">Sonuç bulunamadı.</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
