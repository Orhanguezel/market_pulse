'use client';

import { useState } from 'react';
import { Loader2, Search, Download, Radar } from 'lucide-react';
import { useFindDecisionMakersMutation, useGetSavedDecisionMakersQuery, type DecisionMakerRow } from '@/integrations/rtk/public/decision-maker.endpoints';

const POPPINS = { fontFamily: 'var(--font-poppins), system-ui, sans-serif' } as const;
const TR_CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Kocaeli', 'Konya', 'Adana'];
const CONF_CLS: Record<string, string> = {
  A: 'bg-[#dcfce7] text-[#166534]', B: 'bg-[#fef9c3] text-[#854d0e]', C: 'bg-[#f1f5f9] text-[#64748b]',
};

function toCsv(rows: DecisionMakerRow[]): string {
  const cols = ['company_name', 'city', 'business_type', 'decision_maker_name', 'title', 'linkedin_profile_url', 'company_website', 'social_url', 'source_url', 'fit_note', 'confidence_score', 'last_verified_at'] as const;
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = cols.join(',');
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(',')).join('\n');
  return '﻿' + head + '\n' + body;
}

export default function KararVicilerPage() {
  const [sector, setSector] = useState('fitness');
  const [cities, setCities] = useState<string[]>(['İstanbul', 'Ankara', 'İzmir']);
  const [target, setTarget] = useState(50);
  const [find, { data: runData, isLoading, isError }] = useFindDecisionMakersMutation();
  const { data: saved, refetch: refetchSaved } = useGetSavedDecisionMakersQuery();
  const rows = saved?.rows ?? [];

  const toggleCity = (c: string) => setCities((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const run = async () => {
    if (cities.length === 0 || isLoading) return;
    try { await find({ sector, cities, country: 'TR', targetCount: target, perCityLimit: 5 }).unwrap(); }
    catch { /* isError gösterir */ }
    finally { refetchSaved(); }
  };

  const download = () => {
    if (!rows.length) return;
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `karar-vericiler-${sector}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={POPPINS} className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-[#0f172a]"><Radar className="h-5 w-5 text-[#1e40af]" /> Karar Verici Bulma</h1>
        <p className="mt-0.5 text-[13px] text-[#64748b]">Sektör + şehir → Google Maps işletme havuzu + Apollo karar verici (OSINT, LinkedIn scrape yok).</p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-[#475569]">Sektör</span>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-[14px]">
              <option value="fitness">Fitness / Wellness / Pilates</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-[#475569]">Hedef kayıt</span>
            <input type="number" min={10} max={200} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-[14px]" />
          </label>
        </div>
        <div className="mt-3">
          <span className="mb-1.5 block text-[12px] font-semibold text-[#475569]">Şehirler</span>
          <div className="flex flex-wrap gap-2">
            {TR_CITIES.map((c) => (
              <button key={c} type="button" onClick={() => toggleCity(c)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${cities.includes(c) ? 'bg-[#1e40af] text-white' : 'border border-[#e2e8f0] text-[#475569] hover:border-[#1e40af]'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={run} disabled={isLoading || cities.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e40af] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#15317f] disabled:opacity-50">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isLoading ? 'Aranıyor… (1-2 dk sürebilir)' : 'Karar Vericileri Bul'}
          </button>
          {rows.length ? (
            <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-lg border border-[#1e40af]/30 px-4 py-2.5 text-[14px] font-semibold text-[#1e40af] hover:bg-[#eff6ff]">
              <Download className="h-4 w-4" /> CSV İndir ({rows.length})
            </button>
          ) : null}
        </div>
        {runData?.stats && (
          <p className="mt-3 text-[12.5px] text-[#64748b]">Bu aramada: {runData.stats.companies} işletme tarandı · {runData.stats.withDecisionMaker} karar verici · {runData.saved ?? 0} kaydedildi. Toplam kayıtlı: {rows.length}</p>
        )}
      </div>

      {/* Sonuç */}
      {isError && <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-5 py-4 text-[14px] text-[#991b1b]">Arama başarısız. Modül aktif değilse veya API limiti dolduysa tekrar deneyin.</div>}
      {rows.length ? (
        <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[11.5px] uppercase tracking-wide text-[#64748b]">
                  <th className="px-3 py-2.5">Firma</th><th className="px-3 py-2.5">Şehir</th><th className="px-3 py-2.5">Karar Verici</th>
                  <th className="px-3 py-2.5">Unvan</th><th className="px-3 py-2.5">LinkedIn</th><th className="px-3 py-2.5">Web</th><th className="px-3 py-2.5">Skor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#eff6ff]/40">
                    <td className="px-3 py-2.5 font-medium text-[#0f172a]">{r.company_name}</td>
                    <td className="px-3 py-2.5">{r.city}</td>
                    <td className="px-3 py-2.5">{r.decision_maker_name || '—'}</td>
                    <td className="px-3 py-2.5 text-[#475569]">{r.title || '—'}</td>
                    <td className="px-3 py-2.5">{r.linkedin_profile_url ? <a href={r.linkedin_profile_url} target="_blank" rel="noopener noreferrer" className="font-medium text-[#1e40af] hover:underline">Profil</a> : '—'}</td>
                    <td className="px-3 py-2.5">{r.company_website ? <a href={r.company_website} target="_blank" rel="noopener noreferrer" className="font-medium text-[#1e40af] hover:underline">Site</a> : '—'}</td>
                    <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${CONF_CLS[r.confidence_score]}`}>{r.confidence_score}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
