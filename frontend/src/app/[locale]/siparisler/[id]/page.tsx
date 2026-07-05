'use client';

import { useParams } from 'next/navigation';
import { CrmDetailView } from '@/components/iy/CrmDetailView';
import { useGetCrmOrderQuery } from '@/integrations/rtk/public/crm.endpoints';

export default function SiparisDetayPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? '');
  const { data, isLoading, isError } = useGetCrmOrderQuery(id, { skip: !id });
  return <CrmDetailView title={data?.title ?? 'Sipariş Detayı'} subtitle={data?.order_no ?? data?.status} isLoading={isLoading} isError={isError} fields={[
    { label: 'Sipariş No', value: data?.order_no },
    { label: 'Tutar', value: data?.amount },
    { label: 'Para birimi', value: data?.currency },
    { label: 'Durum', value: data?.status },
    { label: 'Sipariş tarihi', value: data?.ordered_at },
    { label: 'Teklif ID', value: data?.quote_id },
    { label: 'Müşteri ID', value: data?.account_id },
  ]} />;
}
