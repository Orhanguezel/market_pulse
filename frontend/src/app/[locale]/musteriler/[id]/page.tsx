'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Briefcase, CalendarCheck, Loader2, Pencil, Trash2, UserRound } from 'lucide-react';
import { z } from 'zod';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import {
  useDeleteCrmAccountMutation,
  useGetCrmAccountQuery,
  useGetCrmActivitiesQuery,
  useGetCrmContactsQuery,
  useGetCrmDealsQuery,
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
type TabKey = 'contacts' | 'deals' | 'activities';

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

function formFromAccount(account: CrmAccount | undefined): AccountForm {
  return {
    name: account?.name ?? '',
    website: account?.website ?? '',
    country: account?.country ?? '',
    city: account?.city ?? '',
    phone: account?.phone ?? '',
    email: account?.email ?? '',
    industry: account?.industry ?? '',
    status: account?.status ?? 'active',
  };
}

function DetailField({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="border-b border-[#f1f5f9] px-5 py-4">
      <dt className="text-[12px] font-semibold uppercase text-[#64748b]">{label}</dt>
      <dd className="mt-1 truncate text-[14px] text-[#0f172a]">{String(value || '-')}</dd>
    </div>
  );
}

function EmptyTab({ text }: { text: string }) {
  return <div className="px-5 py-10 text-center text-[13px] text-[#64748b]">{text}</div>;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('tr-TR') : '-';
}

export default function MusteriDetayPage() {
  const params = useParams<{ locale: string; id: string }>();
  const router = useRouter();
  const locale = params.locale || 'tr';
  const id = String(params?.id ?? '');
  const { data, isLoading, isError } = useGetCrmAccountQuery(id, { skip: !id });
  const { data: contacts = [], isLoading: contactsLoading } = useGetCrmContactsQuery({ account_id: id }, { skip: !id });
  const { data: deals = [], isLoading: dealsLoading } = useGetCrmDealsQuery({ account_id: id }, { skip: !id });
  const { data: activities = [], isLoading: activitiesLoading } = useGetCrmActivitiesQuery({ ref_type: 'account', ref_id: id }, { skip: !id });
  const [updateAccount, updateState] = useUpdateCrmAccountMutation();
  const [deleteAccount, deleteState] = useDeleteCrmAccountMutation();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [tab, setTab] = React.useState<TabKey>('contacts');
  const defaultValues = React.useMemo(() => formFromAccount(data), [data]);

  const submit = async (values: AccountForm) => {
    await updateAccount({ id, patch: { ...values, status: values.status || 'active' } }).unwrap();
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href={`/${locale}/musteriler`} className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1e40af]">
              <ArrowLeft className="h-4 w-4" /> Müşteriler
            </Link>
            <h1 className="text-xl font-bold text-[#0f172a]">{data?.name ?? 'Müşteri Detayı'}</h1>
            <p className="mt-0.5 text-[13px] text-[#64748b]">{data?.industry || data?.status || 'CRM firma kaydı'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={!data} onClick={() => setEditOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155] disabled:opacity-50">
              <Pencil className="h-4 w-4" /> Düzenle
            </button>
            <button disabled={!data} onClick={() => setDeleteOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 px-3 text-[13px] font-semibold text-rose-700 disabled:opacity-50">
              <Trash2 className="h-4 w-4" /> Sil
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#1e40af]" />
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-[#e2e8f0] bg-white px-6 py-12 text-center text-[14px] text-[#64748b]">Kayıt alınamadı.</div>
        ) : (
          <>
            <div className="rounded-lg border border-[#e2e8f0] bg-white">
              <dl className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="E-posta" value={data?.email} />
                <DetailField label="Telefon" value={data?.phone} />
                <DetailField label="Web sitesi" value={data?.website} />
                <DetailField label="Şehir" value={data?.city} />
                <DetailField label="Ülke" value={data?.country} />
                <DetailField label="Durum" value={data?.status} />
              </dl>
            </div>

            <div className="rounded-lg border border-[#e2e8f0] bg-white">
              <div className="flex overflow-x-auto border-b border-[#e2e8f0] px-4 pt-3 text-[13px] font-semibold text-[#475569]">
                {[
                  { key: 'contacts' as const, label: `Kontaklar (${contacts.length})`, icon: UserRound },
                  { key: 'deals' as const, label: `Deal'ler (${deals.length})`, icon: Briefcase },
                  { key: 'activities' as const, label: `Aktiviteler (${activities.length})`, icon: CalendarCheck },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.key;
                  return (
                    <button key={item.key} onClick={() => setTab(item.key)} className={`inline-flex items-center gap-1.5 border-b-2 px-3 pb-3 ${active ? 'border-[#2563eb] text-[#1d4ed8]' : 'border-transparent text-[#94a3b8]'}`}>
                      <Icon className="h-4 w-4" /> {item.label}
                    </button>
                  );
                })}
              </div>

              {tab === 'contacts' && (
                contactsLoading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#1e40af]" /></div> :
                contacts.length ? (
                  <div className="divide-y divide-[#f1f5f9]">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="grid gap-1 px-5 py-4 md:grid-cols-[1.2fr_1fr_1fr] md:items-center">
                        <div className="font-semibold text-[#0f172a]">{[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '-'}</div>
                        <div className="text-[13px] text-[#64748b]">{contact.title || '-'}</div>
                        <div className="text-[13px] text-[#64748b]">{contact.email || contact.phone || '-'}</div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyTab text="Bu müşteri için kontak yok." />
              )}

              {tab === 'deals' && (
                dealsLoading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#1e40af]" /></div> :
                deals.length ? (
                  <div className="divide-y divide-[#f1f5f9]">
                    {deals.map((deal) => (
                      <div key={deal.id} className="grid gap-1 px-5 py-4 md:grid-cols-[1.3fr_.8fr_.8fr] md:items-center">
                        <Link href={`/${locale}/satis-firsatlari/${deal.id}`} className="font-semibold text-[#1e40af] hover:underline">{deal.title}</Link>
                        <div className="text-[13px] text-[#64748b]">{deal.amount != null ? `${deal.amount} ${deal.currency || ''}` : '-'}</div>
                        <div className="text-[13px] text-[#64748b]">{deal.status || deal.stage_id || '-'}</div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyTab text="Bu müşteri için satış fırsatı yok." />
              )}

              {tab === 'activities' && (
                activitiesLoading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#1e40af]" /></div> :
                activities.length ? (
                  <div className="divide-y divide-[#f1f5f9]">
                    {activities.map((activity) => (
                      <div key={activity.id} className="grid gap-1 px-5 py-4 md:grid-cols-[1.3fr_.8fr_.8fr] md:items-center">
                        <div className="font-semibold text-[#0f172a]">{activity.subject || activity.type || '-'}</div>
                        <div className="text-[13px] text-[#64748b]">{formatDate(activity.due_at)}</div>
                        <div className="text-[13px] text-[#64748b]">{activity.done ? 'Tamamlandı' : 'Açık'}</div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyTab text="Bu müşteri için aktivite yok." />
              )}
            </div>
          </>
        )}
      </div>

      <CrmEntityDialog<AccountForm>
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Müşteriyi düzenle"
        description="Firma bilgilerini güncelleyin."
        submitLabel="Güncelle"
        defaultValues={defaultValues}
        schema={accountSchema}
        fields={fields}
        isSubmitting={updateState.isLoading}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Müşteriyi sil"
        description={data ? `${data.name} kaydı silinecek. Bu işlem geri alınamaz.` : undefined}
        isDeleting={deleteState.isLoading}
        onConfirm={async () => {
          await deleteAccount(id).unwrap();
          router.push(`/${locale}/musteriler`);
        }}
      />
    </>
  );
}
