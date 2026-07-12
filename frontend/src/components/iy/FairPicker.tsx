'use client';

import * as React from 'react';
import { CalendarDays, Loader2, MapPin, Search, Link2, CheckCircle2 } from 'lucide-react';
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

/**
 * Fuar takvimi seçici — Türkiye + Dünya fuar kataloğunda arama yapar, fuar seçilince
 * katılımcı (exhibitor) sayfasını fuarın kendi sitesinden ÜCRETSİZ olarak keşfeder.
 * Bulunamazsa kullanıcı sayfayı elle girip kataloğa kaydedebilir.
 */
export default function FairPicker({ onPick }: { onPick: (fair: FairCatalogItem, exhibitorUrl: string | null) => void }) {
  const [q, setQ] = React.useState('');
  const [upcoming, setUpcoming] = React.useState(true);
  const [selected, setSelected] = React.useState<FairCatalogItem | null>(null);
  const [manualUrl, setManualUrl] = React.useState('');

  const [search, searchState] = useLazySearchFairCatalogQuery();
  const [discover, discoverState] = useDiscoverFairExhibitorMutation();
  const [saveUrl, saveState] = useSetFairExhibitorUrlMutation();
  const fairs = searchState.data ?? [];

  const runSearch = () => { void search({ q: q.trim() || undefined, upcoming, limit: 25 }); };

  const pick = async (fair: FairCatalogItem) => {
    setSelected(fair);
    setManualUrl(fair.exhibitor_url ?? '');
    onPick(fair, fair.exhibitor_url);

    // Katılımcı sayfası kayıtlı değilse fuarın sitesinden keşfetmeyi dene (ücretsiz).
    if (!fair.exhibitor_url) {
      try {
        const res = await discover(fair.id).unwrap();
        if (res.exhibitor_url) {
          setManualUrl(res.exhibitor_url);
          onPick(fair, res.exhibitor_url);
          toast.success('Katılımcı sayfası bulundu');
        } else {
          toast.info(res.note || 'Katılımcı sayfası bulunamadı — elle girebilirsiniz.');
        }
      } catch { toast.error('Katılımcı sayfası aranamadı'); }
    }
  };

  const saveManual = async () => {
    if (!selected) return;
    const url = manualUrl.trim();
    if (!/^https?:\/\//i.test(url)) { toast.error('Geçerli bir URL girin (https://...)'); return; }
    try {
      await saveUrl({ id: selected.id, exhibitor_url: url }).unwrap();
      onPick(selected, url);
      toast.success('Katılımcı sayfası kaydedildi');
    } catch { toast.error('Kaydedilemedi'); }
  };

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
      <p className="mb-2 text-[12px] font-semibold text-[#64748b]">Fuar takviminden seç (Türkiye + Dünya)</p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder="Fuar adı, sektör veya şehir ara…"
            className="h-9 w-full rounded-md border border-[#cbd5e1] bg-white pl-8 pr-3 text-[13px] outline-none focus:border-[#2563eb]"
          />
        </div>
        <label className="flex items-center gap-1.5 text-[12px] text-[#475569]">
          <input type="checkbox" checked={upcoming} onChange={(e) => setUpcoming(e.target.checked)} className="h-3.5 w-3.5" />
          Sadece gelecek fuarlar
        </label>
        <button
          onClick={runSearch}
          disabled={searchState.isFetching}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#1e40af] px-3 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          {searchState.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Ara
        </button>
      </div>

      {searchState.isSuccess && !fairs.length && (
        <p className="mt-2 text-[12px] text-slate-400">Sonuç yok. Farklı bir kelime deneyin.</p>
      )}

      {fairs.length > 0 && (
        <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-[#e2e8f0] bg-white">
          {fairs.map((f) => {
            const active = selected?.id === f.id;
            return (
              <button
                key={f.id}
                onClick={() => pick(f)}
                className={`flex w-full items-start gap-3 border-b border-[#f1f5f9] px-3 py-2 text-left last:border-b-0 ${active ? 'bg-[#eff6ff]' : 'hover:bg-[#f8fafc]'}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[#0f172a]">{f.name}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{fmtDate(f.start_date)}</span>
                    {(f.city || f.country) && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{[f.city, f.country].filter(Boolean).join(', ')}</span>}
                    {f.sector && <span className="truncate">{f.sector.slice(0, 40)}</span>}
                  </span>
                </span>
                {f.exhibitor_url && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="mt-3 rounded-md border border-[#dbeafe] bg-[#eff6ff] p-3">
          <p className="text-[12px] font-semibold text-[#1e40af]">{selected.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-[#475569]"><Link2 className="h-3 w-3" /> Katılımcı sayfası:</span>
            <input
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder={discoverState.isLoading ? 'aranıyor…' : 'https://fuar-sitesi.com/exhibitors'}
              className="h-8 min-w-[240px] flex-1 rounded-md border border-[#cbd5e1] bg-white px-2 text-[12px] outline-none focus:border-[#2563eb]"
            />
            <button
              onClick={saveManual}
              disabled={saveState.isLoading || discoverState.isLoading}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#1e40af] px-2.5 text-[12px] font-semibold text-[#1e40af] hover:bg-white disabled:opacity-50"
            >
              {saveState.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Kaydet
            </button>
          </div>
          {discoverState.isLoading && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#1e40af]">
              <Loader2 className="h-3 w-3 animate-spin" /> Fuarın sitesinden katılımcı sayfası aranıyor…
            </p>
          )}
          {selected.website && (
            <p className="mt-1.5 text-[11px] text-slate-500">
              Fuar sitesi: <a href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`} target="_blank" rel="noreferrer" className="text-[#1e40af] hover:underline">{selected.website}</a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
