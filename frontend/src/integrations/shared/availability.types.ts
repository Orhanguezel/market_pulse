// =============================================================
// FILE: src/integrations/types/availability.types.ts
// FINAL — FE/RTK types aligned with backend availability module
// =============================================================

import type { ResourceType } from '@/integrations/shared';

export type UUID36 = string; // 36 chars
export type Ymd = string; // YYYY-MM-DD
export type Hm = string; // HH:mm

type Active01 = 0 | 1;

function toIso(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  return '';
}

function toHm(v: unknown): Hm {
  if (v instanceof Date) {
    const hh = String(v.getHours()).padStart(2, '0');
    const mm = String(v.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}` as Hm;
  }

  const s = String(v ?? '').trim();
  if (!s) return '00:00' as Hm;

  if (s.includes('T') && s.includes(':')) {
    const timePart = s.split('T')[1] ?? '';
    return (timePart.slice(0, 5) || '00:00') as Hm;
  }

  return (s.length >= 5 ? s.slice(0, 5) : '00:00') as Hm;
}

function toActive01(v: unknown): Active01 {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  return 0;
}

function toBool(v: unknown): boolean {
  return toActive01(v) === 1;
}

/* -------------------- Working Hours -------------------- */

export interface ResourceWorkingHourDto {
  id: UUID36;
  resource_id: UUID36;
  dow: number; // 1..7

  start_time: string | Date; // TIME (db may serialize)
  end_time: string | Date;

  slot_minutes: number;
  break_minutes: number;
  capacity: number;

  is_active: Active01 | boolean | number | string;

  created_at: string | Date;
  updated_at: string | Date;
}

export interface ResourceRecurringOverrideDto {
  id: UUID36;
  resource_id: UUID36;
  dow: number;
  is_active: Active01 | boolean | number | string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface ResourceRecurringOverride {
  id: UUID36;
  resource_id: UUID36;
  dow: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const normalizeResourceRecurringOverride = (
  dto: ResourceRecurringOverrideDto,
): ResourceRecurringOverride => ({
  id: String(dto.id),
  resource_id: String(dto.resource_id),
  dow: Number(dto.dow),
  is_active: toBool(dto.is_active),
  created_at: toIso(dto.created_at),
  updated_at: toIso(dto.updated_at),
});

export interface ResourceWorkingHour {
  id: UUID36;
  resource_id: UUID36;
  dow: number;

  start_time: Hm;
  end_time: Hm;

  slot_minutes: number;
  break_minutes: number;
  capacity: number;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export const normalizeResourceWorkingHour = (dto: ResourceWorkingHourDto): ResourceWorkingHour => ({
  id: String(dto.id),
  resource_id: String(dto.resource_id),
  dow: Number(dto.dow),

  start_time: toHm(dto.start_time),
  end_time: toHm(dto.end_time),

  slot_minutes: Number(dto.slot_minutes ?? 0),
  break_minutes: Number(dto.break_minutes ?? 0),
  capacity: Number(dto.capacity ?? 0),

  is_active: toBool(dto.is_active),

  created_at: toIso(dto.created_at),
  updated_at: toIso(dto.updated_at),
});

/* -------------------- Slots (overrides) -------------------- */

export interface ResourceSlotDto {
  id: UUID36;
  slot_time: string | Date; // TIME
  capacity: number;
  is_active: Active01 | boolean | number | string;
  reserved_count: number; // COALESCE join
}

export interface ResourceSlot {
  id: UUID36;
  slot_time: Hm;
  capacity: number;
  is_active: boolean;
  reserved_count: number;
  available: boolean;
}

export const normalizeResourceSlot = (dto: ResourceSlotDto): ResourceSlot => {
  const cap = Number(dto.capacity ?? 0);
  const reserved = Number((dto as any).reserved_count ?? 0);
  const active = toBool(dto.is_active);

  return {
    id: String(dto.id),
    slot_time: toHm(dto.slot_time),
    capacity: cap,
    is_active: active,
    reserved_count: reserved,
    available: active && cap > 0 && reserved < cap,
  };
};

/* -------------------- Availability check -------------------- */

export interface SlotAvailabilityDto {
  exists: boolean;
  slot_id?: UUID36 | null;

  is_active: Active01; // backend returns 0|1
  capacity: number | null;
  reserved_count: number;
  available: boolean;
}

export interface SlotAvailability {
  exists: boolean;
  slot_id: UUID36 | null;

  is_active: boolean;
  capacity: number | null;
  reserved_count: number;
  available: boolean;
}

export const normalizeSlotAvailability = (dto: SlotAvailabilityDto): SlotAvailability => ({
  exists: !!dto.exists,
  slot_id: (dto as any).slot_id ? String((dto as any).slot_id) : null,
  is_active: Number(dto.is_active ?? 0) === 1,
  capacity: dto.capacity == null ? null : Number(dto.capacity),
  reserved_count: Number(dto.reserved_count ?? 0),
  available: !!dto.available,
});

/* -------------------- Plan (deterministic merged) -------------------- */

export interface PlannedSlotDto {
  time: Hm;

  wh_id: UUID36;
  wh_start_time: string | Date; // "HH:mm:00" or Date
  wh_end_time: string | Date;

  slot_minutes: number;
  break_minutes: number;

  slot_id: UUID36 | null;

  is_active: Active01; // backend 0|1
  capacity: number;
  reserved_count: number;
  available: boolean;
}

export interface PlannedSlot {
  time: Hm;

  wh_id: UUID36;
  wh_start_time: Hm;
  wh_end_time: Hm;

  slot_minutes: number;
  break_minutes: number;

  slot_id: UUID36 | null;

  is_active: boolean;
  capacity: number;
  reserved_count: number;
  available: boolean;
}

export const normalizePlannedSlot = (dto: PlannedSlotDto): PlannedSlot => ({
  time: toHm(dto.time),

  wh_id: String(dto.wh_id),
  wh_start_time: toHm(dto.wh_start_time),
  wh_end_time: toHm(dto.wh_end_time),

  slot_minutes: Number(dto.slot_minutes ?? 0),
  break_minutes: Number(dto.break_minutes ?? 0),

  slot_id: dto.slot_id ? String(dto.slot_id) : null,

  is_active: Number(dto.is_active ?? 0) === 1,
  capacity: Number(dto.capacity ?? 0),
  reserved_count: Number(dto.reserved_count ?? 0),
  available: !!dto.available,
});

/* -------------------- Query params / payloads -------------------- */

export interface AvailabilitySlotsQuery {
  resource_id: UUID36;
  date: Ymd;
}

export interface AvailabilityGetQuery extends AvailabilitySlotsQuery {
  time: Hm;
}

export interface AdminListWorkingHoursQuery {
  resource_id: UUID36;
}

export interface AdminUpsertWorkingHourPayload {
  id?: UUID36;
  resource_id: UUID36;
  dow: number;
  start_time: Hm;
  end_time: Hm;

  slot_minutes?: number;
  break_minutes?: number;
  capacity?: number;
  is_active?: boolean | number | string;
}

export interface AdminListSlotsQuery {
  resource_id: UUID36;
  date: Ymd;
}

export interface AdminSlotAvailabilityQuery {
  resource_id: UUID36;
  date: Ymd;
  time: Hm;
}

export interface AdminPlanQuery {
  resource_id: UUID36;
  date: Ymd;
}

export interface AdminGenerateSlotsPayload {
  resource_id: UUID36;
  date: Ymd;
}

export interface AdminGenerateSlotsResult {
  ok: boolean;
  created: number;
  planned: number;
}

export interface AdminOverrideDayPayload {
  resource_id: UUID36;
  date: Ymd;
  is_active: boolean | number | string;
}

export interface AdminOverrideDayResult {
  ok: boolean;
  updated: number;
  planned: number;
}

export interface AdminOverrideSlotPayload {
  resource_id: UUID36;
  date: Ymd;
  time: Hm;
  is_active: boolean | number | string;
}

export interface AdminOverrideSlotResult {
  ok: boolean;
  updated: boolean;
  slot_id: UUID36 | null;
}

/* -------------------- Weekly plan -------------------- */

export interface WeeklyPlanDayDto {
  dow: number; // 1..7
  slot_times: Hm[];
  ranges: Array<{
    wh_id: UUID36;
    start_time: Hm;
    end_time: Hm;
    slot_minutes: number;
    break_minutes: number;
    capacity: number;
    is_active: Active01;
  }>;
}

export interface WeeklyPlanQuery {
  resource_id: UUID36;
  type?: string;
}

export interface PublicWorkingHoursQuery {
  resource_id: UUID36;
}

/* -------------------- Multi-resource slots -------------------- */

export type AvailabilitySlotsByResourcesQuery = {
  resource_ids: UUID36[];
  date: Ymd;
};

export type AvailabilitySlotsByResourcesResult = Record<UUID36, ResourceSlotDto[]>;

/* optional convenience */
export type AvailabilityResourceValues = {
  title: string;
  type: ResourceType;
  is_active: boolean;
};

/* -------------------- Type guards & helpers -------------------- */

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isUuid36(v: unknown): v is UUID36 {
  return typeof v === 'string' && v.length === 36;
}

export function isYmd(v: unknown): v is Ymd {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export function asSlotArray(v: unknown): ResourceSlotDto[] {
  return Array.isArray(v) ? (v as ResourceSlotDto[]) : [];
}

export const EMPTY_SLOTS: ResourceSlotDto[] = [];

/* -------------------- RTK baseQuery helpers -------------------- */

export type BaseQueryOk = { data: unknown };
export type BaseQueryResult = BaseQueryOk | { error: unknown };

export function parseBaseQueryResult(x: unknown): BaseQueryResult | null {
  if (!isRecord(x)) return null;
  if ('error' in x) return { error: (x as Record<string, unknown>).error };
  if ('data' in x) return { data: (x as Record<string, unknown>).data };
  return null;
}
