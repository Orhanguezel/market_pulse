// =============================================================
// FILE: src/integrations/types/resources.types.ts
// FINAL — Resources FE/RTK types aligned with backend resources module
// =============================================================

export type ResourceType = 'therapist' | 'doctor' | 'table' | 'room' | 'staff' | 'other';

type ActiveLike = 0 | 1 | boolean | number | string;

function toIso(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  return '';
}

function toType(v: unknown): ResourceType {
  const s = String(v ?? 'other').trim() as ResourceType;
  const ok: ResourceType[] = ['therapist', 'doctor', 'table', 'room', 'staff', 'other'];
  return (ok.includes(s) ? s : 'other') as ResourceType;
}

function toActive01(v: unknown): 0 | 1 {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  return 0;
}

function toCap(v: unknown): number {
  const n = Number(v ?? 1);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}

/* -------------------- DTOs (wire format) -------------------- */

export interface ResourcePublicItemDto {
  id: string;
  type: ResourceType; // backend clamps to known values
  title: string;
  capacity: number;
  external_ref_id: string | null;
  label: string;
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
  type: ResourceType;
  title: string;
  capacity: number;
  external_ref_id: string | null;

  is_active: ActiveLike; // backend 0|1
  created_at: string | Date;
  updated_at: string | Date;

  label: string;
}

export interface ResourceRowDto {
  id: string;
  type: ResourceType;
  title: string;
  capacity: number;
  external_ref_id: string | null;
  i18n?: ResourceI18nDto[];

  is_active: ActiveLike;
  created_at: string | Date;
  updated_at: string | Date;
}

/* -------------------- Normalized FE model -------------------- */

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  capacity: number;
  external_ref_id: string | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;

  label: string;
}

export const normalizeResource = (dto: ResourceRowDto | ResourceAdminListItemDto): Resource => {
  const title = String((dto as any).title ?? '').trim();
  const id = String((dto as any).id ?? '').trim();

  return {
    id,
    type: toType((dto as any).type),
    title,
    capacity: toCap((dto as any).capacity),
    external_ref_id: (dto as any).external_ref_id ? String((dto as any).external_ref_id) : null,

    is_active: toActive01((dto as any).is_active) === 1,
    created_at: toIso((dto as any).created_at),
    updated_at: toIso((dto as any).updated_at),

    label: String((dto as any).label ?? title ?? id),
  };
};

/* -------------------- Query params / payloads -------------------- */

export interface ResourcesAdminListQueryParams {
  q?: string;
  type?: ResourceType;
  is_active?: boolean | number | string;
  external_ref_id?: string;

  limit?: number;
  offset?: number;

  // backend supports capacity too
  sort?: 'created_at' | 'updated_at' | 'title' | 'type' | 'capacity';
  order?: 'asc' | 'desc';
}

export interface ResourceAdminCreatePayload {
  type?: ResourceType | null;
  title: string;
  capacity?: number | null;
  external_ref_id?: string | null;
  is_active?: boolean | number | string; // backend -> 0|1
  i18n?: ResourceI18nDto[];
}

export interface ResourceAdminUpdatePayload {
  type?: ResourceType | null;
  title?: string | null;
  capacity?: number | null;
  external_ref_id?: string | null;
  is_active?: boolean | number | string;
  i18n?: ResourceI18nDto[];
}

export interface ResourcesPublicListQueryParams {
  type?: ResourceType;
  locale?: string;
}
