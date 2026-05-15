// =============================================================
// FILE: src/integrations/shared/siteSettings.ts
// FINAL — Site Settings types + shared normalizers/parsers
// - RTK endpoints içinde helper yok
// - Public parse: tryParsePublicValue
// - Admin normalize: normalizeSettingValue
// - Param builders: buildPublicSiteSettingsListParams / buildAdminSiteSettingsListParams
// - Key arg resolver: resolveSiteSettingKeyArg (string | object)
// =============================================================

import { toNum, toBool, parseJsonObject, uiText } from '@/integrations/shared';
import type { ValueType, JsonLike } from '@/integrations/shared';

/** FE/BE arasında ayakta kalacak JSON-benzeri tip */
export type SettingValue =
  | string
  | number
  | boolean
  | null
  | { [k: string]: SettingValue }
  | SettingValue[];

export type SiteSettingRow = {
  id?: string;
  key: string;
  value: unknown; // normalize edilip SettingValue'a dönüştürülecek
  locale?: string | null;
  value_type?: ValueType | null;
  group?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SiteSetting = {
  key: string;
  value: JsonLike;
  locale?: string | null;
  updated_at?: string;
};

export type SiteSettingLike = SiteSettingRow | SiteSetting | null | undefined;

/** PUBLIC list arg (GET /site_settings) */
export type PublicSiteSettingsListArg =
  | {
      prefix?: string;
      keys?: string[];
      order?:
        | 'key.asc'
        | 'key.desc'
        | 'updated_at.asc'
        | 'updated_at.desc'
        | 'created_at.asc'
        | 'created_at.desc';
      limit?: number;
      offset?: number;
    }
  | undefined;

/** PUBLIC get arg (GET /site_settings/:key) — string veya object kabul eder */
export type PublicSiteSettingGetArg =
  | string
  | {
      key: string;
      locale?: string;
      default_locale?: string;
    };

/** ADMIN list params */
export type AdminSiteSettingsListParams = {
  q?: string;
  group?: string;
  keys?: string[];
  prefix?: string;
  locale?: string; // ✅ locale parameter
  limit?: number;
  offset?: number;
  sort?: 'key' | 'updated_at' | 'created_at';
  order?: 'asc' | 'desc';
};

export type UpsertSettingBody = {
  key: string;
  value: SettingValue;
  value_type?: ValueType | null;
  group?: string | null;
  description?: string | null;
};

export type BulkUpsertBody = { items: UpsertSettingBody[] };

// -----------------------------
// low-level primitives
// -----------------------------

function tryParseJsonString<T = unknown>(s: string): T | string {
  try {
    return JSON.parse(s) as T;
  } catch {
    return s;
  }
}

/** Public taraf: string value ise json/bool/num parse etmeye çalışır */
export function tryParsePublicValue<T = unknown>(x: unknown): T {
  if (typeof x === 'string') {
    const s = x.trim();

    // JSON
    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
      try {
        return JSON.parse(s) as T;
      } catch {
        // swallow
      }
    }

    // bool
    if (s === 'true') return true as unknown as T;
    if (s === 'false') return false as unknown as T;

    // number
    if (s !== '' && !Number.isNaN(Number(s))) {
      return Number(s) as unknown as T;
    }
  }

  return x as T;
}

/** Admin taraf: value_type'a göre normalize eder */
export function normalizeSettingValue(value: unknown, value_type?: ValueType | null): SettingValue {
  if (value_type === 'boolean') return toBool(value);
  if (value_type === 'number') return value == null ? null : toNum(value);

  if (value_type === 'json') {
    if (typeof value === 'string') return tryParseJsonString<SettingValue>(value) as SettingValue;
    if (value && typeof value === 'object') return value as SettingValue;
    return null;
  }

  // value_type yoksa “akıllı” normalize:
  if (typeof value === 'string') {
    const s = value.trim();

    if (s === 'true' || s === 'false' || s === '1' || s === '0' || s === 'yes' || s === 'no') {
      return toBool(s);
    }

    if (s !== '' && !Number.isNaN(Number(s))) return toNum(s);

    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
      return tryParseJsonString<SettingValue>(s) as SettingValue;
    }

    return s;
  }

  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value == null) return null;

  return value as SettingValue;
}

/** PUBLIC response normalize (list item) */
export function normalizePublicSiteSettingItem(r: {
  key: string;
  value: unknown;
  updated_at?: string;
}): SiteSetting {
  return {
    key: String(r.key ?? '').trim(),
    value: tryParsePublicValue<JsonLike>(r.value),
    ...(r.updated_at ? { updated_at: r.updated_at } : {}),
  };
}

/** PUBLIC response normalize (single) */
export function normalizePublicSiteSetting(res: unknown): SiteSetting | null {
  if (!res || typeof res !== 'object') return null;
  const r = res as { key?: string; value?: unknown; updated_at?: string };
  const key = String(r.key ?? '').trim();
  if (!key) return null;

  return {
    key,
    value: tryParsePublicValue<JsonLike>(r.value),
    ...(r.updated_at ? { updated_at: r.updated_at } : {}),
  };
}

/** ADMIN row normalize */
export function normalizeAdminSiteSettingRow(r: SiteSettingRow): SiteSettingRow {
  return {
    ...r,
    value: normalizeSettingValue(r.value, r.value_type ?? null),
  };
}

/** PUBLIC list params builder */
export function buildPublicSiteSettingsListParams(
  arg?: PublicSiteSettingsListArg,
): Record<string, string | number> | undefined {
  if (!arg) return undefined;
  const params: Record<string, string | number> = {};

  if (arg.prefix) params.prefix = arg.prefix;
  if (arg.keys?.length) params.keys = arg.keys.join(',');
  if (arg.order) params.order = arg.order;
  if (typeof arg.limit === 'number') params.limit = arg.limit;
  if (typeof arg.offset === 'number') params.offset = arg.offset;

  return Object.keys(params).length ? params : undefined;
}

/** ADMIN list params builder (order => "col.dir") */
export function buildAdminSiteSettingsListParams(
  p?: AdminSiteSettingsListParams,
): Record<string, string | number> | undefined {
  if (!p) return undefined;
  const q: Record<string, string | number> = {};

  if (p.q) q.q = p.q;
  if (p.group) q.group = p.group;
  if (p.keys?.length) q.keys = p.keys.join(',');
  if (p.prefix) q.prefix = p.prefix;
  if (p.locale) q.locale = p.locale;

  const col = p.sort ?? 'key';
  const dir = p.order ?? 'asc';
  q.order = `${col}.${dir}`;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  return q;
}

/** get-by-key arg resolver (string | object) */
export function resolveSiteSettingKeyArg(arg: PublicSiteSettingGetArg): {
  key: string;
  locale?: string;
  default_locale?: string;
} {
  if (typeof arg === 'string') return { key: arg };

  return {
    key: arg.key,
    ...(arg.locale ? { locale: arg.locale } : {}),
    ...(arg.default_locale ? { default_locale: arg.default_locale } : {}),
  };
}

