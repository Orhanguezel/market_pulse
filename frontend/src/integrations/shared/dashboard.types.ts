// =============================================================
// FILE: src/integrations/types/dashboard.types.ts
// – Admin Dashboard Types
// =============================================================

/**
 * Backend'den dönen basit sayım verisi.
 * key: "products", "categories", "services" vs. (sidebar tab id'leri ile uyumlu olursa süper)
//  label: kart üzerinde görünen isim
 */
export interface DashboardCountItemDto {
  key: string;
  label: string;
  count: number;
}

/**
 * Dashboard özet DTO
 * İstersen ileride buraya ekstra alanlar (son 7 gün, sistem statüleri vs.) ekleyebiliriz.
 */
export interface DashboardSummaryDto {
  items: DashboardCountItemDto[];
}
