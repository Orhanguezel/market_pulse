'use client';

import * as React from 'react';
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import {
  useCreateCrmActivityMutation,
  useDeleteCrmActivityMutation,
  useGetCrmActivitiesQuery,
  useUpdateCrmActivityMutation,
  type CrmActivity,
} from '@/integrations/rtk/public/crm.endpoints';

const TYPE_TR: Record<string, string> = { call: 'Arama', email: 'E-posta', meeting: 'Toplantı', task: 'Görev', note: 'Not' };

const activitySchema = z.object({
  ref_type: z.enum(['account', 'contact', 'deal']),
  ref_id: z.string().trim().min(1, 'İlişkili kayıt ID gerekli'),
  type: z.enum(['call', 'email', 'meeting', 'task', 'note']).optional(),
  subject: z.string().trim().min(1, 'Konu gerekli'),
  body: z.string().trim().optional(),
  due_at: z.string().trim().optional(),
});

type ActivityForm = z.infer<typeof activitySchema>;

const emptyActivity: ActivityForm = { ref_type: 'account', ref_id: '', type: 'task', subject: '', body: '', due_at: '' };

const fields: CrmFormField<ActivityForm>[] = [
  { name: 'ref_type', label: 'İlişki tipi', type: 'select', options: [{ value: 'account', label: 'Müşteri' }, { value: 'contact', label: 'Kontak' }, { value: 'deal', label: 'Fırsat' }] },
  { name: 'ref_id', label: 'İlişkili kayıt ID', required: true },
  { name: 'type', label: 'Tip', type: 'select', options: [{ value: 'call', label: 'Arama' }, { value: 'email', label: 'E-posta' }, { value: 'meeting', label: 'Toplantı' }, { value: 'task', label: 'Görev' }, { value: 'note', label: 'Not' }] },
  { name: 'subject', label: 'Konu', required: true },
  { name: 'body', label: 'Not', type: 'textarea' },
  { name: 'due_at', label: 'Vade', type: 'datetime-local' },
];

function formFromActivity(activity: CrmActivity | null): ActivityForm {
  if (!activity) return emptyActivity;
  return {
    ref_type: (activity.ref_type as ActivityForm['ref_type']) ?? 'account',
    ref_id: activity.ref_id ?? '',
    type: (activity.type as ActivityForm['type']) ?? 'task',
    subject: activity.subject ?? '',
    body: activity.body ?? '',
    due_at: activity.due_at ?? '',
  };
}

export default function AktivitelerPage() {
  const { data, isLoading, isError } = useGetCrmActivitiesQuery();
  const [createActivity, createState] = useCreateCrmActivityMutation();
  const [updateActivity, updateState] = useUpdateCrmActivityMutation();
  const [deleteActivity, deleteState] = useDeleteCrmActivityMutation();
  const [editing, setEditing] = React.useState<CrmActivity | null>(null);
  const [deleting, setDeleting] = React.useState<CrmActivity | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const defaultValues = React.useMemo(() => formFromActivity(editing), [editing]);
  const busy = createState.isLoading || updateState.isLoading;

  const cols: CrmColumn<CrmActivity>[] = [
    { key: 'type', label: 'Tip', render: (r) => TYPE_TR[r.type || ''] || r.type || '-' },
    { key: 'subject', label: 'Konu', render: (r) => <span className="font-medium text-[#0f172a]">{r.subject || '-'}</span> },
    { key: 'due_at', label: 'Vade', render: (r) => (r.due_at ? new Date(r.due_at).toLocaleString('tr-TR') : '-') },
    {
      key: 'done', label: 'Durum',
      render: (r) => {
        const done = r.done === 1 || r.done === true;
        return <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${done ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef9c3] text-[#854d0e]'}`}>{done ? 'Tamamlandı' : 'Bekliyor'}</span>;
      },
    },
  ];

  const submit = async (values: ActivityForm) => {
    const patch = { ...values, due_at: values.due_at || null, body: values.body || null };
    if (editing) {
      await updateActivity({ id: editing.id, patch }).unwrap();
      return;
    }
    await createActivity(patch).unwrap();
  };

  return (
    <>
      <CrmListView
        title="Aktiviteler"
        subtitle="Görüşme, görev ve not kayıtları"
        columns={cols}
        rows={data}
        isLoading={isLoading}
        isError={isError}
        emptyText="Henüz aktivite yok."
        toolbarActions={<button onClick={() => { setEditing(null); setDialogOpen(true); }} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Yeni Aktivite</button>}
        rowActions={(row) => (
          <div className="flex items-center gap-1">
            <button disabled={row.done === true || row.done === 1} onClick={() => updateActivity({ id: row.id, patch: { done: true } }).unwrap()} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 text-emerald-700 disabled:opacity-40" title="Tamamla"><CheckCircle2 className="h-4 w-4" /></button>
            <button onClick={() => { setEditing(row); setDialogOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]" title="Düzenle"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700" title="Sil"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />
      <CrmEntityDialog<ActivityForm> open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Aktiviteyi düzenle' : 'Yeni aktivite'} submitLabel={editing ? 'Güncelle' : 'Oluştur'} defaultValues={defaultValues} schema={activitySchema} fields={fields} isSubmitting={busy} onSubmit={submit} />
      <ConfirmDeleteDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Aktiviteyi sil" description="Bu aktivite kaydı silinecek." isDeleting={deleteState.isLoading} onConfirm={() => deleting ? deleteActivity(deleting.id).unwrap() : undefined} />
    </>
  );
}
