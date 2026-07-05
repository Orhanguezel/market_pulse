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

type FormState = { name: string; is_active: boolean; definition_json: string };

const EMPTY: FormState = {
  name: '',
  is_active: true,
  definition_json: JSON.stringify({
    sectors: [],
    target_countries: [],
    company_types: [],
    keywords: [],
    exclude_keywords: [],
  }, null, 2),
};

function toForm(profile: IcpProfile): FormState {
  return {
    name: profile.name,
    is_active: Boolean(profile.is_active),
    definition_json: JSON.stringify(profile.definition ?? {}, null, 2),
  };
}

function parseDefinition(value: string) {
  try {
    return JSON.parse(value || '{}') as Record<string, unknown>;
  } catch {
    throw new Error('Definition JSON geçerli değil.');
  }
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
      const definition = parseDefinition(form.definition_json);
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
    await deleteProfile(selectedId).unwrap();
    setSelectedId(null);
    setForm(EMPTY);
    await refetch();
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
            {advancedOpen && (
              <label className="grid gap-1.5">
                <span className="text-[12px] font-semibold uppercase text-[#64748b]">Definition JSON</span>
                <textarea value={form.definition_json} onChange={(event) => setForm((current) => ({ ...current, definition_json: event.target.value }))} rows={18} className="rounded-md border border-[#cbd5e1] px-3 py-2 font-mono text-[12px] text-[#0f172a]" />
              </label>
            )}
          </div>
        </main>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isDeleting={deleteState.isLoading}
        title="ICP profilini sil"
        description="Bu profil silinecek; mevcut aday kayıtları korunur."
        onConfirm={remove}
      />
    </div>
  );
}
