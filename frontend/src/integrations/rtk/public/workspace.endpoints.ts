import { baseApi } from '@/integrations/rtk/baseApi';

export type WorkspaceRole = 'tenant_admin' | 'tenant_editor';

export type WorkspaceUser = {
  id: string;
  user_id: string;
  tenant_key: string;
  role: WorkspaceRole;
  created_at: string;
  email: string;
  full_name: string | null;
  profile_name: string | null;
  is_active: number | boolean;
  email_verified: number | boolean;
  last_sign_in_at: string | null;
};

export type InviteWorkspaceUserBody = {
  email: string;
  full_name?: string;
  role: WorkspaceRole;
};

export type WorkspaceUserModule = {
  module_key: string;
  name: string;
  category: string | null;
  default_on: boolean;
  user_status: 'active' | 'suspended' | 'none';
};

export const workspaceApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listWorkspaceUsers: b.query<WorkspaceUser[], void>({
      query: () => ({ url: '/tenants/workspace/users', method: 'GET' }),
      providesTags: ['WorkspaceUsers', 'CrmUsersSummary'],
    }),
    inviteWorkspaceUser: b.mutation<{ member: WorkspaceUser; temporary_password: string | null }, InviteWorkspaceUserBody>({
      query: (body) => ({ url: '/tenants/workspace/users/invite', method: 'POST', body }),
      invalidatesTags: ['WorkspaceUsers', 'CrmUsersSummary'],
    }),
    updateWorkspaceUserRole: b.mutation<WorkspaceUser, { userId: string; role: WorkspaceRole }>({
      query: ({ userId, role }) => ({ url: `/tenants/workspace/users/${userId}`, method: 'PATCH', body: { role } }),
      invalidatesTags: ['WorkspaceUsers', 'CrmUsersSummary'],
    }),
    removeWorkspaceUser: b.mutation<void, string>({
      query: (userId) => ({ url: `/tenants/workspace/users/${userId}`, method: 'DELETE' }),
      invalidatesTags: ['WorkspaceUsers', 'CrmUsersSummary'],
    }),
    listWorkspaceUserModules: b.query<{ user_id: string; modules: WorkspaceUserModule[] }, string>({
      query: (userId) => ({ url: `/tenants/workspace/users/${userId}/modules`, method: 'GET' }),
      providesTags: (_r, _e, userId) => [{ type: 'WorkspaceUserModules', id: userId }],
    }),
    setWorkspaceUserModule: b.mutation<{ ok: boolean }, { userId: string; module_key: string; status: 'active' | 'suspended' }>({
      query: ({ userId, ...body }) => ({ url: `/tenants/workspace/users/${userId}/modules`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: 'WorkspaceUserModules', id: userId }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListWorkspaceUsersQuery,
  useInviteWorkspaceUserMutation,
  useUpdateWorkspaceUserRoleMutation,
  useRemoveWorkspaceUserMutation,
  useListWorkspaceUserModulesQuery,
  useSetWorkspaceUserModuleMutation,
} = workspaceApi;
