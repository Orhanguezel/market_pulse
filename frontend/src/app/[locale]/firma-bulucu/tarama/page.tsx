'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, CalendarDays, Database, Loader2, Radar, Search, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import {
  useListIcpProfilesQuery,
  useStartB2bLeadJobMutation,
  useStartCustomsLeadJobMutation,
  useStartFairLeadJobMutation,
  useStartPublicScanMutation,
} from '@/integrations/rtk/hooks';
import FairPicker from '@/components/iy/FairPicker';

type Source = 'b2b' | 'fair' | 'amazon' | 'customs';

const SOURCES: Array<{ key: Source; label: string; text: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'b2b', label: 'B2B Dizin', text: 'Google Maps, Europages veya TOBB üzerinden firma taraması.', icon: Building2 },
  { key: 'fair', label: 'Fuar', text: 'Fuar katılımcı listelerinden aday çıkarma.', icon: CalendarDays },
  { key: 'amazon', label: 'Amazon', text: 'Keyword bazlı pazar ve satıcı risk analizi.', icon: ShoppingCart },
  { key: 'customs', label: 'Gümrük', text: 'HS/GTİP veya ürün sorgusuyla ithalatçı firma bulma.', icon: Database },
];

const B2B_SOURCES = ['google_maps', 'europages', 'tobb'];
const COUNTRIES = ['TR', 'DE', 'NL', 'FR', 'IT', 'ES', 'PL', 'GB', 'US'];
// Gümrük gölü buyer_country'yi TAM İSİM olarak tutar (ISO kodu değil). Filtre eşleşmesi
// için gölde gerçekten veri olan alıcı ülkeleri kullanılır (US/RU/UA ağırlıklı; 16M kayıt).
const CUSTOMS_COUNTRIES = ['United States', 'Russia', 'Ukraine'];
const MARKETPLACES = ['com', 'de', 'co.uk', 'fr', 'it', 'es'];
const COUNTRY_MARKETPLACE: Record<string, string> = { DE: 'de', GB: 'co.uk', FR: 'fr', IT: 'it', ES: 'es', US: 'com' };

