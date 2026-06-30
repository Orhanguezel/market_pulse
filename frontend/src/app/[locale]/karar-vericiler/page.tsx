'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, Download, ExternalLink, Loader2, Play, Radar, RefreshCw, Search } from 'lucide-react';
import {
  useGetDecisionMakerPresetsQuery,
  useLazyExportDecisionMakersCsvQuery,
  useLazyExportDecisionMakersXlsxQuery,
  useListDecisionMakerCompanyPoolQuery,
  useListDecisionMakerJobsQuery,
  useListDecisionMakerResultsQuery,
  useStartDecisionMakerJobMutation,
  type CompanyQualityStatus,
  type DecisionMakerConfidence,
  type DecisionMakerRow,
} from '@/integrations/rtk/public/decision-maker.endpoints';

const POPPINS = { fontFamily: 'var(--font-poppins), system-ui, sans-serif' } as const;
const CITY_SUGGEST = ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa', 'Kocaeli', 'Konya', 'Adana', 'Mersin', 'Mugla', 'Gaziantep', 'Berlin', 'Amsterdam', 'Dubai', 'London'];
const DEFAULT_TITLES = ['Founder', 'Owner', 'CEO', 'General Manager', 'Kurucu', 'Isletme Sahibi', 'Genel Mudur'];

const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: 'TR', name: 'Turkiye' }, { code: 'DE', name: 'Almanya' }, { code: 'NL', name: 'Hollanda' },
  { code: 'FR', name: 'Fransa' }, { code: 'GB', name: 'Birlesik Krallik' }, { code: 'US', name: 'ABD' },
  { code: 'AE', name: 'Birlesik Arap Emirlikleri' }, { code: 'SA', name: 'Suudi Arabistan' }, { code: 'QA', name: 'Katar' },
  { code: 'AZ', name: 'Azerbaycan' }, { code: 'IT', name: 'Italya' }, { code: 'ES', name: 'Ispanya' },
  { code: 'BE', name: 'Belcika' }, { code: 'AT', name: 'Avusturya' }, { code: 'CH', name: 'Isvicre' },
  { code: 'SE', name: 'Isvec' }, { code: 'NO', name: 'Norvec' }, { code: 'DK', name: 'Danimarka' },
  { code: 'FI', name: 'Finlandiya' }, { code: 'PL', name: 'Polonya' }, { code: 'CZ', name: 'Cekya' },
  { code: 'RO', name: 'Romanya' }, { code: 'BG', name: 'Bulgaristan' }, { code: 'GR', name: 'Yunanistan' },
  { code: 'PT', name: 'Portekiz' }, { code: 'IE', name: 'Irlanda' }, { code: 'HU', name: 'Macaristan' },
  { code: 'RU', name: 'Rusya' }, { code: 'UA', name: 'Ukrayna' }, { code: 'KZ', name: 'Kazakistan' },
  { code: 'UZ', name: 'Ozbekistan' }, { code: 'GE', name: 'Gurcistan' }, { code: 'IQ', name: 'Irak' },
  { code: 'KW', name: 'Kuveyt' }, { code: 'BH', name: 'Bahreyn' }, { code: 'OM', name: 'Umman' },
  { code: 'JO', name: 'Urdun' }, { code: 'LB', name: 'Lubnan' }, { code: 'EG', name: 'Misir' },
  { code: 'MA', name: 'Fas' }, { code: 'DZ', name: 'Cezayir' }, { code: 'TN', name: 'Tunus' },
  { code: 'LY', name: 'Libya' }, { code: 'IL', name: 'Israil' }, { code: 'CA', name: 'Kanada' },
  { code: 'MX', name: 'Meksika' }, { code: 'BR', name: 'Brezilya' }, { code: 'AR', name: 'Arjantin' },
  { code: 'IN', name: 'Hindistan' }, { code: 'CN', name: 'Cin' }, { code: 'JP', name: 'Japonya' },
  { code: 'KR', name: 'Guney Kore' }, { code: 'SG', name: 'Singapur' }, { code: 'MY', name: 'Malezya' },
  { code: 'ID', name: 'Endonezya' }, { code: 'TH', name: 'Tayland' }, { code: 'VN', name: 'Vietnam' },
  { code: 'AU', name: 'Avustralya' }, { code: 'NZ', name: 'Yeni Zelanda' }, { code: 'ZA', name: 'Guney Afrika' },
  { code: 'NG', name: 'Nijerya' }, { code: 'KE', name: 'Kenya' }, { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Banglades' }, { code: 'IR', name: 'Iran' }, { code: 'CY', name: 'Kibris' },
  { code: 'RS', name: 'Sirbistan' }, { code: 'HR', name: 'Hirvatistan' }, { code: 'SK', name: 'Slovakya' },
  { code: 'SI', name: 'Slovenya' }, { code: 'LT', name: 'Litvanya' }, { code: 'LV', name: 'Letonya' },
  { code: 'EE', name: 'Estonya' }, { code: 'MD', name: 'Moldova' }, { code: 'AL', name: 'Arnavutluk' },
  { code: 'MK', name: 'Kuzey Makedonya' }, { code: 'BA', name: 'Bosna Hersek' }, { code: 'XK', name: 'Kosova' },
  { code: 'TM', name: 'Turkmenistan' }, { code: 'KG', name: 'Kirgizistan' }, { code: 'TJ', name: 'Tacikistan' },
];

