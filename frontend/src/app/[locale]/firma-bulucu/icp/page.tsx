'use client';

import * as React from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import {
  useCreateIcpProfileMutation,
  useDeleteIcpProfileMutation,
  useListIcpProfilesQuery,
  useUpdateIcpProfileMutation,
} from '@/integrations/rtk/hooks';
import type { IcpProfile } from '@/integrations/shared/lead-machine.types';

type IcpDefinitionForm = {
  sectors: string[]; sub_sectors: string[]; firm_types: string[]; geographies: string[];
  priority_geographies: string[]; exclude_geographies: string[]; sales_channels: string[];
  keywords: string[]; exclude_patterns: string[]; min_employees: number | null; max_employees: number | null;
  strong_match_sectors: string[]; weak_match_sectors: string[]; positive_signals: string[]; negative_signals: string[];
  min_lead_score_for_candidate: number; auto_approve_threshold: number;
};
type FormState = { name: string; is_active: boolean; definition: IcpDefinitionForm };

const EMPTY_DEFINITION: IcpDefinitionForm = {
  sectors: [], sub_sectors: [], firm_types: [], geographies: [],
  priority_geographies: [], exclude_geographies: [], sales_channels: [],
  keywords: [], exclude_patterns: [],
  min_employees: null, max_employees: null, strong_match_sectors: [], weak_match_sectors: [],
  positive_signals: [], negative_signals: [], min_lead_score_for_candidate: 5.5, auto_approve_threshold: 7,
};

const EMPTY: FormState = {
  name: '',
  is_active: true,
  definition: EMPTY_DEFINITION,
};

