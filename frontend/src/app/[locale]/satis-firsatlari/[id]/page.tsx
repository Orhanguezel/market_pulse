'use client';

import { useParams } from 'next/navigation';
import { CrmDetailView } from '@/components/iy/CrmDetailView';
import { useGetCrmDealQuery } from '@/integrations/rtk/public/crm.endpoints';

export default function SatisFirsatiDetayPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? '');
  const { data, isLoading, isError } = useGetCrmDealQuery(id, { skip: !id });

  return (
    <CrmDetailView
      title={data?.title ?? 'Satış Fırsatı Detayı'}
      subtitle={data?.status}
      isLoading={isLoading}
      isError={isError}
      fields={[
        { label: 'Tutar', value: data?.amount },
        { label: 'Para birimi', value: data?.currency },
        { label: 'Durum', value: data?.status },
        { label: 'Aşama', value: data?.stage_id },
        { label: 'Müşteri', value: data?.account_id },
        { label: 'Beklenen kapanış', value: data?.expected_close_date },
      ]}
    />
  );
}