/** key guard */
export function normalizeSiteSettingKey(key: unknown): string {
  return String(key ?? '').trim();
}

export type AppLocaleMeta = {
  code?: unknown;
  label?: unknown;
  is_default?: unknown;
  is_active?: unknown;
};

// Legacy alias used in older admin pages
export type AppLocaleItem = AppLocaleMeta;

// =============================================================
// UI SERVICES (site_settings.ui_services)
// =============================================================

export type UiServicesCopy = {
  page: {
    badge: string;
    title_html: string;
    intro_html: string;
    tagline_fallback: string;
    card_fallback_title: string;
    loading: string;
    error: string;
    empty: string;
    highlight_label: string;
    details_label: string;
  };
  section1: {
    heading: string;
    intro_html: string;
    error: string;
    cta_label: string;
    empty: string;
    loading_title: string;
    loading_text: string;
    card_fallback_title: string;
  };
  section2: {
    badge: string;
    title_html: string;
    error: string;
    learn_more: string;
    empty: string;
    loading_title: string;
    loading_text: string;
    card_fallback_title: string;
    footer_text_html: string;
    footer_link_label: string;
  };
  detail: {
    back_label: string;
    loading: string;
    error: string;
    highlight_label: string;
    details_label: string;
    description_label: string;
    gallery_label: string;
    gallery_loading: string;
    gallery_empty: string;
    not_found: string;
    title_fallback: string;
    tagline_fallback: string;
  };
};

function pickFromRoot(root: Record<string, unknown>, key: string): string {
  return uiText((root as any)?.[key]);
}

export function normalizeUiServicesSettingValue(value: unknown): UiServicesCopy {
  const root = parseJsonObject(value);

  const page = parseJsonObject((root as any).page);
  const section1 = parseJsonObject((root as any).section1);
  const section2 = parseJsonObject((root as any).section2);
  const detail = parseJsonObject((root as any).detail);

  const pick = (obj: Record<string, unknown>, key: string, fallback: string, rootKey?: string) =>
    uiText(obj?.[key]) || pickFromRoot(root, rootKey || key) || fallback;

  return {
    page: {
      badge: pick(page, 'badge', 'My Services', 'page_badge'),
      title_html: pick(
        page,
        'title_html',
        'Transforming Ideas <span class="text-300">into Intuitive Designs for</span> Engaging User <span class="text-300">Experiences</span>',
        'page_title_html',
      ),
      intro_html: pick(
        page,
        'intro_html',
        'With expertise in mobile app and web design, I transform ideas into visually <br /> stunning and user-friendly interfaces that captivate and retain users. <br /> Explore my work and see design in action.',
        'page_intro_html',
      ),
      tagline_fallback: pick(
        page,
        'tagline_fallback',
        'Creative. Unique. Reality.',
        'page_tagline_fallback',
      ),
      card_fallback_title: pick(
        page,
        'card_fallback_title',
        'Untitled',
        'page_card_fallback_title',
      ),
      loading: pick(page, 'loading', 'Loading...', 'page_loading'),
      error: pick(page, 'error', 'Failed to load services.', 'page_error'),
      empty: pick(page, 'empty', 'No services found.', 'page_empty'),
      highlight_label: pick(page, 'highlight_label', 'Highlight', 'page_highlight_label'),
      details_label: pick(page, 'details_label', 'Details', 'page_details_label'),
    },
    section1: {
      heading: pick(section1, 'heading', 'What do I offer?', 'section1_heading'),
      intro_html: pick(
        section1,
        'intro_html',
        'My journey started with a fascination for design and technology,<br />leading me to specialize in UI/UX design',
        'section1_intro_html',
      ),
      error: pick(section1, 'error', 'Failed to load services.', 'section1_error'),
      cta_label: pick(section1, 'cta_label', 'Get a Quote', 'section1_cta_label'),
      empty: pick(section1, 'empty', 'No services found.', 'section1_empty'),
      loading_title: pick(section1, 'loading_title', 'Loading...', 'section1_loading_title'),
      loading_text: pick(section1, 'loading_text', 'Please wait', 'section1_loading_text'),
      card_fallback_title: pick(
        section1,
        'card_fallback_title',
        'Untitled',
        'section1_card_fallback_title',
      ),
    },
    section2: {
      badge: pick(section2, 'badge', 'Cooperation', 'section2_badge'),
      title_html: pick(
        section2,
        'title_html',
        'Designing solutions <span class="text-300">customized<br />to meet your requirements</span>',
        'section2_title_html',
      ),
      error: pick(section2, 'error', 'Failed to load services.', 'section2_error'),
      learn_more: pick(section2, 'learn_more', 'Learn more', 'section2_learn_more'),
      empty: pick(section2, 'empty', 'No services found.', 'section2_empty'),
      loading_title: pick(section2, 'loading_title', 'Loading...', 'section2_loading_title'),
      loading_text: pick(section2, 'loading_text', 'Please wait', 'section2_loading_text'),
      card_fallback_title: pick(
        section2,
        'card_fallback_title',
        'Untitled',
        'section2_card_fallback_title',
      ),
      footer_text_html: pick(
        section2,
        'footer_text_html',
        'Excited to take on <span class="text-dark">new projects</span> and collaborate.<br />Let\'s chat about your ideas.',
        'section2_footer_text_html',
      ),
      footer_link_label: pick(
        section2,
        'footer_link_label',
        'Reach out!',
        'section2_footer_link_label',
      ),
    },
    detail: {
      back_label: pick(detail, 'back_label', 'Back to Services', 'detail_back_label'),
      loading: pick(detail, 'loading', 'Loading...', 'detail_loading'),
      error: pick(detail, 'error', 'Failed to load service.', 'detail_error'),
      highlight_label: pick(detail, 'highlight_label', 'Highlight', 'detail_highlight_label'),
      details_label: pick(detail, 'details_label', 'Details', 'detail_details_label'),
      description_label: pick(
        detail,
        'description_label',
        'Description',
        'detail_description_label',
      ),
      gallery_label: pick(detail, 'gallery_label', 'Gallery', 'detail_gallery_label'),
      gallery_loading: pick(detail, 'gallery_loading', 'Loading...', 'detail_gallery_loading'),
      gallery_empty: pick(detail, 'gallery_empty', 'No gallery images.', 'detail_gallery_empty'),
      not_found: pick(detail, 'not_found', 'Service not found.', 'detail_not_found'),
      title_fallback: pick(detail, 'title_fallback', 'Service', 'detail_title_fallback'),
      tagline_fallback: pick(
        detail,
        'tagline_fallback',
        'Creative. Unique. Reality.',
        'detail_tagline_fallback',
      ),
    },
  };
}

// =============================================================
// UI PROJECTS (site_settings.ui_project)
// =============================================================

