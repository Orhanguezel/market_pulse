'use client';

import { useParams } from 'next/navigation';
import { CrmDetailView } from '@/components/iy/CrmDetailView';
import { useGetCrmQuoteQuery } from '@/integrations/rtk/public/crm.endpoints';

export default function TeklifDetayPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? '');
  const { data, isLoading, isError } = useGetCrmQuoteQuery(id, { skip: !id });
  return <CrmDetailView title={data?.title ?? 'Teklif Detayı'} subtitle={data?.quote_no ?? data?.status} isLoading={isLoading} isError={isError} fields={[
    { label: 'Teklif No', value: data?.quote_no },
    { label: 'Tutar', value: data?.amount },
    { label: 'Para birimi', value: data?.currency },
    { label: 'Durum', value: data?.status },
    { label: 'Geçerlilik', value: data?.valid_until },
    { label: 'Müşteri ID', value: data?.account_id },
    { label: 'Fırsat ID', value: data?.deal_id },
  ]} />;
}
