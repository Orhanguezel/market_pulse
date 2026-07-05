'use client';

import { useParams } from 'next/navigation';
import { CrmDetailView } from '@/components/iy/CrmDetailView';
import { useGetCrmDocumentQuery } from '@/integrations/rtk/public/crm.endpoints';

export default function BelgeDetayPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? '');
  const { data, isLoading, isError } = useGetCrmDocumentQuery(id, { skip: !id });
  return <CrmDetailView title={data?.title ?? 'Belge Detayı'} subtitle={data?.status} isLoading={isLoading} isError={isError} fields={[
    { label: 'İlişki tipi', value: data?.ref_type },
    { label: 'İlişkili kayıt ID', value: data?.ref_id },
    { label: 'Dosya URL', value: data?.file_url },
    { label: 'Dosya türü', value: data?.mime_type },
    { label: 'Durum', value: data?.status },
  ]} />;
}
