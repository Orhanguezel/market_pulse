// src/integrations/endpoints/admin/auth_admin.endpoints.ts
import { baseApi } from '@/integrations/baseApi';
import type {
  AdminUserRaw,
  AdminUserView,
  AdminUsersListParams,
  AdminUpdateUserBody,
  AdminSetActiveBody,
  AdminSetRolesBody,
  AdminSetPasswordBody,
  AdminRemoveUserBody,
} from '@/integrations/shared';
import { normalizeAdminUser } from '@/integrations/shared';

const ADMIN_USERS_BASE = '/admin/users';

type MaybeUsersListResponse = {
  data?: unknown;
  items?: unknown;
  rows?: unknown;
};

function unwrapUsersList(input: unknown): AdminUserRaw[] {
  if (Array.isArray(input)) return input as AdminUserRaw[];

  const wrapped = (input ?? {}) as MaybeUsersListResponse;
  if (Array.isArray(wrapped.data)) return wrapped.data as AdminUserRaw[];
  if (Array.isArray(wrapped.items)) return wrapped.items as AdminUserRaw[];
  if (Array.isArray(wrapped.rows)) return wrapped.rows as AdminUserRaw[];

  return [];
}

function unwrapUser(input: unknown): AdminUserRaw {
  if (!input || typeof input !== 'object') return input as AdminUserRaw;
  const wrapped = input as { data?: unknown; item?: unknown };
  if (wrapped.data && typeof wrapped.data === 'object') return wrapped.data as AdminUserRaw;
  if (wrapped.item && typeof wrapped.item === 'object') return wrapped.item as AdminUserRaw;
  return input as AdminUserRaw;
}

export const authAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /users */
    adminList: b.query<AdminUserView[], AdminUsersListParams | undefined>({
      query: (params) => {
        const p = (params ?? {}) as AdminUsersListParams;
        const sp = new URLSearchParams();

        if (p.q) sp.set('q', p.q);
        if (p.role) sp.set('role', p.role);
        if (typeof p.is_active === 'boolean') sp.set('is_active', p.is_active ? '1' : '0');
        if (p.limit != null) sp.set('limit', String(p.limit));
        if (p.offset != null) sp.set('offset', String(p.offset));
        if (p.sort) sp.set('sort', p.sort);
        if (p.order) sp.set('order', p.order);

        const qs = sp.toString();
        return { url: qs ? `${ADMIN_USERS_BASE}?${qs}` : ADMIN_USERS_BASE, method: 'GET' };
      },
      transformResponse: (res: unknown): AdminUserView[] => {
        return unwrapUsersList(res).map(normalizeAdminUser);
      },
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((u) => ({ type: 'AdminUsers' as const, id: u.id })),
              { type: 'AdminUsers' as const, id: 'LIST' },
            ]
          : [{ type: 'AdminUsers' as const, id: 'LIST' }],
    }),

    /** GET /users/:id */
    adminGet: b.query<AdminUserView, { id: string }>({
      query: ({ id }) => ({ url: `${ADMIN_USERS_BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): AdminUserView => normalizeAdminUser(unwrapUser(res)),
      providesTags: (_r, _e, arg) => [{ type: 'AdminUsers' as const, id: arg.id }],
    }),

    /** PATCH /users/:id */
    adminUpdateUser: b.mutation<AdminUserView, AdminUpdateUserBody>({
      query: ({ id, ...patch }) => ({
        url: `${ADMIN_USERS_BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (res: unknown): AdminUserView => normalizeAdminUser(unwrapUser(res)),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers' as const, id: arg.id },
        { type: 'AdminUsers' as const, id: 'LIST' },
      ],
    }),

    /** POST /users/:id/active */
    adminSetActive: b.mutation<{ ok: true }, AdminSetActiveBody>({
      query: ({ id, is_active }) => ({
        url: `${ADMIN_USERS_BASE}/${encodeURIComponent(id)}/active`,
        method: 'POST',
        body: { is_active },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers' as const, id: arg.id },
        { type: 'AdminUsers' as const, id: 'LIST' },
      ],
    }),

    /** POST /users/:id/roles */
    adminSetRoles: b.mutation<{ ok: true }, AdminSetRolesBody>({
      query: ({ id, roles }) => ({
        url: `${ADMIN_USERS_BASE}/${encodeURIComponent(id)}/roles`,
        method: 'POST',
        body: { roles },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers' as const, id: arg.id },
        { type: 'AdminUsers' as const, id: 'LIST' },
        { type: 'UserRoles' as const, id: 'LIST' },
      ],
    }),

    /** POST /users/:id/password */
    adminSetPassword: b.mutation<{ ok: true }, AdminSetPasswordBody>({
      query: ({ id, password }) => ({
        url: `${ADMIN_USERS_BASE}/${encodeURIComponent(id)}/password`,
        method: 'POST',
        body: { password },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers' as const, id: arg.id },
        { type: 'AdminUsers' as const, id: 'LIST' },
      ],
    }),

    /** DELETE /users/:id */
    adminRemoveUser: b.mutation<{ ok: true }, AdminRemoveUserBody>({
      query: ({ id }) => ({
        url: `${ADMIN_USERS_BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers' as const, id: arg.id },
        { type: 'AdminUsers' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useAdminListQuery,
  useAdminGetQuery,
  useAdminUpdateUserMutation,
  useAdminSetActiveMutation,
  useAdminSetRolesMutation,
  useAdminSetPasswordMutation,
  useAdminRemoveUserMutation,
} = authAdminApi;

// Legacy/admin-panel aliases
export const useListUsersAdminQuery = useAdminListQuery;
export const useGetUserAdminQuery = useAdminGetQuery;
export const useUpdateUserAdminMutation = useAdminUpdateUserMutation;
export const useSetUserActiveAdminMutation = useAdminSetActiveMutation;
export const useSetUserRolesAdminMutation = useAdminSetRolesMutation;
export const useSetUserPasswordAdminMutation = useAdminSetPasswordMutation;
export const useRemoveUserAdminMutation = useAdminRemoveUserMutation;
