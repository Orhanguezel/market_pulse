import { baseApi } from '@/integrations/baseApi';

export interface TenantBranding {
  appName?: string;
  displayName?: string;
  logoUrl?: string;
  sector?: string;
  [key: string]: unknown;
}

export interface TenantSummary {
  key: string;
  name: string;
  locale: string;
  status: string;
  plan: string;
  branding: TenantBranding;
}

export interface TenantRole {
  id: string;
  user_id: string;
  tenant_key: string;
  role: 'tenant_admin' | 'tenant_editor';
  email?: string | null;
  full_name?: string | null;
  created_at: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  locale: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}

export const tenantAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listTenants: b.query<TenantSummary[], void>({
      query: () => ({ url: '/tenants' }),
      providesTags: ['Tenants' as never],
    }),
    getTenant: b.query<TenantSummary, string>({
      query: (key) => ({ url: `/tenants/${key}` }),
      providesTags: ['Tenants' as never],
    }),
    onboardTenant: b.mutation<{ ok: boolean; key: string }, {
      tenant_key: string;
      name: string;
      locale?: string;
      plan?: string;
      branding?: Record<string, unknown>;
      external_db?: Record<string, unknown>;
      external_erp?: Record<string, unknown>;
    }>({
      query: (body) => ({ url: '/tenants/admin/onboard', method: 'POST', body }),
      invalidatesTags: ['Tenants' as never],
    }),
    updateTenantProfile: b.mutation<{ ok: boolean; key: string }, {
      key: string;
      body: {
        name?: string;
        locale?: string;
        status?: string;
        plan?: string;
        branding?: Record<string, unknown>;
        settings?: Record<string, unknown>;
      };
    }>({
      query: ({ key, body }) => ({ url: `/tenants/admin/${key}/profile`, method: 'PATCH', body }),
      invalidatesTags: ['Tenants' as never],
    }),
    listTenantRoles: b.query<TenantRole[], string>({
      query: (key) => ({ url: `/tenants/admin/${key}/roles` }),
      providesTags: ['Tenants' as never],
    }),
    createTenantRole: b.mutation<{ ok: boolean }, { key: string; user_id: string; role?: 'tenant_admin' | 'tenant_editor' }>({
      query: ({ key, ...body }) => ({ url: `/tenants/admin/${key}/roles`, method: 'POST', body }),
      invalidatesTags: ['Tenants' as never],
    }),
    listPlatformSettings: b.query<PlatformSetting[], { locale?: string } | void>({
      query: (params) => ({ url: '/platform-settings', params: params ?? undefined }),
      providesTags: ['PlatformSettings' as never],
    }),
    upsertPlatformSetting: b.mutation<{ ok: boolean; key: string; locale: string }, { key: string; locale?: string; value: unknown }>({
      query: (body) => ({ url: '/admin/platform-settings', method: 'POST', body }),
      invalidatesTags: ['PlatformSettings' as never],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListTenantsQuery,
  useGetTenantQuery,
  useOnboardTenantMutation,
  useUpdateTenantProfileMutation,
  useListTenantRolesQuery,
  useCreateTenantRoleMutation,
  useListPlatformSettingsQuery,
  useUpsertPlatformSettingMutation,
} = tenantAdminApi;
