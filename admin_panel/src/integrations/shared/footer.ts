// ----------------------------------------------------------------------
// FILE: src/integrations/shared/footer.ts
// ----------------------------------------------------------------------

import {
  SiteSettingLike,
  nonEmpty,
  parseJsonArray,
  isActiveFooterSection,
  sortFooterSections,
} from '@/integrations/shared';
import type { FooterSectionDto, PublicMenuItemDto } from '@/integrations/shared';

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterSectionListParams = {
  q?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  /** Admin backend'e uygun sort alanları */
  sort?: 'display_order' | 'created_at' | 'title';
  order?: 'asc' | 'desc';
};

export type FooterPublicListParams = {
  q?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc'; // public'te sort alanı yok; order_num yönü
};

export type ReorderFooterSectionItem = {
  id: string;
  display_order: number;
};

/** BE’den gelen ham kayıt (links string olabilir) */
export type ApiFooterSection = {
  id: string;
  title: string | null;
  links?: string | FooterLink[] | null;
  display_order?: number | null;
  is_active?: boolean | number | '0' | '1' | 'true' | 'false' | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/** FE’de kullanılan normalize edilmiş model */
export type FooterSection = {
  id: string;
  title: string;
  links: FooterLink[];
  display_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

/** Create/Update body (admin/public upsert) */
export type UpsertFooterSectionBody = {
  title: string;
  links?: FooterLink[];
  display_order?: number;
  is_active?: boolean;
};

export type FooterQuickLink = { title?: string; path?: string; pageKey?: string };
export type FooterSocialLink = { url?: string; icon?: string; alt?: string };

export function normalizeQuickLinks(x: unknown): Array<{ name: string; url: string }> {
  const arr = parseJsonArray<FooterQuickLink>(x);
  if (!arr.length) return [];
  return arr
    .map((it) => ({
      name: nonEmpty(it?.title) || nonEmpty(it?.pageKey),
      url: nonEmpty(it?.path),
    }))
    .filter((it) => !!it.name && !!it.url);
}

export function normalizeSocialLinks(
  x: unknown,
): Array<{ url: string; icon: string; alt: string }> {
  const arr = parseJsonArray<FooterSocialLink>(x);
  if (!arr.length) return [];
  return arr
    .map((it) => ({
      url: nonEmpty(it?.url),
      icon: nonEmpty(it?.icon),
      alt: nonEmpty(it?.alt) || 'Social',
    }))
    .filter((it) => !!it.url && !!it.icon);
}

export type LinkItem = { title?: string; path?: string; pageKey?: string };

export function normalizeLinkItems(x: unknown): Array<{ name: string; url: string }> {
  const arr = parseJsonArray<LinkItem>(x);
  if (!arr.length) return [];
  return arr
    .map((it) => ({
      name: nonEmpty(it?.title) || nonEmpty(it?.pageKey),
      url: nonEmpty(it?.path),
    }))
    .filter((it) => !!it.name && !!it.url);
}

export function pickSettingValue(data?: SiteSettingLike): unknown {
  // RTK response formatı projede değişebiliyor; en güvenlisi:
  // - data.value
  // - data.data.value
  // - data.items[0].value
  const d: any = data as any;
  return d?.value ?? d?.data?.value ?? (Array.isArray(d?.items) ? d.items[0]?.value : undefined);
}

export function pickTextFromSettingValue(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v.trim() || fallback;

  if (v && typeof v === 'object') {
    const o: any = v;
    // company_brand JSON: { name, shortName, website, ... }
    const name =
      typeof o?.shortName === 'string' ? o.shortName : typeof o?.name === 'string' ? o.name : '';
    return name.trim() || fallback;
  }

  return fallback;
}

export function pickBrandName(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v.trim() || fallback;
  if (v && typeof v === 'object') {
    const o: any = v;
    const s =
      (typeof o?.shortName === 'string' ? o.shortName : '') ||
      (typeof o?.name === 'string' ? o.name : '');
    return (s || '').trim() || fallback;
  }
  return fallback;
}

export function pickSocialUrl(v: unknown, key: string): string {
  if (!v || typeof v !== 'object') return '';
  const o: any = v;
  const s = typeof o?.[key] === 'string' ? o[key].trim() : '';
  return s;
}

// =============================================================
// Footer menu helpers (sections + menu items)
// =============================================================

export type FooterMenuGroup = {
  section: FooterSectionDto;
  items: PublicMenuItemDto[];
};

export function flattenMenuItems(
  items: PublicMenuItemDto[] | undefined,
  parentSectionId?: string | null,
): PublicMenuItemDto[] {
  const out: PublicMenuItemDto[] = [];

  const walk = (arr: PublicMenuItemDto[] | undefined, sectionId?: string | null) => {
    if (!arr || !arr.length) return;
    for (const item of arr) {
      if (!item) continue;
      const resolvedSectionId = item.section_id || sectionId || null;
      out.push({ ...item, section_id: resolvedSectionId });
      if (item.children && item.children.length) {
        walk(item.children, resolvedSectionId);
      }
    }
  };

  walk(items, parentSectionId);
  return out;
}

export function groupFooterMenuSections(
  sections: FooterSectionDto[] | undefined,
  items: PublicMenuItemDto[] | undefined,
): { groups: FooterMenuGroup[]; ungrouped: PublicMenuItemDto[] } {
  const activeSections = sortFooterSections((sections || []).filter(isActiveFooterSection));
  const flatItems = flattenMenuItems(items).filter((x) => x && x.is_active !== false);

  const bySection = new Map<string, PublicMenuItemDto[]>();
  const ungrouped: PublicMenuItemDto[] = [];

  for (const item of flatItems) {
    const sid = item.section_id;
    if (sid) {
      const arr = bySection.get(sid) || [];
      arr.push(item);
      bySection.set(sid, arr);
    } else {
      ungrouped.push(item);
    }
  }

  const groups: FooterMenuGroup[] = activeSections
    .map((section) => {
      const list = (bySection.get(section.id) || []).slice();
      list.sort((a, b) => (a.order_num ?? 0) - (b.order_num ?? 0));
      return { section, items: list };
    })
    .filter((g) => g.items.length > 0);

  ungrouped.sort((a, b) => (a.order_num ?? 0) - (b.order_num ?? 0));

  return { groups, ungrouped };
}
