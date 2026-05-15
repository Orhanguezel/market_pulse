// ---------------------------------------------------------------------
// FILE: src/integrations/shared/projects.ts
// ---------------------------------------------------------------------

export type ProjectContentJson = {
  html?: string;
  description?: string;
  key_features?: string[];
  technologies_used?: string[];
  design_highlights?: string[];
};

/**
 * Backend merged model: projects (parent) + projects_i18n (current locale)
 * Bu interface "getProjectMergedById/getProjectMergedBySlug/listProjects" çıktısına göre tasarlandı.
 * Repo tarafında ekstra alanlar varsa burada genişletirsin.
 */
export interface Project {
  id: string;

  // parent
  is_published: boolean;
  is_featured: boolean;
  display_order: number;

  featured_image?: string | null;
  featured_image_asset_id?: string | null;

  demo_url?: string | null;
  repo_url?: string | null;

  category?: string | null;
  client_name?: string | null;

  start_date?: string | null; // YYYY-MM-DD
  complete_date?: string | null; // YYYY-MM-DD
  completion_time_label?: string | null;

  services?: string[] | null; // API merged halde array gelebilir; değilse string olabilir (aşağıda normalize edebilirsin)
  website_url?: string | null;

  techs?: string[] | null;

  // i18n (merged)
  locale?: string;
  title: string;
  slug: string;

  summary?: string | null;

  /**
   * Backend packContent() JSON-string üretiyor. Public/Admin response'ta:
   * - string dönebilir (JSON-string / HTML string)
   * - ya da repository merged parse edip object dönebilir
   */
  content: string | ProjectContentJson;