/** Aranabilir ulke secici (find ile): listede ara, sec; backend regionCode (2 harf) kullanir. */
function CountrySelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const selected = COUNTRIES.find((c) => c.code === value.toUpperCase());
  const term = q.trim().toLowerCase();
  const filtered = COUNTRIES.filter((c) => !term || c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)).slice(0, 60);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md border border-[#cbd5e1] px-3 py-2 text-[14px] hover:border-[#1e40af]"
      >
        <span className={selected ? '' : 'text-[#94a3b8]'}>{selected ? `${selected.name} (${selected.code})` : (value || 'Ulke sec / ara')}</span>
        <ChevronDown className="h-4 w-4 text-[#94a3b8]" />
      </button>
      {open ? (
        <>
          <button type="button" aria-hidden onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-[#cbd5e1] bg-white shadow-lg">
            <div className="border-b border-[#e2e8f0] p-2">
              <div className="flex items-center gap-2 rounded-md border border-[#cbd5e1] px-2 focus-within:border-[#1e40af]">
                <Search className="h-3.5 w-3.5 text-[#94a3b8]" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ulke ara..." className="w-full bg-transparent py-1.5 text-[13px] outline-none" />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length ? filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChange(c.code); setOpen(false); setQ(''); }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] hover:bg-[#eff6ff] ${c.code === value.toUpperCase() ? 'bg-[#eff6ff] font-semibold text-[#1e40af]' : 'text-[#334155]'}`}
                >
                  <span>{c.name}</span>
                  <span className="text-[11px] text-[#94a3b8]">{c.code}</span>
                </button>
              )) : <div className="px-3 py-2 text-[13px] text-[#94a3b8]">Sonuc yok</div>}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Apollo benzeri serbest etiket girisi: yaz + Enter/virgul ile ekle, x ile sil. */
function TagInput({ value, onChange, placeholder, suggestions, tone = 'primary' }: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  suggestions?: string[];
  tone?: 'primary' | 'dark';
}) {
  const [text, setText] = useState('');
  const chipCls = tone === 'dark' ? 'bg-[#0f172a]' : 'bg-[#1e40af]';
  const add = (raw: string) => {
    const items = raw.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    const next = [...value];
    for (const item of items) {
      if (!next.some((v) => v.toLowerCase() === item.toLowerCase())) next.push(item);
    }
    onChange(next);
    setText('');
  };
  const remove = (item: string) => onChange(value.filter((v) => v !== item));
  const available = (suggestions ?? []).filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-[#cbd5e1] px-2 py-1.5 focus-within:border-[#1e40af]">
        {value.map((item) => (
          <span key={item} className={`inline-flex items-center gap-1 rounded-md ${chipCls} px-2 py-1 text-[12.5px] font-semibold text-white`}>
            {item}
            <button type="button" onClick={() => remove(item)} aria-label={`${item} kaldir`} className="leading-none text-white/70 hover:text-white">×</button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); }
            else if (e.key === 'Backspace' && !text && value.length) { remove(value[value.length - 1]); }
          }}
          onBlur={() => { if (text.trim()) add(text); }}
          placeholder={value.length ? '' : placeholder}
          className="min-w-[140px] flex-1 border-0 bg-transparent px-1 py-1 text-[14px] outline-none"
        />
      </div>
      {available.length ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {available.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-md border border-dashed border-[#cbd5e1] px-2 py-1 text-[12px] font-semibold text-[#475569] transition-colors hover:border-[#1e40af] hover:text-[#1e40af]">
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const CONF_CLS: Record<DecisionMakerConfidence, string> = {
  A: 'bg-[#dcfce7] text-[#166534]',
  B: 'bg-[#fef9c3] text-[#854d0e]',
  C: 'bg-[#f1f5f9] text-[#64748b]',
};

const STATUS_COPY: Record<string, string> = {
  pending: 'Bekliyor',
  running: 'Calisiyor',
  done: 'Tamamlandi',
  failed: 'Hata',
};

const QUALITY_COPY: Record<CompanyQualityStatus, string> = {
  qualified: 'Qualified',
  possible: 'Possible',
  manual_review: 'Manual',
  excluded: 'Excluded',
};

const QUALITY_CLS: Record<CompanyQualityStatus, string> = {
  qualified: 'bg-[#dcfce7] text-[#166534]',
  possible: 'bg-[#fef9c3] text-[#854d0e]',
  manual_review: 'bg-[#ffedd5] text-[#9a3412]',
  excluded: 'bg-[#fee2e2] text-[#991b1b]',
};

function isRunning(status?: string) {
  return status === 'pending' || status === 'running';
}

function splitLines(value: string) {
  return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
}

function buildFilename(jobId: string | null, confidence: string, format: 'csv' | 'xlsx') {
  const suffix = jobId ? jobId.slice(0, 8) : new Date().toISOString().slice(0, 10);
  return `karar-vericiler-${confidence}-${suffix}.${format}`;
}

export default function KararVericilerPage() {
  const { data: presets } = useGetDecisionMakerPresetsQuery();
  const { data: jobs = [], isFetching: jobsFetching, refetch: refetchJobs } = useListDecisionMakerJobsQuery(undefined, { pollingInterval: 10000 });
  const [startJob, startState] = useStartDecisionMakerJobMutation();
  const [exportCsv, exportState] = useLazyExportDecisionMakersCsvQuery();
  const [exportXlsx, exportXlsxState] = useLazyExportDecisionMakersXlsxQuery();

  const [sector, setSector] = useState('fitness');
  const [country, setCountry] = useState('TR');
  const [cities, setCities] = useState<string[]>(['Istanbul', 'Ankara', 'Izmir']);
  const [target, setTarget] = useState(100);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>(DEFAULT_TITLES);
  const [excludeText, setExcludeText] = useState('');
  const [apolloFallback, setApolloFallback] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<DecisionMakerConfidence | 'all'>('all');
  const [onlyLinkedin, setOnlyLinkedin] = useState(false);
  const [hideEmptyPeople, setHideEmptyPeople] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sectorTypes = presets?.business_types?.[sector] ?? [];
  const titleSuggestions = useMemo(() => {
    const all = [...DEFAULT_TITLES, ...(presets?.default_titles ?? []), ...(presets?.export_b2b_titles ?? [])];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of all) {
      const key = t.toLowerCase();
      if (!seen.has(key)) { seen.add(key); out.push(t); }
    }
    return out;
  }, [presets?.default_titles, presets?.export_b2b_titles]);
  const activeJob = jobs.find((job) => job.id === activeJobId) ?? jobs[0] ?? null;

  const { data: results, isFetching: resultsFetching, refetch: refetchResults } = useListDecisionMakerResultsQuery({
    job_id: activeJob?.id,
    confidence,
    limit: 500,
  }, {
    skip: !activeJob?.id,
    pollingInterval: isRunning(activeJob?.status) ? 10000 : 0,
  });
  const { data: companyPool } = useListDecisionMakerCompanyPoolQuery({
    job_id: activeJob?.id,
    include_excluded: false,
    limit: 200,
  }, {
    skip: !activeJob?.id,
    pollingInterval: isRunning(activeJob?.status) ? 10000 : 0,
  });

  const rows = useMemo(() => {
    const base = results?.rows ?? [];
    return base.filter((row) => {
      if (onlyLinkedin && !row.linkedin_profile_url) return false;
      if (hideEmptyPeople && !row.decision_maker_name) return false;
      return true;
    });
  }, [hideEmptyPeople, onlyLinkedin, results?.rows]);
  const poolRows = companyPool?.rows ?? [];

  const run = async () => {
    if (!cities.length || startState.isLoading) return;
    setError(null);
    try {
      const job = await startJob({
        sector,
        cities,
        country: (country || 'TR').trim().toUpperCase(),
        businessTypes: selectedTypes.length ? selectedTypes : undefined,
        titles: titles.length ? titles : DEFAULT_TITLES,
        excludeKeywords: splitLines(excludeText || (presets?.default_exclude_keywords ?? []).join('\n')),
        apolloFallback,
        targetCount: Math.min(Math.max(target, 10), 200),
        perCityLimit: Math.max(5, Math.ceil(target / Math.max(cities.length, 1))),
      }).unwrap();
      setActiveJobId(job.id);
      await refetchJobs();
    } catch {
      setError('Arama baslatilamadi. Yetki, modul veya API limitlerini kontrol edin.');
    }
  };

  const download = async (format: 'csv' | 'xlsx' = 'csv') => {
    if (!activeJob?.id || exportState.isFetching || exportXlsxState.isFetching) return;
    try {
      const data = format === 'csv'
        ? await exportCsv({ job_id: activeJob.id, confidence }).unwrap()
        : await exportXlsx({ job_id: activeJob.id, confidence }).unwrap();
      const blob = new Blob([data], {
        type: format === 'csv'
          ? 'text/csv;charset=utf-8;'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = buildFilename(activeJob.id, confidence, format);
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(`${format.toUpperCase()} indirilemedi.`);
    }
  };

  return (
    <div style={POPPINS} className="space-y-4 text-[#0f172a]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Radar className="h-5 w-5 text-[#1e40af]" />
            Karar Verici Bulma
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 text-[12px] font-semibold">
            <span className="rounded-md bg-[#eff6ff] px-2 py-1 text-[#1e40af]">Google Places</span>
            <span className="rounded-md bg-[#ecfdf5] px-2 py-1 text-[#047857]">LinkedIn kaynakli OSINT</span>
            <span className="rounded-md bg-[#f8fafc] px-2 py-1 text-[#475569]">A/B/C skor</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { refetchJobs(); refetchResults(); }}
          className="inline-flex items-center gap-2 rounded-md border border-[#cbd5e1] px-3 py-2 text-[13px] font-semibold text-[#334155] hover:bg-[#f8fafc]"
        >
          <RefreshCw className={`h-4 w-4 ${jobsFetching || resultsFetching ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#475569]">Sektor</span>
                <input
                  list="sector-options"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="Sektor yaz veya sec"
                  className="w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-[14px]"
                />
                <datalist id="sector-options">
                  {(presets?.sectors ?? ['fitness', 'pilates', 'wellness', 'boutique']).map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>
              <div className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#475569]">Ulke</span>
                <CountrySelect value={country} onChange={setCountry} />
              </div>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#475569]">Hedef kayit</span>
                <input type="number" min={10} max={200} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-[14px]" />
              </label>
            </div>

            <div>
              <span className="mb-1.5 block text-[12px] font-semibold text-[#475569]">Sehirler <span className="font-normal text-[#94a3b8]">— yaz + Enter, tum Turkiye / diger ulkeler</span></span>
              <TagInput
                value={cities}
                onChange={setCities}
                placeholder="Sehir yaz, Enter'a bas (or. Istanbul, Berlin, Dubai)"
                suggestions={CITY_SUGGEST}
              />
            </div>

            <div>
              <span className="mb-1.5 block text-[12px] font-semibold text-[#475569]">Isletme turleri <span className="font-normal text-[#94a3b8]">— sektore gore oneriler, serbest ekle</span></span>
              <TagInput
                value={selectedTypes}
                onChange={setSelectedTypes}
                placeholder="Tur ekle (or. crossfit box, yoga studio)"
                suggestions={sectorTypes}
                tone="dark"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[#475569]">Karar verici unvanlari <span className="font-normal text-[#94a3b8]">— sec / yaz ekle, x ile kaldir</span></span>
              <TagInput
                value={titles}
                onChange={setTitles}
                placeholder="Unvan ekle (or. Founder, Purchasing Manager)"
                suggestions={titleSuggestions}
              />
            </div>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[#475569]">Hariç tutulacak kelimeler</span>
              <textarea
                value={excludeText}
                onChange={(e) => setExcludeText(e.target.value)}
                placeholder={(presets?.default_exclude_keywords ?? []).join(', ')}
                rows={5}
                className="w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-[13px]"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[12px] font-bold uppercase text-[#475569]">Kredi korumasi</div>
            <p className="mt-0.5 text-[12px] text-[#64748b]">Apollo fallback kapaliysa arastirma asamasinda Apollo kredisi harcanmaz.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-bold text-[#0f172a]">
            <input type="checkbox" checked={apolloFallback} onChange={(e) => setApolloFallback(e.target.checked)} className="h-4 w-4" />
            Ucretli Apollo fallback
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={startState.isLoading || cities.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-[#1e40af] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#15317f] disabled:opacity-50"
          >
            {startState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Job Baslat
          </button>
          {activeJob ? (
            <span className="inline-flex items-center gap-2 rounded-md bg-[#f8fafc] px-3 py-2 text-[13px] font-semibold text-[#475569]">
              {isRunning(activeJob.status) ? <Loader2 className="h-4 w-4 animate-spin text-[#1e40af]" /> : <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />}
              {STATUS_COPY[activeJob.status] ?? activeJob.status} · {activeJob.result_count ?? 0} sonuc
            </span>
          ) : null}
          {error ? (
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#b91c1c]">
              <AlertCircle className="h-4 w-4" />
              {error}
            </span>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-[#e2e8f0] bg-white">
        <div className="border-b border-[#e2e8f0] px-4 py-3">
          <h2 className="text-[15px] font-bold">Sirket Havuzu</h2>
          <p className="mt-0.5 text-[12px] text-[#64748b]">
            {companyPool ? `${companyPool.stats.total} sirket · ${companyPool.stats.qualified} qualified · ${companyPool.stats.possible} possible · ${companyPool.stats.excluded} excluded gizli` : 'Job secildiginde sirket havuzu gelir.'}
          </p>
        </div>
        {poolRows.length ? (
          <div className="overflow-x-auto border-b border-[#e2e8f0]">
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[11.5px] uppercase text-[#64748b]">
                  <th className="px-3 py-2.5">Firma</th>
                  <th className="px-3 py-2.5">Sehir</th>
                  <th className="px-3 py-2.5">Tur</th>
                  <th className="px-3 py-2.5">Skor</th>
                  <th className="px-3 py-2.5">Durum</th>
                  <th className="px-3 py-2.5">Kaynak</th>
                </tr>
              </thead>
              <tbody>
                {poolRows.slice(0, 30).map((row) => (
                  <tr key={`${row.company_name}-${row.city}`} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#eff6ff]/40">
                    <td className="px-3 py-2.5 font-semibold">{row.company_name}</td>
                    <td className="px-3 py-2.5 text-[#475569]">{row.city || '-'}</td>
                    <td className="px-3 py-2.5 text-[#475569]">{row.business_type || '-'}</td>
                    <td className="px-3 py-2.5 font-mono">{row.quality_score}</td>
                    <td className="px-3 py-2.5"><span className={`rounded-md px-2 py-1 text-[11px] font-bold ${QUALITY_CLS[row.quality_status]}`}>{QUALITY_COPY[row.quality_status]}</span></td>
                    <td className="px-3 py-2.5">
                      {row.google_maps_url ? <a href={row.google_maps_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1e40af] hover:underline">Maps</a> : row.website ? <a href={row.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1e40af] hover:underline">Web</a> : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] px-4 py-3">
          <div>
            <h2 className="text-[15px] font-bold">Sonuclar</h2>
            <p className="mt-0.5 text-[12px] text-[#64748b]">
              {results ? `${results.stats.companies} sirket · ${results.stats.withDecisionMaker} karar verici · ${rows.length} gorunen satir` : 'Job secildiginde sonuc gelir.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={activeJob?.id ?? ''} onChange={(e) => setActiveJobId(e.target.value)} className="max-w-[230px] rounded-md border border-[#cbd5e1] px-2 py-2 text-[12px]">
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.status} · {String(job.params?.sector ?? 'sector')} · {new Date(job.created_at).toLocaleDateString('tr-TR')}
                </option>
              ))}
            </select>
            <select value={confidence} onChange={(e) => setConfidence(e.target.value as DecisionMakerConfidence | 'all')} className="rounded-md border border-[#cbd5e1] px-2 py-2 text-[12px]">
              <option value="all">A+B+C</option>
              <option value="A">Sadece A</option>
              <option value="B">Sadece B</option>
              <option value="C">Sadece C</option>
            </select>
            <button type="button" onClick={() => setOnlyLinkedin((value) => !value)} className={`rounded-md px-3 py-2 text-[12px] font-semibold ${onlyLinkedin ? 'bg-[#1e40af] text-white' : 'border border-[#cbd5e1] text-[#475569]'}`}>
              LinkedIn var
            </button>
            <button type="button" onClick={() => setHideEmptyPeople((value) => !value)} className={`rounded-md px-3 py-2 text-[12px] font-semibold ${hideEmptyPeople ? 'bg-[#0f172a] text-white' : 'border border-[#cbd5e1] text-[#475569]'}`}>
              Bos kisiyi gizle
            </button>
            <button type="button" onClick={() => download('csv')} disabled={!activeJob?.id || exportState.isFetching} className="inline-flex items-center gap-2 rounded-md border border-[#1e40af]/30 px-3 py-2 text-[12px] font-semibold text-[#1e40af] hover:bg-[#eff6ff] disabled:opacity-50">
              {exportState.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              CSV
            </button>
            <button type="button" onClick={() => download('xlsx')} disabled={!activeJob?.id || exportXlsxState.isFetching} className="inline-flex items-center gap-2 rounded-md border border-[#1e40af]/30 px-3 py-2 text-[12px] font-semibold text-[#1e40af] hover:bg-[#eff6ff] disabled:opacity-50">
              {exportXlsxState.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              XLSX
            </button>
          </div>
        </div>

        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[11.5px] uppercase text-[#64748b]">
                  <th className="px-3 py-2.5">Firma</th>
                  <th className="px-3 py-2.5">Sehir</th>
                  <th className="px-3 py-2.5">Tur</th>
                  <th className="px-3 py-2.5">Karar Verici</th>
                  <th className="px-3 py-2.5">Unvan</th>
                  <th className="px-3 py-2.5">Kanallar</th>
                  <th className="px-3 py-2.5">Skor</th>
                  <th className="px-3 py-2.5">Not</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: DecisionMakerRow, index) => (
                  <tr key={`${row.company_name}-${row.linkedin_profile_url ?? index}`} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#eff6ff]/40">
                    <td className="px-3 py-2.5 font-semibold">{row.company_name}</td>
                    <td className="px-3 py-2.5 text-[#475569]">{row.city || '-'}</td>
                    <td className="px-3 py-2.5 text-[#475569]">{row.business_type || '-'}</td>
                    <td className="px-3 py-2.5">{row.decision_maker_name || <span className="text-[#94a3b8]">Manuel kontrol</span>}</td>
                    <td className="px-3 py-2.5 text-[#475569]">{row.title || '-'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-2">
                        {row.linkedin_profile_url ? <a href={row.linkedin_profile_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#1e40af] hover:underline">LinkedIn <ExternalLink className="h-3 w-3" /></a> : null}
                        {row.company_website ? <a href={row.company_website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#1e40af] hover:underline">Web <ExternalLink className="h-3 w-3" /></a> : null}
                        {row.source_url && row.source_url !== row.linkedin_profile_url ? <a href={row.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#475569] hover:underline">Kaynak <ExternalLink className="h-3 w-3" /></a> : null}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${CONF_CLS[row.confidence_score]}`}>{row.confidence_score}</span>
                    </td>
                    <td className="max-w-[260px] px-3 py-2.5 text-[12px] text-[#64748b]">{row.fit_note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center px-4 py-10 text-center text-[#64748b]">
            <div>
              <Search className="mx-auto h-8 w-8 text-[#94a3b8]" />
              <p className="mt-2 text-[14px] font-semibold">Sonuc bulunmuyor</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
