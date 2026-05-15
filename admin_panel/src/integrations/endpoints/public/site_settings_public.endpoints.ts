// =============================================================
// FILE: src/integrations/endpoints/public/site_settings_public.endpoints.ts
// Public site settings endpoints (read-only)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { SiteSettingRow } from '@/integrations/shared';
import { normalizeAdminSiteSettingRow } from '@/integrations/shared';

export type PublicSiteSetting = SiteSettingRow;
export type BrandConfig = {
  primaryHex: string;
  primaryHexDark: string;
  accentHex: string;
  accentHexDark: string;
  sidebarBgCss: string;
  logoUrl: string;
  faviconUrl: string;
};

const PUBLIC_BASE = '/site_settings';

export const siteSettingsPublicApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listSiteSettings: b.query<PublicSiteSetting[], void>({
      query: () => ({ url: PUBLIC_BASE }),
      transformResponse: (res: unknown): PublicSiteSetting[] =>
        Array.isArray(res) ? (res as SiteSettingRow[]).map(normalizeAdminSiteSettingRow) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'SiteSettings' as const, id: s.key })),
              { type: 'SiteSettings' as const, id: 'PUBLIC_LIST' },
            ]
          : [{ type: 'SiteSettings' as const, id: 'PUBLIC_LIST' }],
      keepUnusedDataFor: 300, // 5 minutes cache for public
    }),

    getSiteSettingByKey: b.query<PublicSiteSetting | null, string>({
      query: (key) => ({ url: `${PUBLIC_BASE}/${encodeURIComponent(key)}` }),
      transformResponse: (res: unknown): PublicSiteSetting | null =>
        res ? normalizeAdminSiteSettingRow(res as SiteSettingRow) : null,
      providesTags: (_r, _e, key) => [{ type: 'SiteSettings', id: key }],
      keepUnusedDataFor: 300, // 5 minutes cache
    }),

    getBrandConfig: b.query<BrandConfig, void>({
      query: () => ({ url: '/public/brand-config' }),
      transformResponse: (res: unknown): BrandConfig => {
        const value = (res && typeof res === 'object' ? res : {}) as Partial<BrandConfig>;
        return {
          primaryHex: value.primaryHex ?? '#E8A598',
          primaryHexDark: value.primaryHexDark ?? '#D88D7E',
          accentHex: value.accentHex ?? '#22c55e',
          accentHexDark: value.accentHexDark ?? '#4ade80',
          sidebarBgCss: value.sidebarBgCss ?? 'oklch(0.97 0.02 145)',
          logoUrl: value.logoUrl ?? '',
          faviconUrl: value.faviconUrl ?? '',
        };
      },
      providesTags: [{ type: 'SiteSettings' as const, id: 'BRAND_CONFIG' }],
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: false,
});

export const {
  useListSiteSettingsQuery,
  useLazyListSiteSettingsQuery,
  useGetSiteSettingByKeyQuery,
  useLazyGetSiteSettingByKeyQuery,
  useGetBrandConfigQuery,
  useLazyGetBrandConfigQuery,
} = siteSettingsPublicApi;
