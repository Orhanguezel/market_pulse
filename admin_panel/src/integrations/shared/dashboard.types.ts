// =============================================================
// FILE: src/integrations/shared/dashboard.types.ts
// Dashboard analytics types shared with admin frontend
// =============================================================

export type DashboardRangeKey = '7d' | '30d' | '90d';
export type DashboardTrendBucket = 'day' | 'week';

export type DashboardAnalytics = {
  range: DashboardRangeKey;
  fromYmd: string;
  toYmdExclusive: string;
  meta: {
    bucket: DashboardTrendBucket;
  };
  totals: {
    bookings_total: number;
    bookings_new: number;
    bookings_confirmed: number;
    bookings_completed: number;
    bookings_cancelled: number;
    bookings_other: number;
    revenue_total: number;
    slots_total: number;
    slots_reserved: number;
    resources_total: number;
    services_total: number;
    faqs_total: number;
    email_templates_total: number;
    site_settings_total: number;
    custom_pages_total: number;
    menu_items_total: number;
    slider_total: number;
    footer_sections_total: number;
    reviews_total: number;
    users_total: number;
    storage_assets_total: number;
    db_snapshots_total: number;
    audit_logs_total: number;
    availability_total: number;
    notifications_total: number;
    contact_messages_unread: number;
    contact_messages_total: number;
    consultants_active: number;
    today_bookings: number;
    support_tickets_total: number;
    announcements_total: number;
  };
  resources: Array<{
    resource_id: string;
    resource_name: string;
    bookings_total: number;
    bookings_new: number;
    bookings_confirmed: number;
    bookings_completed: number;
    bookings_cancelled: number;
    slots_total: number;
    slots_reserved: number;
  }>;
  services: Array<{
    service_id: string;
    service_name: string;
    bookings_total: number;
    revenue_total: number;
  }>;
  trend: Array<{
    bucket: string;
    bookings_total: number;
    bookings_new: number;
    bookings_confirmed: number;
    bookings_completed: number;
    bookings_cancelled: number;
  }>;
  revenueTrend: Array<{
    bucket: string;
    revenue_total: number;
  }>;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function toNum(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeDashboardAnalytics(raw: unknown): DashboardAnalytics {
  const root = isRecord(raw) ? raw : {};
  const totals = isRecord(root.totals) ? root.totals : {};

  return {
    range: String(root.range || '30d') as DashboardRangeKey,
    fromYmd: String(root.fromYmd || ''),
    toYmdExclusive: String(root.toYmdExclusive || ''),
    meta: {
      bucket: String((isRecord(root.meta) ? root.meta.bucket : '') || 'day') as DashboardTrendBucket,
    },
    totals: {
      bookings_total: toNum(totals.bookings_total),
      bookings_new: toNum(totals.bookings_new),
      bookings_confirmed: toNum(totals.bookings_confirmed),
      bookings_completed: toNum(totals.bookings_completed),
      bookings_cancelled: toNum(totals.bookings_cancelled),
      bookings_other: toNum(totals.bookings_other),
      revenue_total: toNum(totals.revenue_total),
      slots_total: toNum(totals.slots_total),
      slots_reserved: toNum(totals.slots_reserved),
      resources_total: toNum(totals.resources_total),
      services_total: toNum(totals.services_total),
      faqs_total: toNum(totals.faqs_total),
      email_templates_total: toNum(totals.email_templates_total),
      site_settings_total: toNum(totals.site_settings_total),
      custom_pages_total: toNum(totals.custom_pages_total),
      menu_items_total: toNum(totals.menu_items_total),
      slider_total: toNum(totals.slider_total),
      footer_sections_total: toNum(totals.footer_sections_total),
      reviews_total: toNum(totals.reviews_total),
      users_total: toNum(totals.users_total),
      storage_assets_total: toNum(totals.storage_assets_total),
      db_snapshots_total: toNum(totals.db_snapshots_total),
      audit_logs_total: toNum(totals.audit_logs_total),
      availability_total: toNum(totals.availability_total),
      notifications_total: toNum(totals.notifications_total),
      contact_messages_unread: toNum(totals.contact_messages_unread),
      contact_messages_total: toNum(totals.contact_messages_total),
      consultants_active: toNum(totals.consultants_active),
      today_bookings: toNum(totals.today_bookings),
      support_tickets_total: toNum(totals.support_tickets_total),
      announcements_total: toNum(totals.announcements_total),
    },
    resources: Array.isArray(root.resources)
      ? (root.resources as any[]).map((r) => ({
          resource_id: String(r.resource_id || ''),
          resource_name: String(r.resource_name || '—'),
          bookings_total: toNum(r.bookings_total),
          bookings_new: toNum(r.bookings_new),
          bookings_confirmed: toNum(r.bookings_confirmed),
          bookings_completed: toNum(r.bookings_completed),
          bookings_cancelled: toNum(r.bookings_cancelled),
          slots_total: toNum(r.slots_total),
          slots_reserved: toNum(r.slots_reserved),
        }))
      : [],
    services: Array.isArray(root.services)
      ? (root.services as any[]).map((r) => ({
          service_id: String(r.service_id || ''),
          service_name: String(r.service_name || '—'),
          bookings_total: toNum(r.bookings_total),
          revenue_total: toNum(r.revenue_total),
        }))
      : [],
    trend: Array.isArray(root.trend)
      ? (root.trend as any[]).map((r) => ({
          bucket: String(r.bucket || ''),
          bookings_total: toNum(r.bookings_total),
          bookings_new: toNum(r.bookings_new),
          bookings_confirmed: toNum(r.bookings_confirmed),
          bookings_completed: toNum(r.bookings_completed),
          bookings_cancelled: toNum(r.bookings_cancelled),
        }))
      : [],
    revenueTrend: Array.isArray(root.revenueTrend)
      ? (root.revenueTrend as any[]).map((r) => ({
          bucket: String(r.bucket || ''),
          revenue_total: toNum(r.revenue_total),
        }))
      : [],
  };
}
