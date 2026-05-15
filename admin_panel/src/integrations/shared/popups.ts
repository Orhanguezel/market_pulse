import type { BoolLike } from '@/integrations/shared';
import { toBool } from '@/integrations/shared';

export type PopupType = 'topbar' | 'sidebar_top' | 'sidebar_center' | 'sidebar_bottom';
export type PopupDisplayFrequency = 'always' | 'once' | 'daily';
export type PopupLinkTarget = '_self' | '_blank';
export type PopupTextBehavior = 'static' | 'marquee';
export type PopupSortField = 'display_order' | 'created_at' | 'updated_at';
export type PopupSortOrder = 'asc' | 'desc';

export type PopupAdminListQuery = {
  q?: string;
  type?: PopupType;
  is_active?: BoolLike;
  locale?: string;
  default_locale?: string;
  sort?: PopupSortField;
  order?: PopupSortOrder;
  limit?: number;
  offset?: number;
};

export type PopupAdminRaw = {
  id?: number | string;
  uuid?: string;
  type?: PopupType;
  title?: string | null;
  content?: string | null;
  target_paths?: string[] | string | null;
  image_url?: string | null;
  image_asset_id?: string | null;
  alt?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  button_text?: string | null;
  button_color?: string | null;
  button_hover_color?: string | null;
  button_text_color?: string | null;
  link_url?: string | null;
  link_target?: PopupLinkTarget;
  text_behavior?: PopupTextBehavior;
  scroll_speed?: number;
  closeable?: boolean;
  delay_seconds?: number;
  display_frequency?: PopupDisplayFrequency;
  is_active?: boolean;
  display_order?: number;
  start_at?: string | null;
  end_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PopupAdminView = {
  id: number;
  uuid: string;
  type: PopupType;
  title: string;
  content: string | null;
  target_paths: string[];
  image_url: string | null;
  image_asset_id: string | null;
  alt: string | null;
  background_color: string | null;
  text_color: string | null;
  button_text: string | null;
  button_color: string | null;
  button_hover_color: string | null;
  button_text_color: string | null;
  link_url: string | null;
  link_target: PopupLinkTarget;
  text_behavior: PopupTextBehavior;
  scroll_speed: number;
  closeable: boolean;
  delay_seconds: number;
  display_frequency: PopupDisplayFrequency;
  is_active: boolean;
  display_order: number;
  start_at: string | null;
  end_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PopupAdminCreateBody = {
  locale?: string;
  type?: PopupType;
  title: string;
  content?: string | null;
  target_paths?: string[];
  image_url?: string | null;
  image_asset_id?: string | null;
  alt?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  button_text?: string | null;
  button_color?: string | null;
  button_hover_color?: string | null;
  button_text_color?: string | null;
  link_url?: string | null;
  link_target?: PopupLinkTarget;
  text_behavior?: PopupTextBehavior;
  scroll_speed?: number;
  closeable?: BoolLike;
  delay_seconds?: number;
  display_frequency?: PopupDisplayFrequency;
  is_active?: BoolLike;
  display_order?: number;
  start_at?: string | Date | null;
  end_at?: string | Date | null;
};

export type PopupAdminUpdateBody = Partial<PopupAdminCreateBody>;

const s = (v: unknown) => String(v ?? '').trim();

const toIso = (v: unknown): string | null => {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  const raw = s(v);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isFinite(d.valueOf()) ? d.toISOString() : raw;
};

const toType = (v: unknown): PopupType => {
  const x = s(v) as PopupType;
  if (x === 'sidebar_top' || x === 'sidebar_center' || x === 'sidebar_bottom') return x;
  return 'topbar';
};

const toFrequency = (v: unknown): PopupDisplayFrequency => {
  const x = s(v) as PopupDisplayFrequency;
  if (x === 'once' || x === 'daily') return x;
  return 'always';
};

const toLinkTarget = (v: unknown): PopupLinkTarget => (s(v) === '_blank' ? '_blank' : '_self');
const toTextBehavior = (v: unknown): PopupTextBehavior => (s(v) === 'static' ? 'static' : 'marquee');
const toNum = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const toMaybe = (v: unknown): string | null => {
  const x = s(v);
  return x ? x : null;
};

const toPathList = (v: unknown): string[] => {
  if (Array.isArray(v)) {
    return Array.from(new Set(v.map((item) => s(item)).filter(Boolean)));
  }
  if (typeof v === 'string') {
    const raw = s(v);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return toPathList(parsed);
    } catch {
      // ignore
    }
    return Array.from(new Set(raw.split(/[\n,]+/).map((item) => s(item)).filter(Boolean)));
  }
  return [];
};

export const normalizePopupAdmin = (raw: unknown): PopupAdminView => {
  const r = (raw ?? {}) as PopupAdminRaw;
  return {
    id: toNum(r.id, 0),
    uuid: s(r.uuid),
    type: toType(r.type),
    title: s(r.title),
    content: r.content == null ? null : String(r.content),
    target_paths: toPathList(r.target_paths),
    image_url: toMaybe(r.image_url),
    image_asset_id: toMaybe(r.image_asset_id),
    alt: toMaybe(r.alt),
    background_color: toMaybe(r.background_color),
    text_color: toMaybe(r.text_color),
    button_text: toMaybe(r.button_text),
    button_color: toMaybe(r.button_color),
    button_hover_color: toMaybe(r.button_hover_color),
    button_text_color: toMaybe(r.button_text_color),
    link_url: toMaybe(r.link_url),
    link_target: toLinkTarget(r.link_target),
    text_behavior: toTextBehavior(r.text_behavior),
    scroll_speed: toNum(r.scroll_speed, 60),
    closeable: !!r.closeable,
    delay_seconds: toNum(r.delay_seconds, 0),
    display_frequency: toFrequency(r.display_frequency),
    is_active: !!r.is_active,
    display_order: toNum(r.display_order, 0),
    start_at: toMaybe(r.start_at),
    end_at: toMaybe(r.end_at),
    created_at: toMaybe(r.created_at),
    updated_at: toMaybe(r.updated_at),
  };
};

export const normalizePopupAdminList = (raw: unknown): PopupAdminView[] =>
  Array.isArray(raw) ? raw.map(normalizePopupAdmin) : [];

export const toPopupAdminListQuery = (q: PopupAdminListQuery = {}): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  if (q.q) out.q = q.q;
  if (q.type) out.type = q.type;
  if (typeof q.is_active !== 'undefined') out.is_active = q.is_active;
  if (q.locale) out.locale = q.locale;
  if (q.default_locale) out.default_locale = q.default_locale;
  if (q.sort) out.sort = q.sort;
  if (q.order) out.order = q.order;
  if (typeof q.limit !== 'undefined') out.limit = q.limit;
  if (typeof q.offset !== 'undefined') out.offset = q.offset;
  return out;
};

