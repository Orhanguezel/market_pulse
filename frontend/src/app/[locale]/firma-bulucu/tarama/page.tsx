'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, CalendarDays, Database, Loader2, Radar, Search, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import {
  useListIcpProfilesQuery,
  useRunFairLeadJobMutation,
  useStartB2bLeadJobMutation,
  useStartCustomsLeadJobMutation,
  useStartFairLeadJobMutation,
  useStartPublicScanMutation,
} from '@/integrations/rtk/hooks';

type Source = 'b2b' | 'fair' | 'amazon' | 'customs';

const SOURCES: Array<{ key: Source; label: string; text: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'b2b', label: 'B2B Dizin', text: 'Google Maps, Europages veya TOBB üzerinden firma taraması.', icon: Building2 },
  { key: 'fair', label: 'Fuar', text: 'Fuar katılımcı listelerinden aday çıkarma.', icon: CalendarDays },
  { key: 'amazon', label: 'Amazon', text: 'Keyword bazlı pazar ve satıcı risk analizi.', icon: ShoppingCart },
  { key: 'customs', label: 'Gümrük', text: 'HS/GTİP veya ürün sorgusuyla ithalatçı firma bulma.', icon: Database },
];

const B2B_SOURCES = ['google_maps', 'europages', 'tobb'];
const COUNTRIES = ['TR', 'DE', 'NL', 'FR', 'IT', 'ES', 'PL', 'GB', 'US'];
const MARKETPLACES = ['com', 'de', 'co.uk', 'fr', 'it', 'es'];

export default function FirmaBulucuTaramaPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const l = locale || 'tr';
  const { data: icps = [] } = useListIcpProfilesQuery();
  const [startB2b, b2bState] = useStartB2bLeadJobMutation();
  const [startFair, fairState] = useStartFairLeadJobMutation();
  const [runFair, runFairState] = useRunFairLeadJobMutation();
  const [startCustoms, customsState] = useStartCustomsLeadJobMutation();
  const [startAmazon, amazonState] = useStartPublicScanMutation();

  const [source, setSource] = React.useState<Source>('b2b');
  const [icpId, setIcpId] = React.useState('');
  const [b2bSource, setB2bSource] = React.useState('google_maps');
  const [query, setQuery] = React.useState('automotive accessories distributor');
  const [country, setCountry] = React.useState('DE');
  const [limit, setLimit] = React.useState(25);
  const [fairName, setFairName] = React.useState('Automechanika Frankfurt');
  const [fairUrl, setFairUrl] = React.useState('');
  const [fairDate, setFairDate] = React.useState('');
  const [keyword, setKeyword] = React.useState('');
  const [marketplace, setMarketplace] = React.useState('de');
  const [hsPrefix, setHsPrefix] = React.useState('');
  const [productQuery, setProductQuery] = React.useState('');
  const [customsCountry, setCustomsCountry] = React.useState('ALL');
  const [minValue, setMinValue] = React.useState('');
  const busy = b2bState.isLoading || fairState.isLoading || runFairState.isLoading || customsState.isLoading || amazonState.isLoading;

  React.useEffect(() => {
    if (!icpId && icps[0]?.id) setIcpId(icps[0].id);
  }, [icpId, icps]);

  const goCandidates = (channel: string, jobId?: string) => {
    const params = new URLSearchParams({ channel });
    if (jobId) params.set('job_id', jobId);
    router.push(`/${l}/firma-bulucu/adaylar?${params.toString()}`);
  };

  const start = async () => {
    try {
      if (source === 'b2b') {
        if (!icpId) return toast.error('ICP seçimi gerekli.');
        const job = await startB2b({ icp_id: icpId, source: b2bSource, search_query: query, country, limit }).unwrap();
        toast.success('B2B tarama başladı');
        goCandidates('b2b_directory', job.id);
        return;
      }
      if (source === 'fair') {
        if (!fairUrl.trim()) return toast.error('Fuar URL gerekli.');
        const body = { fair_name: fairName, fair_url: fairUrl, fair_date: fairDate || undefined, icp_id: icpId || undefined, max_exhibitors: limit };
        const job = fairUrl.includes('10times') ? await runFair(body).unwrap() : await startFair(body).unwrap();
        toast.success('Fuar taraması başladı');
        goCandidates('trade_fair', job.id);
        return;
      }
      if (source === 'amazon') {
        if (!keyword.trim()) return toast.error('Keyword gerekli.');
        const job = await startAmazon({ keyword: keyword.trim(), marketplace }).unwrap();
        toast.success('Amazon analizi başladı');
        router.push(`/${l}/amazon?job_id=${job.id}`);
        return;
      }
      const hsCodes = hsPrefix.split(',').map((s) => s.trim()).filter(Boolean);
      if (!hsCodes.length && !productQuery.trim()) return toast.error('HS/GTİP veya ürün sorgusu gerekli.');
      const customsBody: Record<string, unknown> = {
        product_query: productQuery.trim() || undefined,
        buyer_country: customsCountry === 'ALL' ? undefined : customsCountry,
        min_value: minValue.trim() ? Number(minValue) : undefined,
        limit,
        icp_id: icpId || undefined,
      };
      if (hsCodes.length > 1) customsBody.hs_codes = hsCodes;
      else if (hsCodes[0]) customsBody.hs_prefix = hsCodes[0];
      const job = await startCustoms(customsBody).unwrap();
      toast.success('Gümrük taraması başladı');
      goCandidates('customs', job.id);
    } catch {
      toast.error('Tarama başlatılamadı.');
    }
  };

  const inputClass = 'h-10 rounded-md border border-[#cbd5e1] bg-white px-3 text-[13px] text-[#0f172a] outline-none focus:border-[#2563eb]';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0f172a]">Firma Bulucu</h1>
        <p className="mt-0.5 text-[13px] text-[#64748b]">Kaynak seçin, ICP profilini bağlayın ve taramayı başlatın.</p>
      </div>

      <section className="rounded-lg border border-[#e2e8f0] bg-white p-4">
        <p className="mb-3 text-[12px] font-semibold uppercase text-[#64748b]">1. Kaynak</p>
        <div className="grid gap-3 md:grid-cols-4">
          {SOURCES.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setSource(item.key)}
                className={`min-h-32 rounded-lg border p-4 text-left transition ${source === item.key ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#e2e8f0] hover:bg-[#f8fafc]'}`}
              >
                <Icon className="h-6 w-6 text-[#1e40af]" />
                <p className="mt-3 text-[14px] font-bold text-[#0f172a]">{item.label}</p>
                <p className="mt-1 text-[12px] text-[#64748b]">{item.text}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-[#e2e8f0] bg-white p-4">
        <p className="mb-3 text-[12px] font-semibold uppercase text-[#64748b]">2. ICP profili</p>
        <div className="grid gap-3 md:grid-cols-3">
          {icps.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#cbd5e1] px-4 py-8 text-center text-[13px] text-[#64748b]">Henüz ICP profili yok.</div>
          ) : icps.map((icp) => (
            <button key={icp.id} onClick={() => setIcpId(icp.id)} className={`rounded-md border p-3 text-left ${icpId === icp.id ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#e2e8f0] hover:bg-[#f8fafc]'}`}>
              <p className="text-[13px] font-bold text-[#0f172a]">{icp.name}</p>
              <p className="mt-1 truncate text-[12px] text-[#64748b]">{JSON.stringify(icp.definition).slice(0, 90)}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#e2e8f0] bg-white p-4">
        <p className="mb-3 text-[12px] font-semibold uppercase text-[#64748b]">3. Parametreler</p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {source === 'b2b' && (
            <>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Arama terimi</span><input className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} /></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Kaynak</span><select className={inputClass} value={b2bSource} onChange={(e) => setB2bSource(e.target.value)}>{B2B_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Ülke</span><select className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)}>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Limit</span><input type="number" className={inputClass} value={limit} onChange={(e) => setLimit(Number(e.target.value))} /></label>
            </>
          )}
          {source === 'fair' && (
            <>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Fuar adı</span><input className={inputClass} value={fairName} onChange={(e) => setFairName(e.target.value)} /></label>
              <label className="grid gap-1.5 lg:col-span-2"><span className="text-[12px] font-semibold text-[#64748b]">Fuar URL</span><input className={inputClass} value={fairUrl} onChange={(e) => setFairUrl(e.target.value)} /></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Tarih</span><input className={inputClass} value={fairDate} onChange={(e) => setFairDate(e.target.value)} /></label>
            </>
          )}
          {source === 'amazon' && (
            <>
              <label className="grid gap-1.5 lg:col-span-2"><span className="text-[12px] font-semibold text-[#64748b]">Keyword</span><input className={inputClass} value={keyword} onChange={(e) => setKeyword(e.target.value)} /></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Marketplace</span><select className={inputClass} value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>{MARKETPLACES.map((m) => <option key={m} value={m}>amazon.{m}</option>)}</select></label>
            </>
          )}
          {source === 'customs' && (
            <>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">HS/GTİP kodları (virgülle)</span><input className={inputClass} placeholder="0904 veya 0904, 0905" value={hsPrefix} onChange={(e) => setHsPrefix(e.target.value)} /></label>
              <label className="grid gap-1.5 lg:col-span-2"><span className="text-[12px] font-semibold text-[#64748b]">Ürün sorgusu</span><input className={inputClass} value={productQuery} onChange={(e) => setProductQuery(e.target.value)} /></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Alıcı ülke</span><select className={inputClass} value={customsCountry} onChange={(e) => setCustomsCountry(e.target.value)}><option value="ALL">Tümü</option>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Min. değer (USD)</span><input type="number" className={inputClass} placeholder="1000" value={minValue} onChange={(e) => setMinValue(e.target.value)} /></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Limit</span><input type="number" className={inputClass} value={limit} onChange={(e) => setLimit(Number(e.target.value))} /></label>
            </>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button disabled={busy} onClick={start} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1e40af] px-4 text-[13px] font-semibold text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : source === 'b2b' ? <Search className="h-4 w-4" /> : <Radar className="h-4 w-4" />}
            Taramayı Başlat
          </button>
        </div>
      </section>
    </div>
  );
}
