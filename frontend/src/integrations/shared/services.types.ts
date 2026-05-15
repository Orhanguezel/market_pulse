// =============================================================
// FILE: src/integrations/rtk/types/services.types.ts
// – Services (Hizmetler) RTK Tipleri (NO CATEGORY)
// Backend: src/modules/services/*
// =============================================================

import { BoolLike, SortDirection } from '@/integrations/shared';

/** Backend ServiceTypeEnum ile uyumlu */
export type ServiceType =
  | 'massage'
  | 'facial'
  | 'body_treatment'
  | 'scrub'
  | 'pack'
  | 'wellness'
  | 'other';

/** Sıralama alanları (serviceListQuerySchema.sort ile uyumlu) */
export type ServiceSortField = 'created_at' | 'updated_at' | 'display_order';

/* ------------------------------------------------------------------
 * LIST QUERY PARAMS (public + admin)
 * Backend: serviceListQuerySchema (validation.ts)
 * ------------------------------------------------------------------ */

export interface ServiceListQueryParams {
  /** Ör: "created_at.desc" – backend parseOrder ile çözüyor */
  order?: string;
  sort?: ServiceSortField;
  orderDir?: SortDirection;

  limit?: number;
  offset?: number;

  q?: string;
  type?: ServiceType;

  featured?: BoolLike;
  is_active?: BoolLike;

  locale?: string;
  default_locale?: string;
}

export type ServiceListAdminQueryParams = ServiceListQueryParams;
export type ServiceListPublicQueryParams = Omit<ServiceListQueryParams, 'is_active'>;

/* ------------------------------------------------------------------
 * API DTO – Service (backend repository ServiceMerged ile uyumlu)
 * ------------------------------------------------------------------ */

export interface ApiServiceBase {
  id: string;
  type: ServiceType | string;

  featured: 0 | 1; // DB tinyint
  is_active: 0 | 1; // DB tinyint
  display_order: number;

  // ana görsel alanları (legacy + storage)
  featured_image: string | null;
  image_url: string | null;
  image_asset_id: string | null;

  // tip spesifik (non-i18n) alanlar
  area: string | null;
  duration: string | null;
  maintenance: string | null;
  season: string | null;
  equipment: string | null;

  created_at: string;
  updated_at: string;

  // i18n coalesced
  slug: string | null;
  name: string | null;
  description: string | null;
  material: string | null;
  price: string | null;
  price_numeric: number | null;
  includes: string | null;
  warranty: string | null;
  image_alt: string | null;

  // SEO + tags
  tags: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;

  locale_resolved: string | null;
}

export type ApiServiceAdmin = ApiServiceBase;

export interface ApiServicePublic extends ApiServiceBase {
  featured_image_url: string | null;
}

/** FE normalize edilmiş DTO */
export interface ServiceDto {
  id: string;
  type: ServiceType | string;

  featured: boolean;
  is_active: boolean;
  display_order: number;

  featured_image: string | null;
  image_url: string | null;
  image_asset_id: string | null;

  /** Public endpoint’lerden gelebilir; admin’de olmayabilir */
  featured_image_url?: string | null;

  // tip spesifik non-i18n alanlar
  area: string | null;
  duration: string | null;
  maintenance: string | null;
  season: string | null;
  equipment: string | null;

  created_at: string;
  updated_at: string;

  // i18n
  slug: string | null;
  name: string | null;
  summary: string | null;
  content: string | null;
  description: string | null;
  material: string | null;
  price: string | null;
  price_numeric: number | null;
  includes: string | null;
  warranty: string | null;
  image_alt: string | null;

  // SEO + tags
  tags: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;

  locale_resolved: string | null;
}

export interface ServiceListResult {
  items: ServiceDto[];
  total: number;
}

/* ------------------------------------------------------------------
 * API DTO – Service Images
 * ------------------------------------------------------------------ */

export interface ApiServiceImage {
  id: string;
  service_id: string;

  image_asset_id: string | null;
  image_url: string | null;

  is_active: 0 | 1;
  display_order: number;

  created_at: string;
  updated_at: string;

  title: string | null;
  alt: string | null;
  caption: string | null;
  locale_resolved: string | null;
}

export interface ServiceImageDto {
  id: string;
  service_id: string;

  image_asset_id: string | null;
  image_url: string | null;

  is_active: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;

  title: string | null;
  alt: string | null;
  caption: string | null;
  locale_resolved: string | null;
}

/* ------------------------------------------------------------------
 * PAYLOAD – CREATE / UPDATE (service)
 * Backend: UpsertServiceBody, PatchServiceBody (validation.ts)
 * ------------------------------------------------------------------ */

export interface ServiceCreatePayload {
  // parent (non-i18n)
  type?: ServiceType;

  featured?: BoolLike;
  is_active?: BoolLike;
  display_order?: number;

  featured_image?: string | null;
  image_url?: string | null;
  image_asset_id?: string | null;