export type UiProjectCopy = {
  projects1: {
    heading: string;
    intro_html: string;
    cta_label: string;
    cta_short_label: string;
  };
  projects2: {
    badge: string;
    heading: string;
    slide_title_html: string;
    slide_description: string;
    info_label: string;
    client_label: string;
    completion_label: string;
    technologies_label: string;
    live_demo_label: string;
    github_label: string;
    sample_client: string;
    sample_completion: string;
    sample_technologies: string;
  };
  work: {
    badge: string;
    title_html: string;
    intro_html: string;
    loading_title: string;
    label_client: string;
    label_completion_time: string;
    label_tools: string;
    updating: string;
    empty_title: string;
    empty_text: string;
  };
  detail: {
    loading: string;
    not_found: string;
    slug_prefix: string;
    slug_missing: string;
    badge: string;
    label_client: string;
    label_start: string;
    label_complete: string;
    label_services: string;
    label_website: string;
    description_label: string;
    tools_label: string;
    key_features_label: string;
    technologies_used_label: string;
    design_highlights_label: string;
    details_label: string;
    gallery_label: string;
  };
};

export function normalizeUiProjectSettingValue(value: unknown): UiProjectCopy {
  const root = parseJsonObject(value);

  const projects1 = parseJsonObject((root as any).projects1);
  const projects2 = parseJsonObject((root as any).projects2);
  const work = parseJsonObject((root as any).work);
  const detail = parseJsonObject((root as any).detail);

  const pick = (obj: Record<string, unknown>, key: string, fallback: string, rootKey?: string) =>
    uiText(obj?.[key]) || pickFromRoot(root, rootKey || key) || fallback;

  return {
    projects1: {
      heading: pick(projects1, 'heading', 'My Latest Works', 'projects1_heading'),
      intro_html: pick(
        projects1,
        'intro_html',
        'I believe that working hard and trying to learn every day will<br />make me improve in satisfying my customers.',
        'projects1_intro_html',
      ),
      cta_label: pick(projects1, 'cta_label', 'View All Projects', 'projects1_cta_label'),
      cta_short_label: pick(projects1, 'cta_short_label', 'View All', 'projects1_cta_short_label'),
    },
    projects2: {
      badge: pick(projects2, 'badge', 'Projects', 'projects2_badge'),
      heading: pick(projects2, 'heading', 'My Recent Works', 'projects2_heading'),
      slide_title_html: pick(
        projects2,
        'slide_title_html',
        'Integrate AI into the <br /> ecommerce system',
        'projects2_slide_title_html',
      ),
      slide_description: pick(
        projects2,
        'slide_description',
        'Developed an online learning platform with course management, quizzes, and progress tracking.',
        'projects2_slide_description',
      ),
      info_label: pick(projects2, 'info_label', 'Project Info', 'projects2_info_label'),
      client_label: pick(projects2, 'client_label', 'Client', 'projects2_client_label'),
      completion_label: pick(
        projects2,
        'completion_label',
        'Completion Time',
        'projects2_completion_label',
      ),
      technologies_label: pick(
        projects2,
        'technologies_label',
        'Technologies',
        'projects2_technologies_label',
      ),
      live_demo_label: pick(projects2, 'live_demo_label', 'Live Demo', 'projects2_live_demo_label'),
      github_label: pick(projects2, 'github_label', 'View on Github', 'projects2_github_label'),
      sample_client: pick(projects2, 'sample_client', 'Conceptual JSC', 'projects2_sample_client'),
      sample_completion: pick(
        projects2,
        'sample_completion',
        '6 months',
        'projects2_sample_completion',
      ),
      sample_technologies: pick(
        projects2,
        'sample_technologies',
        'Node.js, React, MongoDB, Stripe',
        'projects2_sample_technologies',
      ),
    },
    work: {
      badge: pick(work, 'badge', 'Recent Work', 'work_badge'),
      title_html: pick(
        work,
        'title_html',
        'Explore <span class="text-300">My Latest Work and Discover the</span> Craftsmanship Behind <span class="text-300">Each Design</span>',
        'work_title_html',
      ),
      intro_html: pick(
        work,
        'intro_html',
        'Explore my latest work and discover the craftsmanship behind each design: <br />a detailed look into how I bring innovation and creativity to life',
        'work_intro_html',
      ),
      loading_title: pick(work, 'loading_title', 'Loading...', 'work_loading_title'),
      label_client: pick(work, 'label_client', 'Client', 'work_label_client'),
      label_completion_time: pick(
        work,
        'label_completion_time',
        'Completion Time',
        'work_label_completion_time',
      ),
      label_tools: pick(work, 'label_tools', 'Tools', 'work_label_tools'),
      updating: pick(work, 'updating', 'Updating...', 'work_updating'),
      empty_title: pick(work, 'empty_title', 'No projects found', 'work_empty_title'),
      empty_text: pick(
        work,
        'empty_text',
        'Please add projects from admin panel.',
        'work_empty_text',
      ),
    },
    detail: {
      loading: pick(detail, 'loading', 'Loading...', 'detail_loading'),
      not_found: pick(detail, 'not_found', 'Not found', 'detail_not_found'),
      slug_prefix: pick(detail, 'slug_prefix', 'slug:', 'detail_slug_prefix'),
      slug_missing: pick(detail, 'slug_missing', 'slug missing', 'detail_slug_missing'),
      badge: pick(detail, 'badge', 'work details', 'detail_badge'),
      label_client: pick(detail, 'label_client', 'Client', 'detail_label_client'),
      label_start: pick(detail, 'label_start', 'Start', 'detail_label_start'),
      label_complete: pick(detail, 'label_complete', 'Complete', 'detail_label_complete'),
      label_services: pick(detail, 'label_services', 'Services', 'detail_label_services'),
      label_website: pick(detail, 'label_website', 'Website', 'detail_label_website'),
      description_label: pick(
        detail,
        'description_label',
        'Description',
        'detail_description_label',
      ),
      tools_label: pick(detail, 'tools_label', 'Tools', 'detail_tools_label'),
      key_features_label: pick(
        detail,
        'key_features_label',
        'Key Features',
        'detail_key_features_label',
      ),
      technologies_used_label: pick(
        detail,
        'technologies_used_label',
        'Technologies Used',
        'detail_technologies_used_label',
      ),
      design_highlights_label: pick(
        detail,
        'design_highlights_label',
        'Design Highlights',
        'detail_design_highlights_label',
      ),
      details_label: pick(detail, 'details_label', 'Details', 'detail_details_label'),
      gallery_label: pick(detail, 'gallery_label', 'Gallery', 'detail_gallery_label'),
    },
  };
}

// =============================================================
// UI BLOG (site_settings.ui_blog)
// =============================================================

