// =============================================================
// FILE: src/lib/i18n/uiDb.ts  (DYNAMIC - NO HARDCODE LOCALES)
// =============================================================
'use client';

import { useMemo } from 'react';
import { useGetSiteSettingByKeyQuery } from '@/integrations/hooks';
import { useResolvedLocale } from './locale';
import { useUIStrings, UI_FALLBACK_EN } from './ui';

/**
 * DB tarafında kullanacağın section key'leri (site_settings.key)
 */
export type UiSectionKey =
  | 'ui_header'
  | 'ui_home'
  | 'ui_footer'
  | 'ui_services'
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
  | 'ui_appointment';

/**
 * UI key listeleri:
 * - Burayı "UI_FALLBACK_EN" içindeki key isimleriyle aynı tut.
 * - UI_KEYS import etmeden burada string[] olarak tanımlarız (TS stabil).
 */
const SECTION_KEYS: Record<UiSectionKey, readonly string[]> = {
  ui_header: [
    'ui_header_nav_home',
    'ui_header_nav_about',
    'ui_header_nav_services',
    'ui_header_nav_product',
    'ui_header_nav_sparepart',
    'ui_header_nav_references',
    'ui_header_nav_library',
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
    'ui_footer_explore',
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

  ui_services: [
    'ui_services_subprefix',
    'ui_services_sublabel',
    'ui_services_title',
    'ui_services_placeholder_title',
    'ui_services_placeholder_summary',
    'ui_services_details_aria',
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
    'ui_about_view_all',
    'ui_about_fallback_title',
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
  ui_appointment: [
    'ui_appointment_page_title',
    'ui_appointment_meta_title',
    'ui_appointment_meta_description',
    'ui_appointment_og_image',
  ],
};

export type UiSectionResult = {
  ui: (key: string, hardFallback?: string) => string;
  raw: Record<string, unknown>;
  locale: string; // ✅ dynamic
};

function unwrapMaybeData(x: any): any {
  if (!x) return x;
  if (typeof x !== 'object' || Array.isArray(x)) return x;

  // common wrappers: { data: ... } or { value: ... }
  if ('data' in x) return (x as any).data;
  if ('value' in x) return (x as any).value;

  return x;
}

function tryParseJsonObject(input: unknown): Record<string, unknown> {
  const x = unwrapMaybeData(input);

  if (!x) return {};

  // already object
  if (typeof x === 'object' && !Array.isArray(x)) return x as Record<string, unknown>;

  // maybe stringified JSON
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

export function useUiSection(section: UiSectionKey, localeOverride?: string): UiSectionResult {
  // ✅ single source of truth
  const locale = useResolvedLocale(localeOverride);

  // 1) section bazlı JSON override (ui_header, ui_footer, ...)
  const { data: uiSetting } = useGetSiteSettingByKeyQuery(section);

  const json = useMemo<Record<string, unknown>>(() => {
    return tryParseJsonObject(uiSetting?.value);
  }, [uiSetting?.value]);

  // 2) tekil key’ler (ui_header_nav_home gibi)
  const keys = SECTION_KEYS[section] ?? [];
  const { t: tInner } = useUIStrings(keys, locale);

  const ui = (key: string, hardFallback = ''): string => {
    const k = String(key || '').trim();
    if (!k) return '';

    // A) section JSON override
    const raw = json[k];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();

    // B) tekil UI key DB
    const fromDb = String(tInner(k) || '').trim();
    if (fromDb && fromDb !== k) return fromDb;

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
