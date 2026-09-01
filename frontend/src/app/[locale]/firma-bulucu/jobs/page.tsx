'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, PlayCircle, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useJobPolling } from '@/hooks/useJobPolling';
import {
  useGetB2bLeadJobQuery,
  useGetCustomsLeadJobQuery,
  useGetFairLeadJobQuery,
  useGetAmazonLeadJobQuery,
  useDeleteLeadJobMutation,
  useListB2bLeadJobsQuery,
  useListCustomsLeadJobsQuery,
  useListFairLeadJobsQuery,
  useListAmazonLeadJobsQuery,
} from '@/integrations/rtk/hooks';
import type { LeadChannel, LeadSearchJob } from '@/integrations/shared/lead-machine.types';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { toast } from 'sonner';

const CHANNEL_LABELS: Record<string, string> = {
  b2b_directory: 'B2B',
  trade_fair: 'Fuar',
  customs: 'Gümrük',
  amazon: 'Amazon',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  running: 'Çalışıyor',
  done: 'Tamamlandı',
  failed: 'Hata',
};

function isActive(status: string | null | undefined) {
  return status === 'pending' || status === 'running';
}

function statusClass(status: string) {
  if (status === 'done') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'failed') return 'bg-rose-50 text-rose-700 ring-rose-200';
  if (status === 'running') return 'bg-blue-50 text-blue-700 ring-blue-200';
  return 'bg-amber-50 text-amber-700 ring-amber-200';
}

function statusIcon(status: string) {
  if (status === 'done') return <CheckCircle2 className="h-4 w-4" />;
  if (status === 'failed') return <AlertTriangle className="h-4 w-4" />;
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin" />;
  return <PlayCircle className="h-4 w-4" />;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('tr-TR') : '-';
}

