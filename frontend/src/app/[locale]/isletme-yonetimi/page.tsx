'use client';

import SummaryOverview from '@/components/iy/SummaryOverview';
import { useGetCrmBusinessSummaryQuery } from '@/integrations/rtk/public/crm.endpoints';

export default function IsletmeYonetimiPage() {
  const { data, isLoading, isError } = useGetCrmBusinessSummaryQuery();
  return (
    <SummaryOverview
      title="İşletme Yönetimi"
      subtitle={`${data?.tenant.name ?? data?.tenant.tenant_key ?? 'Workspace'} operasyon özeti`}
      isLoading={isLoading}
      isError={isError}
      metrics={[
        { label: 'Aktif modül', value: data?.counts.active_modules, tone: 'green' },
        { label: 'Askıda modül', value: data?.counts.suspended_modules, tone: 'amber' },
        { label: 'Ayar kaydı', value: data?.counts.tenant_settings },
        { label: 'Plan', value: data?.tenant.plan ?? 'standart', tone: 'blue' },
        { label: 'Tenant', value: data?.tenant.tenant_key },
        { label: 'Dil', value: data?.tenant.locale ?? 'tr' },
        { label: 'Durum', value: data?.tenant.status ?? 'active', tone: 'green' },
      ]}
    />
  );
}
