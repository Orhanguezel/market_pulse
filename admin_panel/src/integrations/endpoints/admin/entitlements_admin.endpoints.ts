import { baseApi } from '@/integrations/baseApi';

export type ModuleStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

export interface ModuleCatalogItem {
  module_key: string;
  name: string;
  description: string | null;
  category: string;
  base_price: string | number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  is_active: 0 | 1;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface TenantModule {
  id: string;
  tenant_key: string;
  module_key: string;
  status: ModuleStatus;
  price_snapshot: string | number;
  currency: string;
  activated_at: string;
  expires_at: string | null;
  config: unknown;
  created_at: string;
  updated_at: string;
  name?: string;
  description?: string | null;
  category?: string;
}

export const entitlementsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listModuleCatalog: b.query<ModuleCatalogItem[], void>({
      query: () => ({ url: '/entitlements/catalog' }),
      providesTags: ['ModuleEntitlements' as never],
    }),
    listTenantModules: b.query<TenantModule[], string>({
      query: (tenantKey) => ({ url: `/entitlements/tenant/${tenantKey}` }),
      providesTags: ['ModuleEntitlements' as never],
    }),
    activateTenantModule: b.mutation<{ module: TenantModule | null }, {
      tenantKey: string;
      module_key: string;
      status?: ModuleStatus;
      expires_at?: string | null;
      config?: unknown;
    }>({
      query: ({ tenantKey, ...body }) => ({
        url: `/entitlements/tenant/${tenantKey}/activate`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ModuleEntitlements' as never],
    }),
    suspendTenantModule: b.mutation<{ module: TenantModule | null }, { tenantKey: string; module_key: string }>({
      query: ({ tenantKey, module_key }) => ({
        url: `/entitlements/tenant/${tenantKey}/suspend`,
        method: 'POST',
        body: { module_key },
      }),
      invalidatesTags: ['ModuleEntitlements' as never],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListModuleCatalogQuery,
  useListTenantModulesQuery,
  useActivateTenantModuleMutation,
  useSuspendTenantModuleMutation,
} = entitlementsAdminApi;
