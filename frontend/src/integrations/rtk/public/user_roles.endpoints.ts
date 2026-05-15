// src/integrations/rtk/endpoints/user_roles.endpoints.ts
import { baseApi } from '@/integrations/rtk/baseApi';
import type { UserRoleName, UserRoleRow, UserRoleListParams } from '@/integrations/shared';

export const userRolesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listUserRoles: b.query<UserRoleRow[], UserRoleListParams | void>({
      query: (params) => {
        const p: UserRoleListParams = (params ?? {}) as UserRoleListParams;
        return {
          url: '/user_roles',
          params: {
            user_id: p.user_id,
            role: p.role,
            order: p.order ?? 'created_at',
            direction: p.direction ?? 'asc',
            limit: p.limit,
            offset: p.offset,
          },
        };
      },
      transformResponse: (res: unknown): UserRoleRow[] =>
        Array.isArray(res) ? (res as UserRoleRow[]) : [],
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((r) => ({ type: 'UserRole' as const, id: r.id })),
              { type: 'UserRoles' as const, id: 'LIST' },
            ]
          : [{ type: 'UserRoles' as const, id: 'LIST' }],
    }),

    createUserRole: b.mutation<UserRoleRow, { user_id: string; role: UserRoleName }>({
      query: (body) => ({ url: '/user_roles', method: 'POST', body }),
      invalidatesTags: [{ type: 'UserRoles', id: 'LIST' }],
    }),

    deleteUserRole: b.mutation<{ ok: true }, { id: string }>({
      query: ({ id }) => ({
        url: `/user_roles/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'UserRoles', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const { useListUserRolesQuery, useCreateUserRoleMutation, useDeleteUserRoleMutation } =
  userRolesApi;
