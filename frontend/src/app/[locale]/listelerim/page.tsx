'use client';

import React from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Upload, Sparkles, Zap, Download, Loader2, RefreshCcw, ListChecks } from 'lucide-react';
import {
  useListProspectListsQuery,
  useImportProspectListMutation,
  useListProspectCompaniesQuery,
  useEnrichFreeMutation,
  useEnrichApolloMutation,
  useProspectStatusQuery,
  type ProspectCompany,
} from '@/integrations/rtk/public/prospect-lists.endpoints';
import { AppCard, AppPage, AppPageHeader } from '@/components/iy/AppPage';

const STATUS: Record<ProspectCompany['enrich_status'], { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'bg-slate-100 text-slate-500' },
  free_running: { label: 'Taranıyor…', cls: 'bg-blue-100 text-blue-700' },
  free_done: { label: 'Ücretsiz ✓', cls: 'bg-emerald-100 text-emerald-700' },
  apollo_running: { label: 'Apollo…', cls: 'bg-violet-100 text-violet-700' },
  apollo_done: { label: 'Apollo ✓', cls: 'bg-violet-100 text-violet-800' },
  failed: { label: 'Hata', cls: 'bg-red-100 text-red-700' },
};

function toCsv(rows: ProspectCompany[]): string {
  const head = ['Firma', 'Ülke', 'Website', 'Genel E-posta', 'Telefon', 'Karar Verici', 'Unvan', 'DM E-posta', 'E-posta Kaynağı', 'LinkedIn', 'Durum'];
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) => [r.company_name, r.country, r.website, r.generic_email, r.phone, r.decision_maker_name, r.decision_maker_title, r.decision_maker_email, r.decision_maker_email_source, r.decision_maker_linkedin, STATUS[r.enrich_status].label].map(cell).join(','));
  return [head.map(cell).join(','), ...lines].join('\n');
}

