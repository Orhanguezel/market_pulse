'use client';

import * as React from 'react';
import { BriefcaseBusiness, Building2, CalendarDays, CircleDollarSign, Download, Filter, Loader2, Mail, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useGetCrmReportsSummaryQuery } from '@/integrations/rtk/public/crm.endpoints';
import { usePreviewWeeklyMarketReportQuery, useSendWeeklyMarketReportMutation } from '@/integrations/rtk/public/market.endpoints';
import { useGetLeadApprovedStatsQuery, useGetLeadRejectionStatsQuery } from '@/integrations/rtk/public/lead-machine.endpoints';

type Tab = 'weekly' | 'learning';

function metric(label: string, value: unknown, tone = 'text-[#0f172a]') {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
      <div className="text-[12px] font-semibold text-[#64748b]">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone}`}>{String(value ?? 0)}</div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function dateInputValue(date: Date) { return date.toISOString().slice(0, 10); }
function defaultRange() {
  const now = new Date();
  return { start: dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)), end: dateInputValue(now) };
}
function csvCell(value: unknown) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
function downloadText(content: string, filename: string, type: string) {
  downloadBlob(new Blob(['\uFEFF', content], { type }), filename);
}
function exportRows(headers: string[], rows: unknown[][], filename: string, excel = false) {
  if (excel) {
    const html = `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${String(cell ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    downloadText(html, `${filename}.xls`, 'application/vnd.ms-excel;charset=utf-8');
    return;
  }
  downloadText([headers.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n'), `${filename}.csv`, 'text/csv;charset=utf-8');
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; tone: string }) {
  return <div className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white p-5"><div><p className="text-[11.5px] font-bold uppercase tracking-wide text-[#64748b]">{label}</p><p className="mt-1 text-2xl font-bold text-[#0f172a]">{value}</p></div><span className={`grid h-12 w-12 place-items-center rounded-full ${tone}`}><Icon className="h-5 w-5 text-white" /></span></div>;
}

export default function RaporlarPage() {
  const initialRange = React.useMemo(defaultRange, []);
  const [start, setStart] = React.useState(initialRange.start);
  const [end, setEnd] = React.useState(initialRange.end);
  const [range, setRange] = React.useState(initialRange);
  const [performanceSearch, setPerformanceSearch] = React.useState('');
  const [salesSearch, setSalesSearch] = React.useState('');
  const [tab, setTab] = React.useState<Tab>('weekly');
  const [to, setTo] = React.useState('');
  const { data, isLoading, isError, isFetching, refetch } = useGetCrmReportsSummaryQuery(range);
  const preview = usePreviewWeeklyMarketReportQuery(undefined, { skip: tab !== 'weekly' });
  const [sendReport, sendState] = useSendWeeklyMarketReportMutation();
  const { data: approvedStats, isFetching: approvedFetching } = useGetLeadApprovedStatsQuery();
  const { data: rejectionStats, isFetching: rejectionFetching } = useGetLeadRejectionStatsQuery();
  const counts = data?.counts;
  const previewUrl = React.useMemo(() => preview.data ? URL.createObjectURL(preview.data) : null, [preview.data]);
  const performance = React.useMemo(() => (data?.performance ?? []).filter((row) => row.responsible.toLocaleLowerCase('tr').includes(performanceSearch.toLocaleLowerCase('tr'))), [data?.performance, performanceSearch]);
  const sales = React.useMemo(() => (data?.sales ?? []).filter((row) => `${row.title} ${row.status} ${row.currency}`.toLocaleLowerCase('tr').includes(salesSearch.toLocaleLowerCase('tr'))), [data?.sales, salesSearch]);
  const performanceRows = performance.map((row) => [row.responsible, row.todo, row.quote_sent, row.hot, row.customer_added, row.waiting, row.revision, row.cancelled]);
  const salesRows = sales.map((row) => [new Date(row.sale_date).toLocaleDateString('tr-TR'), row.title, row.status, row.currency, Number(row.amount ?? 0).toLocaleString('tr-TR')]);

  React.useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const send = async () => {
    if (!to.trim()) {
      toast.error('Alıcı e-posta gerekli');
      return;
    }
    await sendReport({ to: to.trim() }).unwrap();
    toast.success('Haftalık rapor gönderildi');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Raporlar</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">Haftalık PDF raporu ve lead öğrenme istatistikleri.</p>
        </div>
        <button onClick={() => refetch()} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155]">
          <RefreshCw className="h-4 w-4" /> Yenile
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Toplam Müşteri" value={data?.operational_counts.customers ?? 0} icon={Building2} tone="bg-[#2563eb]" />
        <SummaryCard label="Çalışan Sayısı" value={data?.operational_counts.employees ?? 0} icon={Users} tone="bg-[#ef4444]" />
        <SummaryCard label="Aktif Satış Fırsatı" value={data?.operational_counts.active_deals ?? 0} icon={BriefcaseBusiness} tone="bg-[#14b8a6]" />
        <SummaryCard label="Toplam Ciro" value={`${Number(data?.operational_counts.total_revenue ?? 0).toLocaleString('tr-TR')} ₺`} icon={CircleDollarSign} tone="bg-[#fb923c]" />
      </div>

      <ReportTableSection title="Sorumlu Bazlı Performans Raporu" icon={BriefcaseBusiness}>
        <div className="grid gap-4 border-b border-[#e2e8f0] p-5 lg:grid-cols-[1fr_1fr_230px] lg:items-end">
          <label className="grid gap-1.5 text-[12px] font-semibold text-[#334155]">Başlangıç Tarihi<input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3" /></label>
          <label className="grid gap-1.5 text-[12px] font-semibold text-[#334155]">Bitiş Tarihi<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3" /></label>
          <button disabled={isFetching || !start || !end || start > end} onClick={() => setRange({ start, end })} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#1e40af] px-4 text-[13px] font-semibold text-white disabled:opacity-50"><Filter className="h-4 w-4" /> Onayla</button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"><div className="flex gap-2"><button onClick={() => exportRows(['Sorumlu','Yapılacak','Teklif Gönderilen','Sıcağa Yakın','Müşteriye Eklenen','Beklemede','Revize','İptal'], performanceRows, 'sorumlu-performans', true)} className="rounded border border-[#cbd5e1] px-3 py-2 text-[12px] font-semibold">Excel İndir</button><button onClick={() => exportRows(['Sorumlu','Yapılacak','Teklif Gönderilen','Sıcağa Yakın','Müşteriye Eklenen','Beklemede','Revize','İptal'], performanceRows, 'sorumlu-performans')} className="rounded border border-[#cbd5e1] px-3 py-2 text-[12px] font-semibold">CSV İndir</button></div><label className="flex items-center gap-2 text-[12px] font-semibold text-[#334155]">Ara:<input value={performanceSearch} onChange={(e) => setPerformanceSearch(e.target.value)} placeholder="Sorumlu ara..." className="h-9 rounded-md border border-[#cbd5e1] px-3 font-normal" /></label></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-[12px]"><thead className="bg-[#f1f5f9] text-left uppercase tracking-wide text-[#334155]"><tr>{['Sorumlu','Yapılacak','Teklif Gönderilen','Sıcağa Yakın','Müşteriye Eklenen','Beklemede','Revize','İptal Edildi'].map((h) => <th key={h} className="border border-[#dbe3ee] px-3 py-3">{h}</th>)}</tr></thead><tbody>{performance.length ? performance.map((row) => <tr key={row.owner_user_id}><td className="border border-[#dbe3ee] px-3 py-3 font-semibold">{row.responsible}</td>{[row.todo,row.quote_sent,row.hot,row.customer_added,row.waiting,row.revision,row.cancelled].map((v,i) => <td key={i} className="border border-[#dbe3ee] px-3 py-3 text-center">{v}</td>)}</tr>) : <tr><td colSpan={8} className="p-8 text-center text-[#94a3b8]">Seçilen tarih aralığında performans kaydı bulunmuyor.</td></tr>}<tr className="bg-[#f8fafc] font-bold"><td className="border border-[#dbe3ee] px-3 py-3">Toplam</td>{[0,1,2,3,4,5,6].map((index) => <td key={index} className="border border-[#dbe3ee] px-3 py-3 text-center">{performance.reduce((sum,row) => sum + [row.todo,row.quote_sent,row.hot,row.customer_added,row.waiting,row.revision,row.cancelled][index], 0)}</td>)}</tr></tbody></table></div>
      </ReportTableSection>

      <ReportTableSection title="Aylık Yeni Gelen Sıcak Satış Raporu" icon={CalendarDays}>
        <div className="px-5 pt-4 text-[13px] font-semibold text-[#334155]">Seçilen tarih aralığındaki toplam satış sayısı: <span className="rounded bg-[#fff7ed] px-2 py-1 text-[#c2410c]">{sales.length}</span></div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="flex gap-2"><button onClick={() => exportRows(['Tarih','Satış','Statü','Para Birimi','Ciro'], salesRows, 'aylik-satis', true)} className="rounded border border-[#cbd5e1] px-3 py-2 text-[12px] font-semibold">Excel İndir</button><button onClick={() => exportRows(['Tarih','Satış','Statü','Para Birimi','Ciro'], salesRows, 'aylik-satis')} className="rounded border border-[#cbd5e1] px-3 py-2 text-[12px] font-semibold">CSV İndir</button></div><label className="flex items-center gap-2 text-[12px] font-semibold text-[#334155]">Ara:<input value={salesSearch} onChange={(e) => setSalesSearch(e.target.value)} placeholder="Satış ara..." className="h-9 rounded-md border border-[#cbd5e1] px-3 font-normal" /></label></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-[12px]"><thead className="bg-[#f1f5f9] text-left uppercase tracking-wide text-[#334155]"><tr>{['Tarih','Satış Türü','Statü','Para Birimi','Ciro'].map((h) => <th key={h} className="border border-[#dbe3ee] px-4 py-3">{h}</th>)}</tr></thead><tbody>{sales.length ? sales.map((row) => <tr key={row.id}><td className="border border-[#dbe3ee] px-4 py-3">{new Date(row.sale_date).toLocaleDateString('tr-TR')}</td><td className="border border-[#dbe3ee] px-4 py-3 font-semibold">{row.title}</td><td className="border border-[#dbe3ee] px-4 py-3 capitalize">{row.status}</td><td className="border border-[#dbe3ee] px-4 py-3">{row.currency}</td><td className="border border-[#dbe3ee] px-4 py-3 font-semibold">{Number(row.amount ?? 0).toLocaleString('tr-TR')}</td></tr>) : <tr><td colSpan={5} className="p-8 text-center text-[#94a3b8]">Tabloda veri bulunmuyor.</td></tr>}<tr className="bg-[#f8fafc] font-bold"><td className="border border-[#dbe3ee] px-4 py-3">Toplam</td><td className="border border-[#dbe3ee]" colSpan={3}></td><td className="border border-[#dbe3ee] px-4 py-3">{sales.filter((row) => row.status !== 'cancelled').reduce((sum,row) => sum + Number(row.amount ?? 0), 0).toLocaleString('tr-TR')}</td></tr></tbody></table></div>
      </ReportTableSection>

      {isError && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">Rapor özeti alınamadı.</div>}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white py-16"><Loader2 className="h-6 w-6 animate-spin text-[#1e40af]" /></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {metric('Hedef firma', counts?.targets_total, 'text-[#1e40af]')}
          {metric('Aktif lead', counts?.active_leads, 'text-emerald-700')}
          {metric('Bekleyen sinyal', counts?.pending_signals, 'text-amber-700')}
          {metric('Yüksek risk', counts?.high_risk_targets, 'text-rose-700')}
          {metric('Haftalık yüksek sinyal', counts?.weekly_high_signals, 'text-amber-700')}
          {metric('Test koşusu', counts?.market_test_runs)}
        </div>
      )}

      <div className="rounded-lg border border-[#e2e8f0] bg-white">
        <div className="flex border-b border-[#e2e8f0] px-4 pt-3 text-[13px] font-semibold">
          <button onClick={() => setTab('weekly')} className={`border-b-2 px-3 pb-3 ${tab === 'weekly' ? 'border-[#2563eb] text-[#1d4ed8]' : 'border-transparent text-[#94a3b8]'}`}>Haftalık PDF</button>
          <button onClick={() => setTab('learning')} className={`border-b-2 px-3 pb-3 ${tab === 'learning' ? 'border-[#2563eb] text-[#1d4ed8]' : 'border-transparent text-[#94a3b8]'}`}>Öğrenme Raporu</button>
        </div>

        {tab === 'weekly' ? (
          <div className="grid gap-4 p-4 lg:grid-cols-[1fr_340px]">
            <div className="min-h-96 overflow-hidden rounded-md border border-[#e2e8f0] bg-[#f8fafc]">
              {preview.isFetching ? (
                <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#1e40af]" /></div>
              ) : previewUrl ? (
                <iframe src={previewUrl} className="h-[620px] w-full" title="Haftalık rapor önizleme" />
              ) : (
                <div className="flex h-96 items-center justify-center text-[13px] text-[#64748b]">PDF önizleme alınamadı.</div>
              )}
            </div>
            <div className="space-y-3">
              <button disabled={!preview.data} onClick={() => preview.data && downloadBlob(preview.data, 'marketpulse-weekly-report.pdf')} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#1e40af] px-3 text-[13px] font-semibold text-[#1e40af] disabled:opacity-50">
                <Download className="h-4 w-4" /> PDF İndir
              </button>
              <label className="grid gap-1.5">
                <span className="text-[12px] font-semibold text-[#64748b]">Alıcı e-posta</span>
                <input value={to} onChange={(event) => setTo(event.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" placeholder="rapor@example.com" />
              </label>
              <button disabled={sendState.isLoading} onClick={send} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
                {sendState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Maille Gönder
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <div className="rounded-md border border-[#e2e8f0]">
              <div className="border-b border-[#e2e8f0] px-4 py-3 text-[13px] font-bold text-[#0f172a]">Onaylı Profil İstatistikleri</div>
              <pre className="max-h-96 overflow-auto p-4 text-[12px] text-[#334155]">{approvedFetching ? 'Yükleniyor...' : JSON.stringify(approvedStats ?? {}, null, 2)}</pre>
            </div>
            <div className="rounded-md border border-[#e2e8f0]">
              <div className="border-b border-[#e2e8f0] px-4 py-3 text-[13px] font-bold text-[#0f172a]">Red Nedenleri</div>
              <pre className="max-h-96 overflow-auto p-4 text-[12px] text-[#334155]">{rejectionFetching ? 'Yükleniyor...' : JSON.stringify(rejectionStats ?? {}, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportTableSection({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm"><div className="flex items-center gap-2 bg-[#eef1f5] px-5 py-5 text-[17px] font-bold text-[#1e3a5f]"><Icon className="h-5 w-5" />{title}</div>{children}</section>;
}
