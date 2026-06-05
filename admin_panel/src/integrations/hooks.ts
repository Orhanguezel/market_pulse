// =============================================================
// FILE: src/integrations/hooks.ts
// Barrel exports for RTK Query hooks (Xilan)
// =============================================================

// =========================
// Public / Shared endpoints
// =========================

// Auth (Public)
export * from '@/integrations/endpoints/users/auth_public.endpoints';
export * from '@/integrations/endpoints/users/profiles.endpoints';
export * from '@/integrations/endpoints/users/user_roles.endpoints';

// Public Endpoints
export * from '@/integrations/endpoints/public/site_settings_public.endpoints';

// =========================
// Admin endpoints
// =========================

// Core / Auth / Dashboard / DB
export * from '@/integrations/endpoints/admin/users/auth_admin.endpoints';
export * from '@/integrations/endpoints/admin/users/roles_admin.endpoints';

export * from '@/integrations/endpoints/admin/dashboard_admin.endpoints';
export * from '@/integrations/endpoints/admin/db_admin.endpoints';

// System / Infra / RBAC
export * from '@/integrations/endpoints/admin/audit_admin.endpoints';
export * from '@/integrations/endpoints/admin/site_settings_admin.endpoints';
export * from '@/integrations/endpoints/admin/external_db_admin.endpoints';
export * from '@/integrations/endpoints/admin/storage_admin.endpoints';
export * from '@/integrations/endpoints/admin/users/roles_admin.endpoints';
export * from '@/integrations/endpoints/admin/mail_admin.endpoints';
export * from '@/integrations/endpoints/admin/notifications_admin.endpoints';
export * from '@/integrations/endpoints/admin/menu_items_admin.endpoints';

// MarketPulse
export * from '@/integrations/endpoints/admin/market_admin.endpoints';
export * from '@/integrations/endpoints/admin/tenant_admin.endpoints';