export const toPopupAdminCreateBody = (b: PopupAdminCreateBody): Record<string, unknown> => ({
  locale: b.locale,
  type: b.type,
  title: b.title,
  content: typeof b.content === 'undefined' ? undefined : b.content,
  image_url: typeof b.image_url === 'undefined' ? undefined : b.image_url,
  image_asset_id: typeof b.image_asset_id === 'undefined' ? undefined : b.image_asset_id,
  alt: typeof b.alt === 'undefined' ? undefined : b.alt,
  background_color: typeof b.background_color === 'undefined' ? undefined : b.background_color,
  text_color: typeof b.text_color === 'undefined' ? undefined : b.text_color,
  button_text: typeof b.button_text === 'undefined' ? undefined : b.button_text,
  button_color: typeof b.button_color === 'undefined' ? undefined : b.button_color,
  button_hover_color: typeof b.button_hover_color === 'undefined' ? undefined : b.button_hover_color,
  button_text_color: typeof b.button_text_color === 'undefined' ? undefined : b.button_text_color,
  link_url: typeof b.link_url === 'undefined' ? undefined : b.link_url,
  link_target: typeof b.link_target === 'undefined' ? undefined : b.link_target,
  target_paths: typeof b.target_paths === 'undefined' ? undefined : b.target_paths,
  text_behavior: typeof b.text_behavior === 'undefined' ? undefined : b.text_behavior,
  scroll_speed: typeof b.scroll_speed === 'undefined' ? undefined : b.scroll_speed,
  closeable: typeof b.closeable === 'undefined' ? undefined : toBool(b.closeable),
  delay_seconds: typeof b.delay_seconds === 'undefined' ? undefined : b.delay_seconds,
  display_frequency: typeof b.display_frequency === 'undefined' ? undefined : b.display_frequency,
  is_active: typeof b.is_active === 'undefined' ? undefined : toBool(b.is_active),
  display_order: typeof b.display_order === 'undefined' ? undefined : b.display_order,
  start_at: typeof b.start_at === 'undefined' ? undefined : toIso(b.start_at),
  end_at: typeof b.end_at === 'undefined' ? undefined : toIso(b.end_at),
});

export const toPopupAdminUpdateBody = (b: PopupAdminUpdateBody): Record<string, unknown> =>
  toPopupAdminCreateBody(b as PopupAdminCreateBody);
