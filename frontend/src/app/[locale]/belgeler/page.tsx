'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ExternalLink, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import { useCreateCrmDocumentMutation, useDeleteCrmDocumentMutation, useGetCrmDocumentsQuery, useUpdateCrmDocumentMutation, type CrmDocument } from '@/integrations/rtk/public/crm.endpoints';

const documentSchema = z.object({
  title: z.string().trim().min(1, 'Belge başlığı gerekli'),
  ref_type: z.enum(['account', 'contact', 'deal', 'quote', 'order']),
  ref_id: z.string().trim().min(1, 'İlişkili kayıt ID gerekli'),
  file_url: z.string().trim().optional(),
  mime_type: z.string().trim().optional(),
  status: z.enum(['active', 'archived']).optional(),
});
type DocumentForm = z.infer<typeof documentSchema>;
const emptyDocument: DocumentForm = { title: '', ref_type: 'account', ref_id: '', file_url: '', mime_type: '', status: 'active' };
const fields: CrmFormField<DocumentForm>[] = [
  { name: 'title', label: 'Belge', required: true },
  { name: 'ref_type', label: 'İlişki tipi', type: 'select', options: [{ value: 'account', label: 'Müşteri' }, { value: 'contact', label: 'Kontak' }, { value: 'deal', label: 'Fırsat' }, { value: 'quote', label: 'Teklif' }, { value: 'order', label: 'Sipariş' }] },
  { name: 'ref_id', label: 'İlişkili kayıt ID', required: true },
  { name: 'file_url', label: 'Dosya URL' },
  { name: 'mime_type', label: 'Dosya türü' },
  { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'active', label: 'Aktif' }, { value: 'archived', label: 'Arşiv' }] },
];
function formFromDocument(document: CrmDocument | null): DocumentForm {
  return document ? { title: document.title ?? '', ref_type: (document.ref_type as DocumentForm['ref_type']) ?? 'account', ref_id: document.ref_id ?? '', file_url: document.file_url ?? '', mime_type: document.mime_type ?? '', status: (document.status as DocumentForm['status']) ?? 'active' } : emptyDocument;
}

export default function BelgelerPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale || 'tr';
  const { data, isLoading, isError } = useGetCrmDocumentsQuery();
  const [createDocument, createState] = useCreateCrmDocumentMutation();
  const [updateDocument, updateState] = useUpdateCrmDocumentMutation();
  const [deleteDocument, deleteState] = useDeleteCrmDocumentMutation();
  const [editing, setEditing] = React.useState<CrmDocument | null>(null);
  const [deleting, setDeleting] = React.useState<CrmDocument | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const defaultValues = React.useMemo(() => formFromDocument(editing), [editing]);
  const cols: CrmColumn<CrmDocument>[] = [
    { key: 'title', label: 'Belge', render: (r) => <span className="font-semibold text-[#0f172a]">{r.title}</span> },
    { key: 'ref_type', label: 'İlişkili', render: (r) => r.ref_type || '-' },
    { key: 'mime_type', label: 'Tür', render: (r) => r.mime_type || '-' },
    { key: 'status', label: 'Durum', render: (r) => r.status || 'active' },
    { key: 'file_url', label: 'Dosya', render: (r) => r.file_url ? <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-[#1e40af] hover:underline">Aç <ExternalLink className="h-3.5 w-3.5" /></a> : '-' },
  ];
  const submit = async (values: DocumentForm) => {
    const patch = { ...values, file_url: values.file_url || null, mime_type: values.mime_type || null };
    if (editing) await updateDocument({ id: editing.id, patch }).unwrap();
    else await createDocument({ ...patch, title: values.title }).unwrap();
  };
  return (
    <>
      <CrmListView title="Belgeler" subtitle="Sözleşme, teklif ve dosyalar" columns={cols} rows={data} isLoading={isLoading} isError={isError} emptyText="Henüz belge yok." toolbarActions={<button onClick={() => { setEditing(null); setDialogOpen(true); }} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Yeni Belge</button>} rowActions={(row) => (
        <div className="flex items-center gap-1">
          <Link href={`/${locale}/belgeler/${row.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]"><Eye className="h-4 w-4" /></Link>
          <button onClick={() => { setEditing(row); setDialogOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700"><Trash2 className="h-4 w-4" /></button>
        </div>
      )} />
      <CrmEntityDialog<DocumentForm> open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Belgeyi düzenle' : 'Yeni belge'} submitLabel={editing ? 'Güncelle' : 'Oluştur'} defaultValues={defaultValues} schema={documentSchema} fields={fields} isSubmitting={createState.isLoading || updateState.isLoading} onSubmit={submit} />
      <ConfirmDeleteDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Belgeyi sil" description="Bu belge kaydı silinecek." isDeleting={deleteState.isLoading} onConfirm={() => deleting ? deleteDocument(deleting.id).unwrap() : undefined} />
    </>
  );
}
