'use client';

import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { useGetCrmDocumentsQuery, type CrmDocument } from '@/integrations/rtk/public/crm.endpoints';

const cols: CrmColumn<CrmDocument>[] = [
  { key: 'title', label: 'Belge', render: (r) => <span className="font-semibold text-[#0f172a]">{r.title}</span> },
  { key: 'ref_type', label: 'İlişkili', render: (r) => r.ref_type || '—' },
  { key: 'mime_type', label: 'Tür', render: (r) => r.mime_type || '—' },
  {
    key: 'file', label: 'Dosya',
    render: (r) => (r.file_url ? <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="font-medium text-[#1e40af] hover:underline">Aç</a> : '—'),
  },
];

export default function BelgelerPage() {
  const { data, isLoading, isError } = useGetCrmDocumentsQuery();
  return <CrmListView title="Belgeler" subtitle="Sözleşme, teklif ve dosyalar" columns={cols} rows={data} isLoading={isLoading} isError={isError} emptyText="Henüz belge yok." />;
}
