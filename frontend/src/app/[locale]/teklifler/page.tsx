'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import { useCreateCrmQuoteMutation, useDeleteCrmQuoteMutation, useGetCrmQuotesQuery, useUpdateCrmQuoteMutation, type CrmQuote } from '@/integrations/rtk/public/crm.endpoints';

const ST: Record<string, string> = { draft: 'Taslak', sent: 'Gönderildi', accepted: 'Kabul', rejected: 'Red', expired: 'Süresi doldu', cancelled: 'İptal' };
const quoteSchema = z.object({
  quote_no: z.string().trim().optional(),
  title: z.string().trim().min(1, 'Teklif başlığı gerekli'),
  amount: z.preprocess((value) => value === '' || value == null ? undefined : Number(value), z.number().optional()),
  currency: z.string().trim().length(3, '3 harfli para birimi').or(z.literal('')).optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled']).optional(),
  valid_until: z.string().trim().optional(),
  account_id: z.string().trim().optional(),
  deal_id: z.string().trim().optional(),
  contact_id: z.string().trim().optional(),
});
type QuoteForm = z.infer<typeof quoteSchema>;
const emptyQuote: QuoteForm = { quote_no: '', title: '', amount: undefined, currency: 'USD', status: 'draft', valid_until: '', account_id: '', deal_id: '', contact_id: '' };
const fields: CrmFormField<QuoteForm>[] = [
  { name: 'quote_no', label: 'Teklif No' },
  { name: 'title', label: 'Teklif', required: true },
  { name: 'amount', label: 'Tutar' },
  { name: 'currency', label: 'Para birimi' },
  { name: 'status', label: 'Durum', type: 'select', options: Object.entries(ST).map(([value, label]) => ({ value, label })) },
  { name: 'valid_until', label: 'Geçerlilik', type: 'date' },
  { name: 'account_id', label: 'Müşteri ID' },
  { name: 'deal_id', label: 'Fırsat ID' },
  { name: 'contact_id', label: 'Kontak ID' },
];
function money(value: unknown, currency = 'USD') {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(amount) ? `${amount.toLocaleString('tr-TR')} ${currency}` : '-';
}
function formFromQuote(quote: CrmQuote | null): QuoteForm {
  return quote ? { quote_no: quote.quote_no ?? '', title: quote.title ?? '', amount: quote.amount == null ? undefined : Number(quote.amount), currency: quote.currency ?? 'USD', status: (quote.status as QuoteForm['status']) ?? 'draft', valid_until: quote.valid_until ?? '', account_id: quote.account_id ?? '', deal_id: quote.deal_id ?? '', contact_id: quote.contact_id ?? '' } : emptyQuote;
}

export default function TekliflerPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale || 'tr';
  const { data, isLoading, isError } = useGetCrmQuotesQuery();
  const [createQuote, createState] = useCreateCrmQuoteMutation();
  const [updateQuote, updateState] = useUpdateCrmQuoteMutation();
  const [deleteQuote, deleteState] = useDeleteCrmQuoteMutation();
  const [editing, setEditing] = React.useState<CrmQuote | null>(null);
  const [deleting, setDeleting] = React.useState<CrmQuote | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const defaultValues = React.useMemo(() => formFromQuote(editing), [editing]);
  const cols: CrmColumn<CrmQuote>[] = [
    { key: 'quote_no', label: 'No', render: (r) => r.quote_no || '-' },
    { key: 'title', label: 'Teklif', render: (r) => <span className="font-semibold text-[#0f172a]">{r.title}</span> },
    { key: 'amount', label: 'Tutar', render: (r) => r.amount != null ? money(r.amount, r.currency || 'USD') : '-' },
    { key: 'status', label: 'Durum', render: (r) => <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[12px] font-medium text-[#1e40af]">{ST[r.status || 'draft'] || r.status}</span> },
    { key: 'valid_until', label: 'Geçerlilik', render: (r) => r.valid_until ? new Date(r.valid_until).toLocaleDateString('tr-TR') : '-' },
  ];
  const submit = async (values: QuoteForm) => {
    const patch = { ...values, quote_no: values.quote_no || null, account_id: values.account_id || null, deal_id: values.deal_id || null, contact_id: values.contact_id || null, currency: values.currency || 'USD', valid_until: values.valid_until || null };
    if (editing) await updateQuote({ id: editing.id, patch }).unwrap();
    else await createQuote({ ...patch, title: values.title }).unwrap();
  };
  return (
    <>
      <CrmListView title="Teklifler" subtitle="Müşteri teklifleri" columns={cols} rows={data} isLoading={isLoading} isError={isError} emptyText="Henüz teklif yok." toolbarActions={<button onClick={() => { setEditing(null); setDialogOpen(true); }} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Yeni Teklif</button>} rowActions={(row) => (
        <div className="flex items-center gap-1">
          <Link href={`/${locale}/teklifler/${row.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]"><Eye className="h-4 w-4" /></Link>
          <button onClick={() => { setEditing(row); setDialogOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700"><Trash2 className="h-4 w-4" /></button>
        </div>
      )} />
      <CrmEntityDialog<QuoteForm> open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Teklifi düzenle' : 'Yeni teklif'} submitLabel={editing ? 'Güncelle' : 'Oluştur'} defaultValues={defaultValues} schema={quoteSchema} fields={fields} isSubmitting={createState.isLoading || updateState.isLoading} onSubmit={submit} />
      <ConfirmDeleteDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Teklifi sil" description="Bu teklif kaydı silinecek." isDeleting={deleteState.isLoading} onConfirm={() => deleting ? deleteQuote(deleting.id).unwrap() : undefined} />
    </>
  );
}
