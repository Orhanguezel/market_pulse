// src/integrations/endpoints/user_roles.endpoints.ts
import { baseApi } from '@/integrations/baseApi';
import type { UserRole, UserRolesListParams } from '@/integrations/shared';

export const userRolesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listUserRoles: b.query<UserRole[], UserRolesListParams | void>({
      query: (params) => {
        const p = (params ?? {}) as UserRolesListParams;
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
      transformResponse: (res: unknown): UserRole[] =>
        Array.isArray(res) ? (res as UserRole[]) : [],
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((r) => ({ type: 'UserRole' as const, id: r.id })),
              { type: 'UserRoles' as const, id: 'LIST' },
            ]
          : [{ type: 'UserRoles' as const, id: 'LIST' }],
    }),

    createUserRole: b.mutation<UserRole, { user_id: string; role: UserRole['role'] }>({
      query: (body) => ({ url: '/user_roles', method: 'POST', body }),
      invalidatesTags: [{ type: 'UserRoles', id: 'LIST' }],
    }),

    deleteUserRole: b.mutation<{ ok: true }, { id: string }>({
      query: ({ id }) => ({ url: `/user_roles/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: 'UserRoles', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const { useListUserRolesQuery, useCreateUserRoleMutation, useDeleteUserRoleMutation } =
  userRolesApi;

// Legacy/admin-panel aliases
export const useAdminUserRolesListQuery = useListUserRolesQuery;
export const useAdminUserRoleCreateMutation = useCreateUserRoleMutation;
export const useAdminUserRoleDeleteMutation = useDeleteUserRoleMutation;
