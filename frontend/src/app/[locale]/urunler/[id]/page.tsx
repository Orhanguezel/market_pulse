'use client';

import { useParams } from 'next/navigation';
import { CrmDetailView } from '@/components/iy/CrmDetailView';
import { useGetCrmProductQuery } from '@/integrations/rtk/public/crm.endpoints';

export default function UrunDetayPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? '');
  const { data, isLoading, isError } = useGetCrmProductQuery(id, { skip: !id });
  return (
    <CrmDetailView
      title={data?.name ?? 'Ürün Detayı'}
      subtitle={data?.sku ?? data?.status}
      isLoading={isLoading}
      isError={isError}
      fields={[
        { label: 'SKU', value: data?.sku },
        { label: 'Açıklama', value: data?.description },
        { label: 'Birim fiyat', value: data?.unit_price },
        { label: 'Para birimi', value: data?.currency },
        { label: 'Durum', value: data?.status },
      ]}
    />
  );
}