  featured_image_alt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface ProjectImage {
  id: string;
  project_id: string;

  asset_id: string;
  image_url?: string | null;

  display_order: number;
  is_active: boolean;

  // i18n merged
  locale?: string;
  alt?: string | null;
  caption?: string | null;

  created_at?: string;
  updated_at?: string;
}

/* =========================================================
 * LIST PARAMS
 * ======================================================= */
export type ProjectListParams = {
  // FE filters
  q?: string;
  slug?: string;

  is_published?: boolean;
  is_featured?: boolean;

  category?: string;
  client?: string;

  limit?: number;
  offset?: number;

  /**
   * Backend destekli alanlar:
   * - sort: created_at | updated_at | display_order
   * - orderDir: asc | desc
   * - order: string (ör: "display_order.asc" veya "created_at.desc")
   *
   * Not: backend kodunda q.order string olarak parse ediliyor.
   * Bu yüzden en neti `order` stringi üretmek.
   */
  orderBy?: 'created_at' | 'updated_at' | 'display_order';
  orderDir?: 'asc' | 'desc';

  // optional projections
  view?: 'card' | 'detail';
  select?: string;

  // locale (opsiyonel)
  locale?: string;
};

/* =========================================================
 * INPUTS (admin create/patch)
 * ======================================================= */
export type UpsertProjectInput = {
  locale?: string;

  // parent
  is_published?: boolean;
  is_featured?: boolean;
  display_order?: number;

  featured_image?: string | null;
  featured_image_asset_id?: string | null;

  demo_url?: string | null;
  repo_url?: string | null;

  category?: string | null;
  client_name?: string | null;

  start_date?: string | null; // YYYY-MM-DD
  complete_date?: string | null; // YYYY-MM-DD
  completion_time_label?: string | null;

  website_url?: string | null;

  services?: string[]; // stored as JSON-string in DB
  techs?: string[]; // stored as JSON-string in DB

  // i18n
  title: string;
  slug: string;
  summary?: string | null;

  content: string; // accepts raw html OR JSON-string

  featured_image_alt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

export type PatchProjectInput = Partial<UpsertProjectInput>;

/* =========================================================
 * INPUTS (admin gallery create/patch)
 * ======================================================= */
export type UpsertProjectImageInput = {
  locale?: string;

  asset_id: string; // required
  image_url?: string | null;

  display_order?: number;
  is_active?: boolean;

  alt?: string | null;
  caption?: string | null;
};

export type PatchProjectImageInput = Partial<UpsertProjectImageInput>;

/* =========================================================
 * QUERY MAPPERS
 * ======================================================= */

// Admin: tam filtre kontrolü
export function toAdminProjectQuery(p?: ProjectListParams) {
  if (!p) return undefined;

  const q: Record<string, any> = {};

  if (p.q) q.q = p.q;
  if (p.slug) q.slug = p.slug;

  if (typeof p.is_published === 'boolean') q.is_published = p.is_published;
  if (typeof p.is_featured === 'boolean') q.is_featured = p.is_featured;

  if (p.category) q.category = p.category;
  if (p.client) q.client = p.client;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  // backend: order string
  if (p.orderBy && p.orderDir) q.order = `${p.orderBy}.${p.orderDir}`;

  if (p.view) q.view = p.view;
  if (p.select) q.select = p.select;

  if (p.locale) q.locale = p.locale;

  return q;
}

// Public: default published = true (senin public route config public)
export function toPublicProjectQuery(p?: ProjectListParams | void | null) {
  const q: Record<string, any> = {};

  // Public default: published olanlar
  q.is_published = true;

  if (!p) return q;

  if (p.q) q.q = p.q;
  if (p.slug) q.slug = p.slug;

  // Public'ta is_published override edilebilir mi?
  // İstersen kapat; şimdilik izin veriyorum:
  if (typeof p.is_published === 'boolean') q.is_published = p.is_published;

  if (typeof p.is_featured === 'boolean') q.is_featured = p.is_featured;
  if (p.category) q.category = p.category;
  if (p.client) q.client = p.client;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  if (p.orderBy && p.orderDir) q.order = `${p.orderBy}.${p.orderDir}`;

  if (p.view) q.view = p.view;
  if (p.select) q.select = p.select;

  if (p.locale) q.locale = p.locale;

  return q;
}

/* =========================================================
 * NORMALIZERS (PUBLIC UI)
 * - Keep all helpers here (single source of truth)
 * ======================================================= */

export type NormalizedProjectContent = {
  html: string;
  description: string | null;
  key_features: string[];
  technologies_used: string[];
  design_highlights: string[];
};

export type NormalizedProjectDetail = {
  id: string;
  slug: string;
  title: string;
  category: string;

  // Header + Description fallbacks
  summaryTop: string;
  descriptionText: string;

  client: string;
  startPretty: string;
  completePretty: string;

  servicesArr: string[];
  website: string;

  toolsArr: string[];

  cover: string;
  coverAlt: string;

  content: NormalizedProjectContent;
};

export type GetProjectBySlugArgs = { slug: string; include?: 'images' };

// ---------- primitives ----------
export function asStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

export function fmtDateISOToPretty(isoLike?: unknown): string {
  const s = asStr(isoLike).slice(0, 10);
  if (!s) return '';
  const [y, m, d] = s.split('-');
  if (!y || !m || !d) return s;

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const mi = Number(m) - 1;
  return `${d} ${monthNames[mi] ?? m} ${y}`;
}

/**
 * Accepts:
 * - string[]
 * - JSON-string '["a","b"]'
 * - comma separated "a,b"
 * - null/undefined
 */
export function parseStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((x) => typeof x === 'string' && x.trim()).map((x) => String(x).trim());
  }

  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return [];

    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((x) => typeof x === 'string' && String(x).trim())
            .map((x) => String(x).trim());
        }
      } catch {
        // fallthrough
      }
    }

    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Project.content:
 * - string (JSON-string or raw html string)
 * - or object (ProjectContentJson)
 */