function describeParams(params: Record<string, unknown>) {
  const parts = [
    params.search_query,
    params.fair_url,
    params.product_query,
    params.hs_prefix,
    params.country,
    params.buyer_country,
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
  return parts.length ? parts.slice(0, 3).join(' · ') : 'Parametre yok';
}

function B2bJobWatcher({ id, onSettled }: { id: string; onSettled: () => void }) {
  useJobPolling({ jobId: id, useJobQuery: useGetB2bLeadJobQuery, onDone: onSettled, onFailed: onSettled });
  return null;
}

function FairJobWatcher({ id, onSettled }: { id: string; onSettled: () => void }) {
  useJobPolling({ jobId: id, useJobQuery: useGetFairLeadJobQuery, onDone: onSettled, onFailed: onSettled });
  return null;
}

function CustomsJobWatcher({ id, onSettled }: { id: string; onSettled: () => void }) {
  useJobPolling({ jobId: id, useJobQuery: useGetCustomsLeadJobQuery, onDone: onSettled, onFailed: onSettled });
  return null;
}

function AmazonJobWatcher({ id, onSettled }: { id: string; onSettled: () => void }) {
  useJobPolling({ jobId: id, useJobQuery: useGetAmazonLeadJobQuery, onDone: onSettled, onFailed: onSettled });
  return null;
}

function JobWatcher({ job, onSettled }: { job: LeadSearchJob; onSettled: () => void }) {
  if (!isActive(job.status)) return null;
  if (job.channel === 'b2b_directory') return <B2bJobWatcher id={job.id} onSettled={onSettled} />;
  if (job.channel === 'trade_fair') return <FairJobWatcher id={job.id} onSettled={onSettled} />;
  if (job.channel === 'customs') return <CustomsJobWatcher id={job.id} onSettled={onSettled} />;
  if (job.channel === 'amazon') return <AmazonJobWatcher id={job.id} onSettled={onSettled} />;
  return null;
}

export default function FirmaBulucuJobsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale || 'tr';
  const [channel, setChannel] = React.useState<LeadChannel | 'all'>('all');
  const [deleteJob, deleteState] = useDeleteLeadJobMutation();
  const [jobToDelete, setJobToDelete] = React.useState<LeadSearchJob | null>(null);
  const b2b = useListB2bLeadJobsQuery(undefined, { pollingInterval: 10000 });
  const fair = useListFairLeadJobsQuery(undefined, { pollingInterval: 10000 });
  const customs = useListCustomsLeadJobsQuery(undefined, { pollingInterval: 10000 });
  const amazon = useListAmazonLeadJobsQuery(undefined, { pollingInterval: 10000 });

  const refetchAll = React.useCallback(() => {
    b2b.refetch();
    fair.refetch();
    customs.refetch();
    amazon.refetch();
  }, [b2b, fair, customs, amazon]);

  const jobs = React.useMemo(() => {
    const merged = [...(b2b.data ?? []), ...(fair.data ?? []), ...(customs.data ?? []), ...(amazon.data ?? [])];
    return merged
      .filter((job) => channel === 'all' || job.channel === channel)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [b2b.data, fair.data, customs.data, amazon.data, channel]);

  const isLoading = b2b.isLoading || fair.isLoading || customs.isLoading || amazon.isLoading;
  const isError = b2b.isError || fair.isError || customs.isError || amazon.isError;
  const isFetching = b2b.isFetching || fair.isFetching || customs.isFetching || amazon.isFetching;
  const activeCount = jobs.filter((job) => isActive(job.status)).length;

  const removeJob = async () => {
    if (!jobToDelete) return;
    try {
      await deleteJob(jobToDelete.id).unwrap();
      toast.success('Tarama işi ve bağlı sonuçları silindi');
      setJobToDelete(null);
      refetchAll();
    } catch (error) {
      const status = (error as { status?: number })?.status;
      toast.error(status === 409 ? 'Çalışan tarama işi silinemez. Tamamlanmasını bekleyin.' : 'Tarama işi silinemedi');
      throw error;
    }
  };

  return (
    <div className="space-y-5">
      {jobs.map((job) => <JobWatcher key={`${job.channel}:${job.id}`} job={job} onSettled={refetchAll} />)}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Tarama İşleri</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">B2B, fuar, gümrük ve Amazon taramalarının durumunu izleyin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${locale}/firma-bulucu/tarama`} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white">
            <Search className="h-4 w-4" /> Yeni Tarama
          </Link>
          <button onClick={refetchAll} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155]">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Yenile
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-[#e2e8f0] bg-white p-4 md:grid-cols-[1fr_auto] md:items-end">
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-[#64748b]">Kaynak</span>
          <select value={channel} onChange={(event) => setChannel(event.target.value as LeadChannel | 'all')} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]">
            <option value="all">Tüm kaynaklar</option>
            <option value="b2b_directory">B2B</option>
            <option value="trade_fair">Fuar</option>
            <option value="customs">Gümrük</option>
            <option value="amazon">Amazon</option>
          </select>
        </label>
        <div className="rounded-md bg-[#f8fafc] px-3 py-2 text-[12px] font-semibold text-[#475569]">
          {jobs.length} iş · {activeCount} aktif
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white py-16"><Loader2 className="h-6 w-6 animate-spin text-[#1e40af]" /></div>
      ) : isError ? (
        <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-12 text-center text-[13px] text-[#64748b]">Tarama işleri alınamadı.</div>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-12 text-center text-[13px] text-[#64748b]">Henüz tarama işi yok.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
          <div className="grid grid-cols-[1.1fr_1.4fr_.8fr_.8fr_.9fr_auto] gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[12px] font-bold text-[#64748b] max-lg:hidden">
            <span>Kaynak</span>
            <span>Parametre</span>
            <span>Durum</span>
            <span>Sonuç</span>
            <span>Başlangıç</span>
            <span>Aksiyon</span>
          </div>
          {jobs.map((job) => (
            <div key={job.id} className="grid gap-3 border-b border-[#e2e8f0] px-4 py-4 last:border-b-0 lg:grid-cols-[1.1fr_1.4fr_.8fr_.8fr_.9fr_auto] lg:items-center">
              <div>
                <div className="font-semibold text-[#0f172a]">{CHANNEL_LABELS[job.channel] ?? job.channel}</div>
                <div className="mt-1 truncate text-[12px] text-[#94a3b8]">{job.id}</div>
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-[#334155]">{describeParams(job.params)}</div>
                {job.error_msg && <div className="mt-1 truncate text-[12px] text-rose-600">{job.error_msg}</div>}
              </div>
              <div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ring-1 ${statusClass(job.status)}`}>
                  {statusIcon(job.status)} {STATUS_LABELS[job.status] ?? job.status}
                </span>
              </div>
              <div className="text-[13px] font-semibold text-[#334155]">{job.result_count ?? 0}</div>
              <div className="text-[12px] text-[#64748b]">
                <div>{formatDate(job.started_at ?? job.created_at)}</div>
                {job.finished_at && <div className="mt-1">Bitiş: {formatDate(job.finished_at)}</div>}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/${locale}/firma-bulucu/adaylar?channel=${job.channel}&job_id=${job.id}`} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#1e40af] px-2.5 text-[12px] font-semibold text-[#1e40af]">
                  <ExternalLink className="h-3.5 w-3.5" /> Adaylar
                </Link>
                <button type="button" disabled={isActive(job.status) || deleteState.isLoading} onClick={() => setJobToDelete(job)} title={isActive(job.status) ? 'Aktif işler silinemez' : 'Tarama işini sil'} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`${CHANNEL_LABELS[job.channel] ?? job.channel} taramasını sil`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDeleteDialog
        open={Boolean(jobToDelete)}
        onOpenChange={(open) => { if (!open) setJobToDelete(null); }}
        isDeleting={deleteState.isLoading}
        notify={false}
        title="Tarama işini sil"
        description="Tarama işi, bu işe bağlı adaylar ve analiz sonuçları kalıcı olarak silinecek. Bu işlem geri alınamaz."
        onConfirm={removeJob}
      />
    </div>
  );
}
