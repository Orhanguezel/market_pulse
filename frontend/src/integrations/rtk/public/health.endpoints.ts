// -------------------------------------------------------------
// FILE: src/integrations/rtk/endpoints/health.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from '@/integrations/rtk/baseApi';
import type { HealthStatus } from '@/integrations/shared';

export const healthApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getHealth: b.query<HealthStatus, void>({
      query: () => ({ url: '/__health' }),
      transformResponse: (res: unknown): HealthStatus => res as HealthStatus,
      providesTags: [{ type: 'Health' as const, id: 'SVC' }],
      keepUnusedDataFor: 10,
    }),
  }),
  overrideExisting: true,
});

export const { useGetHealthQuery } = healthApi;
