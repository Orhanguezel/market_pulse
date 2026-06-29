'use client';

import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { useGetCrmLeadsQuery, type CrmLead } from '@/integrations/rtk/public/crm.endpoints';

const cols: CrmColumn<CrmLead>[] = [
  { key: 'name', label: 'Firma', render: (r) => <span className="font-semibold text-[#0f172a]">{r.name || '—'}</span> },
  { key: 'country', label: 'Ülke', render: (r) => r.country || '—' },
  {
    key: 'website', label: 'Web',
    render: (r) => (r.website ? <a href={r.website} target="_blank" rel="noopener noreferrer" className="font-medium text-[#1e40af] hover:underline">Site</a> : '—'),
  },
  { key: 'email', label: 'E-posta', render: (r) => r.email || '—' },
  { key: 'lead_score', label: 'Skor', render: (r) => (r.lead_score != null ? Number(r.lead_score).toFixed(1) : '—') },
  { key: 'status', label: 'Durum', render: (r) => <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[12px] font-medium text-[#1e40af]">{r.status || 'pending'}</span> },
];

export default function PotansiyelMusterilerPage() {
  const { data, isLoading, isError } = useGetCrmLeadsQuery();
  return (
    <CrmListView
      title="Potansiyel Müşteriler"
      subtitle="Lead motoru ile bulunan aday firmalar"
      columns={cols}
      rows={data}
      isLoading={isLoading}
      isError={isError}
      emptyText="Henüz aday yok. Lead taraması başlatın."
    />
  );
}
