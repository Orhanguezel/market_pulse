'use client';

import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { useGetCrmProductsQuery, type CrmProduct } from '@/integrations/rtk/public/crm.endpoints';

const cols: CrmColumn<CrmProduct>[] = [
  { key: 'sku', label: 'SKU', render: (r) => r.sku || '—' },
  { key: 'name', label: 'Ürün', render: (r) => <span className="font-semibold text-[#0f172a]">{r.name}</span> },
  { key: 'price', label: 'Fiyat', render: (r) => (r.unit_price != null ? `${Number(r.unit_price).toLocaleString('tr-TR')} ${r.currency || 'USD'}` : '—') },
  { key: 'status', label: 'Durum', render: (r) => <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[12px] font-medium text-[#1e40af]">{r.status || 'aktif'}</span> },
];

export default function UrunlerPage() {
  const { data, isLoading, isError } = useGetCrmProductsQuery();
  return <CrmListView title="Ürünler" subtitle="Ürün/hizmet kataloğu" columns={cols} rows={data} isLoading={isLoading} isError={isError} emptyText="Henüz ürün kaydı yok." />;
}
