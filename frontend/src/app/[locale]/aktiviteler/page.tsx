'use client';

import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { useGetCrmActivitiesQuery, type CrmActivity } from '@/integrations/rtk/public/crm.endpoints';

const TYPE_TR: Record<string, string> = {
  call: 'Arama', email: 'E-posta', meeting: 'Toplantı', task: 'Görev', note: 'Not',
};

const cols: CrmColumn<CrmActivity>[] = [
  { key: 'type', label: 'Tip', render: (r) => TYPE_TR[r.type || ''] || r.type || '—' },
  { key: 'subject', label: 'Konu', render: (r) => <span className="font-medium text-[#0f172a]">{r.subject || '—'}</span> },
  { key: 'due_at', label: 'Vade', render: (r) => (r.due_at ? new Date(r.due_at).toLocaleString('tr-TR') : '—') },
  {
    key: 'done', label: 'Durum',
    render: (r) => {
      const done = r.done === 1 || r.done === true;
      return (
        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${done ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef9c3] text-[#854d0e]'}`}>
          {done ? 'Tamamlandı' : 'Bekliyor'}
        </span>
      );
    },
  },
];

export default function AktivitelerPage() {
  const { data, isLoading, isError } = useGetCrmActivitiesQuery();
  return (
    <CrmListView
      title="Aktiviteler"
      subtitle="Görüşme, görev ve hatırlatmalar"
      columns={cols}
      rows={data}
      isLoading={isLoading}
      isError={isError}
      emptyText="Henüz aktivite yok."
    />
  );
}
