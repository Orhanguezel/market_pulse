// =============================================================
// FILE: src/integrations/shared/pageCopies.ts
// FINAL — Static page copy (site_settings) normalizers
// =============================================================

import { parseJsonObject, uiText } from './common';

// -----------------------------
// Services Page
// -----------------------------

export type ServicesPageCopy = {
  badge: string;
  title_html: string;
  intro_html: string;
  cta_label: string;
  loading: string;
  error: string;
  empty: string;
  highlight_label: string;
  details_label: string;
};

export function normalizeServicesPageCopy(val: unknown): ServicesPageCopy {
  const o = parseJsonObject(val);

  return {
    badge: uiText(o.badge) || 'My Services',
    title_html:
      uiText(o.title_html) ||
      'Transforming Ideas <span class="text-300">into Intuitive Designs for</span> Engaging User <span class="text-300">Experiences</span>',
    intro_html:
      uiText(o.intro_html) ||
      'With expertise in mobile app and web design, I transform ideas into visually <br /> stunning and user-friendly interfaces that captivate and retain users. <br /> Explore my work and see design in action.',
    cta_label: uiText(o.cta_label) || 'Get a Quote',
    loading: uiText(o.loading) || 'Loading...',
    error: uiText(o.error) || 'Failed to load services.',
    empty: uiText(o.empty) || 'No services found.',
    highlight_label: uiText(o.highlight_label) || 'Highlight',
    details_label: uiText(o.details_label) || 'Details',
  };
}

// -----------------------------
// Work Page
// -----------------------------

export type WorkPageCopy = {
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

export function normalizeWorkPageCopy(val: unknown): WorkPageCopy {
  const o = parseJsonObject(val);

  return {
    badge: uiText(o.badge) || 'Recent Work',
    title_html:
      uiText(o.title_html) ||
      'Explore <span class="text-300">My Latest Work and Discover the</span> Craftsmanship Behind <span class="text-300">Each Design</span>',
    intro_html:
      uiText(o.intro_html) ||
      'Explore my latest work and discover the craftsmanship behind each design: <br />a detailed look into how I bring innovation and creativity to life',
    loading_title: uiText(o.loading_title) || 'Loading...',
    label_client: uiText(o.label_client) || 'Client',
    label_completion_time: uiText(o.label_completion_time) || 'Completion Time',
    label_tools: uiText(o.label_tools) || 'Tools',
    updating: uiText(o.updating) || 'Updating...',
    empty_title: uiText(o.empty_title) || 'No projects found',
    empty_text: uiText(o.empty_text) || 'Please add projects from admin panel.',
  };
}

// -----------------------------
// Pricing Page
// -----------------------------

export type PricingPageCopy = {
  badge: string;
  title_html: string;
  intro_html: string;
  loading: string;
  error: string;
  empty: string;
  cta_default_label: string;
  faq_title: string;
  faq_empty: string;
  faq_error: string;
};

export function normalizePricingPageCopy(val: unknown): PricingPageCopy {
  const o = parseJsonObject(val);

  return {
    badge: uiText(o.badge) || 'My Pricing',
    title_html:
      uiText(o.title_html) || 'Affordable <span class="text-300">Solutions for Every</span> Budget',
    intro_html:
      uiText(o.intro_html) ||
      'Flexible Plans Tailored to Meet Your Unique Needs, Ensuring High-Quality Services <br /> Without Breaking the Bank',
    loading: uiText(o.loading) || 'Loading...',
    error: uiText(o.error) || 'Failed to load pricing/faq data.',
    empty: uiText(o.empty) || 'No pricing plans found.',
    cta_default_label: uiText(o.cta_default_label) || 'Order Now',
    faq_title: uiText(o.faq_title) || 'Common Questions',
    faq_empty: uiText(o.faq_empty) || 'No FAQs found.',
    faq_error: uiText(o.faq_error) || 'Failed to load FAQs.',
  };
}

// -----------------------------
// Blog Page
// -----------------------------

export type BlogPageCopy = {
  badge: string;
  title_html: string;
  intro_html: string;
  loading: string;
  error: string;
  read_time: string;
  default_category: string;
};

export function normalizeBlogPageCopy(val: unknown): BlogPageCopy {
  const o = parseJsonObject(val);

  return {
    badge: uiText(o.badge) || 'Recent blog',
    title_html:
      uiText(o.title_html) ||
      'Explore the <span class="text-dark">insights and trends shaping</span> our industry',
    intro_html:
      uiText(o.intro_html) ||
      'Discover key insights and emerging trends shaping the future of design: a detailed <br /> examination of how these innovations are reshaping our industry',
    loading: uiText(o.loading) || 'Loading...',
    error: uiText(o.error) || 'Failed to load posts.',
    read_time: uiText(o.read_time) || '3 min read',
    default_category: uiText(o.default_category) || 'Blog',
  };
}
