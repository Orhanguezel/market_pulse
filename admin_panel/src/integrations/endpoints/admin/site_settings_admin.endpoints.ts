// =============================================================
// FILE: src/integrations/endpoints/admin/site_settings_admin.endpoints.ts
// FINAL — no helpers inside; everything from types barrel
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  SiteSettingRow,
  SettingValue,
  UpsertSettingBody,
  AdminSiteSettingsListParams,
  AppLocaleMeta,
} from '@/integrations/shared';
import {
  buildAdminSiteSettingsListParams,
  normalizeAdminSiteSettingRow,
  normalizeAppLocalesPublic,
  normalizeDefaultLocalePublic,
} from '@/integrations/shared';

export type AdminSiteSetting = SiteSettingRow;

export type GetSiteSettingAdminByKeyArg =
  | string
  | {
      key: string;
      locale?: string | null;
    };

const ADMIN_BASE = '/admin/site-settings';
const ADMIN_LIST = '/admin/site-settings/list';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['SiteSettings'] as const });

export const siteSettingsAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listSiteSettingsAdmin: b.query<AdminSiteSetting[], AdminSiteSettingsListParams | undefined>({
      query: (params) => {
        const q = buildAdminSiteSettingsListParams(params);
        return q ? { url: ADMIN_LIST, params: q } : { url: ADMIN_LIST }; // ✅ /list endpoint kullan
      },
      transformResponse: (res: unknown): AdminSiteSetting[] =>
        Array.isArray(res) ? (res as SiteSettingRow[]).map(normalizeAdminSiteSettingRow) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'SiteSettings' as const, id: s.key })),
              { type: 'SiteSettings' as const, id: 'LIST' },
            ]
          : [{ type: 'SiteSettings' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    getSiteSettingAdminByKey: b.query<AdminSiteSetting | null, GetSiteSettingAdminByKeyArg>({
      query: (arg) => {
        const key = typeof arg === 'string' ? arg : arg.key;
        const locale = typeof arg === 'string' ? null : arg.locale;

        return {
          url: `${ADMIN_BASE}/${encodeURIComponent(key)}`,
          params: locale ? { locale } : undefined,
        };
      },
      transformResponse: (res: unknown): AdminSiteSetting | null =>
        res ? (normalizeAdminSiteSettingRow(res as SiteSettingRow) as AdminSiteSetting) : null,
      providesTags: (_r, _e, arg) => {
        const key = typeof arg === 'string' ? arg : arg.key;
        return [{ type: 'SiteSettings', id: key }];
      },
    }),

    // /admin/site-settings/app-locales
    getAppLocalesAdmin: b.query<AppLocaleMeta[], void>({
      query: () => ({ url: `${ADMIN_BASE}/app-locales`, method: 'GET' }),
      transformResponse: (res: unknown): AppLocaleMeta[] => normalizeAppLocalesPublic(res),
      providesTags: [{ type: 'SiteSettings' as const, id: 'APP_LOCALES' }],
      keepUnusedDataFor: 60,
    }),

    // /admin/site-settings/default-locale
    getDefaultLocaleAdmin: b.query<string, void>({
      query: () => ({ url: `${ADMIN_BASE}/default-locale`, method: 'GET' }),
      transformResponse: (res: unknown): string => normalizeDefaultLocalePublic(res),
      providesTags: [{ type: 'SiteSettings' as const, id: 'DEFAULT_LOCALE' }],
      keepUnusedDataFor: 60,
    }),

    createSiteSettingAdmin: b.mutation<AdminSiteSetting, UpsertSettingBody>({
      query: (body) => ({
        url: ADMIN_BASE,
        method: 'POST',
        body: { key: body.key, value: body.value },
      }),
      transformResponse: (res: unknown): AdminSiteSetting =>
        normalizeAdminSiteSettingRow(res as SiteSettingRow) as AdminSiteSetting,
      invalidatesTags: [{ type: 'SiteSettings', id: 'LIST' }],
    }),

    updateSiteSettingAdmin: b.mutation<
      { ok: true },
      { key: string; value: SettingValue; locale?: string | null }
    >({
      query: ({ key, value, locale }) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(key)}`,
        method: 'PUT',
        params: locale ? { locale } : undefined,
        body: { value },
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => {
        const key = String(arg.key || '').trim();
        const tags: Array<{ type: 'SiteSettings'; id: string }> = [
          { type: 'SiteSettings', id: key || 'UNKNOWN' },
          { type: 'SiteSettings', id: 'LIST' },
        ];

        if (key === 'default_locale') tags.push({ type: 'SiteSettings', id: 'DEFAULT_LOCALE' });
        if (key === 'app_locales') tags.push({ type: 'SiteSettings', id: 'APP_LOCALES' });

        return tags;
      },
    }),

    bulkUpsertSiteSettingsAdmin: b.mutation<{ ok: true }, { items: UpsertSettingBody[] }>({
      query: ({ items }) => ({
        url: `${ADMIN_BASE}/bulk-upsert`,
        method: 'POST',
        body: { items: items.map((i) => ({ key: i.key, value: i.value })) },
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [
        { type: 'SiteSettings', id: 'LIST' },
        { type: 'SiteSettings', id: 'DEFAULT_LOCALE' },
        { type: 'SiteSettings', id: 'APP_LOCALES' },
      ],
    }),

    deleteSiteSettingAdmin: b.mutation<{ ok: true }, { key: string; locale?: string | null }>({
      query: ({ key, locale }) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(key)}`,
        method: 'DELETE',
        params: locale ? { locale } : undefined,
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'SiteSettings', id: arg.key },
        { type: 'SiteSettings', id: 'LIST' },
      ],
    }),

    deleteManySiteSettingsAdmin: b.mutation<
      { ok: true },
      { idNe?: string; key?: string; keyNe?: string; keys?: string[]; prefix?: string }
    >({
      query: (p) => {
        const params: Record<string, string> = {};
        if (p.idNe) params['id!'] = p.idNe;
        if (p.key) params['key'] = p.key;
        if (p.keyNe) params['key!'] = p.keyNe;
        if (p.keys?.length) params['keys'] = p.keys.join(',');
        if (p.prefix) params['prefix'] = p.prefix;

        return { url: ADMIN_BASE, method: 'DELETE', params };
      },
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: 'SiteSettings', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSiteSettingsAdminQuery,
  useGetSiteSettingAdminByKeyQuery,
  useGetAppLocalesAdminQuery,
  useGetDefaultLocaleAdminQuery,
  useCreateSiteSettingAdminMutation,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
  useBulkUpsertSiteSettingsAdminMutation,
  useDeleteManySiteSettingsAdminMutation,
} = siteSettingsAdminApi;
