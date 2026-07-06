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

export type PackageItem = {
  module_key: string;
  name: string;
  description: string | null;
  category: string;
  base_price: string | number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  free: boolean;
  owned: boolean;
};

export type MyPackagesResponse = {
  tenant_key: string;
  packages: PackageItem[];
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
    myPackages: b.query<MyPackagesResponse, void>({
      query: () => ({
        url: '/entitlements/packages',
        method: 'GET',
      }),
      providesTags: ['Entitlements'],
    }),
  }),
  overrideExisting: true,
});

export const { useMyEntitlementsQuery, useMyPackagesQuery } = entitlementsApi;
