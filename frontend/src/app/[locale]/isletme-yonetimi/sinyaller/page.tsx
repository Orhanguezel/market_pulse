'use client';

import * as React from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import {
  useCreateMarketSignalMutation,
  useDeleteMarketSignalMutation,
  useListMarketSignalsQuery,
  useReviewMarketSignalMutation,
} from '@/integrations/rtk/public/market.endpoints';
import type { MarketSignal } from '@/integrations/shared/market.types';

const SEVERITY: Record<string, string> = { critical: 'Kritik', high: 'Yüksek', medium: 'Orta', low: 'Düşük' };

const signalSchema = z.object({
  title: z.string().trim().min(1, 'Başlık gerekli'),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  signal_type: z.string().trim().optional(),
  description: z.string().trim().optional(),
  source_url: z.string().trim().optional(),
  target_id: z.string().trim().optional(),
  lead_id: z.string().trim().optional(),
});

type SignalForm = z.infer<typeof signalSchema>;

const fields: CrmFormField<SignalForm>[] = [
  { name: 'title', label: 'Başlık', required: true },
  { name: 'severity', label: 'Önem', type: 'select', options: Object.entries(SEVERITY).map(([value, label]) => ({ value, label })) },
  { name: 'signal_type', label: 'Sinyal tipi' },
  { name: 'description', label: 'Açıklama', type: 'textarea' },
  { name: 'source_url', label: 'Kaynak URL' },
  { name: 'target_id', label: 'Hedef Firma ID' },
  { name: 'lead_id', label: 'Lead ID' },
];

const emptySignal: SignalForm = { title: '', severity: 'medium', signal_type: 'manual', description: '', source_url: '', target_id: '', lead_id: '' };

function severityClass(severity?: string | null) {
  if (severity === 'critical') return 'bg-rose-100 text-rose-800';
  if (severity === 'high') return 'bg-orange-100 text-orange-800';
  if (severity === 'low') return 'bg-emerald-100 text-emerald-800';
  return 'bg-amber-100 text-amber-800';
}

export default function SinyallerPage() {
  const [severity, setSeverity] = React.useState('');
  const [reviewed, setReviewed] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<MarketSignal | null>(null);
  const { data = [], isLoading, isError } = useListMarketSignalsQuery({
    severity: severity || undefined,
    is_reviewed: reviewed === '' ? undefined : reviewed === 'true',
    limit: 200,
  });
  const [createSignal, createState] = useCreateMarketSignalMutation();
  const [reviewSignal, reviewState] = useReviewMarketSignalMutation();
  const [deleteSignal, deleteState] = useDeleteMarketSignalMutation();

  const cols: CrmColumn<MarketSignal>[] = [
    { key: 'title', label: 'Sinyal', render: (row) => <span className="font-semibold text-[#0f172a]">{row.title}</span> },
    { key: 'severity', label: 'Önem', render: (row) => <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${severityClass(row.severity)}`}>{SEVERITY[row.severity || 'medium'] || row.severity}</span> },
    { key: 'signalType', label: 'Tip', render: (row) => row.signalType || row.source || '-' },
    { key: 'targetId', label: 'Hedef', render: (row) => row.targetId || row.target_id || '-' },
    { key: 'isReviewed', label: 'Durum', render: (row) => row.isReviewed ? 'İncelendi' : 'Bekliyor' },
    { key: 'createdAt', label: 'Tarih', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString('tr-TR') : row.created_at ? new Date(row.created_at).toLocaleDateString('tr-TR') : '-' },
  ];

  const submit = async (values: SignalForm) => {
    await createSignal({
      title: values.title,
      severity: values.severity || 'medium',
      signal_type: values.signal_type || 'manual',
      description: values.description || undefined,
      source_url: values.source_url || undefined,
      target_id: values.target_id || undefined,
      lead_id: values.lead_id || undefined,
    }).unwrap();
  };

  return (
    <>
      <div className="grid gap-3 rounded-lg border border-[#e2e8f0] bg-white p-4 md:grid-cols-3">
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Önem</span><select value={severity} onChange={(event) => setSeverity(event.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]"><option value="">Tümü</option>{Object.entries(SEVERITY).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">İnceleme</span><select value={reviewed} onChange={(event) => setReviewed(event.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]"><option value="">Tümü</option><option value="false">Bekliyor</option><option value="true">İncelendi</option></select></label>
      </div>
      <CrmListView
        title="Sinyaller"
        subtitle="Pazar, rakip ve müşteri sinyalleri"
        columns={cols}
        rows={data}
        isLoading={isLoading}
        isError={isError}
        emptyText="Henüz sinyal yok."
        toolbarActions={<button onClick={() => setDialogOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Sinyal Ekle</button>}
        rowActions={(row) => (
          <div className="flex items-center gap-1">
            <button disabled={row.isReviewed || reviewState.isLoading} onClick={() => reviewSignal({ id: row.id, status: 'reviewed' }).unwrap().then(() => toast.success('Sinyal incelendi'))} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 text-emerald-700 disabled:opacity-40" title="İncele"><CheckCircle2 className="h-4 w-4" /></button>
            <button onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700" title="Sil"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />
      <CrmEntityDialog<SignalForm> open={dialogOpen} onOpenChange={setDialogOpen} title="Sinyal ekle" submitLabel="Oluştur" defaultValues={emptySignal} schema={signalSchema} fields={fields} isSubmitting={createState.isLoading} onSubmit={submit} />
      <ConfirmDeleteDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Sinyali sil" description={deleting ? `${deleting.title} silinecek.` : undefined} isDeleting={deleteState.isLoading} onConfirm={() => deleting ? deleteSignal(deleting.id).unwrap() : undefined} />
    </>
  );
}
