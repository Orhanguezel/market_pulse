'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, FileSpreadsheet, Loader2, Mail, RefreshCw, Search, Star, ThumbsDown, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useApproveLeadCandidateToLeadMutation,
  useCreateLeadRuleMutation,
  useDeleteLeadRuleMutation,
  useEnrichLeadCandidateMutation,
  useEnrichLeadCandidatesBatchMutation,
  useListLeadRulesQuery,
  useListLeadCandidatesPageQuery,
  useLazyListLeadCandidatesPageQuery,
  useReviewLeadCandidateMutation,
  useReviewLeadCandidatesBulkMutation,
} from '@/integrations/rtk/hooks';
import { useGenerateCandidateOutreachDraftMutation } from '@/integrations/rtk/public/outreach.endpoints';
import type { LeadCandidate } from '@/integrations/shared/lead-machine.types';

const CHANNELS = [
  { value: '', label: 'Tüm kanallar' },
  { value: 'b2b_directory', label: 'B2B' },
  { value: 'trade_fair', label: 'Fuar' },
  { value: 'customs', label: 'Gümrük' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'decision_maker', label: 'Karar Verici' },
];

const STATUSES = [
  { value: '', label: 'Tüm durumlar' },
  { value: 'pending', label: 'Bekleyen' },
  { value: 'approved', label: 'Onaylı' },
  { value: 'favorite', label: 'Favori' },
  { value: 'rejected', label: 'Red' },
];

