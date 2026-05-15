// src/integrations/endpoints/admin/roles_admin.endpoints.ts
import { baseApi } from '@/integrations/baseApi';
import type {
  ApiRole,
  Role,
  Permission,
  RolesListParams,
  UpsertRoleBody,
  PatchRoleBody,
} from '@/integrations/shared';
import { normalizeRole } from '@/integrations/shared';

export const rolesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listRolesAdmin: b.query<Role[], RolesListParams | void>({
      query: () => ({ url: '/admin/roles' }),
      transformResponse: (res: unknown): Role[] => {
        if (Array.isArray(res)) return (res as ApiRole[]).map(normalizeRole);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiRole[]).map(normalizeRole) : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: 'Role' as const, id: r.slug })),
              { type: 'Roles' as const, id: 'LIST' },
            ]
          : [{ type: 'Roles' as const, id: 'LIST' }],
    }),

    getRoleAdmin: b.query<Role, string>({
      query: (slug) => ({ url: `/admin/roles/${encodeURIComponent(slug)}` }),
      transformResponse: (res: unknown): Role => normalizeRole(res as ApiRole),
      providesTags: (_r, _e, slug) => [{ type: 'Role' as const, id: slug }],
    }),

    createRoleAdmin: b.mutation<Role, UpsertRoleBody>({
      query: (body) => ({ url: '/admin/roles', method: 'POST', body }),
      transformResponse: (res: unknown): Role => normalizeRole(res as ApiRole),
      invalidatesTags: [{ type: 'Roles' as const, id: 'LIST' }],
    }),

    updateRoleAdmin: b.mutation<Role, { slug: string; body: PatchRoleBody }>({
      query: ({ slug, body }) => ({
        url: `/admin/roles/${encodeURIComponent(slug)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown): Role => normalizeRole(res as ApiRole),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Role' as const, id: arg.slug },
        { type: 'Roles' as const, id: 'LIST' },
      ],
    }),

    deleteRoleAdmin: b.mutation<{ ok: true }, string>({
      query: (slug) => ({ url: `/admin/roles/${encodeURIComponent(slug)}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: 'Roles' as const, id: 'LIST' }],
    }),

    listPermissionsAdmin: b.query<Permission[], void>({
      query: () => ({ url: '/admin/permissions' }),
      transformResponse: (res: unknown): Permission[] => {
        if (Array.isArray(res)) {
          return (res as Permission[]).map((p) => ({
            ...p,
            key: String((p as any).key),
            name: String((p as any).name),
            group: (p as any).group ?? null,
            description: (p as any).description ?? null,
          }));
        }
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data)
          ? (maybe.data as Permission[]).map((p) => ({
              ...p,
              key: String((p as any).key),
              name: String((p as any).name),
              group: (p as any).group ?? null,
              description: (p as any).description ?? null,
            }))
          : [];
      },
      providesTags: [{ type: 'Permissions' as const, id: 'LIST' }],
    }),

    setRolePermissionsAdmin: b.mutation<{ ok: true }, { slug: string; permissions: string[] }>({
      query: ({ slug, permissions }) => ({
        url: `/admin/roles/${encodeURIComponent(slug)}/permissions`,
        method: 'POST',
        body: { permissions },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Role' as const, id: arg.slug },
        { type: 'Roles' as const, id: 'LIST' },
        { type: 'Permissions' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListRolesAdminQuery,
  useGetRoleAdminQuery,
  useCreateRoleAdminMutation,
  useUpdateRoleAdminMutation,
  useDeleteRoleAdminMutation,
  useListPermissionsAdminQuery,
  useSetRolePermissionsAdminMutation,
} = rolesAdminApi;
