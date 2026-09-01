'use client';

import * as React from 'react';
import { CheckCircle2, Cloud, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import {
  useCreateCrmTaskMutation,
  useDeleteCrmTaskMutation,
  useGetCrmTasksQuery,
  useGetGoogleTasksConnectUrlMutation,
  useGetGoogleTasksStatusQuery,
  useSyncGoogleTasksMutation,
  useUpdateCrmTaskMutation,
  type CrmTask,
} from '@/integrations/rtk/public/crm.endpoints';

const ST: Record<string, string> = { open: 'Açık', done: 'Tamamlandı', cancelled: 'İptal' };
const PR: Record<string, string> = { low: 'Düşük', normal: 'Normal', high: 'Yüksek', urgent: 'Acil' };

const taskSchema = z.object({
  subject: z.string().trim().min(1, 'Görev adı gerekli'),
  body: z.string().trim().optional(),
  due_at: z.string().trim().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  status: z.enum(['open', 'done', 'cancelled']).optional(),
  ref_type: z.enum(['', 'account', 'contact', 'deal', 'quote', 'order']).optional(),
  ref_id: z.string().trim().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

const emptyTask: TaskForm = { subject: '', body: '', due_at: '', priority: 'normal', status: 'open', ref_type: '', ref_id: '' };

const fields: CrmFormField<TaskForm>[] = [
  { name: 'subject', label: 'Görev', required: true },
  { name: 'body', label: 'Not', type: 'textarea' },
  { name: 'due_at', label: 'Vade', type: 'datetime-local' },
  { name: 'priority', label: 'Öncelik', type: 'select', options: [{ value: 'low', label: 'Düşük' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'Yüksek' }, { value: 'urgent', label: 'Acil' }] },
  { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'open', label: 'Açık' }, { value: 'done', label: 'Tamamlandı' }, { value: 'cancelled', label: 'İptal' }] },
  { name: 'ref_type', label: 'İlişki tipi', type: 'select', options: [{ value: '', label: 'İlişki yok' }, { value: 'account', label: 'Müşteri' }, { value: 'contact', label: 'Kontak' }, { value: 'deal', label: 'Fırsat' }, { value: 'quote', label: 'Teklif' }, { value: 'order', label: 'Sipariş' }] },
  { name: 'ref_id', label: 'İlişkili kayıt ID' },
];

function formFromTask(task: CrmTask | null): TaskForm {
  if (!task) return emptyTask;
  return {
    subject: task.subject ?? '',
    body: task.body ?? '',
    due_at: task.due_at ?? '',
    priority: (task.priority as TaskForm['priority']) ?? 'normal',
    status: (task.status as TaskForm['status']) ?? 'open',
    ref_type: (task.ref_type as TaskForm['ref_type']) ?? '',
    ref_id: task.ref_id ?? '',
  };
}

export default function GorevlerPage() {
  const { data, isLoading, isError } = useGetCrmTasksQuery();
  const [createTask, createState] = useCreateCrmTaskMutation();
  const [updateTask, updateState] = useUpdateCrmTaskMutation();
  const [deleteTask, deleteState] = useDeleteCrmTaskMutation();
  const { data: googleStatus, isLoading: googleStatusLoading } = useGetGoogleTasksStatusQuery();
  const [getGoogleConnectUrl, googleConnectState] = useGetGoogleTasksConnectUrlMutation();
  const [syncGoogle, googleSyncState] = useSyncGoogleTasksMutation();
  const [editing, setEditing] = React.useState<CrmTask | null>(null);
  const [deleting, setDeleting] = React.useState<CrmTask | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const defaultValues = React.useMemo(() => formFromTask(editing), [editing]);
  const busy = createState.isLoading || updateState.isLoading;

  const connectGoogle = async () => {
    try {
      const { url } = await getGoogleConnectUrl().unwrap();
      window.location.href = url;
    } catch {
      toast.error('Google bağlantısı başlatılamadı.');
    }
  };

  const syncWithGoogle = async () => {
    try {
      const result = await syncGoogle().unwrap();
      toast.success(`Google Tasks eşitlendi: ${result.imported} içe, ${result.exported} dışa, ${result.updated} güncelleme.`);
    } catch (error) {
      const payload = error as { data?: { error?: { code?: string; activation_url?: string } } };
      if (payload.data?.error?.code === 'GOOGLE_TASKS_API_DISABLED') {
        toast.error('Google Tasks API kapalı. Google Cloud Console’dan etkinleştirin.', {
          action: payload.data.error.activation_url ? {
            label: 'API’yi Etkinleştir',
            onClick: () => window.open(payload.data?.error?.activation_url, '_blank', 'noopener,noreferrer'),
          } : undefined,
          duration: 10000,
        });
        return;
      }
      toast.error('Google Tasks eşitlenemedi. Bağlantı iznini kontrol edin.');
    }
  };

  const cols: CrmColumn<CrmTask>[] = [
    { key: 'subject', label: 'Görev', render: (r) => <span className="font-semibold text-[#0f172a]">{r.subject}</span> },
    { key: 'due_at', label: 'Vade', render: (r) => (r.due_at ? new Date(r.due_at).toLocaleString('tr-TR') : '-') },
    { key: 'priority', label: 'Öncelik', render: (r) => PR[r.priority || 'normal'] || r.priority },
    {
      key: 'status', label: 'Durum',
      render: (r) => {
        const s = r.status || 'open';
        const cls = s === 'done' ? 'bg-[#dcfce7] text-[#166534]' : s === 'cancelled' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#fef9c3] text-[#854d0e]';
        return <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${cls}`}>{ST[s] || s}</span>;
      },
    },
  ];

  const submit = async (values: TaskForm) => {
    const patch = { ...values, ref_type: values.ref_type || null, ref_id: values.ref_id || null, due_at: values.due_at || null };
    if (editing) {
      await updateTask({ id: editing.id, patch }).unwrap();
      return;
    }
    await createTask({ ...patch, subject: values.subject }).unwrap();
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#dbeafe] bg-white px-4 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1e40af]"><Cloud className="h-5 w-5" /></span>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-[#0f172a]">Google Tasks</div>
            <div className="truncate text-[12px] text-[#64748b]">
              {googleStatusLoading ? 'Bağlantı kontrol ediliyor…' : googleStatus?.connected
                ? `${googleStatus.email ?? 'Google hesabı'} bağlı${googleStatus.last_synced_at ? ` · Son eşitleme ${new Date(googleStatus.last_synced_at).toLocaleString('tr-TR')}` : ''}`
                : googleStatus?.reconnect_required ? 'Google Tasks izni için hesabınızı yeniden bağlayın.' : 'Görevlerinizi Google Tasks ile iki yönlü eşitleyin.'}
            </div>
          </div>
        </div>
        {googleStatus?.connected ? (
          <button disabled={googleSyncState.isLoading} onClick={syncWithGoogle} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-60">
            {googleSyncState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Senkronize Et
          </button>
        ) : (
          <button disabled={googleConnectState.isLoading} onClick={connectGoogle} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-60">
            {googleConnectState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />} {googleStatus?.reconnect_required ? 'Yeniden Bağla' : 'Google’a Bağlan'}
          </button>
        )}
      </div>
      <CrmListView
        title="Görevler"
        subtitle="Yapılacaklar ve takip"
        columns={cols}
        rows={data}
        isLoading={isLoading}
        isError={isError}
        emptyText="Henüz görev yok."
        toolbarActions={<button onClick={() => { setEditing(null); setDialogOpen(true); }} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Yeni Görev</button>}
        rowActions={(row) => (
          <div className="flex items-center gap-1">
            <button disabled={row.status === 'done'} onClick={() => updateTask({ id: row.id, patch: { status: 'done', completed_at: new Date().toISOString() } }).unwrap()} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 text-emerald-700 disabled:opacity-40" title="Tamamla"><CheckCircle2 className="h-4 w-4" /></button>
            <button onClick={() => { setEditing(row); setDialogOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]" title="Düzenle"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700" title="Sil"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />
      <CrmEntityDialog<TaskForm> open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Görevi düzenle' : 'Yeni görev'} submitLabel={editing ? 'Güncelle' : 'Oluştur'} defaultValues={defaultValues} schema={taskSchema} fields={fields} isSubmitting={busy} onSubmit={submit} />
      <ConfirmDeleteDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Görevi sil" description="Bu görev kaydı silinecek." isDeleting={deleteState.isLoading} onConfirm={() => deleting ? deleteTask(deleting.id).unwrap() : undefined} />
    </>
  );
}
