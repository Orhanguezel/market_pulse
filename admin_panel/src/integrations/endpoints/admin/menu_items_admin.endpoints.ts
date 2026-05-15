// =============================================================
// FILE: src/integrations/endpoints/admin/menu_items_admin.endpoints.ts
// Admin Menu Items RTK endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AdminMenuItemDto,
  AdminMenuItemListQueryParams,
  AdminMenuItemCreatePayload,
  AdminMenuItemUpdatePayload,
  AdminMenuItemReorderPayload,
  MenuItemListResponse,
  MetaWithHeaders,
} from '@/integrations/shared';
import { parseTotalFromMeta } from '@/integrations/shared';

export const menuItemsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // LIST – GET /admin/menu_items
    listMenuItemsAdmin: build.query<
      MenuItemListResponse<AdminMenuItemDto>,
      AdminMenuItemListQueryParams | void
    >({
      query: (params?: AdminMenuItemListQueryParams) => ({
        url: '/admin/menu_items',
        method: 'GET',
        params,
      }),
      transformResponse: (data: AdminMenuItemDto[], meta?: MetaWithHeaders) => {
        const total = parseTotalFromMeta(data?.length ?? 0, meta);
        return {
          items: data ?? [],
          total,
        };
      },
      providesTags: (result) =>
        result?.items
          ? [
              { type: 'MenuItem' as const, id: 'LIST' },
              ...result.items.map((m) => ({
                type: 'MenuItem' as const,
                id: m.id,
              })),
            ]
          : [{ type: 'MenuItem' as const, id: 'LIST' }],
    }),

    // GET by id – GET /admin/menu_items/:id
    // locale destekli: arg.id + arg.locale
    getMenuItemAdmin: build.query<AdminMenuItemDto, { id: string; locale?: string }>({
      query: ({ id, locale }) => ({
        url: `/admin/menu_items/${encodeURIComponent(id)}`,
        method: 'GET',
        params: locale ? { locale } : undefined,
      }),
      providesTags: (_r, _e, arg) => [{ type: 'MenuItem' as const, id: arg.id }],
    }),

    // CREATE – POST /admin/menu_items
    createMenuItemAdmin: build.mutation<AdminMenuItemDto, AdminMenuItemCreatePayload>({
      query: (body) => ({
        url: '/admin/menu_items',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'MenuItem' as const, id: 'LIST' },
              { type: 'MenuItem' as const, id: result.id },
            ]
          : [{ type: 'MenuItem' as const, id: 'LIST' }],
    }),

    // UPDATE – PATCH /admin/menu_items/:id
    updateMenuItemAdmin: build.mutation<
      AdminMenuItemDto,
      { id: string; data: AdminMenuItemUpdatePayload }
    >({
      query: ({ id, data }) => ({
        url: `/admin/menu_items/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'MenuItem' as const, id },
        { type: 'MenuItem' as const, id: 'LIST' },
      ],
    }),

    // DELETE – DELETE /admin/menu_items/:id
    deleteMenuItemAdmin: build.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/menu_items/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'MenuItem' as const, id },
        { type: 'MenuItem' as const, id: 'LIST' },
      ],
    }),

    // REORDER – POST /admin/menu_items/reorder
    reorderMenuItemsAdmin: build.mutation<{ ok: boolean }, AdminMenuItemReorderPayload>({
      query: (body) => ({
        url: '/admin/menu_items/reorder',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'MenuItem' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListMenuItemsAdminQuery,
  useGetMenuItemAdminQuery,
  useCreateMenuItemAdminMutation,
  useUpdateMenuItemAdminMutation,
  useDeleteMenuItemAdminMutation,
  useReorderMenuItemsAdminMutation,
} = menuItemsAdminApi;
