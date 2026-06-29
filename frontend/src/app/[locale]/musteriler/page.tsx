'use client';

import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { useGetCrmAccountsQuery, type CrmAccount } from '@/integrations/rtk/public/crm.endpoints';

const cols: CrmColumn<CrmAccount>[] = [
  { key: 'name', label: 'Firma', render: (r) => <span className="font-semibold text-[#0f172a]">{r.name}</span> },
  { key: 'loc', label: 'Konum', render: (r) => [r.city, r.country].filter(Boolean).join(', ') || '—' },
  { key: 'phone', label: 'Telefon', render: (r) => r.phone || '—' },
  { key: 'email', label: 'E-posta', render: (r) => r.email || '—' },
  {
    key: 'status', label: 'Durum',
    render: (r) => (
      <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[12px] font-medium text-[#1e40af]">
        {r.status || 'aktif'}
      </span>
    ),
  },
];

export default function MusterilerPage() {
  const { data, isLoading, isError } = useGetCrmAccountsQuery();
  return (
    <CrmListView
      title="Müşteriler"
      subtitle="CRM firma kayıtları"
      columns={cols}
      rows={data}
      isLoading={isLoading}
      isError={isError}
      emptyText="Henüz müşteri kaydı yok. Potansiyel müşterileri (lead) dönüştürerek ekleyebilirsiniz."
    />
  );
}
