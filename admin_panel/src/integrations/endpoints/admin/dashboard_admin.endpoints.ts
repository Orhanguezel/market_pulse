// =============================================================
// FILE: src/integrations/endpoints/admin/dashboard_admin.endpoints.ts
// =============================================================
import { baseApi } from "@/integrations/baseApi";
import type { DashboardAnalytics, DashboardRangeKey } from "@/integrations/shared";
import { normalizeDashboardAnalytics } from "@/integrations/shared";

// ---- API -----------------------------------------------------
export const dashboardAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getDashboardSummaryAdmin: b.query<DashboardAnalytics, { range?: DashboardRangeKey } | void>({
      query: (params) => ({
        url: "/admin/dashboard/analytics",
        params: params ?? undefined,
      }),
      transformResponse: (res: unknown) => normalizeDashboardAnalytics(res),
      providesTags: [{ type: "Dashboard" as const, id: "SUMMARY" }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetDashboardSummaryAdminQuery } = dashboardAdminApi;
