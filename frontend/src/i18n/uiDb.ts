// =============================================================
// FILE: src/lib/i18n/uiDb.ts  (DYNAMIC - NO HARDCODE LOCALES)
// =============================================================
'use client';

import { useMemo } from 'react';
import { useListSiteSettingsQuery } from '@/integrations/rtk/hooks';
import { useResolvedLocale,UI_FALLBACK_EN } from '@/i18n';
import type { SiteSettingRow } from '@/integrations/shared';
import type { TranslatedLabel } from '@/integrations/shared';

/**
 * DB tarafında kullanacağın section key'leri (site_settings.key)
 */
export type UiSectionKey =
  | 'ui_header'
  | 'ui_home'
  | 'ui_footer'
  | 'ui_banner'
  | 'ui_hero'
  | 'ui_contact'
  | 'ui_about'
  | 'ui_about_stats'
  | 'ui_pricing'
  | 'ui_testimonials'
  | 'ui_faq'
  | 'ui_features'
  | 'ui_cta'
  | 'ui_blog'
  | 'ui_dashboard'
  | 'ui_auth'
  | 'ui_newsletter'
  | 'ui_library'
  | 'ui_feedback'
  | 'ui_references'
  | 'ui_news'
  | 'ui_products'
  | 'ui_spareparts'
  | 'ui_faqs'
  | 'ui_team'
  | 'ui_offer'
  | 'ui_catalog'
  | 'ui_errors'
  | 'ui_cookie'
  | 'ui_cookie_policy'
  | 'ui_quality'
  | 'ui_mission'
  | 'ui_vision'
  | 'ui_kvkk'
  | 'ui_mission_vision'
  | 'ui_legal_notice'
  | 'ui_privacy_notice'
  | 'ui_privacy_policy'
  | 'ui_terms'
  | 'ui_common'
  | 'ui_solutions'
  | 'ui_chat';

/**
 * UI key listeleri:
 * - Burayı "UI_FALLBACK_EN" içindeki key isimleriyle aynı tut.
 * - UI_KEYS import etmeden burada string[] olarak tanımlarız (TS stabil).
 */
