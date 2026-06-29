'use client';

import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { useGetCrmTasksQuery, type CrmTask } from '@/integrations/rtk/public/crm.endpoints';

const ST: Record<string, string> = { open: 'Açık', done: 'Tamamlandı', cancelled: 'İptal' };
const PR: Record<string, string> = { low: 'Düşük', normal: 'Normal', high: 'Yüksek', urgent: 'Acil' };

const cols: CrmColumn<CrmTask>[] = [
  { key: 'subject', label: 'Görev', render: (r) => <span className="font-semibold text-[#0f172a]">{r.subject}</span> },
  { key: 'due_at', label: 'Vade', render: (r) => (r.due_at ? new Date(r.due_at).toLocaleString('tr-TR') : '—') },
  { key: 'priority', label: 'Öncelik', render: (r) => PR[r.priority || 'normal'] || r.priority },
  {
    key: 'status', label: 'Durum',
    render: (r) => {
      const s = r.status || 'open';
      const cls = s === 'done' ? 'bg-[#dcfce7] text-[#166534]' : s === 'cancelled' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#fef9c3] text-[#854d0e]';
      return <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${cls}`}>{ST[s] || s}</span>;
    },
  },
];

export default function GorevlerPage() {
  const { data, isLoading, isError } = useGetCrmTasksQuery();
  return <CrmListView title="Görevler" subtitle="Yapılacaklar ve takip" columns={cols} rows={data} isLoading={isLoading} isError={isError} emptyText="Henüz görev yok." />;
}
