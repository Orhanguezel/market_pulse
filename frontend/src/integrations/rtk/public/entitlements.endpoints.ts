import { baseApi } from '@/integrations/rtk/baseApi';

export type MyEntitlementModule = {
  module_key: string;
  status: string;
  name: string | null;
  category: string | null;
};

export type MyEntitlementsResponse = {
  tenant_key: string;
  modules: MyEntitlementModule[];
};

export const entitlementsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    myEntitlements: b.query<MyEntitlementsResponse, void>({
      query: () => ({
        url: '/entitlements/me',
        method: 'GET',
      }),
      providesTags: ['Entitlements'],
    }),
  }),
  overrideExisting: true,
});

export const { useMyEntitlementsQuery } = entitlementsApi;
