'use client';

import * as React from 'react';
import { useOpenCreateFromQuery } from '@/hooks/useOpenCreateFromQuery';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import {
  useCreateCrmAccountMutation,
  useDeleteCrmAccountMutation,
  useGetCrmAccountsQuery,
  useUpdateCrmAccountMutation,
  type CrmAccount,
} from '@/integrations/rtk/public/crm.endpoints';

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Firma adı gerekli'),
  website: z.string().trim().optional(),
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Geçerli e-posta girin').or(z.literal('')).optional(),
  industry: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

type AccountForm = z.infer<typeof accountSchema>;

const emptyAccount: AccountForm = {
  name: '',
  website: '',
  country: '',
  city: '',
  phone: '',
  email: '',
  industry: '',
  status: 'active',
};

const fields: CrmFormField<AccountForm>[] = [
  { name: 'name', label: 'Firma', required: true },
  { name: 'website', label: 'Web sitesi' },
  { name: 'email', label: 'E-posta', type: 'email' },
  { name: 'phone', label: 'Telefon' },
  { name: 'country', label: 'Ülke' },
  { name: 'city', label: 'Şehir' },
  { name: 'industry', label: 'Sektör' },
  { name: 'status', label: 'Durum' },
];

const cols: CrmColumn<CrmAccount>[] = [
  { key: 'name', label: 'Firma', render: (r) => <span className="font-semibold text-[#0f172a]">{r.name}</span> },
  { key: 'city', label: 'Konum', render: (r) => [r.city, r.country].filter(Boolean).join(', ') || '-' },
  { key: 'industry', label: 'Sektör', render: (r) => r.industry || '-' },
  { key: 'phone', label: 'Telefon', render: (r) => r.phone || '-' },
  { key: 'email', label: 'E-posta', render: (r) => r.email || '-' },
  {
    key: 'status', label: 'Durum',
    render: (r) => (
      <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[12px] font-medium text-[#1e40af]">
        {r.status || 'active'}
      </span>
    ),
  },
];

function formFromAccount(account: CrmAccount | null): AccountForm {
  if (!account) return emptyAccount;
  return {
    name: account.name ?? '',
    website: account.website ?? '',
    country: account.country ?? '',
    city: account.city ?? '',
    phone: account.phone ?? '',
    email: account.email ?? '',
    industry: account.industry ?? '',
    status: account.status ?? 'active',
  };
}

export default function MusterilerPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale || 'tr';
  const { data, isLoading, isError } = useGetCrmAccountsQuery();
  const [createAccount, createState] = useCreateCrmAccountMutation();
  const [updateAccount, updateState] = useUpdateCrmAccountMutation();
  const [deleteAccount, deleteState] = useDeleteCrmAccountMutation();
  const [editing, setEditing] = React.useState<CrmAccount | null>(null);
  const [deleting, setDeleting] = React.useState<CrmAccount | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  useOpenCreateFromQuery(() => { setEditing(null); setDialogOpen(true); });

  const defaultValues = React.useMemo(() => formFromAccount(editing), [editing]);
  const busy = createState.isLoading || updateState.isLoading;

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (account: CrmAccount) => {
    setEditing(account);
    setDialogOpen(true);
  };

  const submit = async (values: AccountForm) => {
    const patch = { ...values, status: values.status || 'active' };
    if (editing) {
      await updateAccount({ id: editing.id, patch }).unwrap();
      return;
    }
    await createAccount({ ...patch, name: values.name }).unwrap();
  };

  return (
    <>
      <CrmListView
        title="Müşteriler"
        subtitle="CRM firma kayıtları"
        columns={cols}
        rows={data}
        isLoading={isLoading}
        isError={isError}
        emptyText="Henüz müşteri kaydı yok. Yeni müşteri ekleyebilir veya onaylı adayları CRM'e aktarabilirsiniz."
        toolbarActions={(
          <button onClick={openCreate} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white">
            <Plus className="h-4 w-4" /> Yeni Müşteri
          </button>
        )}
        rowActions={(row) => (
          <div className="flex items-center gap-1">
            <Link href={`/${locale}/musteriler/${row.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]" title="Detay">
              <Eye className="h-4 w-4" />
            </Link>
            <button onClick={() => openEdit(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]" title="Düzenle">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700" title="Sil">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      <CrmEntityDialog<AccountForm>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Müşteriyi düzenle' : 'Yeni müşteri'}
        description="Firma bilgilerini ve CRM durumunu yönetin."
        submitLabel={editing ? 'Güncelle' : 'Oluştur'}
        defaultValues={defaultValues}
        schema={accountSchema}
        fields={fields}
        isSubmitting={busy}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Müşteriyi sil"
        description={deleting ? `${deleting.name} kaydı silinecek. Bu işlem geri alınamaz.` : undefined}
        isDeleting={deleteState.isLoading}
        onConfirm={() => deleting ? deleteAccount(deleting.id).unwrap() : undefined}
      />
    </>
  );
}
