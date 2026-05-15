// =============================================================
// FILE: src/integrations/types/menu_items.types.ts
// – Menu Items shared types (Admin + Public)
// =============================================================
import { BoolLike } from '@/integrations/shared';

export type MenuLocation = 'header' | 'footer';
export type MenuItemType = 'page' | 'custom';

// ---------------- PUBLIC DTO ----------------

export interface PublicMenuItemDto {
  id: string;
  title: string;
  url: string; // backend "" de dönebilir
  section_id: string | null;
  icon: string | null;
  is_active: boolean;
  href: string;
  slug: string | null;
  parent_id: string | null;
  position: number;
  order_num: number;
  locale?: string | null;
  created_at?: string;
  updated_at?: string;

  // nested tree için opsiyonel children
  children?: PublicMenuItemDto[];
}

// Public list query (menuItemListQuerySchema ile uyumlu)
export interface PublicMenuItemListQueryParams {
  select?: string;
  parent_id?: string | null;
  is_active?: BoolLike;
  location?: MenuLocation;
  section_id?: string | null;
  locale?: string;
  // nested tree istiyorsan
  nested?: BoolLike;
  // "display_order|position|order_num|created_at|updated_at[.desc]"
  order?: string;
  limit?: number | string;
  offset?: number | string;
}

// ---------------- ADMIN DTO ----------------

export interface AdminMenuItemDto {
  id: string;
  title: string;
  url: string | null;
  type: MenuItemType;
  page_id: string | null;
  parent_id: string | null;
  location: MenuLocation;
  icon: string | null;
  section_id: string | null;
  is_active: boolean;
  display_order: number;
  locale?: string | null;
  created_at?: string;
  updated_at?: string;

  // admin tree view için opsiyonel children
  children?: AdminMenuItemDto[];
}

// adminMenuItemListQuerySchema ile uyumlu
export interface AdminMenuItemListQueryParams {
  q?: string;
  location?: MenuLocation;
  section_id?: string | null;
  parent_id?: string | null;
  is_active?: BoolLike;
  sort?: 'display_order' | 'created_at' | 'title';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  locale?: string;
  nested?: BoolLike;
}

// Create/Update payload'ları

export interface AdminMenuItemCreatePayload {
  title: string;
  url: string | null; // "custom" için zorunlu, backend validate ediyor
  type: MenuItemType;
  page_id?: string | null;
  parent_id?: string | null;
  location: MenuLocation;
  icon?: string | null;
  section_id?: string | null;
  is_active?: BoolLike;
  display_order?: number;
  locale?: string;
}

export interface AdminMenuItemUpdatePayload {
  title?: string;
  url?: string | null;
  type?: MenuItemType;
  page_id?: string | null;
  parent_id?: string | null;
  location?: MenuLocation;
  icon?: string | null;
  section_id?: string | null;
  is_active?: BoolLike;
  display_order?: number;
  locale?: string;
}

// Reorder payload

export interface AdminMenuItemReorderItem {
  id: string;
  display_order: number;
}

export interface AdminMenuItemReorderPayload {
  items: AdminMenuItemReorderItem[];
}

// Generic list response helper
export interface MenuItemListResponse<TItem> {
  items: TItem[];
  total: number;
}