export type UiBlogCopy = {
  blog1: {
    heading: string;
    intro: string;
    cta_label: string;
    loading: string;
    error: string;
    empty: string;
    read_time: string;
    category_fallback: string;
  };
  blog2: {
    badge: string;
    heading: string;
    card1_category: string;
    card1_title: string;
    card1_description: string;
    card2_category: string;
    card2_title: string;
    card2_description: string;
    card3_category: string;
    card3_title: string;
    card3_description: string;
    sample_date: string;
    read_time: string;
  };
  list: {
    badge: string;
    title_html: string;
    intro_html: string;
    loading: string;
    error: string;
    read_time: string;
    default_category: string;
    empty: string;
  };
  post: {
    loading: string;
    error: string;
    empty: string;
  };
  detail: {
    loading_title: string;
    loading_text: string;
    not_found_title: string;
    not_found_text_prefix: string;
    error_title: string;
    error_text: string;
    read_time_label: string;
    by_label: string;
    share_label: string;
    related_title: string;
    view_more_label: string;
    related_empty: string;
    category_fallback: string;
    read_time: string;
  };
};

export function normalizeUiBlogSettingValue(value: unknown): UiBlogCopy {
  const root = parseJsonObject(value);

  const blog1 = parseJsonObject((root as any).blog1);
  const blog2 = parseJsonObject((root as any).blog2);
  const list = parseJsonObject((root as any).list);
  const post = parseJsonObject((root as any).post);
  const detail = parseJsonObject((root as any).detail);

  const pick = (obj: Record<string, unknown>, key: string, fallback: string, rootKey?: string) =>
    uiText(obj?.[key]) || pickFromRoot(root, rootKey || key) || fallback;

  return {
    blog1: {
      heading: pick(blog1, 'heading', 'Recent blog', 'blog1_heading'),
      intro: pick(
        blog1,
        'intro',
        'Explore the insights and trends shaping our industry',
        'blog1_intro',
      ),
      cta_label: pick(blog1, 'cta_label', 'View more', 'blog1_cta_label'),
      loading: pick(blog1, 'loading', 'Loading...', 'blog1_loading'),
      error: pick(blog1, 'error', 'Something went wrong.', 'blog1_error'),
      empty: pick(blog1, 'empty', 'No posts found.', 'blog1_empty'),
      read_time: pick(blog1, 'read_time', '3 min read', 'blog1_read_time'),
      category_fallback: pick(blog1, 'category_fallback', 'Blog', 'blog1_category_fallback'),
    },
    blog2: {
      badge: pick(blog2, 'badge', 'Latest Posts', 'blog2_badge'),
      heading: pick(blog2, 'heading', 'From Blog', 'blog2_heading'),
      card1_category: pick(blog2, 'card1_category', 'CEO', 'blog2_card1_category'),
      card1_title: pick(
        blog2,
        'card1_title',
        'Optimize Your Web Application for Speed',
        'blog2_card1_title',
      ),
      card1_description: pick(
        blog2,
        'card1_description',
        'Stay ahead of the curve with these emerging trends in UI/UX design.',
        'blog2_card1_description',
      ),
      card2_category: pick(blog2, 'card2_category', 'Development', 'blog2_card2_category'),
      card2_title: pick(
        blog2,
        'card2_title',
        'Best Practices for Secure Web Development',
        'blog2_card2_title',
      ),
      card2_description: pick(
        blog2,
        'card2_description',
        'Stay ahead of the curve with these emerging trends in UI/UX design.',
        'blog2_card2_description',
      ),
      card3_category: pick(blog2, 'card3_category', 'Trending', 'blog2_card3_category'),
      card3_title: pick(
        blog2,
        'card3_title',
        '10 JavaScript Frameworks for Web Development in 2026',
        'blog2_card3_title',
      ),
      card3_description: pick(
        blog2,
        'card3_description',
        'Stay ahead of the curve with these emerging trends in UI/UX design.',
        'blog2_card3_description',
      ),
      sample_date: pick(blog2, 'sample_date', 'March 28, 2026', 'blog2_sample_date'),
      read_time: pick(blog2, 'read_time', '3 min read', 'blog2_read_time'),
    },
    list: {
      badge: pick(list, 'badge', 'Recent blog', 'list_badge'),
      title_html: pick(
        list,
        'title_html',
        'Explore the <span class="text-dark">insights and trends shaping</span> our industry',
        'list_title_html',
      ),
      intro_html: pick(
        list,
        'intro_html',
        'Discover key insights and emerging trends shaping the future of design: a detailed <br /> examination of how these innovations are reshaping our industry',
        'list_intro_html',
      ),
      loading: pick(list, 'loading', 'Loading...', 'list_loading'),
      error: pick(list, 'error', 'Failed to load posts.', 'list_error'),
      read_time: pick(list, 'read_time', '3 min read', 'list_read_time'),
      default_category: pick(list, 'default_category', 'Blog', 'list_default_category'),
      empty: pick(list, 'empty', 'No posts found.', 'list_empty'),
    },
    post: {
      loading: pick(post, 'loading', 'Loading...', 'post_loading'),
      error: pick(post, 'error', 'Something went wrong', 'post_error'),
      empty: pick(post, 'empty', 'No Posts Found', 'post_empty'),
    },
    detail: {
      loading_title: pick(detail, 'loading_title', 'Loading...', 'detail_loading_title'),
      loading_text: pick(detail, 'loading_text', 'Please wait', 'detail_loading_text'),
      not_found_title: pick(detail, 'not_found_title', 'Post not found', 'detail_not_found_title'),
      not_found_text_prefix: pick(
        detail,
        'not_found_text_prefix',
        'Invalid slug:',
        'detail_not_found_text_prefix',
      ),
      error_title: pick(detail, 'error_title', 'Something went wrong', 'detail_error_title'),
      error_text: pick(detail, 'error_text', 'Please try again.', 'detail_error_text'),
      read_time_label: pick(detail, 'read_time_label', '16 mins to read', 'detail_read_time_label'),
      by_label: pick(detail, 'by_label', 'By', 'detail_by_label'),
      share_label: pick(detail, 'share_label', 'Share', 'detail_share_label'),
      related_title: pick(detail, 'related_title', 'Related posts', 'detail_related_title'),
      view_more_label: pick(detail, 'view_more_label', 'View more', 'detail_view_more_label'),
      related_empty: pick(detail, 'related_empty', 'No related posts.', 'detail_related_empty'),
      category_fallback: pick(detail, 'category_fallback', 'Blog', 'detail_category_fallback'),
      read_time: pick(detail, 'read_time', '3 min read', 'detail_read_time'),
    },
  };
}

// =============================================================
// UI RESUME (site_settings.ui_resume)
// =============================================================

export type UiResumeResearchItem = {
  year: string;
  title: string;
  description: string;
};

export type UiResumeCopy = {
  resume1: {
    heading: string;
    intro_html: string;
    cta_label: string;
    education_label: string;
    experience_label: string;
    loading: string;
    error: string;
    empty_education: string;
    empty_experience: string;
    marquee_text: string;
  };
  education2: {
    heading: string;
    loading_label: string;
    loading_text: string;
    error_label: string;
    error_text: string;
    empty_label: string;
    empty_text: string;
    research_heading: string;
    research_items: UiResumeResearchItem[];
  };
  experience2: {
    heading: string;
    loading_label: string;
    loading_text: string;
    error_label: string;
    error_text: string;
    empty_label: string;
    empty_text: string;
    research_heading: string;
    research_items: UiResumeResearchItem[];
  };
};

