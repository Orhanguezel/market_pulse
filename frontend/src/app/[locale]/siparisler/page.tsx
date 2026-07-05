'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import { useCreateCrmOrderMutation, useDeleteCrmOrderMutation, useGetCrmOrdersQuery, useUpdateCrmOrderMutation, type CrmOrder } from '@/integrations/rtk/public/crm.endpoints';

const ST: Record<string, string> = { draft: 'Taslak', confirmed: 'Onaylandı', fulfilled: 'Tamamlandı', cancelled: 'İptal' };
const orderSchema = z.object({
  order_no: z.string().trim().optional(),
  title: z.string().trim().min(1, 'Sipariş başlığı gerekli'),
  amount: z.preprocess((value) => value === '' || value == null ? undefined : Number(value), z.number().optional()),
  currency: z.string().trim().length(3, '3 harfli para birimi').or(z.literal('')).optional(),
  status: z.enum(['draft', 'confirmed', 'fulfilled', 'cancelled']).optional(),
  ordered_at: z.string().trim().optional(),
  account_id: z.string().trim().optional(),
  quote_id: z.string().trim().optional(),
  deal_id: z.string().trim().optional(),
  contact_id: z.string().trim().optional(),
});
type OrderForm = z.infer<typeof orderSchema>;
const emptyOrder: OrderForm = { order_no: '', title: '', amount: undefined, currency: 'USD', status: 'draft', ordered_at: '', account_id: '', quote_id: '', deal_id: '', contact_id: '' };
const fields: CrmFormField<OrderForm>[] = [
  { name: 'order_no', label: 'Sipariş No' },
  { name: 'title', label: 'Sipariş', required: true },
  { name: 'amount', label: 'Tutar' },
  { name: 'currency', label: 'Para birimi' },
  { name: 'status', label: 'Durum', type: 'select', options: Object.entries(ST).map(([value, label]) => ({ value, label })) },
  { name: 'ordered_at', label: 'Sipariş tarihi', type: 'date' },
  { name: 'account_id', label: 'Müşteri ID' },
  { name: 'quote_id', label: 'Teklif ID' },
  { name: 'deal_id', label: 'Fırsat ID' },
  { name: 'contact_id', label: 'Kontak ID' },
];
function money(value: unknown, currency = 'USD') {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(amount) ? `${amount.toLocaleString('tr-TR')} ${currency}` : '-';
}
function formFromOrder(order: CrmOrder | null): OrderForm {
  return order ? { order_no: order.order_no ?? '', title: order.title ?? '', amount: order.amount == null ? undefined : Number(order.amount), currency: order.currency ?? 'USD', status: (order.status as OrderForm['status']) ?? 'draft', ordered_at: order.ordered_at ?? '', account_id: order.account_id ?? '', quote_id: order.quote_id ?? '', deal_id: order.deal_id ?? '', contact_id: order.contact_id ?? '' } : emptyOrder;
}

export default function SiparislerPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale || 'tr';
  const { data, isLoading, isError } = useGetCrmOrdersQuery();
  const [createOrder, createState] = useCreateCrmOrderMutation();
  const [updateOrder, updateState] = useUpdateCrmOrderMutation();
  const [deleteOrder, deleteState] = useDeleteCrmOrderMutation();
  const [editing, setEditing] = React.useState<CrmOrder | null>(null);
  const [deleting, setDeleting] = React.useState<CrmOrder | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const defaultValues = React.useMemo(() => formFromOrder(editing), [editing]);
  const cols: CrmColumn<CrmOrder>[] = [
    { key: 'order_no', label: 'No', render: (r) => r.order_no || '-' },
    { key: 'title', label: 'Sipariş', render: (r) => <span className="font-semibold text-[#0f172a]">{r.title}</span> },
    { key: 'amount', label: 'Tutar', render: (r) => r.amount != null ? money(r.amount, r.currency || 'USD') : '-' },
    { key: 'status', label: 'Durum', render: (r) => <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[12px] font-medium text-[#1e40af]">{ST[r.status || 'draft'] || r.status}</span> },
    { key: 'ordered_at', label: 'Tarih', render: (r) => r.ordered_at ? new Date(r.ordered_at).toLocaleDateString('tr-TR') : '-' },
  ];
  const submit = async (values: OrderForm) => {
    const patch = { ...values, order_no: values.order_no || null, account_id: values.account_id || null, quote_id: values.quote_id || null, deal_id: values.deal_id || null, contact_id: values.contact_id || null, currency: values.currency || 'USD', ordered_at: values.ordered_at || null };
    if (editing) await updateOrder({ id: editing.id, patch }).unwrap();
    else await createOrder({ ...patch, title: values.title }).unwrap();
  };
  return (
    <>
      <CrmListView title="Siparişler" subtitle="Satış siparişleri" columns={cols} rows={data} isLoading={isLoading} isError={isError} emptyText="Henüz sipariş yok." toolbarActions={<button onClick={() => { setEditing(null); setDialogOpen(true); }} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Yeni Sipariş</button>} rowActions={(row) => (
        <div className="flex items-center gap-1">
          <Link href={`/${locale}/siparisler/${row.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]"><Eye className="h-4 w-4" /></Link>
          <button onClick={() => { setEditing(row); setDialogOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700"><Trash2 className="h-4 w-4" /></button>
        </div>
      )} />
      <CrmEntityDialog<OrderForm> open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Siparişi düzenle' : 'Yeni sipariş'} submitLabel={editing ? 'Güncelle' : 'Oluştur'} defaultValues={defaultValues} schema={orderSchema} fields={fields} isSubmitting={createState.isLoading || updateState.isLoading} onSubmit={submit} />
      <ConfirmDeleteDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Siparişi sil" description="Bu sipariş kaydı silinecek." isDeleting={deleteState.isLoading} onConfirm={() => deleting ? deleteOrder(deleting.id).unwrap() : undefined} />
    </>
  );
}
