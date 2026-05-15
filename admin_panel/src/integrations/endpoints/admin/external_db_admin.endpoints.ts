import { baseApi } from '@/integrations/baseApi';

export type ExternalDbConnection = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  host: string;
  port: number;
  db_name: string;
  username: string;
  is_active?: boolean;
  last_tested_at?: string | null;
  last_test_ok?: boolean | null;
  last_error?: string | null;
};

export type ExternalDbTable = {
  tableName: string;
};

type UpsertExternalDbPayload = {
  key?: string;
  name: string;
  description?: string;
  host: string;
  port: number;
  db_name: string;
  username: string;
  password?: string;
  is_active?: boolean;
};

export const externalDbAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listExternalDbConnections: b.query<ExternalDbConnection[], void>({
      query: () => ({ url: '/admin/external-db' }),
      providesTags: [{ type: 'Settings' as const, id: 'EXTERNAL_DB_LIST' }],
    }),
    createExternalDbConnection: b.mutation<ExternalDbConnection, UpsertExternalDbPayload>({
      query: (body) => ({ url: '/admin/external-db', method: 'POST', body }),
      invalidatesTags: [{ type: 'Settings', id: 'EXTERNAL_DB_LIST' }],
    }),
    updateExternalDbConnection: b.mutation<
      ExternalDbConnection,
      { id: string; body: UpsertExternalDbPayload }
    >({
      query: ({ id, body }) => ({ url: `/admin/external-db/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Settings', id: 'EXTERNAL_DB_LIST' }],
    }),
    deleteExternalDbConnection: b.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/external-db/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Settings', id: 'EXTERNAL_DB_LIST' }],
    }),
    testExternalDbConnection: b.mutation<{ ok: boolean; message?: string }, string>({
      query: (id) => ({ url: `/admin/external-db/${id}/test`, method: 'POST' }),
      invalidatesTags: [{ type: 'Settings', id: 'EXTERNAL_DB_LIST' }],
    }),
    listExternalDbTables: b.query<ExternalDbTable[], string>({
      query: (id) => ({ url: `/admin/external-db/${id}/tables` }),
    }),
    runExternalDbSelectQuery: b.mutation<{ rows: Record<string, unknown>[] }, { id: string; sql: string }>({
      query: ({ id, sql }) => ({ url: `/admin/external-db/${id}/query`, method: 'POST', body: { sql } }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListExternalDbConnectionsQuery,
  useCreateExternalDbConnectionMutation,
  useUpdateExternalDbConnectionMutation,
  useDeleteExternalDbConnectionMutation,
  useTestExternalDbConnectionMutation,
  useListExternalDbTablesQuery,
  useRunExternalDbSelectQueryMutation,
} = externalDbAdminApi;