const RESUME_RESEARCH_FALLBACK: UiResumeResearchItem[] = [
  {
    year: '2023-2024:',
    title: 'Advanced Data Analytics with Big Data Tools',
    description: 'Utilized big data tools for advanced analytics and insights.',
  },
  {
    year: '2021-2013:',
    title: 'Cloud-Native Application Architectures',
    description: 'Studied best practices for designing cloud-native applications.',
  },
  {
    year: '2019-2020:',
    title: 'AI-Driven User Experience Personalization',
    description: 'Leveraged AI to personalize user experiences based on behavior.',
  },
];

function normalizeResearchItems(
  raw: unknown,
  fallback: UiResumeResearchItem[],
): UiResumeResearchItem[] {
  if (Array.isArray(raw)) {
    const items = raw
      .map((item) => {
        const o = parseJsonObject(item);
        const year = uiText(o.year) || '';
        const title = uiText(o.title) || '';
        const description = uiText(o.description) || '';
        return { year, title, description };
      })
      .filter((item) => item.year || item.title || item.description);
    if (items.length > 0) return items;
  }

  return fallback;
}

export function normalizeUiResumeSettingValue(value: unknown): UiResumeCopy {
  const root = parseJsonObject(value);

  const resume1 = parseJsonObject((root as any).resume1);
  const education2 = parseJsonObject((root as any).education2);
  const experience2 = parseJsonObject((root as any).experience2);

  const pick = (obj: Record<string, unknown>, key: string, fallback: string, rootKey?: string) =>
    uiText(obj?.[key]) || pickFromRoot(root, rootKey || key) || fallback;

  const educationResearch = normalizeResearchItems(
    (education2 as any)?.research_items,
    RESUME_RESEARCH_FALLBACK,
  );

  const experienceResearch = normalizeResearchItems(
    (experience2 as any)?.research_items,
    RESUME_RESEARCH_FALLBACK,
  );

  return {
    resume1: {
      heading: pick(resume1, 'heading', 'My Resume', 'resume1_heading'),
      intro_html: pick(
        resume1,
        'intro_html',
        'I believe that working hard and trying to learn every day will<br />make me improve in satisfying my customers.',
        'resume1_intro_html',
      ),
      cta_label: pick(resume1, 'cta_label', 'Get in touch', 'resume1_cta_label'),
      education_label: pick(resume1, 'education_label', 'Education', 'resume1_education_label'),
      experience_label: pick(resume1, 'experience_label', 'Experience', 'resume1_experience_label'),
      loading: pick(resume1, 'loading', 'Loading...', 'resume1_loading'),
      error: pick(resume1, 'error', 'Failed to load resume data.', 'resume1_error'),
      empty_education: pick(
        resume1,
        'empty_education',
        'No education entries found.',
        'resume1_empty_education',
      ),
      empty_experience: pick(
        resume1,
        'empty_experience',
        'No experience entries found.',
        'resume1_empty_experience',
      ),
      marquee_text: pick(
        resume1,
        'marquee_text',
        'Branding . Marketing . User Interface',
        'resume1_marquee_text',
      ),
    },
    education2: {
      heading: pick(education2, 'heading', 'Education', 'education2_heading'),
      loading_label: pick(education2, 'loading_label', 'Loading...', 'education2_loading_label'),
      loading_text: pick(education2, 'loading_text', 'Please wait', 'education2_loading_text'),
      error_label: pick(education2, 'error_label', 'Failed', 'education2_error_label'),
      error_text: pick(
        education2,
        'error_text',
        'Education data could not be loaded.',
        'education2_error_text',
      ),
      empty_label: pick(education2, 'empty_label', 'No entries', 'education2_empty_label'),
      empty_text: pick(
        education2,
        'empty_text',
        'No education entries found.',
        'education2_empty_text',
      ),
      research_heading: pick(
        education2,
        'research_heading',
        'Researched',
        'education2_research_heading',
      ),
      research_items: educationResearch,
    },
    experience2: {
      heading: pick(experience2, 'heading', 'Education', 'experience2_heading'),
      loading_label: pick(experience2, 'loading_label', 'Loading...', 'experience2_loading_label'),
      loading_text: pick(experience2, 'loading_text', 'Please wait', 'experience2_loading_text'),
      error_label: pick(experience2, 'error_label', 'Failed', 'experience2_error_label'),
      error_text: pick(
        experience2,
        'error_text',
        'Education data could not be loaded.',
        'experience2_error_text',
      ),
      empty_label: pick(experience2, 'empty_label', 'No entries', 'experience2_empty_label'),
      empty_text: pick(
        experience2,
        'empty_text',
        'No education entries found.',
        'experience2_empty_text',
      ),
      research_heading: pick(
        experience2,
        'research_heading',
        'Researched',
        'experience2_research_heading',
      ),
      research_items: experienceResearch,
    },
  };
}

// =============================================================
// UI HOME (site_settings.ui_home)
// =============================================================

export type UiHomeCopy = {
  home1: {
    greeting: string;
    title_html: string;
    description: string;
    cta_primary: string;
    cta_secondary: string;
    experience_label: string;
    hero_image: string;
    hero_image_alt: string;
    decor_image: string;
    decor_image_alt: string;
  };
  home2: {
    greeting: string;
    title_html: string;
    description_html: string;
    more_label: string;
    cv_label: string;
    hero_image: string;
    hero_image_alt: string;
    icon_image: string;
    icon_image_alt: string;
  };
};