function definitionItems(definition: Record<string, unknown>, key: string): string[] {
  const value = definition[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function definitionRecord(definition: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = definition[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Profilde fuar bilgisi (ad/URL) var mı — fuar taramasını hazır kuran profiller bunlar. */
function hasFairBlock(icp?: { definition?: Record<string, unknown> } | null): boolean {
  if (!icp?.definition) return false;
  const fair = definitionRecord(icp.definition, 'fair');
  return Boolean(firstText(fair.name, fair.url, fair.exhibitor_list_url));
}

/**
 * Fuar takvimini ICP'ye göre ön-filtrelemek için arama terimleri.
 * Öncelik: profilin fair.search_terms alanı → yoksa alt sektör/sektör/anahtar kelimeler.
 * (Fuar seçici bunlar olmadan 3.400 fuarı ilgisiz sırayla gösteriyordu.)
 */
function fairSearchTerms(icp?: { definition?: Record<string, unknown> } | null): string[] {
  if (!icp?.definition) return [];
  const fair = definitionRecord(icp.definition, 'fair');
  const explicit = definitionItems(fair, 'search_terms');
  if (explicit.length) return explicit;
  return [
    ...definitionItems(icp.definition, 'sub_sectors'),
    ...definitionItems(icp.definition, 'sectors'),
    ...definitionItems(icp.definition, 'keywords'),
  ].slice(0, 6);
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const item = value.find((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim()));
      if (item) return item.trim();
    }
  }
  return '';
}

function IcpSummary({ definition }: { definition: Record<string, unknown> }) {
  const sectors = definitionItems(definition, 'sectors');
  const firmTypes = definitionItems(definition, 'firm_types');
  const priorityCountries = definitionItems(definition, 'priority_geographies');
  const countries = priorityCountries.length ? priorityCountries : definitionItems(definition, 'geographies');
  const tags = [...sectors.slice(0, 2), ...firmTypes.slice(0, 1), ...countries.slice(0, 3)];

  return tags.length ? (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-[#475569] ring-1 ring-[#dbeafe]">{tag}</span>)}
    </div>
  ) : <p className="mt-1 text-[12px] text-[#94a3b8]">Profil alanları henüz doldurulmamış.</p>;
}

export default function FirmaBulucuTaramaPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const l = locale || 'tr';
  const { data: icps = [] } = useListIcpProfilesQuery();
  const [startB2b, b2bState] = useStartB2bLeadJobMutation();
  const [startFair, fairState] = useStartFairLeadJobMutation();
  const [startCustoms, customsState] = useStartCustomsLeadJobMutation();
  const [startAmazon, amazonState] = useStartPublicScanMutation();

  const [source, setSource] = React.useState<Source>('b2b');
  const [icpId, setIcpId] = React.useState('');
  const [b2bSource, setB2bSource] = React.useState('google_maps');
  const [query, setQuery] = React.useState('');
  const [country, setCountry] = React.useState('DE');
  const [limit, setLimit] = React.useState(25);
  const [fairName, setFairName] = React.useState('');
  const [fairUrl, setFairUrl] = React.useState('');
  const [fairDate, setFairDate] = React.useState('');
  const [keyword, setKeyword] = React.useState('');
  const [marketplace, setMarketplace] = React.useState('de');
  const [hsPrefix, setHsPrefix] = React.useState('');
  const [productQuery, setProductQuery] = React.useState('');
  const [customsCountry, setCustomsCountry] = React.useState('ALL');
  const [minValue, setMinValue] = React.useState('');
  const busy = b2bState.isLoading || fairState.isLoading || customsState.isLoading || amazonState.isLoading;

  React.useEffect(() => {
    if (!icpId && icps[0]?.id) {
      setIcpId(icps[0].id);
      applyIcpDefaults(icps[0], source);
    }
    // İlk API yüklemesinde bir kez varsayılan profili seçer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icpId, icps]);

  const applyIcpDefaults = (icp: (typeof icps)[number], targetSource: Source) => {
    const definition = icp.definition ?? {};
    const sectors = definitionItems(definition, 'sectors');
    const subSectors = definitionItems(definition, 'sub_sectors');
    const firmTypes = definitionItems(definition, 'firm_types');
    const keywords = definitionItems(definition, 'keywords');
    const priorityCountries = definitionItems(definition, 'priority_geographies');
    const countries = definitionItems(definition, 'geographies');
    const selectedCountry = firstText(priorityCountries, countries) || 'DE';

    if (targetSource === 'b2b') {
      const explicitQueries = definitionItems(definition, 'search_queries');
      const termParts = explicitQueries.length
        ? [explicitQueries[0]]
        : [firstText(keywords, subSectors, sectors), firstText(firmTypes)];
      setQuery(termParts.filter(Boolean).join(' '));
      setCountry(selectedCountry);
      const preferredSource = firstText(definition.preferred_b2b_source, definitionItems(definition, 'b2b_sources'));
      setB2bSource(B2B_SOURCES.includes(preferredSource) ? preferredSource : 'google_maps');
    }

    if (targetSource === 'fair') {
      const fair = definitionRecord(definition, 'fair');
      const dates = firstText(fair.dates);
      setFairName(firstText(fair.name));
      setFairUrl(firstText(fair.url, fair.exhibitor_list_url));
      setFairDate(firstText(fair.start_date, dates.split('/')[0]));
    }

    if (targetSource === 'amazon') {
      setKeyword(firstText(definition.amazon_keyword, keywords, subSectors, sectors));
      const preferredMarketplace = firstText(definition.amazon_marketplace);
      setMarketplace(MARKETPLACES.includes(preferredMarketplace) ? preferredMarketplace : COUNTRY_MARKETPLACE[selectedCountry] ?? 'com');
    }

    if (targetSource === 'customs') {
      setHsPrefix(definitionItems(definition, 'hs_codes').join(', '));
      setProductQuery(firstText(definition.customs_product_query, keywords, subSectors, sectors));
      setCustomsCountry(selectedCountry);
    }
  };

  const selectIcp = (icp: (typeof icps)[number]) => {
    setIcpId(icp.id);
    applyIcpDefaults(icp, source);
  };

  const selectSource = (nextSource: Source) => {
    setSource(nextSource);
    const selectedIcp = icps.find((icp) => icp.id === icpId);

    // Fuara geçildiğinde seçili profilde fuar bilgisi yoksa, fuar bilgisi olan bir profile geç.
    // (Aksi halde fuar adı/URL alanları boş kalıyor ve profil "fuara uygun değil" gibi görünüyordu.)
    if (nextSource === 'fair' && !hasFairBlock(selectedIcp)) {
      const fairIcp = icps.find(hasFairBlock);
      if (fairIcp) {
        setIcpId(fairIcp.id);
        applyIcpDefaults(fairIcp, nextSource);
        return;
      }
    }
    if (selectedIcp) applyIcpDefaults(selectedIcp, nextSource);
  };

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
        if (!icpId) return toast.error('ICP seçimi gerekli.');
        const selectedIcp = icps.find((icp) => icp.id === icpId);
        const definition = selectedIcp?.definition ?? {};
        const configuredMax = Number(definition.fair_max_exhibitors ?? 2500);
        const body = {
          fair_name: fairName,
          fair_url: fairUrl,
          fair_date: fairDate || undefined,
          icp_id: icpId,
          hall_filters: definitionItems(definition, 'target_halls'),
          max_pages: Number(definition.fair_max_pages ?? 120),
          max_exhibitors: Number.isFinite(configuredMax) ? configuredMax : 2500,
          detail_concurrency: Number(definition.detail_concurrency ?? 2),
        };
        const job = await startFair(body).unwrap();
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
    } catch (error) {
      const apiError = error as { status?: number; data?: { error?: { message?: string; plan?: string; daily_limit?: number } } };
      if (apiError.status === 429 && apiError.data?.error?.message === 'daily_limit_reached') {
        toast.error(`Günlük tarama kotası doldu (${apiError.data.error.plan ?? 'plan'}: ${apiError.data.error.daily_limit ?? 0}).`);
      } else if (apiError.status === 401) {
        toast.error('Oturum süresi doldu. Yeniden giriş yapın.');
      } else {
        toast.error('Tarama başlatılamadı.');
      }
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
                onClick={() => selectSource(item.key)}
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
        <p className="mb-1 text-[12px] font-semibold uppercase text-[#64748b]">2. ICP profili</p>
        {source === 'fair' && (
          <p className="mb-3 text-[12px] text-[#64748b]">
            ICP profili katılımcıları filtrelemek için kullanılır. Fuar bilgisi profilde kayıtlı değilse aşağıdaki takvimden seçebilirsiniz.
          </p>
        )}
        <div className="grid gap-3 md:grid-cols-3">
          {icps.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#cbd5e1] px-4 py-8 text-center text-[13px] text-[#64748b]">Henüz ICP profili yok.</div>
          ) : icps.map((icp) => (
            <button key={icp.id} onClick={() => selectIcp(icp)} className={`rounded-md border p-3 text-left ${icpId === icp.id ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#e2e8f0] hover:bg-[#f8fafc]'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-bold text-[#0f172a]">{icp.name}</p>
                <span className="flex shrink-0 items-center gap-1.5">
                  {source === 'fair' && hasFairBlock(icp) && (
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">fuar hazır</span>
                  )}
                  {typeof icp.definition.version === 'number' && <span className="text-[10px] font-semibold text-[#64748b]">v{icp.definition.version}</span>}
                </span>
              </div>
              <IcpSummary definition={icp.definition} />
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
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Ülke</span><select className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)}>{Array.from(new Set([country, ...COUNTRIES])).map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Limit</span><input type="number" className={inputClass} value={limit} onChange={(e) => setLimit(Number(e.target.value))} /></label>
            </>
          )}
          {source === 'fair' && (
            <>
              <div className="lg:col-span-4">
                <FairPicker
                  suggestedTerms={fairSearchTerms(icps.find((icp) => icp.id === icpId))}
                  onPick={(fair, exhibitorUrl, startDate) => {
                    setFairName(fair.name);
                    setFairDate((startDate ?? fair.start_date ?? '').slice(0, 10));
                    if (exhibitorUrl) setFairUrl(exhibitorUrl);
                  }}
                />
              </div>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Fuar adı</span><input className={inputClass} value={fairName} onChange={(e) => setFairName(e.target.value)} /></label>
              <label className="grid gap-1.5 lg:col-span-2"><span className="text-[12px] font-semibold text-[#64748b]">Katılımcı listesi URL</span><input className={inputClass} placeholder="Fuarın exhibitor/katılımcı sayfası" value={fairUrl} onChange={(e) => setFairUrl(e.target.value)} /></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Tarih</span><input type="date" className={inputClass} value={fairDate} onChange={(e) => setFairDate(e.target.value)} /></label>
            </>
          )}
          {source === 'amazon' && (
            <>
              <label className="grid gap-1.5 lg:col-span-2"><span className="text-[12px] font-semibold text-[#64748b]">Keyword</span><input className={inputClass} value={keyword} onChange={(e) => setKeyword(e.target.value)} /></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Marketplace</span><select className={inputClass} value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>{Array.from(new Set([marketplace, ...MARKETPLACES])).map((m) => <option key={m} value={m}>amazon.{m}</option>)}</select></label>
            </>
          )}
          {source === 'customs' && (
            <>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">HS/GTİP kodları (virgülle)</span><input className={inputClass} placeholder="0904 veya 0904, 0905" value={hsPrefix} onChange={(e) => setHsPrefix(e.target.value)} /></label>
              <label className="grid gap-1.5 lg:col-span-2"><span className="text-[12px] font-semibold text-[#64748b]">Ürün sorgusu</span><input className={inputClass} value={productQuery} onChange={(e) => setProductQuery(e.target.value)} /></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Alıcı ülke</span><select className={inputClass} value={customsCountry} onChange={(e) => setCustomsCountry(e.target.value)}><option value="ALL">Tümü (önerilen)</option>{Array.from(new Set([...CUSTOMS_COUNTRIES, customsCountry])).filter((c) => c !== 'ALL').map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
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
