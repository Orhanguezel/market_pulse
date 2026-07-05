'use client';

import * as React from 'react';
import {
  CalendarDays,
  Check,
  Download,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Star,
  ThumbsDown,
  UserPlus,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useApproveLeadCandidateToLeadMutation,
  useEnrichLeadCandidateMutation,
  useGenerateFairBriefingBulkPdfMutation,
  useLazyGetFairBriefingCandidatePdfQuery,
  useLazyGetFairBriefingDayPdfQuery,
  useListFairLeadJobsQuery,
  useListLeadCandidatesQuery,
  useReviewLeadCandidateMutation,
} from '@/integrations/rtk/hooks';
import type { LeadCandidate, LeadCandidateStatus } from '@/integrations/shared/lead-machine.types';

const STATUSES: Array<{ value: '' | LeadCandidateStatus; label: string }> = [
  { value: '', label: 'Tüm adaylar' },
  { value: 'pending', label: 'Bekleyen' },
  { value: 'favorite', label: 'Favori' },
  { value: 'approved', label: 'Onaylı' },
  { value: 'rejected', label: 'Red' },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function score(candidate: LeadCandidate) {
  const value = typeof candidate.lead_score === 'number' ? candidate.lead_score : Number(candidate.lead_score ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function fairInfo(candidate: LeadCandidate) {
  const raw = asRecord(candidate.raw_data);
  return asRecord(raw.fair_info);
}

function boothLabel(candidate: LeadCandidate) {
  const info = fairInfo(candidate);
  return text(info.booth_number) ?? text(info.booth) ?? text(info.stand) ?? '-';
}

function hallLabel(candidate: LeadCandidate) {
  const info = fairInfo(candidate);
  return text(info.hall) ?? text(info.fair_hall) ?? '-';
}

function fairDate(candidate: LeadCandidate) {
  const info = fairInfo(candidate);
  return text(info.fair_date) ?? candidate.created_at.slice(0, 10);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

export default function FairDayPage() {
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<'' | LeadCandidateStatus>('');
  const [jobId, setJobId] = React.useState('');
  const [date, setDate] = React.useState(today);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());

  const { data = [], isLoading, isError, refetch } = useListLeadCandidatesQuery({
    channel: 'trade_fair',
    status: status || undefined,
    job_id: jobId || undefined,
    limit: 150,
  });
  const { data: fairJobs = [] } = useListFairLeadJobsQuery();
  const [reviewCandidate, reviewState] = useReviewLeadCandidateMutation();
  const [approveToLead, approveState] = useApproveLeadCandidateToLeadMutation();
  const [enrichCandidate, enrichState] = useEnrichLeadCandidateMutation();
  const [getCandidatePdf, candidatePdfState] = useLazyGetFairBriefingCandidatePdfQuery();
  const [getDayPdf, dayPdfState] = useLazyGetFairBriefingDayPdfQuery();
  const [generateBulkPdf, bulkPdfState] = useGenerateFairBriefingBulkPdfMutation();

  const busy = reviewState.isLoading || approveState.isLoading || enrichState.isLoading || candidatePdfState.isFetching || dayPdfState.isFetching || bulkPdfState.isLoading;

  const rows = React.useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    return [...data]
      .filter((candidate) => !date || fairDate(candidate).slice(0, 10) === date || candidate.created_at.slice(0, 10) === date)
      .filter((candidate) => {
        if (!needle) return true;
        return [
          candidate.name,
          candidate.city,
          candidate.country,
          candidate.website,
          candidate.email,
          candidate.contact_name,
          candidate.ai_summary,
          boothLabel(candidate),
          hallLabel(candidate),
        ].some((value) => String(value ?? '').toLocaleLowerCase('tr-TR').includes(needle));
      })
      .sort((a, b) => score(b) - score(a));
  }, [data, date, query]);

  const stats = React.useMemo(() => ({
    total: rows.length,
    pending: rows.filter((item) => item.status === 'pending').length,
    favorite: rows.filter((item) => item.status === 'favorite').length,
    approved: rows.filter((item) => item.status === 'approved').length,
  }), [rows]);

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const review = async (id: string, action: 'approve' | 'reject' | 'favorite') => {
    await reviewCandidate({ id, action }).unwrap();
    toast.success(action === 'approve' ? 'Aday onaylandı' : action === 'favorite' ? 'Favoriye alındı' : 'Aday reddedildi');
  };

  const createLead = async (id: string) => {
    await approveToLead(id).unwrap();
    toast.success('CRM lead kaydı oluşturuldu');
  };

  const downloadCandidate = async (candidate: LeadCandidate) => {
    const blob = await getCandidatePdf(candidate.id).unwrap();
    downloadBlob(blob, `fuar-brifing-${candidate.name.replace(/\s+/g, '-').toLocaleLowerCase('tr-TR')}.pdf`);
  };

  const downloadDay = async () => {
    const blob = await getDayPdf(date).unwrap();
    downloadBlob(blob, `fuar-brifing-${date}.pdf`);
  };

  const downloadSelected = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    const blob = await generateBulkPdf({ ids }).unwrap();
    downloadBlob(blob, `fuar-brifing-secili-${ids.length}.pdf`);
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Fuar Günü</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">Sahada hızlı görüşme, not alma ve CRM aktarımı için fuar aday paneli.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => refetch()} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155]">
            <RefreshCw className="h-4 w-4" /> Yenile
          </button>
          <button disabled={busy || !date} onClick={downloadDay} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
            {dayPdfState.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />} Gün PDF
          </button>
          <button disabled={busy || !selected.size} onClick={downloadSelected} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#1e40af] px-3 text-[13px] font-semibold text-[#1e40af] disabled:opacity-50">
            {bulkPdfState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Seçili PDF
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {[
          ['Toplam', stats.total],
          ['Bekleyen', stats.pending],
          ['Favori', stats.favorite],
          ['Onaylı', stats.approved],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#e2e8f0] bg-white p-3">
            <div className="text-[12px] font-semibold text-[#64748b]">{label}</div>
            <div className="mt-1 text-2xl font-bold text-[#0f172a]">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-lg border border-[#e2e8f0] bg-white p-3 md:grid-cols-[1.3fr_0.8fr_1fr_1fr]">
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-[#64748b]">Ara</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full rounded-md border border-[#cbd5e1] pl-9 pr-3 text-[13px]" />
          </div>
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-[#64748b]">Tarih</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-[#64748b]">Durum</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as '' | LeadCandidateStatus)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]">
            {STATUSES.map((item) => <option key={item.value || 'all'} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-[#64748b]">Fuar işi</span>
          <select value={jobId} onChange={(event) => setJobId(event.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]">
            <option value="">Tüm joblar</option>
            {fairJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {String(job.params?.fair_name ?? job.id)} · {job.status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#1e40af]" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-12 text-center text-[13px] text-[#64748b]">Fuar adayları alınamadı.</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-12 text-center text-[13px] text-[#64748b]">Bu filtrelerle fuar adayı yok.</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((candidate) => (
            <article key={candidate.id} className="rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.has(candidate.id)} onChange={() => toggleSelected(candidate.id)} className="mt-1 h-4 w-4 shrink-0" aria-label={`${candidate.name} seç`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-[16px] font-bold text-[#0f172a]">{candidate.name}</h2>
                      <div className="mt-1 flex flex-wrap gap-2 text-[12px] font-semibold text-[#64748b]">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Hall {hallLabel(candidate)} · Stand {boothLabel(candidate)}</span>
                        <span>{candidate.city || '-'} / {candidate.country || '-'}</span>
                      </div>
                    </div>
                    <span className="rounded-md bg-[#eff6ff] px-2 py-1 text-[12px] font-bold text-[#1d4ed8]">{score(candidate).toFixed(1)}</span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-[13px] leading-5 text-[#475569]">{candidate.ai_summary || candidate.decision || 'Brifing özeti henüz yok.'}</p>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <a aria-disabled={!candidate.phone} href={candidate.phone ? `tel:${normalizePhone(candidate.phone)}` : undefined} className="inline-flex h-10 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155] aria-disabled:pointer-events-none aria-disabled:opacity-40" title="Ara">
                      <Phone className="h-4 w-4" />
                    </a>
                    <a aria-disabled={!candidate.email} href={candidate.email ? `mailto:${candidate.email}` : undefined} className="inline-flex h-10 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155] aria-disabled:pointer-events-none aria-disabled:opacity-40" title="Mail gönder">
                      <Mail className="h-4 w-4" />
                    </a>
                    <a aria-disabled={!candidate.website} href={candidate.website || undefined} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155] aria-disabled:pointer-events-none aria-disabled:opacity-40" title="Web sitesini aç">
                      <Globe className="h-4 w-4" />
                    </a>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <button disabled={busy} onClick={() => review(candidate.id, 'favorite')} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-amber-300 px-2 text-[12px] font-semibold text-amber-700 disabled:opacity-50">
                      <Star className="h-3.5 w-3.5" /> Favori
                    </button>
                    <button disabled={busy} onClick={() => review(candidate.id, 'approve')} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2 text-[12px] font-semibold text-white disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" /> Onayla
                    </button>
                    <button disabled={busy} onClick={() => review(candidate.id, 'reject')} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-rose-200 px-2 text-[12px] font-semibold text-rose-700 disabled:opacity-50">
                      <ThumbsDown className="h-3.5 w-3.5" /> Red
                    </button>
                    <button disabled={busy} onClick={() => createLead(candidate.id)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#1e40af] px-2 text-[12px] font-semibold text-[#1e40af] disabled:opacity-50">
                      <UserPlus className="h-3.5 w-3.5" /> CRM
                    </button>
                    <button disabled={busy} onClick={() => enrichCandidate(candidate.id).unwrap().then(() => toast.success('Enrichment başladı')).catch(() => toast.error('Enrichment başlatılamadı'))} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#cbd5e1] px-2 text-[12px] font-semibold text-[#334155] disabled:opacity-50">
                      <Wand2 className="h-3.5 w-3.5" /> Enrich
                    </button>
                    <button disabled={busy} onClick={() => downloadCandidate(candidate)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#cbd5e1] px-2 text-[12px] font-semibold text-[#334155] disabled:opacity-50">
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