function asStringArray(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
function asNumber(value: unknown, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function csv(value: string) { return value.split(',').map((item) => item.trim()).filter(Boolean); }

function toForm(profile: IcpProfile): FormState {
  return {
    name: profile.name,
    is_active: Boolean(profile.is_active),
    definition: {
      ...EMPTY_DEFINITION,
      ...profile.definition,
      sectors: asStringArray(profile.definition?.sectors), sub_sectors: asStringArray(profile.definition?.sub_sectors),
      firm_types: asStringArray(profile.definition?.firm_types), geographies: asStringArray(profile.definition?.geographies ?? profile.definition?.target_countries),
      priority_geographies: asStringArray(profile.definition?.priority_geographies),
      exclude_geographies: asStringArray(profile.definition?.exclude_geographies),
      sales_channels: asStringArray(profile.definition?.sales_channels),
      keywords: asStringArray(profile.definition?.keywords), exclude_patterns: asStringArray(profile.definition?.exclude_patterns ?? profile.definition?.exclude_keywords),
      strong_match_sectors: asStringArray(profile.definition?.strong_match_sectors), weak_match_sectors: asStringArray(profile.definition?.weak_match_sectors),
      positive_signals: asStringArray(profile.definition?.positive_signals), negative_signals: asStringArray(profile.definition?.negative_signals),
      min_lead_score_for_candidate: asNumber(profile.definition?.min_lead_score_for_candidate, 5.5),
      auto_approve_threshold: asNumber(profile.definition?.auto_approve_threshold, 7),
    },
  };
}

export default function FirmaBulucuIcpPage() {
  const { data: profiles = [], isLoading, isError, refetch } = useListIcpProfilesQuery();
  const [createProfile, createState] = useCreateIcpProfileMutation();
  const [updateProfile, updateState] = useUpdateIcpProfileMutation();
  const [deleteProfile, deleteState] = useDeleteIcpProfileMutation();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [advancedOpen, setAdvancedOpen] = React.useState(true);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const selected = profiles.find((profile) => profile.id === selectedId) ?? null;
  const busy = createState.isLoading || updateState.isLoading || deleteState.isLoading;

  React.useEffect(() => {
    if (selected) setForm(toForm(selected));
  }, [selected]);

  const startNew = () => {
    setSelectedId(null);
    setForm(EMPTY);
  };

  const save = async () => {
    try {
      const definition = form.definition;
      if (!form.name.trim()) {
        toast.error('Profil adı gerekli.');
        return;
      }
      if (selectedId) {
        await updateProfile({ id: selectedId, patch: { name: form.name.trim(), definition, is_active: form.is_active } }).unwrap();
        toast.success('ICP profili güncellendi');
      } else {
        const created = await createProfile({ name: form.name.trim(), definition, is_active: form.is_active }).unwrap();
        setSelectedId(created.id);
        toast.success('ICP profili oluşturuldu');
      }
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ICP kaydedilemedi.');
    }
  };

  const remove = async () => {
    if (!selectedId) return;
    try {
      // Temizlik ekranında bağlı işler ve adaylar korunur; yalnız ICP referansları
      // kaldırılıp profil silinir. Tek modal kullanmak çakışan overlay/focus-lock'u önler.
      await deleteProfile({ id: selectedId, force: true }).unwrap();
      setSelectedId(null);
      setForm(EMPTY);
      toast.success('ICP profili silindi');
      await refetch();
    } catch (error) {
      toast.error('ICP profili silinemedi.');
      throw error;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">ICP Profilleri</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">Firma Bulucu taramalarında kullanılacak ideal müşteri profilleri.</p>
        </div>
        <button onClick={startNew} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white">
          <Plus className="h-4 w-4" /> Yeni ICP
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-[#e2e8f0] bg-white">
          <div className="border-b border-[#e2e8f0] px-4 py-3 text-[13px] font-semibold text-[#475569]">Profiller</div>
          <div className="max-h-[680px] overflow-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#1e40af]" /></div>
            ) : isError ? (
              <p className="px-3 py-8 text-center text-[13px] text-[#64748b]">ICP profilleri alınamadı.</p>
            ) : profiles.length === 0 ? (
              <p className="px-3 py-8 text-center text-[13px] text-[#64748b]">Henüz ICP profili yok.</p>
            ) : profiles.map((profile) => (
              <button key={profile.id} onClick={() => setSelectedId(profile.id)} className={`mb-2 w-full rounded-md border p-3 text-left ${selectedId === profile.id ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#e2e8f0] hover:bg-[#f8fafc]'}`}>
                <p className="truncate text-[13px] font-bold text-[#0f172a]">{profile.name}</p>
                <p className="mt-1 text-[12px] text-[#64748b]">{profile.is_active ? 'Aktif' : 'Pasif'}</p>
              </button>
            ))}
          </div>
        </aside>

        <main className="rounded-lg border border-[#e2e8f0] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#e2e8f0] px-4 py-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-[15px] font-bold text-[#0f172a]">{selectedId ? 'ICP Düzenle' : 'Yeni ICP'}</h2>
            <div className="flex gap-2">
              <button disabled={!selectedId || busy} onClick={() => setDeleteOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 px-3 text-[13px] font-semibold text-rose-700 disabled:opacity-50">
                <Trash2 className="h-4 w-4" /> Sil
              </button>
              <button disabled={busy} onClick={save} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-4">
            <label className="grid gap-1.5">
              <span className="text-[12px] font-semibold uppercase text-[#64748b]">Profil adı</span>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" />
            </label>
            <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#475569]">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} className="h-4 w-4" />
              Aktif
            </label>
            <button onClick={() => setAdvancedOpen((value) => !value)} className="w-fit rounded-md border border-[#cbd5e1] px-3 py-2 text-[13px] font-semibold text-[#334155]">
              Gelişmiş alanlar {advancedOpen ? '−' : '+'}
            </button>
            <div className="grid gap-4 md:grid-cols-2">
              {([
                ['sectors', 'Sektörler', 'automotive, textiles'], ['sub_sectors', 'Alt sektörler', 'car mats, accessories'],
                ['firm_types', 'Firma tipleri', 'distributor, importer'], ['geographies', 'Hedef ülkeler', 'DE, NL, FR'],
                ['keywords', 'Anahtar kelimeler', 'floor mats, private label'], ['exclude_patterns', 'Hariç kelimeler', 'rental, used parts'],
                ['priority_geographies', 'Öncelikli ülkeler', 'DE, AT'], ['exclude_geographies', 'Hariç ülkeler', 'CN, HK'],
                ['sales_channels', 'Satış kanalları', 'amazon, own website'],
              ] as const).map(([key, label, placeholder]) => (
                <label key={key} className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">{label}</span><input value={form.definition[key].join(', ')} placeholder={placeholder} onChange={(event) => setForm((current) => ({ ...current, definition: { ...current.definition, [key]: csv(event.target.value) } }))} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" /></label>
              ))}
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Minimum çalışan</span><input type="number" value={form.definition.min_employees ?? ''} onChange={(event) => setForm((current) => ({ ...current, definition: { ...current.definition, min_employees: event.target.value ? Number(event.target.value) : null } }))} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" /></label>
              <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Maksimum çalışan</span><input type="number" value={form.definition.max_employees ?? ''} onChange={(event) => setForm((current) => ({ ...current, definition: { ...current.definition, max_employees: event.target.value ? Number(event.target.value) : null } }))} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" /></label>
            </div>
            {advancedOpen && (
              <div className="grid gap-4 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 md:grid-cols-2">
                {(['strong_match_sectors', 'weak_match_sectors', 'positive_signals', 'negative_signals'] as const).map((key) => <label key={key} className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">{key.replaceAll('_', ' ')}</span><textarea rows={2} value={form.definition[key].join(', ')} onChange={(event) => setForm((current) => ({ ...current, definition: { ...current.definition, [key]: csv(event.target.value) } }))} className="rounded-md border border-[#cbd5e1] px-3 py-2 text-[13px]" /></label>)}
                {(['min_lead_score_for_candidate', 'auto_approve_threshold'] as const).map((key) => <label key={key} className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">{key.replaceAll('_', ' ')}</span><input type="number" step="0.1" value={form.definition[key]} onChange={(event) => setForm((current) => ({ ...current, definition: { ...current.definition, [key]: Number(event.target.value) } }))} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" /></label>)}
              </div>
            )}
          </div>
        </main>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isDeleting={deleteState.isLoading}
        title="ICP profilini sil"
        notify={false}
        description="Profil silinecek. Bağlı tarama işleri ve adaylar korunacak, yalnız ICP bağlantıları kaldırılacak. Bu profile ait dışlama kuralları silinecek."
        onConfirm={remove}
      />
    </div>
  );
}