const SECTION_KEYS: Record<UiSectionKey, readonly string[]> = {
  ui_header: [
    'ui_header_nav_home',
    'ui_header_nav_about',
    'ui_header_nav_blog',
    'ui_header_nav_news',
    'ui_header_nav_contact',
    'ui_header_cta',
    'ui_header_open_menu',
    'ui_header_open_sidebar',
    'ui_header_close',
    'ui_header_language',
    'ui_header_auth',
    'ui_header_register',
    'ui_header_search_placeholder',
    'ui_header_search',
    'ui_header_contact_info',
    'ui_header_call',
    'ui_header_email',
  ],

  ui_home: [
    'ui_home_h1',
    'ui_hero_kicker_prefix',
    'ui_hero_kicker_brand',
    'ui_hero_title_fallback',
    'ui_hero_desc_fallback',
    'ui_hero_cta',
    'ui_hero_prev',
    'ui_hero_next',
  ],

  ui_footer: [
    'ui_footer_tagline',
    'ui_footer_company',
    'ui_footer_about',
    'ui_footer_blog',
    'ui_footer_resources',
    'ui_footer_free_tools',
    'ui_footer_contact_us',
    'ui_footer_services',
    'ui_footer_service_seo',
    'ui_footer_service_ppc',
    'ui_footer_service_smm',
    'ui_footer_service_link_building',
    'ui_footer_service_cro',
    'ui_footer_account',
    'ui_footer_privacy',
    'ui_footer_affiliate',
    'ui_footer_product_design',
    'ui_footer_web_design',
    'ui_footer_contact',
    'ui_footer_phone_aria',
    'ui_footer_email_aria',
    'ui_footer_copyright_prefix',
    'ui_footer_copyright_suffix',
  ],

  ui_banner: ['ui_breadcrumb_home'],

  ui_hero: [
    'ui_hero_kicker_prefix',
    'ui_hero_kicker_brand',
    'ui_hero_title_fallback',
    'ui_hero_desc_fallback',
    'ui_hero_cta',
    'ui_hero_prev',
    'ui_hero_next',
  ],

  ui_contact: [
    'ui_contact_subprefix',
    'ui_contact_sublabel',
    'ui_contact_title_left',
    'ui_contact_tagline',
    'ui_contact_quick_email_placeholder',
    'ui_contact_form_title',
    'ui_contact_first_name',
    'ui_contact_last_name',
    'ui_contact_company',
    'ui_contact_website',
    'ui_contact_phone',
    'ui_contact_email',
    'ui_contact_select_label',
    'ui_contact_service_cooling_towers',
    'ui_contact_service_maintenance',
    'ui_contact_service_modernization',
    'ui_contact_service_other',
    'ui_contact_terms_prefix',
    'ui_contact_terms',
    'ui_contact_conditions',
    'ui_contact_submit',
    'ui_contact_sending',
    'ui_contact_success',
    'ui_contact_error_generic',
  ],

  ui_about: [
    'ui_about_subprefix',
    'ui_about_sublabel',
    'ui_about_page_title',
    'ui_about_page_lead',
    'ui_about_page_description',
    'ui_about_meta_title',
    'ui_about_meta_description',
    'ui_about_og_image',
    'ui_about_view_all',
    'ui_about_read_more',
    'ui_about_fallback_title',
    'ui_about_empty',
    'ui_about_error',
    'ui_about_empty_text',
  ],

  ui_about_stats: [
    'ui_about_stats_refs_title',
    'ui_about_stats_projects_title',
    'ui_about_stats_years_title',
  ],

  ui_pricing: [],

  ui_testimonials: [
    'ui_feedback_subprefix',
    'ui_feedback_sublabel',
    'ui_feedback_title',
    'ui_feedback_paragraph',
    'ui_feedback_prev',
    'ui_feedback_next',
    'ui_feedback_role_customer',
  ],

  ui_faq: [],
  ui_features: [],
  ui_cta: [],

  ui_blog: [
    'ui_blog_page_title',
    'ui_blog_detail_page_title',
    'ui_blog_meta_title',
    'ui_blog_meta_description',
    'ui_blog_og_image',
    'ui_blog_loading',
    'ui_blog_not_found',
    'ui_blog_content_soon',
    'ui_blog_author_fallback',
    'ui_blog_author_role_fallback',
    'ui_blog_highlights_title',
    'ui_blog_tags_title',
    'ui_blog_prev_post',
    'ui_blog_next_post',
    'ui_blog_leave_comment',
    'ui_blog_comment_placeholder',
    'ui_blog_comment_name_placeholder',
    'ui_blog_comment_email_placeholder',
    'ui_blog_comment_submit',
    'ui_blog_filter_all',
  ],

  ui_dashboard: [],

  ui_auth: [
    'ui_auth_title',
    'ui_auth_lead',
    'ui_auth_register_link',
    'ui_auth_email_label',
    'ui_auth_email_placeholder',
    'ui_auth_password_label',
    'ui_auth_password_placeholder',
    'ui_auth_remember_me',
    'ui_auth_submit',
    'ui_auth_loading',
    'ui_auth_or',
    'ui_auth_google_button',
    'ui_auth_google_loading',
    'ui_auth_error_required',
    'ui_auth_error_google_generic',
  ],

  ui_newsletter: [
    'ui_newsletter_title',
    'ui_newsletter_desc',
    'ui_newsletter_cta',
    'ui_newsletter_ok',
    'ui_newsletter_fail',
    'ui_newsletter_placeholder',
    'ui_newsletter_section_aria',
    'ui_newsletter_email_aria',
  ],

  ui_library: [
    'ui_library_subprefix',
    'ui_library_sublabel',
    'ui_library_title_prefix',
    'ui_library_title_mark',
    'ui_library_view_detail',
    'ui_library_view_detail_aria',
    'ui_library_view_all',
    'ui_library_untitled',
    'ui_library_sample_one',
    'ui_library_sample_two',
  ],

  ui_feedback: [
    'ui_feedback_subprefix',
    'ui_feedback_sublabel',
    'ui_feedback_title',
    'ui_feedback_paragraph',
    'ui_feedback_prev',
    'ui_feedback_next',
    'ui_feedback_role_customer',
  ],

  ui_references: [
    'ui_references_subprefix',
    'ui_references_sublabel',
    'ui_references_title',
    'ui_references_view_all',
  ],

  ui_news: [
    'ui_news_subprefix',
    'ui_news_sublabel',
    'ui_news_title_prefix',
    'ui_news_title_mark',
    'ui_news_read_more',
    'ui_news_read_more_aria',
    'ui_news_view_all',
    'ui_news_untitled',
    'ui_news_sample_one',
    'ui_news_sample_two',
  ],

  ui_products: [
    'ui_products_kicker_prefix',
    'ui_products_kicker_label',
    'ui_products_title_prefix',
    'ui_products_title_mark',
    'ui_products_read_more',
    'ui_products_read_more_aria',
    'ui_products_price_label',
    'ui_products_view_all',
    'ui_products_empty',
  ],

  ui_spareparts: [
    'ui_spareparts_kicker_prefix',
    'ui_spareparts_kicker_label',
    'ui_spareparts_title_prefix',
    'ui_spareparts_title_mark',
    'ui_spareparts_read_more',
    'ui_spareparts_read_more_aria',
    'ui_spareparts_price_label',
    'ui_spareparts_view_all',
    'ui_spareparts_empty',
  ],

  ui_faqs: ['ui_faqs_page_title'],
  ui_team: ['ui_team_page_title'],
  ui_offer: ['ui_offer_page_title'],
  ui_catalog: ['ui_catalog_page_title'],

  ui_cookie: [
    'ui_cookie_title',
    'ui_cookie_description',
    'ui_cookie_label_necessary',
    'ui_cookie_desc_necessary',
    'ui_cookie_label_analytics',
    'ui_cookie_desc_analytics',
    'ui_cookie_btn_cancel',
    'ui_cookie_btn_save',
  ],

  ui_errors: [
    'ui_404_title',
    'ui_404_subtitle',
    'ui_404_back_home',
    'ui_500_title',
    'ui_500_subtitle',
    'ui_500_try_again',
    'ui_generic_error',
    'ui_loading',
  ],
  ui_cookie_policy: ['ui_cookie_policy_page_title'],
  ui_quality: ['ui_quality_meta_title', 'ui_quality_meta_description'],
  ui_mission_vision: ['ui_mission_vision_meta_title', 'ui_mission_vision_meta_description'],
  ui_mission: ['ui_mission_page_title', 'ui_mission_meta_title', 'ui_mission_meta_description'],
  ui_vision: ['ui_vision_page_title', 'ui_vision_meta_title', 'ui_vision_meta_description'],
  ui_kvkk: [
    'ui_kvkk_page_title',
    'ui_kvkk_meta_title',
    'ui_kvkk_meta_description',
    'ui_kvkk_empty',
    'ui_kvkk_empty_text',
  ],
  ui_legal_notice: [
    'ui_legal_notice_page_title',
    'ui_legal_notice_meta_title',
    'ui_legal_notice_meta_description',
    'ui_legal_notice_empty',
    'ui_legal_notice_empty_text',
  ],
  ui_privacy_notice: [
    'ui_privacy_notice_page_title',
    'ui_privacy_notice_meta_title',
    'ui_privacy_notice_meta_description',
    'ui_privacy_notice_empty',
    'ui_privacy_notice_empty_text',
  ],
  ui_privacy_policy: [
    'ui_privacy_policy_page_title',
    'ui_privacy_policy_meta_title',
    'ui_privacy_policy_meta_description',
    'ui_privacy_policy_empty',
    'ui_privacy_policy_empty_text',
  ],
  ui_terms: [
    'ui_terms_page_title',
    'ui_terms_meta_title',
    'ui_terms_meta_description',
    'ui_terms_empty',
    'ui_terms_empty_text',
  ],
  ui_common: [
    'ui_common_read_more',
    'ui_common_read_less',
    'ui_common_loading',
    'ui_common_error_generic',
  ],
  ui_solutions: [
    'ui_solutions_page_title',
    'ui_solutions_meta_title',
    'ui_solutions_meta_description',
  ],
  ui_chat: [
    'ui_chat_title',
    'ui_chat_subtitle',
    'ui_chat_placeholder',
    'ui_chat_send',
    'ui_chat_connect_admin',
    'ui_chat_connecting',
    'ui_chat_login_title',
    'ui_chat_login_button',
    'ui_chat_loading',
    'ui_chat_ai_mode',
    'ui_chat_admin_mode',
    'ui_chat_admin_inbox',
    'ui_chat_no_admin_threads',
    'ui_chat_thread_label',
    'ui_chat_queue_pending',
    'ui_chat_queue_mine',
    'ui_chat_queue_all',
    'ui_chat_unread_label',
    'ui_chat_empty',
  ],
};

