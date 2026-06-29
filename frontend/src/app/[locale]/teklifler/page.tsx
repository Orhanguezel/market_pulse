'use client';

import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { useGetCrmQuotesQuery, type CrmQuote } from '@/integrations/rtk/public/crm.endpoints';

const ST: Record<string, string> = { draft: 'Taslak', sent: 'Gönderildi', accepted: 'Kabul', rejected: 'Red', expired: 'Süresi doldu', cancelled: 'İptal' };

const cols: CrmColumn<CrmQuote>[] = [
  { key: 'quote_no', label: 'No', render: (r) => r.quote_no || '—' },
  { key: 'title', label: 'Teklif', render: (r) => <span className="font-semibold text-[#0f172a]">{r.title}</span> },
  { key: 'amount', label: 'Tutar', render: (r) => (r.amount != null ? `${Number(r.amount).toLocaleString('tr-TR')} ${r.currency || 'USD'}` : '—') },
  { key: 'status', label: 'Durum', render: (r) => <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[12px] font-medium text-[#1e40af]">{ST[r.status || 'draft'] || r.status}</span> },
  { key: 'valid_until', label: 'Geçerlilik', render: (r) => (r.valid_until ? new Date(r.valid_until).toLocaleDateString('tr-TR') : '—') },
];

export default function TekliflerPage() {
  const { data, isLoading, isError } = useGetCrmQuotesQuery();
  return <CrmListView title="Teklifler" subtitle="Müşteri teklifleri" columns={cols} rows={data} isLoading={isLoading} isError={isError} emptyText="Henüz teklif yok." />;
}
