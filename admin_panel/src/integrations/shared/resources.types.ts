// =============================================================
// FILE: src/integrations/shared/resources.types.ts
// Resources types & helpers
// =============================================================

export type ResourceType = 'therapist' | 'doctor' | 'table' | 'room' | 'staff' | 'other';

export interface ResourceRowDto {
  id: string;
  title: string;
  type: ResourceType;
  is_active: boolean | number;
  capacity: number;
  external_ref_id?: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  i18n?: ResourceI18nDto[];
}

export interface ResourceI18nDto {
  id?: string;
  resource_id?: string;
  locale: string;
  title: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ResourceAdminListItemDto {
  id: string;
  title: string;
  label: string;
  type: ResourceType;
  is_active: boolean;
  capacity: number;
  external_ref_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourcesAdminListQueryParams {
  q?: string;
  type?: ResourceType | '';
  status?: 'active' | 'inactive' | 'all';
  limit?: number;
  offset?: number;
}

export interface ResourceCreatePayload {
  title: string;
  type: ResourceType;
  is_active?: boolean;
  capacity?: number;
  external_ref_id?: string | null;
  i18n?: ResourceI18nDto[];
}

export interface ResourceUpdatePayload {
  title?: string;
  type?: ResourceType;
  is_active?: boolean;
  capacity?: number;
  external_ref_id?: string | null;
  i18n?: ResourceI18nDto[];
}

// Normalizer
export function normalizeResource(raw: unknown): ResourceAdminListItemDto {
  const r = (raw ?? {}) as any;
  return {
    id: String(r.id ?? ''),
    title: String(r.title ?? ''),
    label: String(r.label ?? r.title ?? ''),
    type: (r.type as ResourceType) || 'other',
    is_active: Boolean(r.is_active === true || r.is_active === 1),
    capacity: Number(r.capacity ?? 1),
    external_ref_id: r.external_ref_id ?? null,
    created_at: typeof r.created_at === 'string' ? r.created_at : (r.created_at?.toISOString?.() ?? new Date().toISOString()),
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : (r.updated_at?.toISOString?.() ?? new Date().toISOString()),
  };
}

// Helper
export function normalizeResourceList(raw: unknown): ResourceAdminListItemDto[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeResource);
}
