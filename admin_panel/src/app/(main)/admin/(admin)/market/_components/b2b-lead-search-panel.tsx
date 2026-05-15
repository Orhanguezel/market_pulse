'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, MapPin, Play, RefreshCw, Search } from 'lucide-react';
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
  useListB2bJobsQuery,
  useListIcpProfilesQuery,
  useStartB2bJobMutation,
  type LeadSearchJob,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

const SOURCES = [
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'europages', label: 'Europages' },
  { value: 'tobb', label: 'TOBB' },
];

const COUNTRIES = ['DE', 'AT', 'NL', 'PL', 'CZ', 'FR', 'IT', 'ES', 'TR'];

const JOB_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'border-gm-muted/30 bg-gm-surface/20 text-gm-muted' },
  running: { label: 'Çalışıyor', cls: 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning' },
  done: { label: 'Tamamlandı', cls: 'border-gm-success/30 bg-gm-success/10 text-gm-success' },
  failed: { label: 'Hata', cls: 'border-gm-error/30 bg-gm-error/10 text-gm-error' },
};

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

export default function B2bLeadSearchPanel() {
  const { data: icps, isLoading: isIcpLoading } = useListIcpProfilesQuery();
  const { data: jobs, isLoading, isFetching, refetch } = useListB2bJobsQuery();
  const [startB2bJob, startState] = useStartB2bJobMutation();

  const [icpId, setIcpId] = React.useState('');
  const [source, setSource] = React.useState('google_maps');
  const [searchQuery, setSearchQuery] = React.useState('automotive accessories distributor');
  const [country, setCountry] = React.useState('DE');
  const [limit, setLimit] = React.useState(25);

  React.useEffect(() => {
    if (!icpId && icps?.[0]?.id) setIcpId(icps[0].id);
  }, [icpId, icps]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!icpId) {
      toast.error('ICP seçimi gerekli');
      return;
    }
    try {
      await startB2bJob({
        icp_id: icpId,
        source,
        search_query: searchQuery.trim() || undefined,
        country,
        limit,
      }).unwrap();
      toast.success('B2B araması başladı');
    } catch {
      toast.error('B2B araması başlatılamadı');
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
          <h1 className="font-serif text-4xl text-gm-text">B2B Arama</h1>
          <p className="max-w-xl font-serif text-sm italic text-gm-muted">
            ICP profilini kullanarak dizinlerden ve Google Maps’ten aday firmalar çıkarın.
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
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_220px_160px]">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">ICP Profili</Label>
                <Select value={icpId} onValueChange={setIcpId} disabled={isIcpLoading}>
                  <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                    <SelectValue placeholder="ICP seç" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                    {(icps ?? []).map((icp) => (
                      <SelectItem key={icp.id} value={icp.id}>
                        {icp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Kaynak</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                    {SOURCES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Ülke</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                    {COUNTRIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_160px_auto] lg:items-end">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Arama Terimi</Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted/60" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="automotive accessories distributor"
                    className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 pl-12 text-gm-text placeholder:text-gm-muted/70"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Limit</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text"
                />
              </div>

              <Button
                type="submit"
                disabled={startState.isLoading || !icpId}
                className="h-12 rounded-full bg-gm-gold px-8 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light"
              >
                <Play className="mr-2 size-4" />
                Tara
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl text-gm-text">B2B Job Listesi</h2>
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
                const params = job.params ?? {};
                return (
                  <div key={job.id} className="grid gap-4 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {statusBadge(job)}
                        <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-bg-deep/40 text-[9px] font-bold uppercase tracking-widest text-gm-muted">
                          {String(params.source ?? 'google_maps')}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                          <MapPin className="size-3" />
                          {String(params.country ?? 'DE')}
                        </span>
                      </div>
                      <div className="font-serif text-xl text-gm-text">{String(params.search_query ?? 'B2B araması')}</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-gm-muted">
                        <span>Limit {String(params.limit ?? 25)}</span>
                        <span>Aday {job.result_count}</span>
                        {job.error_msg && <span className="text-gm-error">{job.error_msg}</span>}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface">
                      <Link href={`/admin/market/lead-machine/candidates?channel=b2b_directory&job_id=${job.id}`}>
                        İncele
                        <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 py-16 text-center">
                <Building2 className="mx-auto mb-4 size-12 text-gm-gold/40" />
                <div className="font-serif text-lg italic text-gm-muted">Henüz B2B araması yok.</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
