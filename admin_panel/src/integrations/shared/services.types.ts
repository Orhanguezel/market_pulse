// =============================================================
// FILE: src/integrations/shared/services.types.ts
// FINAL — Services (Hizmetler) RTK Tipleri (FE Services page protocol)
// Backend: src/modules/services/schema.ts + repository ServiceMerged
// - NO category/sub_category
// - i18n: slug, name, summary, content, image_alt, meta_*
// - parent: type, featured, is_active, display_order, cover fields
// - cover_url: backend resolved (asset/url/legacy)
// =============================================================

import type { BoolLike, SortOrder } from '@/integrations/shared';

/** Backend ServiceTypeEnum ile uyumlu */
export type ServiceType =
  | 'maintenance_repair'
  | 'modernization'
  | 'spare_parts_components'
  | 'applications_references'
  | 'engineering_support'
  | 'production'
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
  orderDir?: SortOrder;

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

  featured: 0 | 1;
  is_active: 0 | 1;
  display_order: number;

  // cover (legacy + storage)
  featured_image: string | null;
  image_url: string | null;
  image_asset_id: string | null;

  /** backend resolved cover url (asset/url/legacy) */
  cover_url: string | null;

  created_at: string;
  updated_at: string;

  // i18n coalesced
  slug: string | null;
  name: string | null;
  summary: string | null;
  content: string | null; // json-string OR html string
  description: string | null;
  image_alt: string | null;

  // Service-specific fields (from services_i18n)
  material: string | null;
  price: string | null;
  price_numeric: number | null;
  includes: string | null;
  warranty: string | null;
  tags: string | null;
  area: string | null;
  duration: string | null;
  maintenance: string | null;
  season: string | null;
  thickness: string | null;
  equipment: string | null;

  // SEO
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;

  locale_resolved: string | null;
}

export type ApiServiceAdmin = ApiServiceBase;
export type ApiServicePublic = ApiServiceBase;

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

  cover_url: string | null;

  created_at: string;
  updated_at: string;

  slug: string | null;
  name: string | null;
  summary: string | null;
  content: string | null;
  description?: string | null;
  image_alt: string | null;

  // Service-specific fields (optional, may not be in all responses)
  price?: string | number | null;
  price_numeric?: number | null;
  material?: string | null;
  includes?: string | null;
  warranty?: string | null;
  tags?: string | string[] | null;
  area?: string | null;
  duration?: string | null;
  maintenance?: string | null;
  season?: string | null;
  thickness?: string | null;
  equipment?: string | null;

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
 * API DTO – Service Images (backend repository ServiceImageMerged ile uyumlu)
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

  // i18n
  locale?: string;
  name?: string;
  slug?: string;
  summary?: string | null;
  content?: string; // required by backend create flow
  image_alt?: string | null;

  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;

  replicate_all_locales?: boolean;
}

export interface ServiceUpdatePayload {
  type?: ServiceType;

  featured?: BoolLike;
  is_active?: BoolLike;
  display_order?: number;

  featured_image?: string | null;
  image_url?: string | null;
  image_asset_id?: string | null;

  locale?: string;
  name?: string;
  slug?: string;
  summary?: string | null;
  content?: string;
  image_alt?: string | null;

  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;

  apply_all_locales?: boolean;
}

/* ------------------------------------------------------------------
 * PAYLOAD – CREATE / UPDATE (service images – gallery)
 * Backend: UpsertServiceImageBody, PatchServiceImageBody
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
 * UI FORM TYPES (admin)
 * - backend'in yeni alan setine göre sadeleştirildi
 * ------------------------------------------------------------------ */

export type ServiceFormValues = {
  id?: string;
  locale: string;

  // i18n
  name: string;
  slug: string;
  summary: string;
  content: string; // json-string OR html
  description?: string;
  image_alt: string;

  // Service-specific form fields (optional)
  price?: string;
  price_numeric?: string;
  material?: string;
  includes?: string;
  warranty?: string;
  tags?: string;
  area?: string;
  duration?: string;
  maintenance?: string;
  season?: string;
  equipment?: string;

  meta_title: string;
  meta_description: string;
  meta_keywords: string;

  // parent
  is_active: boolean;
  featured: boolean;
  display_order: string;
  type: ServiceType | string;

  // cover
  featured_image: string;
  image_url: string;
  image_asset_id: string;

  // i18n ops
  replicate_all_locales: boolean;
  apply_all_locales: boolean;
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

/* ------------------------------------------------------------------
 * NORMALIZERS
 * ------------------------------------------------------------------ */

export const normalizeService = (row: ApiServiceBase): ServiceDto => ({
  id: row.id,
  type: row.type,

  featured: row.featured === 1,
  is_active: row.is_active === 1,
  display_order: row.display_order,

  featured_image: row.featured_image,
  image_url: row.image_url,
  image_asset_id: row.image_asset_id,

  cover_url: row.cover_url,

  created_at: row.created_at,
  updated_at: row.updated_at,

  slug: row.slug,
  name: row.name,
  summary: row.summary,
  content: row.content,
  description: row.description,
  image_alt: row.image_alt,

  // Service-specific fields
  material: row.material,
  price: row.price,
  price_numeric: row.price_numeric,
  includes: row.includes,
  warranty: row.warranty,
  tags: row.tags,
  area: row.area,
  duration: row.duration,
  maintenance: row.maintenance,
  season: row.season,
  thickness: row.thickness,
  equipment: row.equipment,

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

export type ServiceContentShape = {
  tagline?: string;
  highlights?: { title?: string; description?: string }[];
  html?: string;
};

export function safeParseServiceContent(raw: string | null): ServiceContentShape | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // JSON-string mi?
  if (s.startsWith('{') || s.startsWith('[')) {
    try {
      const obj = JSON.parse(s);
      if (obj && typeof obj === 'object') return obj as ServiceContentShape;
    } catch {
      // ignore
    }
  }

  // HTML veya plain text; bu sayfada highlights beklediğimiz için null dönüyoruz
  return null;
}

export function pickCardImageUrl(svc: ServiceDto, fallbackIndex: number): string {
  // backend cover_url varsa o
  const resolved = svc.cover_url || svc.image_url || svc.featured_image;
  if (resolved) return resolved;

  // FE asset fallback (orijinal template görselleri)
  const idx = ((fallbackIndex % 4) + 1) as 1 | 2 | 3 | 4;
  return `/assets/imgs/services-list/img-${idx}.png`;
}

// Form component props
export interface ServiceFormProps {
  initialData?: ServiceDto;
  onSubmit: (data: ServiceFormValues) => void | Promise<void>;
  isLoading?: boolean;

  // Form mode
  mode?: 'create' | 'edit';
  loading?: boolean;
  saving?: boolean;

  // Locale management
  locales?: { value: string; label: string }[];
  localesLoading?: boolean;
  defaultLocale?: string;

  // Callbacks
  onCancel?: () => void;
  onLocaleChange?: (locale: string) => void;
}
