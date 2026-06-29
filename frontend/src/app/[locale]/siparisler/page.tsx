'use client';

import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { useGetCrmOrdersQuery, type CrmOrder } from '@/integrations/rtk/public/crm.endpoints';

const ST: Record<string, string> = { draft: 'Taslak', confirmed: 'Onaylandı', fulfilled: 'Tamamlandı', cancelled: 'İptal' };

const cols: CrmColumn<CrmOrder>[] = [
  { key: 'order_no', label: 'No', render: (r) => r.order_no || '—' },
  { key: 'title', label: 'Sipariş', render: (r) => <span className="font-semibold text-[#0f172a]">{r.title}</span> },
  { key: 'amount', label: 'Tutar', render: (r) => (r.amount != null ? `${Number(r.amount).toLocaleString('tr-TR')} ${r.currency || 'USD'}` : '—') },
  { key: 'status', label: 'Durum', render: (r) => <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[12px] font-medium text-[#1e40af]">{ST[r.status || 'draft'] || r.status}</span> },
  { key: 'ordered_at', label: 'Tarih', render: (r) => (r.ordered_at ? new Date(r.ordered_at).toLocaleDateString('tr-TR') : '—') },
];

export default function SiparislerPage() {
  const { data, isLoading, isError } = useGetCrmOrdersQuery();
  return <CrmListView title="Siparişler" subtitle="Satış siparişleri" columns={cols} rows={data} isLoading={isLoading} isError={isError} emptyText="Henüz sipariş yok." />;
}