export function normalizeUiHomeSettingValue(value: unknown): UiHomeCopy {
  const root = parseJsonObject(value);

  const home1 = parseJsonObject((root as any).home1);
  const home2 = parseJsonObject((root as any).home2);

  const pick = (obj: Record<string, unknown>, key: string, fallback: string, rootKey?: string) =>
    uiText(obj?.[key]) || pickFromRoot(root, rootKey || key) || fallback;

  return {
    home1: {
      greeting: pick(home1, 'greeting', 'Welcome', 'home1_greeting'),
      title_html: pick(
        home1,
        'title_html',
        'Building digital experiences',
        'home1_title_html',
      ),
      description: pick(
        home1,
        'description',
        'Create user-focused digital products and interactive experiences.',
        'home1_description',
      ),
      cta_primary: pick(home1, 'cta_primary', 'Download CV', 'home1_cta_primary'),
      cta_secondary: pick(home1, 'cta_secondary', 'Hire me', 'home1_cta_secondary'),
      experience_label: pick(
        home1,
        'experience_label',
        '+ 12 years with professional design software',
        'home1_experience_label',
      ),
      hero_image: pick(home1, 'hero_image', '/assets/imgs/hero/hero-1/man.png', 'home1_hero_image'),
      hero_image_alt: pick(home1, 'hero_image_alt', 'Hero image', 'home1_hero_image_alt'),
      decor_image: pick(
        home1,
        'decor_image',
        '/assets/imgs/hero/hero-1/decorate.png',
        'home1_decor_image',
      ),
      decor_image_alt: pick(home1, 'decor_image_alt', 'Decor', 'home1_decor_image_alt'),
    },
    home2: {
      greeting: pick(home2, 'greeting', 'Welcome', 'home2_greeting'),
      title_html: pick(
        home2,
        'title_html',
        'Digital product studio<span class="flicker">_</span>',
        'home2_title_html',
      ),
      description_html: pick(
        home2,
        'description_html',
        '&lt;p&gt;<span class="text-dark">Fast, reliable web and app experiences.</span>&lt;/p&gt;',
        'home2_description_html',
      ),
      more_label: pick(home2, 'more_label', '...and more', 'home2_more_label'),
      cv_label: pick(home2, 'cv_label', '[ Download my CV ]', 'home2_cv_label'),
      hero_image: pick(
        home2,
        'hero_image',
        'assets/imgs/home-page-2/hero-1/people.png',
        'home2_hero_image',
      ),
      hero_image_alt: pick(home2, 'hero_image_alt', 'Hero image', 'home2_hero_image_alt'),
      icon_image: pick(
        home2,
        'icon_image',
        'assets/imgs/home-page-2/hero-1/icon.svg',
        'home2_icon_image',
      ),
      icon_image_alt: pick(home2, 'icon_image_alt', 'Decor', 'home2_icon_image_alt'),
    },
  };
}

// =============================================================
// UI HOME 3 (site_settings.ui_home3)
// =============================================================

export type UiHome3Copy = {
  hero: {
    badge: string;
    title_html: string;
    description: string;
    cv_label: string;
    cv_href: string;
    hire_label: string;
    hire_href: string;
    hero_image: string;
    hero_image_alt: string;
    signature_image: string;
    signature_image_alt: string;
  };
  typical: {
    heading: string;
    empty: string;
  };
  services: {
    heading: string;
    empty: string;
  };
  resume: {
    education_heading: string;
    awards_heading: string;
    empty_education: string;
    empty_awards: string;
  };
  blog: {
    heading: string;
    empty: string;
    default_category: string;
  };
  testimonials: {
    heading: string;
    empty: string;
  };
  contact: {
    heading: string;
    form_title: string;
    phone: string;
    email: string;
    skype: string;
    address: string;
    map_href: string;
  };
};

export function normalizeUiHome3SettingValue(value: unknown): UiHome3Copy {
  const root = parseJsonObject(value);

  const hero = parseJsonObject((root as any).hero);
  const typical = parseJsonObject((root as any).typical);
  const services = parseJsonObject((root as any).services);
  const resume = parseJsonObject((root as any).resume);
  const blog = parseJsonObject((root as any).blog);
  const testimonials = parseJsonObject((root as any).testimonials);
  const contact = parseJsonObject((root as any).contact);

  const pick = (obj: Record<string, unknown>, key: string, fallback: string, rootKey?: string) =>
    uiText(obj?.[key]) || pickFromRoot(root, rootKey || key) || fallback;

  return {
    hero: {
      badge: pick(hero, 'badge', 'Designing Experiences, Building Brands', 'hero_badge'),
      title_html: pick(
        hero,
        'title_html',
        'Crafting Products <span class="text-dark">with Purpose</span>',
        'hero_title_html',
      ),
      description: pick(
        hero,
        'description',
        'Design and build modern web experiences that are fast, elegant, and conversion-focused.',
        'hero_description',
      ),
      cv_label: pick(hero, 'cv_label', 'Download CV', 'hero_cv_label'),
      cv_href: pick(hero, 'cv_href', '/assets/resume.pdf', 'hero_cv_href'),
      hire_label: pick(hero, 'hire_label', 'Hire me', 'hero_hire_label'),
      hire_href: pick(hero, 'hire_href', '#contact', 'hero_hire_href'),
      hero_image: pick(hero, 'hero_image', '/assets/imgs/home-page-3/hero/img-1.png', 'hero_image'),
      hero_image_alt: pick(hero, 'hero_image_alt', 'Hero image', 'hero_image_alt'),
      signature_image: pick(
        hero,
        'signature_image',
        '/assets/imgs/home-page-3/hero/signature.png',
        'signature_image',
      ),
      signature_image_alt: pick(hero, 'signature_image_alt', 'Signature', 'signature_image_alt'),
    },
    typical: {
      heading: pick(typical, 'heading', 'Typical Works', 'typical_heading'),
      empty: pick(typical, 'empty', 'No projects yet.', 'typical_empty'),
    },
    services: {
      heading: pick(services, 'heading', 'My Services', 'services_heading'),
      empty: pick(services, 'empty', 'No services yet.', 'services_empty'),
    },
    resume: {
      education_heading: pick(resume, 'education_heading', 'Education', 'resume_education_heading'),
      awards_heading: pick(resume, 'awards_heading', 'Awards', 'resume_awards_heading'),
      empty_education: pick(
        resume,
        'empty_education',
        'No education entries.',
        'resume_empty_education',
      ),
      empty_awards: pick(resume, 'empty_awards', 'No awards yet.', 'resume_empty_awards'),
    },
    blog: {
      heading: pick(blog, 'heading', 'From Blog', 'blog_heading'),
      empty: pick(blog, 'empty', 'No posts yet.', 'blog_empty'),
      default_category: pick(blog, 'default_category', 'Inspiration', 'blog_default_category'),
    },
    testimonials: {
      heading: pick(testimonials, 'heading', 'Testimonials', 'testimonials_heading'),
      empty: pick(testimonials, 'empty', 'No testimonials yet.', 'testimonials_empty'),
    },
    contact: {
      heading: pick(contact, 'heading', 'Contact me', 'contact_heading'),
      form_title: pick(contact, 'form_title', "Let's connect", 'contact_form_title'),
      phone: pick(contact, 'phone', '+49 000 000 00 00', 'contact_phone'),
      email: pick(contact, 'email', '', 'contact_email'),
      skype: pick(contact, 'skype', 'GuezelWebDesign', 'contact_skype'),
      address: pick(contact, 'address', 'Berlin, Germany', 'contact_address'),
      map_href: pick(
        contact,
        'map_href',
        'https://www.google.com/maps?q=Berlin',
        'contact_map_href',
      ),
    },
  };
}

// =============================================================
// UI STATIC (site_settings.ui_static)
// =============================================================

export type UiStaticItem = {
  value: number;
  prefix?: string;
  suffix?: string;
  label_top?: string;
  label_bottom?: string;
  label?: string;
  icon?: string;
};

export type UiStaticCopy = {
  static1: {
    items: UiStaticItem[];
  };
  static2: {
    items: UiStaticItem[];
    background_image: string;
  };
};

