'use client';

import * as React from 'react';
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import {
  useCreateCrmReminderMutation,
  useDeleteCrmReminderMutation,
  useGetCrmRemindersQuery,
  useUpdateCrmReminderMutation,
  type CrmReminder,
} from '@/integrations/rtk/public/crm.endpoints';

const ST: Record<string, string> = { scheduled: 'Planlandı', sent: 'Gönderildi', snoozed: 'Ertelendi', cancelled: 'İptal' };
const CH: Record<string, string> = { in_app: 'Uygulama', email: 'E-posta', sms: 'SMS', whatsapp: 'WhatsApp' };

const reminderSchema = z.object({
  title: z.string().trim().min(1, 'Başlık gerekli'),
  body: z.string().trim().optional(),
  remind_at: z.string().trim().min(1, 'Hatırlatma zamanı gerekli'),
  channel: z.enum(['in_app', 'email', 'sms', 'whatsapp']).optional(),
  status: z.enum(['scheduled', 'sent', 'snoozed', 'cancelled']).optional(),
  ref_type: z.enum(['', 'account', 'contact', 'deal', 'quote', 'order', 'task', 'activity']).optional(),
  ref_id: z.string().trim().optional(),
});

type ReminderForm = z.infer<typeof reminderSchema>;

const emptyReminder: ReminderForm = { title: '', body: '', remind_at: '', channel: 'in_app', status: 'scheduled', ref_type: '', ref_id: '' };

const fields: CrmFormField<ReminderForm>[] = [
  { name: 'title', label: 'Hatırlatma', required: true },
  { name: 'body', label: 'Not', type: 'textarea' },
  { name: 'remind_at', label: 'Zaman', type: 'datetime-local', required: true },
  { name: 'channel', label: 'Kanal', type: 'select', options: [{ value: 'in_app', label: 'Uygulama' }, { value: 'email', label: 'E-posta' }, { value: 'sms', label: 'SMS' }, { value: 'whatsapp', label: 'WhatsApp' }] },
  { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'scheduled', label: 'Planlandı' }, { value: 'sent', label: 'Gönderildi' }, { value: 'snoozed', label: 'Ertelendi' }, { value: 'cancelled', label: 'İptal' }] },
  { name: 'ref_type', label: 'İlişki tipi', type: 'select', options: [{ value: '', label: 'İlişki yok' }, { value: 'account', label: 'Müşteri' }, { value: 'contact', label: 'Kontak' }, { value: 'deal', label: 'Fırsat' }, { value: 'quote', label: 'Teklif' }, { value: 'order', label: 'Sipariş' }, { value: 'task', label: 'Görev' }, { value: 'activity', label: 'Aktivite' }] },
  { name: 'ref_id', label: 'İlişkili kayıt ID' },
];

function formFromReminder(reminder: CrmReminder | null): ReminderForm {
  if (!reminder) return emptyReminder;
  return {
    title: reminder.title ?? '',
    body: reminder.body ?? '',
    remind_at: reminder.remind_at ?? '',
    channel: (reminder.channel as ReminderForm['channel']) ?? 'in_app',
    status: (reminder.status as ReminderForm['status']) ?? 'scheduled',
    ref_type: (reminder.ref_type as ReminderForm['ref_type']) ?? '',
    ref_id: reminder.ref_id ?? '',
  };
}

export default function HatirlatmalarPage() {
  const { data, isLoading, isError } = useGetCrmRemindersQuery();
  const [createReminder, createState] = useCreateCrmReminderMutation();
  const [updateReminder, updateState] = useUpdateCrmReminderMutation();
  const [deleteReminder, deleteState] = useDeleteCrmReminderMutation();
  const [editing, setEditing] = React.useState<CrmReminder | null>(null);
  const [deleting, setDeleting] = React.useState<CrmReminder | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const defaultValues = React.useMemo(() => formFromReminder(editing), [editing]);
  const busy = createState.isLoading || updateState.isLoading;

  const cols: CrmColumn<CrmReminder>[] = [
    { key: 'title', label: 'Hatırlatma', render: (r) => <span className="font-semibold text-[#0f172a]">{r.title}</span> },
    { key: 'remind_at', label: 'Zaman', render: (r) => (r.remind_at ? new Date(r.remind_at).toLocaleString('tr-TR') : '-') },
    { key: 'channel', label: 'Kanal', render: (r) => CH[r.channel || 'in_app'] || r.channel },
    {
      key: 'status',
      label: 'Durum',
      render: (r) => {
        const value = r.status || 'scheduled';
        const cls = value === 'sent' ? 'bg-[#dcfce7] text-[#166534]' : value === 'cancelled' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#eff6ff] text-[#1e40af]';
        return <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${cls}`}>{ST[value] || value}</span>;
      },
    },
  ];

  const submit = async (values: ReminderForm) => {
    const patch = { ...values, body: values.body || null, ref_type: values.ref_type || null, ref_id: values.ref_id || null };
    if (editing) {
      await updateReminder({ id: editing.id, patch }).unwrap();
      return;
    }
    await createReminder({ ...patch, title: values.title }).unwrap();
  };

  return (
    <>
      <CrmListView
        title="Hatırlatma Yönetimi"
        subtitle="Zamanlanmış hatırlatmalar"
        columns={cols}
        rows={data}
        isLoading={isLoading}
        isError={isError}
        emptyText="Henüz hatırlatma yok."
        toolbarActions={<button onClick={() => { setEditing(null); setDialogOpen(true); }} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Yeni Hatırlatma</button>}
        rowActions={(row) => (
          <div className="flex items-center gap-1">
            <button disabled={row.status === 'sent'} onClick={() => updateReminder({ id: row.id, patch: { status: 'sent', sent_at: new Date().toISOString() } }).unwrap()} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 text-emerald-700 disabled:opacity-40" title="Gönderildi işaretle"><CheckCircle2 className="h-4 w-4" /></button>
            <button onClick={() => { setEditing(row); setDialogOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]" title="Düzenle"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700" title="Sil"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />
      <CrmEntityDialog<ReminderForm> open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Hatırlatmayı düzenle' : 'Yeni hatırlatma'} submitLabel={editing ? 'Güncelle' : 'Oluştur'} defaultValues={defaultValues} schema={reminderSchema} fields={fields} isSubmitting={busy} onSubmit={submit} />
      <ConfirmDeleteDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Hatırlatmayı sil" description="Bu hatırlatma kaydı silinecek." isDeleting={deleteState.isLoading} onConfirm={() => deleting ? deleteReminder(deleting.id).unwrap() : undefined} />
    </>
  );
}