  // tip spesifik alanlar
  area?: string | null;
  duration?: string | null;
  maintenance?: string | null;
  season?: string | null;
  soil_type?: string | null;
  thickness?: string | null;
  equipment?: string | null;

  // i18n
  locale?: string;
  name?: string;
  slug?: string;
  description?: string;
  material?: string;
  price?: string;
  includes?: string;
  warranty?: string;
  image_alt?: string;

  // SEO + tags
  tags?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;

  replicate_all_locales?: boolean;
}

export interface ServiceUpdatePayload {
  // parent (non-i18n)
  type?: ServiceType;

  featured?: BoolLike;
  is_active?: BoolLike;
  display_order?: number;

  featured_image?: string | null;
  image_url?: string | null;
  image_asset_id?: string | null;

  // tip spesifik alanlar
  area?: string | null;
  duration?: string | null;
  maintenance?: string | null;
  season?: string | null;
  soil_type?: string | null;
  thickness?: string | null;
  equipment?: string | null;

  // i18n
  locale?: string;
  name?: string;
  slug?: string;
  description?: string;
  material?: string;
  price?: string;
  includes?: string;
  warranty?: string;
  image_alt?: string;

  // SEO + tags
  tags?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;

  apply_all_locales?: boolean;
}

/* ------------------------------------------------------------------
 * PAYLOAD – CREATE / UPDATE (service images – gallery)
 * ------------------------------------------------------------------ */

export interface ServiceImageCreatePayload {
  image_asset_id?: string | null;
  image_url?: string | null;

  is_active?: BoolLike;
  display_order?: number;

  title?: string | null;
  alt?: string | null;
  caption?: string | null;
  locale?: string;

  replicate_all_locales?: boolean;
}

export interface ServiceImageUpdatePayload {
  image_asset_id?: string | null;
  image_url?: string | null;

  is_active?: BoolLike;
  display_order?: number;

  title?: string | null;
  alt?: string | null;
  caption?: string | null;
  locale?: string;

  apply_all_locales?: boolean;
}

/* ------------------------------------------------------------------
 * UI FORM TYPES
 * ------------------------------------------------------------------ */

export type AdminLocaleOption = { value: string; label: string };

export type ServiceFormValues = {
  id?: string;
  locale: string;

  // i18n
  name: string;
  slug: string;
  description: string;

  material: string;
  price: string;
  includes: string;
  warranty: string;
  image_alt: string;

  // i18n extras (services_i18n)
  tags: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;

  // parent
  is_active: boolean;
  featured: boolean;
  display_order: string;

  // cover (string in UI)
  featured_image: string;
  image_url: string;
  image_asset_id: string;

  // teknik
  area: string;
  duration: string;
  maintenance: string;
  season: string;
  equipment: string;

  // i18n ops
  replicate_all_locales: boolean;
  apply_all_locales: boolean;
};

export type ServiceFormProps = {
  mode: 'create' | 'edit';
  initialData?: ServiceDto;
  loading: boolean;
  saving: boolean;

  locales: AdminLocaleOption[];
  localesLoading?: boolean;

  defaultLocale?: string;

  onSubmit: (values: any) => void | Promise<void>;

  onCancel?: () => void;
  onLocaleChange?: (locale: string) => void;
};

export type AdminServiceListItem = {
  id: string;
  name: string;

  slug: string;
  is_active: boolean;
  featured: boolean;
  display_order: number;
  locale: string;
};

export const normalizeService = (
  row: ApiServiceBase & { featured_image_url?: string | null },
): ServiceDto => ({
  id: row.id,
  type: row.type,

  featured: row.featured === 1,
  is_active: row.is_active === 1,
  display_order: row.display_order,

  featured_image: row.featured_image,
  image_url: row.image_url,
  image_asset_id: row.image_asset_id,

  featured_image_url:
    typeof row.featured_image_url !== 'undefined' ? row.featured_image_url : undefined,

  area: row.area,
  duration: row.duration,
  maintenance: row.maintenance,
  season: row.season,
  equipment: row.equipment,

  created_at: row.created_at,
  updated_at: row.updated_at,

  slug: row.slug,
  name: row.name,
  summary: (row as any).summary ?? null,
  content: (row as any).content ?? null,
  description: row.description,
  material: row.material,
  price: row.price,
  price_numeric: row.price_numeric,
  includes: row.includes,
  warranty: row.warranty,
  image_alt: row.image_alt,

  tags: row.tags,
  meta_title: row.meta_title,
  meta_description: row.meta_description,
  meta_keywords: row.meta_keywords,

  locale_resolved: row.locale_resolved,
});

export const normalizeServiceImage = (row: ApiServiceImage): ServiceImageDto => ({
  id: row.id,
  service_id: row.service_id,
  image_asset_id: row.image_asset_id,
  image_url: row.image_url,
  is_active: row.is_active === 1,
  display_order: row.display_order,
  created_at: row.created_at,
  updated_at: row.updated_at,
  title: row.title,
  alt: row.alt,
  caption: row.caption,
  locale_resolved: row.locale_resolved,
});
