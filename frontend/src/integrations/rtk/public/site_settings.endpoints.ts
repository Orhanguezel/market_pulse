// =============================================================
// FILE: src/integrations/rtk/endpoints/site_settings.endpoints.ts
// – Public Site Settings RTK (aligned with BE routes) [FINAL]
//   - GET /site_settings
//   - GET /site_settings/:key
//   - GET /site_settings/app-locales
//   - GET /site_settings/default-locale
//
// PERF:
// - refetchOnFocus/reconnect/mountOrArgChange: OFF (stable config)
// - keepUnusedDataFor: raised (less churn on route changes)
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  SiteSettingRow,
  AppLocaleMeta,
  DefaultLocaleMeta,
  SiteSettingsListArgs,
  SiteSettingByKeyArgs,
} from '@/integrations/shared';
import {
  mapRowToSetting,
  parseAppLocalesMeta,
  stableQueryOptions,
} from '@/integrations/shared';

export const siteSettingsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /site_settings?locale=de&prefix=foo&key_in=a,b
    listSiteSettings: b.query<SiteSettingRow[], SiteSettingsListArgs | void>({
      query: (arg) => {
        const params: Record<string, string> = {};

        if (arg?.prefix) params.prefix = String(arg.prefix);
        if (arg?.locale) params.locale = String(arg.locale);

        if (arg?.key) params.key = String(arg.key);
        if (arg?.keys?.length) params.key_in = arg.keys.join(',');

        if (arg?.order) params.order = String(arg.order);
        if (arg?.limit !== undefined) params.limit = String(arg.limit);
        if (arg?.offset !== undefined) params.offset = String(arg.offset);

        return {
          url: '/site_settings',
          params: Object.keys(params).length ? params : undefined,
        };
      },

      transformResponse: (res: unknown): SiteSettingRow[] => {
        const arr = Array.isArray(res) ? (res as unknown[]) : [];
        return arr.map(mapRowToSetting).filter(Boolean) as SiteSettingRow[];
      },

      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((s) => ({ type: 'SiteSettings' as const, id: s.key })),
              { type: 'SiteSettings' as const, id: 'LIST' },
            ]
          : [{ type: 'SiteSettings' as const, id: 'LIST' }],

      keepUnusedDataFor: 300,
      ...stableQueryOptions,
    }),

    // GET /site_settings/:key?locale=de
    getSiteSettingByKey: b.query<SiteSettingRow | null, SiteSettingByKeyArgs>({
      query: ({ key, locale }) => ({
        url: `/site_settings/${encodeURIComponent(key)}`,
        params: locale ? { locale } : undefined,
      }),

      transformResponse: (res: unknown): SiteSettingRow | null => mapRowToSetting(res),

      providesTags: (_r, _e, arg) => [{ type: 'SiteSettings', id: arg.key }],

      keepUnusedDataFor: 300,
      ...stableQueryOptions,
    }),

    // GET /site_settings/app-locales
    getAppLocalesPublic: b.query<AppLocaleMeta[], void>({
      query: () => ({ url: '/site_settings/app-locales' }),
      transformResponse: (res: unknown) => parseAppLocalesMeta(res),
      providesTags: [{ type: 'SiteSettings', id: 'META:APP_LOCALES' }],
      keepUnusedDataFor: 600,
      ...stableQueryOptions,
    }),

    // GET /site_settings/default-locale
    getDefaultLocalePublic: b.query<DefaultLocaleMeta, void>({
      query: () => ({ url: '/site_settings/default-locale' }),
      transformResponse: (res: unknown): DefaultLocaleMeta => {
        if (typeof res === 'string') return res.trim().toLowerCase() || null;
        if (res == null) return null;

        if (typeof res === 'object' && (res as any).value) {
          const v = (res as any).value;
          if (typeof v === 'string') return v.trim().toLowerCase() || null;
        }

        return null;
      },
      providesTags: [{ type: 'SiteSettings', id: 'META:DEFAULT_LOCALE' }],
      keepUnusedDataFor: 600,
      ...stableQueryOptions,
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSiteSettingsQuery,
  useGetSiteSettingByKeyQuery,
  useGetAppLocalesPublicQuery,
  useGetDefaultLocalePublicQuery,
} = siteSettingsApi;