const STATIC1_FALLBACK: UiStaticItem[] = [
  {
    value: 12,
    prefix: '+',
    label_top: 'Year of',
    label_bottom: 'Experience',
  },
  {
    value: 250,
    prefix: '+',
    label_top: 'Projects',
    label_bottom: 'Completed',
  },
  {
    value: 680,
    prefix: '+',
    label_top: 'Satisfied',
    label_bottom: 'Happy Clients',
  },
  {
    value: 18,
    prefix: '+',
    label_top: 'Awards',
    label_bottom: 'Won Received',
  },
];

const STATIC2_FALLBACK: UiStaticItem[] = [
  {
    value: 12,
    suffix: '+',
    label: 'Year Experience',
    icon: 'ri-shape-line',
  },
  {
    value: 250,
    suffix: '+',
    label: 'Projects Completed',
    icon: 'ri-computer-line',
  },
  {
    value: 680,
    suffix: '+',
    label: 'Satisfied Clients',
    icon: 'ri-service-line',
  },
  {
    value: 18,
    suffix: '+',
    label: 'Awards Winner',
    icon: 'ri-award-line',
  },
];

function normalizeStaticItems(raw: unknown, fallback: UiStaticItem[]): UiStaticItem[] {
  if (Array.isArray(raw)) {
    const items = raw
      .map((item) => {
        const o = parseJsonObject(item);
        const rawValue = (o as any).value ?? (o as any).count ?? (o as any).number;
        const value = toNum(rawValue);
        const hasValue = rawValue !== undefined && rawValue !== null && rawValue !== '';
        const prefix = uiText((o as any).prefix);
        const suffix = uiText((o as any).suffix);
        const label_top =
          uiText((o as any).label_top) || uiText((o as any).labelTop) || uiText((o as any).top);
        const label_bottom =
          uiText((o as any).label_bottom) ||
          uiText((o as any).labelBottom) ||
          uiText((o as any).bottom);
        const label = uiText((o as any).label);
        const icon = uiText((o as any).icon);

        if (!hasValue && !prefix && !suffix && !label_top && !label_bottom && !label && !icon) {
          return null;
        }

        return {
          value: Number.isFinite(value as any) ? Number(value) : 0,
          ...(prefix ? { prefix } : {}),
          ...(suffix ? { suffix } : {}),
          ...(label_top ? { label_top } : {}),
          ...(label_bottom ? { label_bottom } : {}),
          ...(label ? { label } : {}),
          ...(icon ? { icon } : {}),
        } as UiStaticItem;
      })
      .filter(Boolean) as UiStaticItem[];

    if (items.length > 0) return items;
  }

  return fallback;
}

export function normalizeUiStaticSettingValue(value: unknown): UiStaticCopy {
  const root = parseJsonObject(value);
  const static1 = parseJsonObject((root as any).static1);
  const static2 = parseJsonObject((root as any).static2);

  const items1 = normalizeStaticItems(
    (static1 as any).items ?? (root as any).static1_items,
    STATIC1_FALLBACK,
  );
  const items2 = normalizeStaticItems(
    (static2 as any).items ?? (root as any).static2_items,
    STATIC2_FALLBACK,
  );

  const background_image =
    uiText((static2 as any).background_image) ||
    uiText((root as any).static2_background_image) ||
    'assets/imgs/home-page-2/static/bg.png';

  return {
    static1: { items: items1 },
    static2: { items: items2, background_image },
  };
}

// =============================================================
// UI COPORATION (site_settings.ui_coporation)
// =============================================================

export type UiCoporationJournalItem = {
  date: string;
  title: string;
};

export type UiCoporationCopy = {
  badge: string;
  heading_html: string;
  contact: {
    avatar: string;
    avatar_alt: string;
    skype_label: string;
    skype_value: string;
    skype_href: string;
    phone_label: string;
    phone_value: string;
    phone_href: string;
    email_label: string;
    email_value: string;
    email_href: string;
  };
  journal: {
    badge: string;
    items: UiCoporationJournalItem[];
  };
};

const COPORATION_JOURNAL_FALLBACK: UiCoporationJournalItem[] = [
  { date: '15 Jul:', title: 'Muzzilla-streaming-API-services-for-Python' },
  { date: '30 Jun:', title: 'ChatHub-Chat-application-VueJs-Mongodb' },
  { date: '26 May:', title: 'DineEasy-coffee-tea-reservation-system' },
  { date: '17 Apr:', title: 'FinanceBuddy-Personal-finance-tracker' },
  { date: '05 Mar:', title: 'TuneStream-Music-streaming-service-API' },
];

function normalizeCoporationJournalItems(
  raw: unknown,
  fallback: UiCoporationJournalItem[],
): UiCoporationJournalItem[] {
  if (Array.isArray(raw)) {
    const items = raw
      .map((item) => {
        const o = parseJsonObject(item);
        const date = uiText((o as any).date);
        const title = uiText((o as any).title);
        if (!date && !title) return null;
        return { date, title };
      })
      .filter(Boolean) as UiCoporationJournalItem[];

    if (items.length > 0) return items;
  }

  return fallback;
}

export function normalizeUiCoporationSettingValue(value: unknown): UiCoporationCopy {
  const root = parseJsonObject(value);
  const contact = parseJsonObject((root as any).contact);
  const journal = parseJsonObject((root as any).journal);

  const pick = (obj: Record<string, unknown>, key: string, fallback: string, rootKey?: string) =>
    uiText(obj?.[key]) || uiText((root as any)?.[rootKey || key]) || fallback;

  const badge = pick(root, 'badge', 'Cooperation');
  const heading_html =
    uiText((root as any).heading_html) ||
    'More than +168 <span class="text-300">companies <br /></span> trusted <span class="text-300">worldwide_</span>';

  const avatar = pick(contact, 'avatar', 'assets/imgs/coporation/avatar.png', 'contact_avatar');
  const avatar_alt = pick(contact, 'avatar_alt', 'Avatar', 'contact_avatar_alt');

  const skype_label = pick(contact, 'skype_label', '[skype]', 'contact_skype_label');
  const skype_value = pick(contact, 'skype_value', 'support', 'contact_skype_value');
  const skype_href = pick(contact, 'skype_href', '#', 'contact_skype_href');

  const phone_label = pick(contact, 'phone_label', '[phone]', 'contact_phone_label');
  const phone_value = pick(contact, 'phone_value', '+49 000 000 00 00', 'contact_phone_value');
  const phone_href = pick(contact, 'phone_href', 'tel:+490000000000', 'contact_phone_href');

  const email_label = pick(contact, 'email_label', '[email]', 'contact_email_label');
  const email_value = pick(
    contact,
    'email_value',
    '',
    'contact_email_value',
  );
  const email_href = pick(
    contact,
    'email_href',
    '',
    'contact_email_href',
  );

  const journalBadge = pick(journal, 'badge', 'Git Journaling', 'journal_badge');
  const journalItems = normalizeCoporationJournalItems(
    (journal as any).items ?? (root as any).journal_items,
    COPORATION_JOURNAL_FALLBACK,
  );

  return {
    badge,
    heading_html,
    contact: {
      avatar,
      avatar_alt,
      skype_label,
      skype_value,
      skype_href,
      phone_label,
      phone_value,
      phone_href,
      email_label,
      email_value,
      email_href,
    },
    journal: {
      badge: journalBadge,
      items: journalItems,
    },
  };
}

