'use client';

import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { useGetCrmDealsQuery, type CrmDeal } from '@/integrations/rtk/public/crm.endpoints';

const STATUS_TR: Record<string, string> = { open: 'Açık', won: 'Kazanıldı', lost: 'Kaybedildi' };

const cols: CrmColumn<CrmDeal>[] = [
  { key: 'title', label: 'Fırsat', render: (r) => <span className="font-semibold text-[#0f172a]">{r.title}</span> },
  { key: 'amount', label: 'Tutar', render: (r) => (r.amount != null ? `${Number(r.amount).toLocaleString('tr-TR')} ${r.currency || 'USD'}` : '—') },
  {
    key: 'status', label: 'Durum',
    render: (r) => {
      const s = r.status || 'open';
      const cls = s === 'won' ? 'bg-[#dcfce7] text-[#166534]' : s === 'lost' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#eff6ff] text-[#1e40af]';
      return <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${cls}`}>{STATUS_TR[s] || s}</span>;
    },
  },
  { key: 'expected_close_date', label: 'Tahmini Kapanış', render: (r) => (r.expected_close_date ? new Date(r.expected_close_date).toLocaleDateString('tr-TR') : '—') },
];

export default function SatisFirsatlariPage() {
  const { data, isLoading, isError } = useGetCrmDealsQuery();
  return (
    <CrmListView
      title="Satış Fırsatları"
      subtitle="Açık ve kapanan fırsatlar"
      columns={cols}
      rows={data}
      isLoading={isLoading}
      isError={isError}
      emptyText="Henüz satış fırsatı yok."
    />
  );
}
