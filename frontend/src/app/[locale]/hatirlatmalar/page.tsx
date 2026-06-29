'use client';

import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { useGetCrmRemindersQuery, type CrmReminder } from '@/integrations/rtk/public/crm.endpoints';

const ST: Record<string, string> = { scheduled: 'Planlandı', sent: 'Gönderildi', snoozed: 'Ertelendi', cancelled: 'İptal' };
const CH: Record<string, string> = { in_app: 'Uygulama', email: 'E-posta', sms: 'SMS', whatsapp: 'WhatsApp' };

const cols: CrmColumn<CrmReminder>[] = [
  { key: 'title', label: 'Hatırlatma', render: (r) => <span className="font-semibold text-[#0f172a]">{r.title}</span> },
  { key: 'remind_at', label: 'Zaman', render: (r) => (r.remind_at ? new Date(r.remind_at).toLocaleString('tr-TR') : '—') },
  { key: 'channel', label: 'Kanal', render: (r) => CH[r.channel || 'in_app'] || r.channel },
  { key: 'status', label: 'Durum', render: (r) => <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[12px] font-medium text-[#1e40af]">{ST[r.status || 'scheduled'] || r.status}</span> },
];

export default function HatirlatmalarPage() {
  const { data, isLoading, isError } = useGetCrmRemindersQuery();
  return <CrmListView title="Hatırlatma Yönetimi" subtitle="Zamanlanmış hatırlatmalar" columns={cols} rows={data} isLoading={isLoading} isError={isError} emptyText="Henüz hatırlatma yok." />;
}