// =============================================================
// UI BRANDS (site_settings.ui_brands)
// =============================================================

export type UiBrandsCopy = {
  heading: string;
  intro_html: string;
  track: 'right' | 'left' | 'all';
  loading: string;
  error: string;
  empty: string;
};

function normalizeBrandsTrack(raw: unknown): 'right' | 'left' | 'all' {
  const s = uiText(raw).toLowerCase();
  if (s === 'left') return 'left';
  if (s === 'all') return 'all';
  return 'right';
}

export function normalizeUiBrandsSettingValue(val: unknown): UiBrandsCopy {
  const o = parseJsonObject(val);

  const heading = uiText(o.heading) || 'Trusted by industry leaders';
  const intro_html =
    uiText(o.intro_html) ||
    'I have collaborated with many large corporations, companies, and agencies around<br />the world in many fields of design and consulting';
  const track = normalizeBrandsTrack(o.track);

  const loading = uiText(o.loading) || 'Loading...';
  const error = uiText(o.error) || 'Failed to load brands.';
  const empty = uiText(o.empty) || 'No brands found.';

  return {
    heading,
    intro_html,
    track,
    loading,
    error,
    empty,
  };
}

// =============================================================
// UI SKILLS (site_settings.ui_skills)
// =============================================================

export type UiSkillsListItem = {
  label: string;
  value: string;
};

export type UiSkillsCopy = {
  skills1: {
    heading: string;
    intro_html: string;
    loading: string;
    error: string;
    empty: string;
    extra_intro: string;
    extra_items: string[];
  };
  skills2: {
    badge: string;
    heading: string;
    loading: string;
    error: string;
    list_items: UiSkillsListItem[];
  };
};

const SKILLS_LIST_FALLBACK: UiSkillsListItem[] = [
  {
    label: 'Front-End:',
    value: 'HTML, CSS, JavaScript, React, Angular',
  },
  {
    label: 'Back-End:',
    value: 'Node.js, Express, Python, Django',
  },
  {
    label: 'Databases:',
    value: 'MySQL, PostgreSQL, MongoDB',
  },
  {
    label: 'Tools & Platforms:',
    value: 'Git, Docker, AWS, Heroku',
  },
  {
    label: 'Others:',
    value: 'RESTful APIs, GraphQL, Agile Methodologies',
  },
];

function normalizeSkillsItems(raw: unknown, fallback: UiSkillsListItem[]): UiSkillsListItem[] {
  if (Array.isArray(raw)) {
    const items = raw
      .map((item) => {
        const o = parseJsonObject(item);
        const label = uiText(o.label) || '';
        const value = uiText(o.value) || '';
        return { label, value };
      })
      .filter((item) => item.label || item.value);

    if (items.length > 0) return items;
  }

  return fallback;
}

function normalizeSkillsExtraItems(raw: unknown, fallback: string[]): string[] {
  if (Array.isArray(raw)) {
    const items = raw.map((x) => uiText(x)).filter((x) => !!x) as string[];
    if (items.length > 0) return items;
  }

  if (typeof raw === 'string' && raw.trim()) {
    const items = raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (items.length > 0) return items;
  }

  return fallback;
}

export function normalizeUiSkillsSettingValue(value: unknown): UiSkillsCopy {
  const root = parseJsonObject(value);

  const skills1 = parseJsonObject((root as any).skills1);
  const skills2 = parseJsonObject((root as any).skills2);

  const pick = (obj: Record<string, unknown>, key: string, fallback: string, rootKey?: string) =>
    uiText(obj?.[key]) || pickFromRoot(root, rootKey || key) || fallback;

  const extraItemsFallback = ['HTML', 'CSS', 'Javascript', 'Bootstrap', 'TailwindCSS'];

  return {
    skills1: {
      heading: pick(skills1, 'heading', 'My Skills', 'skills1_heading'),
      intro_html: pick(
        skills1,
        'intro_html',
        'I thrive on turning complex problems into simple, beautiful<br />solutions that enhance user satisfaction.',
        'skills1_intro_html',
      ),
      loading: pick(skills1, 'loading', 'Loading...', 'skills1_loading'),
      error: pick(skills1, 'error', 'Failed to load skills.', 'skills1_error'),
      empty: pick(skills1, 'empty', 'No skills found.', 'skills1_empty'),
      extra_intro: pick(
        skills1,
        'extra_intro',
        'In addition, I have some programming knowledge such as:',
        'skills1_extra_intro',
      ),
      extra_items: normalizeSkillsExtraItems((skills1 as any)?.extra_items, extraItemsFallback),
    },
    skills2: {
      badge: pick(skills2, 'badge', 'Skills', 'skills2_badge'),
      heading: pick(skills2, 'heading', 'My Skills', 'skills2_heading'),
      loading: pick(skills2, 'loading', 'Loading...', 'skills2_loading'),
      error: pick(skills2, 'error', 'Failed to load.', 'skills2_error'),
      list_items: normalizeSkillsItems((skills2 as any)?.list_items, SKILLS_LIST_FALLBACK),
    },
  };
}

function unwrapMaybeData(x: any): any {
  if (x && typeof x === 'object' && 'data' in x) return (x as any).data;
  return x;
}

/**
 * /site_settings/app-locales normalize
 * Tolerates API returning:
 * - AppLocaleMeta[]
 * - {data: AppLocaleMeta[]}
 * - SiteSetting-like: {key, value}
 * - {data: {key,value}} etc.
 */
export function normalizeAppLocalesPublic(res: unknown): AppLocaleMeta[] {
  const v0 = unwrapMaybeData(res as any);

  // direct array
  if (Array.isArray(v0)) return v0 as AppLocaleMeta[];

  // SiteSetting-like object => read value
  if (v0 && typeof v0 === 'object') {
    const maybeValue = unwrapMaybeData((v0 as any).value);
    const parsed = tryParsePublicValue<any>(maybeValue);

    if (Array.isArray(parsed)) return parsed as AppLocaleMeta[];

    // sometimes API might return {locales:[...]}
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).locales)) {
      return (parsed as any).locales as AppLocaleMeta[];
    }
  }

  return [];
}

/**
 * /site_settings/default-locale normalize
 * Tolerates API returning:
 * - "de"
 * - {data:"de"}
 * - SiteSetting-like: {key, value:"de"}
 */
export function normalizeDefaultLocalePublic(res: unknown): string {
  const v0 = unwrapMaybeData(res as any);

  if (typeof v0 === 'string') return v0.trim();

  if (v0 && typeof v0 === 'object') {
    const maybeValue = unwrapMaybeData((v0 as any).value);
    const parsed = tryParsePublicValue<any>(maybeValue);

    if (typeof parsed === 'string') return parsed.trim();
  }

  return '';
}
