import { safeStr } from './common';

export type PopupType = 'topbar' | 'bottombar' | 'sidebar_top' | 'sidebar_center' | 'sidebar_bottom';
export type PopupDisplayFrequency = 'always' | 'once' | 'daily';
export type PopupSortField = 'display_order' | 'created_at' | 'updated_at';
export type PopupSortOrder = 'asc' | 'desc';

export type PopupPublicQueryParams = {
  locale?: string;
  default_locale?: string;
  type?: PopupType;
  q?: string;
  current_path?: string;
  limit?: number;
  offset?: number;
  sort?: PopupSortField;
  order?: PopupSortOrder;
};

export type ApiPopupPublic = {
  id?: number | string;
  type?: PopupType | string;
  title?: string;
  content?: string | null;
  target_paths?: string[] | string | null;
  image?: string | null;
  alt?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  button_text?: string | null;
  button_color?: string | null;
  button_hover_color?: string | null;
  button_text_color?: string | null;
  link_url?: string | null;
  link_target?: '_self' | '_blank' | string;
  text_behavior?: 'static' | 'marquee' | string;
  scroll_speed?: number | string;
  closeable?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  delay_seconds?: number | string;
  display_frequency?: PopupDisplayFrequency | string;
  order?: number | string;
};

export type PopupPublicDto = {
  id: string;
  type: PopupType;
  title: string;
  content: string | null;
  target_paths: string[];
  image: string | null;
  alt: string | null;
  background_color: string | null;
  text_color: string | null;
  button_text: string | null;
  button_color: string | null;
  button_hover_color: string | null;
  button_text_color: string | null;
  link_url: string | null;
  link_target: '_self' | '_blank';
  text_behavior: 'static' | 'marquee';
  scroll_speed: number;
  closeable: boolean;
  delay_seconds: number;
  display_frequency: PopupDisplayFrequency;
  order: number;
};

const asNum = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const asBool = (v: unknown): boolean =>
  v === true || v === 1 || v === '1' || v === 'true';

const toType = (v: unknown): PopupType => {
  const x = safeStr(v) as PopupType;
  if (x === 'bottombar' || x === 'sidebar_top' || x === 'sidebar_center' || x === 'sidebar_bottom') return x;
  return 'topbar';
};

const toFrequency = (v: unknown): PopupDisplayFrequency => {
  const x = safeStr(v) as PopupDisplayFrequency;
  if (x === 'once' || x === 'daily') return x;
  return 'always';
};

const toTextBehavior = (v: unknown): 'static' | 'marquee' =>
  safeStr(v) === 'static' ? 'static' : 'marquee';

const toLinkTarget = (v: unknown): '_self' | '_blank' =>
  safeStr(v) === '_blank' ? '_blank' : '_self';

const toNullable = (v: unknown): string | null => {
  const s = safeStr(v);
  return s || null;
};

const toPathList = (v: unknown): string[] => {
  if (Array.isArray(v)) {
    return Array.from(new Set(v.map((item) => safeStr(item)).filter(Boolean)));
  }
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return toPathList(parsed);
    } catch {
      // ignore
    }
    return Array.from(new Set(s.split(/[\n,]+/).map((item) => safeStr(item)).filter(Boolean)));
  }
  return [];
};

export const normalizePopupPublic = (raw: ApiPopupPublic): PopupPublicDto => ({
  id: safeStr(raw.id),
  type: toType(raw.type),
  title: safeStr(raw.title),
  content: raw.content == null ? null : String(raw.content),
  target_paths: toPathList(raw.target_paths),
  image: toNullable(raw.image),
  alt: toNullable(raw.alt),
  background_color: toNullable(raw.background_color),
  text_color: toNullable(raw.text_color),
  button_text: toNullable(raw.button_text),
  button_color: toNullable(raw.button_color),
  button_hover_color: toNullable(raw.button_hover_color),
  button_text_color: toNullable(raw.button_text_color),
  link_url: toNullable(raw.link_url),
  link_target: toLinkTarget(raw.link_target),
  text_behavior: toTextBehavior(raw.text_behavior),
  scroll_speed: asNum(raw.scroll_speed, 60),
  closeable: asBool(raw.closeable),
  delay_seconds: asNum(raw.delay_seconds, 0),
  display_frequency: toFrequency(raw.display_frequency),
  order: asNum(raw.order, 0),
});
