// =============================================================
// FILE: src/integrations/shared/reports.ts
// Admin reports DTOs
// =============================================================

export type ReportFilterParams = {
  from?: string;
  to?: string;
  service_id?: string;
  resource_id?: string;
  status?: string;
  locale?: string;
};

export type KpiRow = {
  period: 'day' | 'week' | 'month' | string;
  bucket: string;
  bookings_total: number;
  completed_total: number;
  cancelled_total: number;
  success_rate: number; // 0..1
};

export type UserPerformanceRow = {
  resource_id: string;
  resource_title: string;
  bookings_total: number;
  completed_total: number;
  cancelled_orders: number;
  success_rate: number; // 0..1
};

export type LocationRow = {
  locale: string;
  locale_label: string;
  bookings_total: number;
  completed_total: number;
  cancelled_orders: number;
  success_rate: number; // 0..1
};
