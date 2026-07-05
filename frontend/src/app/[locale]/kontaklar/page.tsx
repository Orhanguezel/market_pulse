'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import {
  useCreateCrmContactMutation,
  useDeleteCrmContactMutation,
  useGetCrmAccountsQuery,
  useGetCrmContactsQuery,
  useUpdateCrmContactMutation,
  type CrmContact,
} from '@/integrations/rtk/public/crm.endpoints';

const contactSchema = z.object({
  first_name: z.string().trim().optional(),
  last_name: z.string().trim().optional(),
  title: z.string().trim().optional(),
  email: z.string().trim().email('Geçerli e-posta girin').or(z.literal('')).optional(),
  phone: z.string().trim().optional(),
  linkedin_url: z.string().trim().optional(),
  account_id: z.string().trim().optional(),
}).refine((value) => Boolean(value.first_name || value.last_name || value.email || value.phone), {
  message: 'En az ad, soyad, e-posta veya telefon girin',
  path: ['first_name'],
});

type ContactForm = z.infer<typeof contactSchema>;

const emptyContact: ContactForm = {
  first_name: '',
  last_name: '',
  title: '',
  email: '',
  phone: '',
  linkedin_url: '',
  account_id: '',
};

function formFromContact(contact: CrmContact | null): ContactForm {
  if (!contact) return emptyContact;
  return {
    first_name: contact.first_name ?? '',
    last_name: contact.last_name ?? '',
    title: contact.title ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    linkedin_url: contact.linkedin_url ?? '',
    account_id: contact.account_id ?? '',
  };
}

export default function KontaklarPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale || 'tr';
  const { data, isLoading, isError } = useGetCrmContactsQuery();
  const { data: accounts = [] } = useGetCrmAccountsQuery();
  const [createContact, createState] = useCreateCrmContactMutation();
  const [updateContact, updateState] = useUpdateCrmContactMutation();
  const [deleteContact, deleteState] = useDeleteCrmContactMutation();
  const [editing, setEditing] = React.useState<CrmContact | null>(null);
  const [deleting, setDeleting] = React.useState<CrmContact | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const accountNames = React.useMemo(() => new Map(accounts.map((account) => [account.id, account.name])), [accounts]);
  const defaultValues = React.useMemo(() => formFromContact(editing), [editing]);
  const fields = React.useMemo<CrmFormField<ContactForm>[]>(() => [
    { name: 'first_name', label: 'Ad' },
    { name: 'last_name', label: 'Soyad' },
    { name: 'title', label: 'Ünvan' },
    { name: 'email', label: 'E-posta', type: 'email' },
    { name: 'phone', label: 'Telefon' },
    { name: 'linkedin_url', label: 'LinkedIn URL' },
    { name: 'account_id', label: 'Firma', type: 'select', options: [{ value: '', label: 'Firma seçilmedi' }, ...accounts.map((account) => ({ value: account.id, label: account.name }))] },
  ], [accounts]);
  const busy = createState.isLoading || updateState.isLoading;

  const cols = React.useMemo<CrmColumn<CrmContact>[]>(() => [
    { key: 'first_name', label: 'Kişi', render: (row) => <span className="font-semibold text-[#0f172a]">{[row.first_name, row.last_name].filter(Boolean).join(' ') || '-'}</span> },
    { key: 'title', label: 'Ünvan', render: (row) => row.title || '-' },
    {
      key: 'account_id',
      label: 'Firma',
      render: (row) => row.account_id ? <Link href={`/${locale}/musteriler/${row.account_id}`} className="font-medium text-[#1e40af] hover:underline">{accountNames.get(row.account_id) ?? row.account_id}</Link> : '-',
    },
    { key: 'email', label: 'E-posta', render: (row) => row.email || '-' },
    { key: 'phone', label: 'Telefon', render: (row) => row.phone || '-' },
    { key: 'created_at', label: 'Oluşturma', render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString('tr-TR') : '-' },
  ], [accountNames, locale]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const submit = async (values: ContactForm) => {
    const patch = { ...values, account_id: values.account_id || null };
    if (editing) {
      await updateContact({ id: editing.id, patch }).unwrap();
      return;
    }
    await createContact(patch).unwrap();
  };

  return (
    <>
      <CrmListView
        title="Kontaklar"
        subtitle="Müşteri kişi kayıtları"
        columns={cols}
        rows={data}
        isLoading={isLoading}
        isError={isError}
        emptyText="Henüz kontak yok."
        toolbarActions={(
          <button onClick={openCreate} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white">
            <Plus className="h-4 w-4" /> Yeni Kontak
          </button>
        )}
        rowActions={(row) => (
          <div className="flex items-center gap-1">
            <button onClick={() => { setEditing(row); setDialogOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]" title="Düzenle">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700" title="Sil">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      <CrmEntityDialog<ContactForm>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Kontağı düzenle' : 'Yeni kontak'}
        description="Kişi bilgilerini ve bağlı firmayı yönetin."
        submitLabel={editing ? 'Güncelle' : 'Oluştur'}
        defaultValues={defaultValues}
        schema={contactSchema}
        fields={fields}
        isSubmitting={busy}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Kontağı sil"
        description="Bu kontak kaydı silinecek. Bu işlem geri alınamaz."
        isDeleting={deleteState.isLoading}
        onConfirm={() => deleting ? deleteContact(deleting.id).unwrap() : undefined}
      />
    </>
  );
}