export type UiSectionResult = {
  ui: (key: string, hardFallback?: string) => string;
  raw: Record<string, unknown>;
  locale: string; // ✅ dynamic
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function unwrapMaybeData(x: any): any {
  if (!x) return x;
  if (typeof x !== 'object' || Array.isArray(x)) return x;
  if ('data' in x) return (x as any).data;
  if ('value' in x) return (x as any).value;
  return x;
}

function tryParseJsonObject(input: unknown): Record<string, unknown> {
  const x = unwrapMaybeData(input);
  if (!x) return {};
  if (typeof x === 'object' && !Array.isArray(x)) return x as Record<string, unknown>;
  if (typeof x === 'string') {
    const s = x.trim();
    if (!s) return {};
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        const j = JSON.parse(s);
        if (j && typeof j === 'object' && !Array.isArray(j)) return j as Record<string, unknown>;
      } catch {
        return {};
      }
    }
  }
  return {};
}

function tryParseJson(x: unknown): unknown {
  if (typeof x !== 'string') return x;
  const s = x.trim();
  if (!s) return x;
  if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
    try {
      return JSON.parse(s);
    } catch {
      return x;
    }
  }
  return x;
}

function normShortLocale(x: unknown): string {
  return String(x || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();
}

type SettingsValueRecord = { label?: TranslatedLabel; [k: string]: unknown };

function normalizeValueToLabel(value: unknown): SettingsValueRecord {
  const v = tryParseJson(value);
  if (typeof v === 'string') return { label: { en: v } as TranslatedLabel };
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const obj = v as any;
    if (obj.label && typeof obj.label === 'object' && !Array.isArray(obj.label)) return obj;
    return { label: obj as TranslatedLabel };
  }
  return {};
}

