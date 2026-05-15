// =============================================================
// FILE: src/integrations/rtk/endpoints/menu_items.endpoints.ts
// – Public Menu Items RTK endpoints
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  PublicMenuItemDto,
  PublicMenuItemListQueryParams,
  MenuItemListResponse,
  RtkMetaWithHeaders,
} from '@/integrations/shared';
import { parseTotalFromHeaders } from '@/integrations/shared';

export const menuItemsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // LIST – GET /menu_items
    listMenuItems: build.query<
      MenuItemListResponse<PublicMenuItemDto>,
      PublicMenuItemListQueryParams | void
    >({
      query: (params?: PublicMenuItemListQueryParams) => ({
        url: '/menu_items',
        method: 'GET',
        params,
      }),
      transformResponse: (data: PublicMenuItemDto[], meta?: RtkMetaWithHeaders) => {
        const total = parseTotalFromHeaders(meta?.response?.headers, data?.length ?? 0);
        return {
          items: data ?? [],
          total,
        };
      },
      providesTags: (result) =>
        result?.items
          ? [
              { type: 'MenuItemPublic' as const, id: 'LIST' },
              ...result.items.map((m) => ({
                type: 'MenuItemPublic' as const,
                id: m.id,
              })),
            ]
          : [{ type: 'MenuItemPublic' as const, id: 'LIST' }],
    }),

    // GET by id – GET /menu_items/:id
    // locale destekli: arg.id + arg.locale
    getMenuItem: build.query<PublicMenuItemDto, { id: string; locale?: string }>({
      query: ({ id, locale }) => ({
        url: `/menu_items/${encodeURIComponent(id)}`,
        method: 'GET',
        params: locale ? { locale } : undefined,
      }),
      providesTags: (_r, _e, arg) => [{ type: 'MenuItemPublic' as const, id: arg.id }],
    }),
  }),
  overrideExisting: false,
});

export const { useListMenuItemsQuery, useGetMenuItemQuery } = menuItemsApi;