export function parseProjectContent(input: Project['content']): NormalizedProjectContent {
  const empty: NormalizedProjectContent = {
    html: '',
    description: null,
    key_features: [],
    technologies_used: [],
    design_highlights: [],
  };

  if (!input) return empty;

  // object
  if (typeof input === 'object') {
    const obj = input as ProjectContentJson;
    return {
      html: typeof obj.html === 'string' ? obj.html : '',
      description: typeof obj.description === 'string' ? obj.description : null,
      key_features: Array.isArray(obj.key_features)
        ? obj.key_features.filter((x) => typeof x === 'string' && x.trim())
        : [],
      technologies_used: Array.isArray(obj.technologies_used)
        ? obj.technologies_used.filter((x) => typeof x === 'string' && x.trim())
        : [],
      design_highlights: Array.isArray(obj.design_highlights)
        ? obj.design_highlights.filter((x) => typeof x === 'string' && x.trim())
        : [],
    };
  }

  // string
  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return empty;

    // JSON-string?
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        const obj = JSON.parse(s) as ProjectContentJson;
        if (obj && typeof obj === 'object') return parseProjectContent(obj as any);
      } catch {
        // fallthrough -> treat as html
      }
    }

    // raw html
    return { ...empty, html: s };
  }

  return empty;
}

/**
 * Normalize Project -> UI fields with robust fallbacks
 * IMPORTANT:
 * - Uses your Project interface ONLY (no custom WorkDetail types).
 * - Handles content.description null by falling back to summary then content.html(text).
 */
export function normalizeProjectDetail(p: Project): NormalizedProjectDetail {
  const content = parseProjectContent(p.content);

  const title = (p.title ?? '').trim();
  const category = (p.category ?? '').trim();

  const client = (p.client_name ?? '').trim();

  const startPretty = fmtDateISOToPretty(p.start_date);
  const completePretty = fmtDateISOToPretty(p.complete_date);

  const servicesArr = parseStringArray(p.services ?? null);

  const website = (p.website_url ?? '').trim();

  const toolsArr = parseStringArray(p.techs ?? null);

  const cover = (p.featured_image ?? '').trim() || '/assets/imgs/work/img-background.png';
  const coverAlt = (p.featured_image_alt ?? '').trim() || title;

  const htmlText = content.html ? stripHtml(content.html) : '';

  // Header altı metin: summary > content.description > htmlText
  const summaryTop =
    (p.summary ?? '').trim() || (content.description ?? '').trim() || htmlText || '';

  // Description: content.description > summary > htmlText
  const descriptionText =
    (content.description ?? '').trim() || (p.summary ?? '').trim() || htmlText || '';

  return {
    id: p.id,
    slug: p.slug,
    title,
    category,
    summaryTop,
    descriptionText,
    client,
    startPretty,
    completePretty,
    servicesArr,
    website,
    toolsArr,
    cover,
    coverAlt,
    content,
  };
}

export function normalizeStringArray(input: unknown): string[] {
  if (Array.isArray(input))
    return input.filter((x) => typeof x === 'string' && x.trim()) as string[];
  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return [];
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed))
          return parsed.filter((x) => typeof x === 'string' && x.trim()) as string[];
      } catch {}
    }
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

export function contentToSummary(p: Project): string {
  if (typeof p.summary === 'string' && p.summary.trim()) return p.summary;
  if (p.content && typeof p.content === 'object') {
    const d = (p.content as any).description;
    if (typeof d === 'string' && d.trim()) return d;
  }
  return '';
}

export function slugifyClass(input: unknown): string {
  const s = typeof input === 'string' ? input : '';
  const t = s.trim().toLowerCase();
  if (!t) return 'other';
  // keep ascii safe: ui/ux -> ui-ux, "APP DESIGN" -> app-design
  return (
    t
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-') // spaces, slashes, etc.
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'other'
  );
}

export function localeFromPathname(pathname: string): string {
  // "/de/work" -> "de"
  const seg = pathname.split('?')[0].split('#')[0].split('/').filter(Boolean);
  return seg[0] || 'de';
}