function score(candidate: LeadCandidate) {
  const value = typeof candidate.lead_score === 'number' ? candidate.lead_score : Number(candidate.lead_score ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function rawRecord(candidate: LeadCandidate) {
  if (candidate.raw_data && typeof candidate.raw_data === 'object' && !Array.isArray(candidate.raw_data)) return candidate.raw_data as Record<string, unknown>;
  return {};
}

function nestedRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export default function FirmaBulucuAdaylarPage() {
  const params = useSearchParams();
  const [channel, setChannel] = React.useState(params.get('channel') ?? '');
  const [status, setStatus] = React.useState(params.get('status') ?? '');
  const [jobId, setJobId] = React.useState(params.get('job_id') ?? '');
  const [query, setQuery] = React.useState('');
  const [ruleValue, setRuleValue] = React.useState('');
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [page, setPage] = React.useState(1);
  const [exporting, setExporting] = React.useState(false);
  const pageSize = 50;
  const { data: pageData, isLoading, isError, refetch } = useListLeadCandidatesPageQuery({
    channel: channel || undefined,
    status: status || undefined,
    job_id: jobId || undefined,
    page,
    limit: pageSize,
  });
  const data = pageData?.rows ?? [];
  const [loadExportPage] = useLazyListLeadCandidatesPageQuery();
  const total = pageData?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const [reviewCandidate, reviewState] = useReviewLeadCandidateMutation();
  const [reviewCandidatesBulk, bulkReviewState] = useReviewLeadCandidatesBulkMutation();
  const [approveToLead, approveState] = useApproveLeadCandidateToLeadMutation();
  const [enrichOne, enrichOneState] = useEnrichLeadCandidateMutation();
  const [enrichBatch, enrichBatchState] = useEnrichLeadCandidatesBatchMutation();
  const [generateDraft, generateDraftState] = useGenerateCandidateOutreachDraftMutation();
  const { data: rules = [] } = useListLeadRulesQuery();
  const [createRule, createRuleState] = useCreateLeadRuleMutation();
  const [deleteRule, deleteRuleState] = useDeleteLeadRuleMutation();
  const busy = reviewState.isLoading || bulkReviewState.isLoading || approveState.isLoading || enrichOneState.isLoading || enrichBatchState.isLoading || generateDraftState.isLoading || createRuleState.isLoading || deleteRuleState.isLoading;

  React.useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [channel, status, jobId]);

  const rows = React.useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    return [...data]
      .filter((candidate) => !needle || [candidate.name, candidate.city, candidate.country, candidate.website, candidate.ai_summary].some((value) => String(value ?? '').toLocaleLowerCase('tr-TR').includes(needle)))
      .sort((a, b) => score(b) - score(a));
  }, [data, query]);

  const toggle = (id: string) => {
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

  const lead = async (id: string) => {
    await approveToLead(id).unwrap();
    toast.success('Lead kaydı oluşturuldu');
  };

  const enrichSelected = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    await enrichBatch({ candidate_ids: ids }).unwrap();
    toast.success(`${ids.length} aday enrichment kuyruğuna alındı`);
  };

  const rejectSelected = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    await reviewCandidatesBulk({ candidate_ids: ids, action: 'reject', reject_reason: 'bulk_reject' }).unwrap();
    setSelected(new Set());
    toast.success(`${ids.length} aday reddedildi`);
  };

  const addRule = async () => {
    const value = ruleValue.trim();
    if (!value) return;
    await createRule({ value, channel: channel || undefined, rule_type: 'exclude_reject_tag', label: value }).unwrap();
    setRuleValue('');
    toast.success('Tarama dışlama kuralı eklendi');
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const all: LeadCandidate[] = [];
      let exportPage = 1;
      let expected = Number.POSITIVE_INFINITY;
      while (all.length < expected) {
        const result = await loadExportPage({
          channel: channel || undefined,
          status: status || undefined,
          job_id: jobId || undefined,
          page: exportPage,
          limit: 100,
        }, true).unwrap();
        all.push(...result.rows);
        expected = result.total;
        if (!result.rows.length || exportPage >= Math.ceil(expected / 100)) break;
        exportPage += 1;
      }
      const XLSX = await import('xlsx');
      const exportRows = all.map((candidate) => {
        const raw = rawRecord(candidate);
        const fair = nestedRecord(raw.fair_info);
        const exhibitor = nestedRecord(raw.exhibitor);
        return {
          'Firma Adı': candidate.name,
          'Web Sitesi': candidate.website || '',
          'E-posta': candidate.email || '',
          'Telefon': candidate.phone || '',
          'Ülke': candidate.country || '',
          'Şehir': candidate.city || '',
          'Salon': fair.hall || exhibitor.hall || '',
          'Stand': fair.booth_number || exhibitor.booth_number || '',
          'Lead Skoru': score(candidate),
          'Durum': candidate.status,
          'Kanal': candidate.channel,
          'İletişim Kişisi': candidate.contact_name || '',
          'AI Özeti': candidate.ai_summary || '',
          'Kaynak Detay': exhibitor.detail_url || '',
          'Job ID': candidate.job_id,
          'Oluşturulma': candidate.created_at,
        };
      });
      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet(exportRows);
      sheet['!cols'] = [32, 34, 28, 18, 10, 18, 10, 14, 12, 12, 16, 24, 50, 55, 38, 22].map((wch) => ({ wch }));
      XLSX.utils.book_append_sheet(workbook, sheet, 'Firma Adayları');
      XLSX.writeFile(workbook, `firma-adaylari-${jobId || 'tum-kayitlar'}.xlsx`);
      toast.success(`${all.length} aday Excel dosyasına aktarıldı`);
    } catch {
      toast.error('Excel dosyası oluşturulamadı');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Firma Adayları</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">Tarama sonuçlarını inceleyin, onaylayın ve CRM’e aktarın.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={exporting || isLoading || total === 0} onClick={exportExcel} className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 text-[13px] font-semibold text-emerald-700 disabled:opacity-50">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Excel İndir
          </button>
          <button onClick={() => refetch()} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155]">
            <RefreshCw className="h-4 w-4" /> Yenile
          </button>
          <button disabled={!selected.size || busy} onClick={enrichSelected} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
            {enrichBatchState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Toplu Enrich
          </button>
          <button disabled={!selected.size || busy} onClick={rejectSelected} className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 px-3 text-[13px] font-semibold text-rose-700 disabled:opacity-50">
            <ThumbsDown className="h-4 w-4" /> Toplu Red
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-[#e2e8f0] bg-white p-4 md:grid-cols-4">
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Ara</span><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 w-full rounded-md border border-[#cbd5e1] pl-9 pr-3 text-[13px]" /></div></label>
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Kanal</span><select value={channel} onChange={(e) => setChannel(e.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]">{CHANNELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Durum</span><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]">{STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Job ID</span><input value={jobId} onChange={(e) => setJobId(e.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" /></label>
      </div>

      <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <label className="grid flex-1 gap-1.5">
            <span className="text-[12px] font-semibold text-[#64748b]">Tarama dışlama kuralı</span>
            <input value={ruleValue} onChange={(e) => setRuleValue(e.target.value)} placeholder="Örn: supplement, retail, alakasız kategori" className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" />
          </label>
          <button disabled={busy || !ruleValue.trim()} onClick={addRule} className="inline-flex h-10 items-center justify-center rounded-md border border-[#1e40af] px-3 text-[13px] font-semibold text-[#1e40af] disabled:opacity-50">Kural Ekle</button>
        </div>
        {rules.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {rules.map((rule) => (
              <button key={rule.id} disabled={busy} onClick={() => deleteRule(rule.id).unwrap().then(() => toast.success('Kural silindi'))} className="rounded-md bg-[#f1f5f9] px-2.5 py-1.5 text-[12px] font-semibold text-[#475569] disabled:opacity-50">
                {rule.value} ×
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white py-16"><Loader2 className="h-6 w-6 animate-spin text-[#1e40af]" /></div>
      ) : isError ? (
        <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-12 text-center text-[13px] text-[#64748b]">Adaylar alınamadı.</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-12 text-center text-[13px] text-[#64748b]">Aday bulunamadı.</div>
      ) : (
        <>
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((candidate) => (
            <article key={candidate.id} className="rounded-lg border border-[#e2e8f0] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <label className="flex min-w-0 items-start gap-3">
                  <input type="checkbox" checked={selected.has(candidate.id)} onChange={() => toggle(candidate.id)} className="mt-1 h-4 w-4" />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-bold text-[#0f172a]">{candidate.name}</span>
                    <span className="mt-1 block text-[12px] text-[#64748b]">{candidate.city || '-'} · {candidate.country || '-'} · {candidate.channel}</span>
                  </span>
                </label>
                <span className="rounded-md bg-[#eff6ff] px-2 py-1 text-[12px] font-bold text-[#1d4ed8]">{score(candidate).toFixed(1)}</span>
              </div>
              <p className="mt-3 line-clamp-3 text-[13px] leading-5 text-[#475569]">{candidate.ai_summary || 'Özet henüz yok.'}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
                {candidate.website && <a className="max-w-full truncate font-semibold text-[#1e40af] hover:underline" href={candidate.website} target="_blank" rel="noreferrer">{candidate.website}</a>}
                {candidate.email && <a className="font-semibold text-[#1e40af] hover:underline" href={`mailto:${candidate.email}`}>{candidate.email}</a>}
                {candidate.contact_name && <span className="text-[#64748b]">{candidate.contact_name}</span>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button disabled={busy} onClick={() => review(candidate.id, 'approve')} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 text-[12px] font-semibold text-white disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Onayla</button>
                <button disabled={busy} onClick={() => review(candidate.id, 'favorite')} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-amber-300 px-2.5 text-[12px] font-semibold text-amber-700 disabled:opacity-50"><Star className="h-3.5 w-3.5" /> Favori</button>
                <button disabled={busy} onClick={() => review(candidate.id, 'reject')} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-200 px-2.5 text-[12px] font-semibold text-rose-700 disabled:opacity-50"><ThumbsDown className="h-3.5 w-3.5" /> Red</button>
                <button disabled={busy} onClick={() => lead(candidate.id)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#1e40af] px-2.5 text-[12px] font-semibold text-[#1e40af] disabled:opacity-50"><Mail className="h-3.5 w-3.5" /> Lead’e Aktar</button>
                <button disabled={busy} onClick={() => enrichOne(candidate.id).unwrap().then(() => toast.success('Enrichment başladı')).catch(() => toast.error('Enrichment başlatılamadı'))} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#cbd5e1] px-2.5 text-[12px] font-semibold text-[#334155] disabled:opacity-50"><Wand2 className="h-3.5 w-3.5" /> Enrich</button>
                <button disabled={busy} onClick={() => generateDraft(candidate.id).unwrap().then(() => toast.success('Outreach taslağı üretildi')).catch(() => toast.error('Taslak üretilemedi'))} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#cbd5e1] px-2.5 text-[12px] font-semibold text-[#334155] disabled:opacity-50"><Mail className="h-3.5 w-3.5" /> Taslak</button>
              </div>
            </article>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-[13px]">
          <span className="text-[#64748b]">Toplam {total} aday · Sayfa {page}/{pageCount}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="h-8 rounded-md border border-[#cbd5e1] px-3 font-semibold text-[#334155] disabled:opacity-40">Önceki</button>
            <button disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} className="h-8 rounded-md border border-[#cbd5e1] px-3 font-semibold text-[#334155] disabled:opacity-40">Sonraki</button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