export default function ProspectListsPage() {
  const { data: listsData, refetch: refetchLists } = useListProspectListsQuery();
  const { data: statusData } = useProspectStatusQuery();
  const lists = listsData?.lists ?? [];
  const apolloEnabled = statusData?.apollo_enabled ?? false;

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [importing, setImporting] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [importList] = useImportProspectListMutation();
  const [enrichFree] = useEnrichFreeMutation();
  const [enrichApollo] = useEnrichApolloMutation();

  const companiesQ = useListProspectCompaniesQuery(activeId ? { id: activeId } : ({} as never), { skip: !activeId });
  const companies = companiesQ.data?.companies ?? [];
  const anyRunning = companies.some((c) => c.enrich_status === 'free_running' || c.enrich_status === 'apollo_running' || c.enrich_status === 'pending');

  // Enrichment sürerken poll
  React.useEffect(() => {
    if (!activeId || !anyRunning) return;
    const t = setInterval(() => { void companiesQ.refetch(); void refetchLists(); }, 4000);
    return () => clearInterval(t);
  }, [activeId, anyRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = async (file: File) => {
    setImporting(true);
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]!];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });
      // İlk satır başlık; kolon0 = firma, kolon1 = website (yoksa boş)
      const body = rows.slice(1)
        .map((r) => ({ company_name: String((r as unknown[])[0] ?? '').trim(), website: (r as unknown[])[1] != null ? String((r as unknown[])[1]).trim() : null }))
        .filter((c) => c.company_name && c.company_name.toLowerCase() !== 'nan');
      if (!body.length) { toast.error('Dosyada firma bulunamadı'); return; }
      const res = await importList({ name: file.name.replace(/\.(xlsx|xls|csv)$/i, ''), source_file: file.name, companies: body }).unwrap();
      toast.success(`${res.total} firma içe aktarıldı`);
      await refetchLists();
      setActiveId(res.list_id);
    } catch (e) {
      toast.error('İçe aktarma hatası');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const startFree = async () => {
    if (!activeId) return;
    try { await enrichFree({ id: activeId }).unwrap(); toast.success('Ücretsiz zenginleştirme başladı'); void companiesQ.refetch(); }
    catch { toast.error('Başlatılamadı'); }
  };

  const startApollo = async () => {
    const ids = [...selected];
    if (!ids.length) { toast.error('Firma seçin'); return; }
    try {
      const res = await enrichApollo({ company_ids: ids }).unwrap();
      if (!res.apollo_enabled) toast.error('Apollo API anahtarı tanımlı değil — sonuç gelmez');
      else toast.success(`${res.count} firma için Apollo başladı`);
      setSelected(new Set());
      void companiesQ.refetch();
    } catch { toast.error('Başlatılamadı'); }
  };

  const exportCsv = () => {
    const blob = new Blob(['﻿' + toCsv(companies)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `liste-${activeId?.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <AppPage>
      <AppPageHeader
        icon={ListChecks}
        title="Firma Listelerim"
        description="Excel/CSV firma listesi yükleyin; e-posta, LinkedIn ve karar verici bilgilerini zenginleştirin."
      />

      {/* Upload */}
      <AppCard className="flex flex-wrap items-center gap-3 border-dashed p-4">
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={importing} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1e40af] px-4 text-[13px] font-semibold text-white hover:bg-[#15317f] disabled:opacity-50">
          {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Excel/CSV Yükle
        </button>
        <span className="text-xs text-slate-400">1. kolon: Firma Adı · 2. kolon: Website (opsiyonel)</span>
      </AppCard>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Listeler */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Listeler ({lists.length})</h2>
            <button onClick={() => refetchLists()} className="text-slate-400 hover:text-slate-600"><RefreshCcw className="size-3.5" /></button>
          </div>
          {lists.map((l) => (
            <button key={l.id} onClick={() => { setActiveId(l.id); setSelected(new Set()); }} className={`w-full rounded-lg border bg-white p-3 text-left transition-colors ${activeId === l.id ? 'border-[#1e40af] bg-[#eff6ff]' : 'border-[#e2e8f0] hover:border-[#93c5fd]'}`}>
              <div className="truncate text-sm font-medium text-slate-900">{l.name}</div>
              <div className="mt-1 text-[11px] text-slate-400">{l.total} firma · ücretsiz {l.free_done} · Apollo {l.apollo_done}</div>
            </button>
          ))}
          {!lists.length && <p className="text-xs text-slate-400">Henüz liste yok. Yukarıdan yükle.</p>}
        </div>

        {/* Firma tablosu */}
        <div>
          {!activeId ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">Bir liste seç veya yükle.</div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <button onClick={startFree} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white hover:bg-[#15317f]">
                  <Sparkles className="size-4" /> Ücretsiz Zenginleştir
                </button>
                <button onClick={startApollo} disabled={!selected.size} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40">
                  <Zap className="size-4" /> Apollo (seçili {selected.size})
                </button>
                <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Download className="size-4" /> CSV
                </button>
                {anyRunning && <span className="inline-flex items-center gap-1 text-xs text-blue-600"><Loader2 className="size-3.5 animate-spin" /> işleniyor…</span>}
                {!apolloEnabled && <span className="text-[11px] text-amber-600">Apollo anahtarı yok — ücretsiz mod</span>}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="w-8 px-3 py-2"></th>
                      <th className="px-3 py-2">Firma</th>
                      <th className="px-3 py-2">Genel E-posta</th>
                      <th className="px-3 py-2">Karar Verici</th>
                      <th className="px-3 py-2">DM E-posta</th>
                      <th className="px-3 py-2">LinkedIn</th>
                      <th className="px-3 py-2">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c) => (
                      <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-3 py-2"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} /></td>
                        <td className="px-3 py-2">
                          <div className="max-w-[220px] truncate font-medium text-slate-800">{c.company_name}</div>
                          {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline">{c.website.replace(/^https?:\/\//, '').slice(0, 32)}</a>}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{c.generic_email || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-2 text-slate-600">{c.decision_maker_name ? <span>{c.decision_maker_name}{c.decision_maker_title ? <span className="block text-[11px] text-slate-400">{c.decision_maker_title}</span> : null}</span> : <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-2 text-slate-600">{c.decision_maker_email || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-2">{c.linkedin_search_url ? <a href={c.decision_maker_linkedin || c.linkedin_search_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline">ara/aç</a> : <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-2"><span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS[c.enrich_status].cls}`}>{STATUS[c.enrich_status].label}</span></td>
                      </tr>
                    ))}
                    {!companies.length && <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-400">Firma yok</td></tr>}
                  </tbody>
                </table>
              </div>
              {companies.length >= 500 && <p className="mt-2 text-[11px] text-slate-400">İlk 500 firma gösteriliyor.</p>}
            </>
          )}
        </div>
      </div>
    </AppPage>
  );
}
