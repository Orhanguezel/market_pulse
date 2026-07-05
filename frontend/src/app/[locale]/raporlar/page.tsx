'use client';

import * as React from 'react';
import { Download, Loader2, Mail, RefreshCw } from 'lucide-react';
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

export default function RaporlarPage() {
  const [tab, setTab] = React.useState<Tab>('weekly');
  const [to, setTo] = React.useState('');
  const { data, isLoading, isError, refetch } = useGetCrmReportsSummaryQuery();
  const preview = usePreviewWeeklyMarketReportQuery(undefined, { skip: tab !== 'weekly' });
  const [sendReport, sendState] = useSendWeeklyMarketReportMutation();
  const { data: approvedStats, isFetching: approvedFetching } = useGetLeadApprovedStatsQuery();
  const { data: rejectionStats, isFetching: rejectionFetching } = useGetLeadRejectionStatsQuery();
  const counts = data?.counts;
  const previewUrl = React.useMemo(() => preview.data ? URL.createObjectURL(preview.data) : null, [preview.data]);

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
