// =============================================================
// FILE: src/integrations/shared/review.types.ts
// FINAL — Public Reviews + Testimonials UI helpers in ONE place
// - Component içinde helper yok
// =============================================================

import type { BoolLike } from '@/integrations/shared';
import { parseJsonObject, uiText } from '@/integrations/shared';

// ===============================
// Reviews (Public)
// ===============================

export type ReviewModerationFlags = {
  safe?: boolean;
  flags?: string[];
  matched_patterns?: string[];
  source?: string;
  checked_at?: string;
  [k: string]: unknown;
};

export type ReviewDto = {
  id: string;

  target_type: string;
  target_id: string;

  name: string;
  email: string;
  rating: number;

  is_active: boolean;
  is_approved: boolean;
  is_verified?: boolean;                          // T17-1
  moderation_flags?: ReviewModerationFlags | null; // T17-3/T17-7
  display_order: number;

  likes_count: number;
  dislikes_count: number;
  helpful_count: number;

  /** Kaydın gönderildiği dil */
  submitted_locale: string;

  created_at: string;
  updated_at: string;

  // i18n alanları (coalesced)
  comment: string | null;
  locale_resolved: string | null;

  /** legacy */
  locale?: string | null;

  // Optional FE extras (some backends might return)
  title?: string | null;
  admin_reply?: string | null;
  avatar_url?: string | null;
  logo_url?: string | null;
  profile_href?: string | null;
  role?: string | null;
  company?: string | null;
};

export type ReviewListQueryParams = {
  search?: string;
  approved?: BoolLike;
  active?: BoolLike;
  verified?: BoolLike;       // T17-7 — is_verified=1
  auto_flagged?: BoolLike;   // T17-7 — moderation_flags NOT NULL AND is_approved=0
  has_outcome?: BoolLike;    // T17-7 — review_outcomes.user_response IS NOT NULL
  minRating?: number;
  maxRating?: number;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'display_order' | 'rating' | 'name';
  order?: 'asc' | 'desc';

  // Listeleme locale override
  locale?: string;

  // Target filtreleri
  target_type?: string;
  target_id?: string;
};

export type ReviewCreatePayload = {
  target_type: string;
  target_id: string;

  locale?: string; // yoksa server req.locale/DEFAULT_LOCALE kullanır

  name: string;
  email: string;
  rating: number;
  comment: string;
  title?: string;

  // Testimonials extras (optional)
  role?: string;
  company?: string;
  avatar_url?: string;
  logo_url?: string;
  profile_href?: string;

  is_active?: boolean;
  is_approved?: boolean;
  display_order?: number;
};

export type ReviewUpdatePayload = Partial<ReviewCreatePayload> & {
  admin_reply?: string | null;
};

export type ReviewReactionPayload = {
  type: 'like' | 'dislike';
};

// ===============================
// Testimonials UI (site_settings)
// ===============================

export type TestimonialsSection = {
  headline: string;
  intro_line_1: string; // <br/> bozulmasın diye iki satır
  intro_line_2: string;
  target_type: string;
  bucket: string; // reviews target_id filter

  // (opsiyonel) cta
  cta_label: string;
  cta_href: string;

  loading: string;
  error: string;
  empty: string;

  // decorate images
  man_img: string;
  decorate_img: string;
};

export function normalizeTestimonialsSectionSettingValue(val: unknown): TestimonialsSection {
  const o = parseJsonObject(val);

  const headline = uiText(o.headline) || "Client's Testimonials";

  const intro_line_1 =
    uiText(o.intro_line_1) ||
    'I believe that working hard and trying to learn every day will make me';
  const intro_line_2 = uiText(o.intro_line_2) || 'improve in satisfying my customers.';

  const target_type = uiText((o as any).target_type) || 'testimonial';
  const bucket = uiText(o.bucket) || '11111111-1111-1111-1111-111111111111';

  const cta_label = uiText(o.cta_label);
  const cta_href = uiText(o.cta_href);

  const loading = uiText(o.loading) || 'Loading...';
  const error = uiText(o.error) || 'Failed to load testimonials.';
  const empty = uiText(o.empty) || 'No testimonials yet.';

  const man_img = uiText(o.man_img) || '/assets/imgs/testimonials/testimonials-1/man.png';
  const decorate_img =
    uiText(o.decorate_img) || '/assets/imgs/testimonials/testimonials-1/decorate.png';

  return {
    headline,
    intro_line_1,
    intro_line_2,
    target_type,
    bucket,
    cta_label,
    cta_href,
    loading,
    error,
    empty,
    man_img,
    decorate_img,
  };
}

// ===============================
// Testimonials item mapper (from ReviewDto)
// ===============================

export type TestimonialCard = {
  id: string;

  rating: number; // 0..5
  comment: string;

  name: string;
  meta: string; // " - role, company" (template format)

  avatar: string;
  logo: string;
  href: string;
};

const clampRating = (n: unknown): number => {
  const x = typeof n === 'number' ? n : Number(String(n ?? '0'));
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(5, Math.round(x)));
};

export function mapReviewToTestimonialCard(r: ReviewDto): TestimonialCard {
  const name = uiText(r.name) || '—';
  const role = uiText((r as any).role);
  const company = uiText((r as any).company);
  let metaRaw = uiText((r as any).title);
  if (!metaRaw) metaRaw = [role, company].filter(Boolean).join(', ');
  const meta = metaRaw ? ` - ${metaRaw}` : '';

  const comment = uiText(r.comment) || '…';

  const avatar =
    uiText((r as any).avatar_url) || '/assets/imgs/testimonials/testimonials-1/avatar-1.png';

  const logo = uiText((r as any).logo_url) || '/assets/imgs/testimonials/testimonials-1/logo-1.png';

  const href = uiText((r as any).profile_href) || '#';

  return {
    id: uiText(r.id),
    rating: clampRating(r.rating),
    comment,
    name,
    meta,
    avatar,
    logo,
    href,
  };
}
