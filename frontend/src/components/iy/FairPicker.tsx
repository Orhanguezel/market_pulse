'use client';

import * as React from 'react';
import { CalendarDays, Loader2, MapPin, Search, Link2, CheckCircle2, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useLazySearchFairCatalogQuery,
  useDiscoverFairExhibitorMutation,
  useSetFairExhibitorUrlMutation,
} from '@/integrations/rtk/hooks';
import type { FairCatalogItem } from '@/integrations/shared/lead-machine.types';

function fmtDate(d: string | null): string {
  if (!d) return 'tarih belirsiz';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const isPast = (d: string | null) => !!d && d.slice(0, 10) < new Date().toISOString().slice(0, 10);

/**
 * Fuar takvimi seçici (dropdown).
 *
 * Katalog 3400+ fuar içerir. Dünya takvimi kayıtlarının tarihi 2024'te kalmıştır ve
 * web sitesi yoktur; fuar seçilince ÜCRETSİZ keşif çalışır ve fuarın resmî sitesi,
 * güncel tarihi ve katılımcı (exhibitor) sayfası bulunup kataloğa yazılır.
 */
export default function FairPicker({
  onPick,
  suggestedTerms = [],
}: {
  onPick: (fair: FairCatalogItem, exhibitorUrl: string | null, startDate?: string | null) => void;
  /** Seçili ICP profilinden gelen sektör/anahtar kelimeler — katalog bunlarla ön-filtrelenir. */
  suggestedTerms?: string[];
}) {
  const [q, setQ] = React.useState('');
  const [upcoming, setUpcoming] = React.useState(false);
  const [source, setSource] = React.useState<'' | 'tr_takvim' | 'dunya_takvim'>('');
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<FairCatalogItem | null>(null);
  const [manualUrl, setManualUrl] = React.useState('');
  const boxRef = React.useRef<HTMLDivElement>(null);

  const [search, searchState] = useLazySearchFairCatalogQuery();
  const [discover, discoverState] = useDiscoverFairExhibitorMutation();
  const [saveUrl, saveState] = useSetFairExhibitorUrlMutation();
  const fairs = React.useMemo(() => searchState.data ?? [], [searchState.data]);

  const runSearch = React.useCallback(
    (term: string, onlyUpcoming: boolean, src: string) => {
      void search({ q: term.trim() || undefined, upcoming: onlyUpcoming, source: src || undefined, limit: 40 });
    },
    [search],
  );

  // Açılınca liste hazır olsun. ICP profilinde sektör/anahtar kelime varsa katalog ONUNLA
  // ön-filtrelenir — aksi halde 3.400 fuar arasından ilgisiz sonuçlar geliyordu.
  React.useEffect(() => {
    if (open && !searchState.data && !searchState.isFetching) {
      runSearch(suggestedTerms[0] ?? '', upcoming, source);
      if (suggestedTerms[0]) setQ(suggestedTerms[0]);
    }
  }, [open, searchState.data, searchState.isFetching, runSearch, upcoming, source, suggestedTerms]);

  // Yazdıkça / filtre değişince ara (debounce)
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => runSearch(q, upcoming, source), 350);
    return () => clearTimeout(t);
  }, [q, upcoming, source, open, runSearch]);

  // Dışarı tıklayınca kapan
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const pick = async (fair: FairCatalogItem) => {
    setSelected(fair);
    setManualUrl(fair.exhibitor_url ?? '');
    setOpen(false);
    setQ('');
    onPick(fair, fair.exhibitor_url, fair.start_date);

    // Katılımcı sayfası yoksa fuarın sitesinden ücretsiz keşfet (site de yoksa önce siteyi bul).
    if (!fair.exhibitor_url) {
      try {
        const res = await discover(fair.id).unwrap();
        if (res.exhibitor_url) {
          setManualUrl(res.exhibitor_url);
          toast.success(res.start_date ? 'Katılımcı sayfası ve güncel tarih bulundu' : 'Katılımcı sayfası bulundu');
        } else {
          toast.info(res.note || 'Katılımcı sayfası bulunamadı — elle girebilirsiniz.');
        }
        onPick(fair, res.exhibitor_url, res.start_date ?? fair.start_date);
      } catch {
        toast.error('Katılımcı sayfası aranamadı');
      }
    }
  };

  const saveManual = async () => {
    if (!selected) return;
    const url = manualUrl.trim();
    if (!/^https?:\/\//i.test(url)) return toast.error('Geçerli bir URL girin (https://...)');
    try {
      await saveUrl({ id: selected.id, exhibitor_url: url }).unwrap();
      onPick(selected, url, selected.start_date);
      toast.success('Katılımcı sayfası kaydedildi');
    } catch {
      toast.error('Kaydedilemedi');
    }
  };

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
      <p className="mb-2 text-[12px] font-semibold text-[#64748b]">Fuar takviminden seç (Türkiye + Dünya · 3.400+ fuar)</p>

      {suggestedTerms.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[#64748b]">ICP profiline göre:</span>
          {suggestedTerms.slice(0, 6).map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => { setQ(term); setOpen(true); runSearch(term, upcoming, source); }}
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                q === term ? 'bg-[#1e40af] text-white' : 'bg-white text-[#1e40af] ring-1 ring-[#dbeafe] hover:bg-[#eff6ff]'
              }`}
            >
              {term}
            </button>
          ))}
          {/* Terim tüm katalogda karşılık bulmayabilir (ör. "rulman" fuar adlarında geçmez) —
              filtreyi tek tıkla kaldırabilmek gerekiyor. */}
          <button
            type="button"
            onClick={() => { setQ(''); setOpen(true); runSearch('', upcoming, source); }}
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              q === '' ? 'bg-[#1e40af] text-white' : 'bg-white text-[#64748b] ring-1 ring-[#e2e8f0] hover:bg-white'
            }`}
          >
            filtresiz
          </button>
        </div>
      )}

      {/* Katalog iki takvimden gelir; hangisine baktığın belli olsun. */}
      <div className="mb-2 flex items-center gap-1">
        {([['', 'Tümü'], ['tr_takvim', 'Türkiye'], ['dunya_takvim', 'Dünya']] as const).map(([value, label]) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => { setSource(value); setOpen(true); }}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
              source === value ? 'bg-white text-[#0f172a] shadow-sm ring-1 ring-[#cbd5e1]' : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div ref={boxRef} className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setOpen(true); runSearch(q, upcoming, source); } }}
              placeholder="Fuar adı, sektör veya şehir ara — ya da listeden seç"
              className="h-9 w-full rounded-md border border-[#cbd5e1] bg-white pl-8 pr-8 text-[13px] outline-none focus:border-[#2563eb]"
            />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Fuar listesini aç"
            >
              {searchState.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          <label className="flex items-center gap-1.5 text-[12px] text-[#475569]">
            <input
              type="checkbox"
              checked={upcoming}
              onChange={(e) => { setUpcoming(e.target.checked); setOpen(true); }}
              className="h-3.5 w-3.5"
            />
            Sadece tarihi güncel fuarlar
          </label>
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-11 z-50 max-h-72 overflow-y-auto rounded-md border border-[#cbd5e1] bg-white shadow-lg">
            {searchState.isFetching && !fairs.length && (
              <p className="px-3 py-3 text-[12px] text-slate-400">Yükleniyor…</p>
            )}
            {!searchState.isFetching && !fairs.length && (
              <p className="px-3 py-3 text-[12px] text-slate-400">
                Sonuç yok. {upcoming ? '"Sadece tarihi güncel fuarlar" filtresini kaldırmayı deneyin.' : 'Farklı bir kelime deneyin.'}
              </p>
            )}
            {fairs.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => pick(f)}
                className="flex w-full items-start gap-3 border-b border-[#f1f5f9] px-3 py-2 text-left last:border-b-0 hover:bg-[#eff6ff]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[#0f172a]">{f.name}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                    <span className={`inline-flex items-center gap-1 ${isPast(f.start_date) ? 'text-amber-600' : ''}`}>
                      <CalendarDays className="h-3 w-3" />
                      {fmtDate(f.start_date)}
                      {isPast(f.start_date) && ' · seçince güncellenir'}
                    </span>
                    {(f.city || f.country) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[f.city, f.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {f.sector && <span className="truncate">{f.sector.slice(0, 36)}</span>}
                  </span>
                </span>
                {f.exhibitor_url && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="mt-3 rounded-md border border-[#dbeafe] bg-[#eff6ff] p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12px] font-semibold text-[#1e40af]">{selected.name}</p>
            <button type="button" onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600" aria-label="Seçimi kaldır">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-[#475569]"><Link2 className="h-3 w-3" /> Katılımcı sayfası:</span>
            <input
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder={discoverState.isLoading ? 'aranıyor…' : 'https://fuar-sitesi.com/exhibitors'}
              className="h-8 min-w-[240px] flex-1 rounded-md border border-[#cbd5e1] bg-white px-2 text-[12px] outline-none focus:border-[#2563eb]"
            />
            <button
              type="button"
              onClick={saveManual}
              disabled={saveState.isLoading || discoverState.isLoading}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#1e40af] px-2.5 text-[12px] font-semibold text-[#1e40af] hover:bg-white disabled:opacity-50"
            >
              {saveState.isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Kaydet
            </button>
          </div>

          {discoverState.isLoading && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#1e40af]">
              <Loader2 className="h-3 w-3 animate-spin" /> Fuarın sitesi, güncel tarihi ve katılımcı sayfası aranıyor…
            </p>
          )}
          {selected.website && (
            <p className="mt-1.5 text-[11px] text-slate-500">
              Fuar sitesi:{' '}
              <a
                href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#1e40af] hover:underline"
              >
                {selected.website}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
