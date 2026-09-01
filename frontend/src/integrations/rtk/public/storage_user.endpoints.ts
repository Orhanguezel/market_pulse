import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { baseApi } from '@/integrations/rtk/baseApi';
import type { StorageAsset, StorageListParams, StorageUpdateInput } from '@/integrations/shared/storage';

type StorageListResult = { items: StorageAsset[]; total: number };

export const storageUserApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMyStorageAssets: builder.query<StorageListResult, StorageListParams | void>({
      query: (params) => ({ url: '/storage/my/assets', method: 'GET', params: params ?? undefined }),
      transformResponse: (items: StorageAsset[], meta) => ({
        items: items ?? [],
        total: Number(meta?.response?.headers.get('x-total-count') ?? items?.length ?? 0),
      }),
      providesTags: (result) => [
        { type: 'Storage', id: 'MY_LIST' },
        ...(result?.items.map((asset) => ({ type: 'Storage' as const, id: asset.id })) ?? []),
      ],
    }),
    getMyStorageAsset: builder.query<StorageAsset, string>({
      query: (id) => `/storage/my/assets/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, id) => [{ type: 'Storage', id }],
    }),
    uploadMyStorageAssets: builder.mutation<{ items: StorageAsset[]; failed: string[] }, { files: File[]; folder?: string }>({
      async queryFn({ files, folder }, _api, _extra, baseQuery) {
        const uploaded: StorageAsset[] = [];
        const failed: string[] = [];
        let lastError: FetchBaseQueryError | undefined;
        for (const file of files) {
          const body = new FormData();
          if (folder?.trim()) body.append('folder', folder.trim());
          body.append('file', file, file.name);
          const result = await baseQuery({ url: '/storage/my/assets', method: 'POST', body });
          if (result.error) {
            failed.push(file.name);
            lastError = result.error as FetchBaseQueryError;
            continue;
          }
          uploaded.push(result.data as StorageAsset);
        }
        if (!uploaded.length && lastError) return { error: lastError };
        return { data: { items: uploaded, failed } };
      },
      invalidatesTags: [{ type: 'Storage', id: 'MY_LIST' }, { type: 'Storage', id: 'MY_FOLDERS' }],
    }),
    patchMyStorageAsset: builder.mutation<StorageAsset, { id: string; patch: StorageUpdateInput }>({
      query: ({ id, patch }) => ({ url: `/storage/my/assets/${encodeURIComponent(id)}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Storage', id }, { type: 'Storage', id: 'MY_LIST' }, { type: 'Storage', id: 'MY_FOLDERS' }],
    }),
    deleteMyStorageAsset: builder.mutation<void, string>({
      query: (id) => ({ url: `/storage/my/assets/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Storage', id }, { type: 'Storage', id: 'MY_LIST' }, { type: 'Storage', id: 'MY_FOLDERS' }],
    }),
    listMyStorageFolders: builder.query<string[], void>({
      query: () => '/storage/my/folders',
      providesTags: [{ type: 'Storage', id: 'MY_FOLDERS' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListMyStorageAssetsQuery,
  useGetMyStorageAssetQuery,
  useUploadMyStorageAssetsMutation,
  usePatchMyStorageAssetMutation,
  useDeleteMyStorageAssetMutation,
  useListMyStorageFoldersQuery,
} = storageUserApi;
