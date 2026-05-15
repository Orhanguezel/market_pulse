// =============================================================
// FILE: src/integrations/types/site_settings.types.ts
// – minimal site_settings tipleri (single source of truth)
// =============================================================

export type ValueType = 'string' | 'number' | 'boolean' | 'json';

/**
 * Backend’den gelen value tipi (JSON parse edilmiş varsayılır)
 * - string | number | boolean | object | array | null
 */
export type SettingValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | Array<unknown>
  | null;

/** site_settings tablosu için kanonik satır tipi */
export type SiteSettingRow = {
  id?: string;
  key: string;
  locale?: string; // backend bazı uçlarda locale döndürür
  value: SettingValue;
  created_at?: string;
  updated_at?: string;
};

/**
 * Backward-compat aliases:
 * Bazı sayfalar "SiteSetting" adını bekliyor.
 */
export type SiteSetting = SiteSettingRow;

/**
 * /site_settings/app-locales ve /site-settings/app-locales
 */
export type AppLocaleMeta = {
  code: string;
  label?: string;
  is_default?: boolean;
  is_active?: boolean;
};

/**
 * Backward-compat aliases:
 * Bazı yerlerde "AppLocaleItem" adı kullanılıyor.
 */
export type AppLocaleItem = AppLocaleMeta;

/**
 * /site_settings/default-locale ve /site-settings/default-locale
 */
export type DefaultLocaleMeta = string | null;

/* -------------------------------------------------------------
 * Eğer Topbar / EmailTemplate hâlâ projede kullanılıyorsa kalsın.
 * ------------------------------------------------------------- */

export type TopbarSettingRow = {
  id: string;
  is_active: boolean | 0 | 1;
  message: string;
  coupon_code?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};

export type EmailTemplateRow = {
  id: string;
  template_key: string;
  template_name: string;
  subject: string;
  content: string; // HTML
  variables: string[];
  is_active: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};

/* ------------------------------------------------------------------
 * Query params (endpoint args)
 * ------------------------------------------------------------------ */

export type SiteSettingsListArgs = {
  prefix?: string;
  locale?: string;
  keys?: string[];
  key?: string;
  order?: string;
  limit?: number | string;
  offset?: number | string;
};

export type SiteSettingByKeyArgs = {
  key: string;
  locale?: string;
};

/* ------------------------------------------------------------------
 * Helpers / Normalizers
 * ------------------------------------------------------------------ */

/** Backend value string ise JSON/boolean/number parse et */
export function tryParseSettingValue(x: unknown): SettingValue {
  if (typeof x === 'string') {
    const s = x.trim();
    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
      try {
        return JSON.parse(s) as SettingValue;
      } catch {
        /* ignore */
      }
    }
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (s !== '' && !Number.isNaN(Number(s))) return Number(s);
  }
  return x as SettingValue;
}

/** Backend row'unu SiteSettingRow'a dönüştür */
export function mapRowToSetting(r: unknown): SiteSettingRow | null {
  if (!r || typeof r !== 'object') return null;
  const o = r as any;
  const key = String(o.key ?? '').trim();
  if (!key) return null;
  return {
    id: o.id,
    key,
    locale: typeof o.locale === 'string' ? o.locale : undefined,
    value: tryParseSettingValue(o.value),
    created_at: typeof o.created_at === 'string' ? o.created_at : undefined,
    updated_at: typeof o.updated_at === 'string' ? o.updated_at : undefined,
  };
}

/** /site_settings/app-locales cevabını parse et */
export function parseAppLocalesMeta(res: unknown): AppLocaleMeta[] {
  if (!Array.isArray(res)) return [];
  return (res as any[])
    .map((x) => {
      if (!x) return null;
      const code = String(x.code ?? x.value ?? '').trim();
      if (!code) return null;
      const label = typeof x.label === 'string' ? x.label.trim() : undefined;
      const is_default = x.is_default === true;
      const is_active = x.is_active !== false;
      return { code, label, is_default, is_active } as AppLocaleMeta;
    })
    .filter(Boolean) as AppLocaleMeta[];
}