/* ------------------------------------------------------------------ */
/*  useUiSection — TÜM ui_* key'leri TEK istek ile çeker              */
/*  RTK Query deduplication: tüm section'lar aynı cache'i paylaşır    */
/* ------------------------------------------------------------------ */

export function useUiSection(section: UiSectionKey, localeOverride?: string): UiSectionResult {
  const locale = useResolvedLocale(localeOverride);

  // ✅ TEK istek: GET /site_settings?prefix=ui_&locale=de
  // RTK Query tüm useUiSection çağrılarını deduplicate eder (aynı args).
  const { data: allUiSettings } = useListSiteSettingsQuery(
    locale ? { prefix: 'ui_', locale } : undefined,
  );

  // Hızlı lookup Map (tüm ui_* satırları)
  const allUiMap = useMemo(() => {
    const m = new Map<string, SiteSettingRow>();
    if (allUiSettings) {
      for (const row of allUiSettings) m.set(row.key, row);
    }
    return m;
  }, [allUiSettings]);

  // 1) Section bazlı JSON override (ui_header, ui_footer, ...)
  const json = useMemo<Record<string, unknown>>(() => {
    const row = allUiMap.get(section);
    return row ? tryParseJsonObject(row.value) : {};
  }, [allUiMap, section]);

  // 2) Tekil key'ler (ui_header_nav_home gibi) → label extraction
  const keys = SECTION_KEYS[section] ?? [];
  const keyMap = useMemo(() => {
    const out: Record<string, SettingsValueRecord> = {};
    for (const k of keys) {
      const row = allUiMap.get(k);
      if (row) out[k] = normalizeValueToLabel(row.value);
    }
    return out;
  }, [allUiMap, keys]);

  const ui = (key: string, hardFallback = ''): string => {
    const k = String(key || '').trim();
    if (!k) return '';

    // A) section JSON override
    const raw = json[k];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();

    // B) tekil UI key DB
    const record = keyMap[k];
    if (record) {
      const label = (record.label || {}) as TranslatedLabel;
      const l = normShortLocale(locale);
      const val =
        (l && (label as any)[l]) ||
        (label as any).en ||
        (label as any).tr ||
        (Object.values(label || {})[0] as string) ||
        '';
      const fromDb = (typeof val === 'string' ? val : '').trim();
      if (fromDb && fromDb !== k) return fromDb;
    }

    // C) param hard fallback
    const hf = String(hardFallback || '').trim();
    if (hf) return hf;

    // D) constant EN fallback
    const fromConst = (UI_FALLBACK_EN as any)[k];
    if (typeof fromConst === 'string' && fromConst.trim()) return fromConst.trim();

    // E) key
    return k;
  };

  return { ui, raw: json, locale };
}
