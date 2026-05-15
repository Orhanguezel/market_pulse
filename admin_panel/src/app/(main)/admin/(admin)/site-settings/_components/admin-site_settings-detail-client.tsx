'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/admin-site_settings-detail-client.tsx
// FINAL — Site Setting Detail (App Router)
// - Locale source: site_settings keys: app_locales + default_locale
// - URL sync: ?locale=xx or ?locale=*
// - NO bootstrap, shadcn/ui
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';

import type { SiteSetting, SettingValue } from '@/integrations/shared';
import {
  useGetSiteSettingAdminByKeyQuery,
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/hooks';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { SiteSettingsForm } from './site-settings-form';
import { AdminJsonEditor } from '@/app/(main)/admin/_components/common/AdminJsonEditor';
import { SeoStructuredForm } from '../tabs/structured/seo-structured-form';

import {
  ContactInfoStructuredForm,
  contactFormToObj,
  contactObjToForm,
  type ContactInfoFormState,
} from '../tabs/structured/contact-info-structured-form';

import {
  SocialsStructuredForm,
  socialsFormToObj,
  socialsObjToForm,
  type SocialsFormState,
} from '../tabs/structured/socials-structured-form';

import {
  CompanyProfileStructuredForm,
  companyFormToObj,
  companyObjToForm,
  type CompanyProfileFormState,
} from '../tabs/structured/company-profile-structured-form';

import {
  UiHeaderStructuredForm,
  uiHeaderFormToObj,
  uiHeaderObjToForm,
  type UiHeaderFormState,
} from '../tabs/structured/ui-header-structured-form';

import {
  BusinessHoursStructuredForm,
  businessHoursFormToObj,
  businessHoursObjToForm,
  type BusinessHoursFormState,
} from '../tabs/structured/business-hours-structured-form';
import { parseMediaUrl } from '@/integrations/shared/common';

/* ----------------------------- helpers (same behavior as /pages) ----------------------------- */

const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

function isSeoKey(key: string) {
  const k = String(key || '')
    .trim()
    .toLowerCase();
  return k === 'seo' || k === 'site_seo' || k === 'site_meta_default';
}

const GENERAL_KEYS = [
  'contact_info',
  'socials',
  'businessHours',
  'company_profile',
  'ui_header',
] as const;
type GeneralKey = (typeof GENERAL_KEYS)[number];

function isGeneralKey(key: string): key is GeneralKey {
  return (GENERAL_KEYS as readonly string[]).includes(String(key || '').trim() as any);
}

function coerceSettingValue(input: any): any {
  if (input === null || input === undefined) return input;
  if (typeof input === 'object') return input;

  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return input;
    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));
    if (!looksJson) return input;
    try {
      return JSON.parse(s);
    } catch {
      return input;
    }
  }

  return input;
}

const MEDIA_OBJECT_KEYS = ['url', 'src', 'image_url', 'image'] as const;
const ROOT_MEDIA_SETTING_KEYS = new Set([
  'site_logo',
  'site_logo_dark',
  'site_logo_light',
  'site_favicon',
  'site_apple_touch_icon',
  'site_app_icon_512',
  'site_og_default_image',
  'site_appointment_cover',
]);

type MediaFieldSpec = {
  label: string;
  path: string[];
  value: string;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isMediaFieldName(name: string): boolean {
  const key = String(name || '').trim().toLowerCase();
  if (!key || key.endsWith('_alt')) return false;
  return (
    key.includes('og_image') ||
    key.includes('cover_image') ||
    key.includes('hero_image') ||
    key.includes('featured_image') ||
    key.includes('decor_image') ||
    key.includes('signature_image') ||
    key.includes('icon_image') ||
    key.endsWith('_image') ||
    key.endsWith('_logo') ||
    key.endsWith('_favicon') ||
    key.endsWith('_icon') ||
    key === 'image' ||
    key === 'logo' ||
    key === 'favicon'
  );
}

function prettifyMediaLabel(path: string[]): string {
  const last = path[path.length - 1] || 'image';
  return last
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function collectMediaFields(settingKey: string, value: unknown): MediaFieldSpec[] {
  const normalizedKey = String(settingKey || '').trim().toLowerCase();
  const out: MediaFieldSpec[] = [];

  if (ROOT_MEDIA_SETTING_KEYS.has(normalizedKey)) {
    out.push({
      label: prettifyMediaLabel([normalizedKey]),
      path: [],
      value: parseMediaUrl(value),
    });
    return out;
  }

  const visit = (node: unknown, path: string[] = [], depth = 0) => {
    if (!isPlainRecord(node) || depth > 3) return;

    for (const [key, child] of Object.entries(node)) {
      const nextPath = [...path, key];
      if (isMediaFieldName(key)) {
        out.push({
          label: prettifyMediaLabel(nextPath),
          path: nextPath,
          value: parseMediaUrl(child),
        });
      }

      if (isPlainRecord(child)) visit(child, nextPath, depth + 1);
    }
  };

  visit(value);

  return out.filter(
    (item, index, arr) =>
      arr.findIndex((candidate) => candidate.path.join('.') === item.path.join('.')) === index,
  );
}

function setNestedValue(current: unknown, path: string[], nextUrl: string): unknown {
  if (!path.length) {
    if (isPlainRecord(current)) {
      for (const key of MEDIA_OBJECT_KEYS) {
        if (key in current) return { ...current, [key]: nextUrl };
      }
    }
    return nextUrl;
  }

  const [head, ...tail] = path;
  const base = isPlainRecord(current) ? current : {};
  const existingChild = base[head];

  if (!tail.length) {
    if (isPlainRecord(existingChild)) {
      for (const key of MEDIA_OBJECT_KEYS) {
        if (key in existingChild) {
          return { ...base, [head]: { ...existingChild, [key]: nextUrl } };
        }
      }
    }

    return { ...base, [head]: nextUrl };
  }

  return {
    ...base,
    [head]: setNestedValue(existingChild, tail, nextUrl),
  };
}

const MediaFieldsEditor: React.FC<{
  settingKey: string;
  value: SettingValue;
  setValue: (next: any) => void;
  disabled?: boolean;
}> = ({ settingKey, value, setValue, disabled }) => {
  const mediaFields = React.useMemo(
    () => collectMediaFields(settingKey, coerceSettingValue(value)),
    [settingKey, value],
  );

  if (!mediaFields.length) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {mediaFields.map((field) => (
        <AdminImageUploadField
          key={field.path.join('.') || settingKey}
          label={field.label}
          helperText={field.path.length ? field.path.join('.') : settingKey}
          bucket="public"
          folder="site-media"
          metadata={{
            module: 'site_settings',
            setting_key: settingKey,
            field: field.path.join('.') || 'root',
          }}
          value={field.value}
          onChange={(url) =>
            setValue((prev: unknown) => setNestedValue(prev ?? coerceSettingValue(value), field.path, url))
          }
          disabled={disabled}
        />
      ))}
    </div>
  );
};

/* ----------------------------- structured renderers ----------------------------- */

type StructuredRenderProps = {
  value: SettingValue;
  setValue: (next: any) => void;
  disabled?: boolean;
  settingKey: string;
  locale: string;
};

const JsonStructuredRenderer: React.FC<StructuredRenderProps> = ({ value, setValue, disabled }) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const v = coerceSettingValue(value ?? {});
  return (
    <div className="space-y-3">
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        {t('admin.siteSettings.detail.structuredJson.noRenderer')}
      </div>

      <AdminJsonEditor
        label={t('admin.siteSettings.detail.structuredJson.label')}
        value={v ?? {}}
        onChange={(next) => setValue(next)}
        disabled={disabled}
        helperText={t('admin.siteSettings.detail.structuredJson.helperText')}
        height={340}
      />
    </div>
  );
};

const SeoStructuredRenderer: React.FC<StructuredRenderProps> = (p) => (
  <SeoStructuredForm
    settingKey={p.settingKey}
    locale={p.locale}
    value={p.value}
    setValue={p.setValue}
    disabled={p.disabled}
  />
);

const ContactStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSettingValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = React.useMemo(
    () => ({ phone: '', email: '', address: '', whatsapp: '' }) as any,
    [],
  );
  const [form, setForm] = React.useState<ContactInfoFormState>(() => contactObjToForm(base, seed));

  React.useEffect(() => setForm(contactObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: ContactInfoFormState) => {
    setForm(next);
    setValue(contactFormToObj(next));
  };

  return (
    <ContactInfoStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const SocialsStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSettingValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = React.useMemo(
    () => ({ instagram: '', facebook: '', linkedin: '', youtube: '', x: '' }) as any,
    [],
  );
  const [form, setForm] = React.useState<SocialsFormState>(() => socialsObjToForm(base, seed));

  React.useEffect(() => setForm(socialsObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: SocialsFormState) => {
    setForm(next);
    setValue(socialsFormToObj(next));
  };

  return (
    <SocialsStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const CompanyStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSettingValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = React.useMemo(
    () => ({ company_name: '', slogan: '', about: '' }) as any,
    [],
  );

  const [form, setForm] = React.useState<CompanyProfileFormState>(() =>
    companyObjToForm(base, seed),
  );
  React.useEffect(() => setForm(companyObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: CompanyProfileFormState) => {
    setForm(next);
    setValue(companyFormToObj(next));
  };

  return (
    <CompanyProfileStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const UiHeaderStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSettingValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = React.useMemo(
    () =>
      ({
        nav_home: 'Home',
        nav_products: 'Products',
        nav_services: 'Services',
        nav_contact: 'Contact',
        cta_label: 'Get Offer',
      }) as any,
    [],
  );

  const [form, setForm] = React.useState<UiHeaderFormState>(() => uiHeaderObjToForm(base, seed));
  React.useEffect(() => setForm(uiHeaderObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: UiHeaderFormState) => {
    setForm(next);
    setValue(uiHeaderFormToObj(next));
  };

  return (
    <UiHeaderStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const BusinessHoursStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSettingValue(value);
    return Array.isArray(v) ? v : [];
  }, [value]);

  const seed = React.useMemo(
    () =>
      [
        { day: 'mon', open: '09:00', close: '18:00', closed: false },
        { day: 'tue', open: '09:00', close: '18:00', closed: false },
        { day: 'wed', open: '09:00', close: '18:00', closed: false },
        { day: 'thu', open: '09:00', close: '18:00', closed: false },
        { day: 'fri', open: '09:00', close: '18:00', closed: false },
        { day: 'sat', open: '10:00', close: '14:00', closed: false },
        { day: 'sun', open: '00:00', close: '00:00', closed: true },
      ] as any,
    [],
  );

  const [form, setForm] = React.useState<BusinessHoursFormState>(() =>
    businessHoursObjToForm(base, seed),
  );
  React.useEffect(() => setForm(businessHoursObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: BusinessHoursFormState) => {
    setForm(next);
    setValue(businessHoursFormToObj(next));
  };

  return (
    <BusinessHoursStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

/* ----------------------------- component ----------------------------- */

export default function SiteSettingsDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const settingKey = React.useMemo(() => String(id || '').trim(), [id]);

  const {
    localeOptions: appLocaleOptions,
    defaultLocaleFromDb,
    loading: isLocalesLoading,
    fetching: isLocalesFetching,
  } = useAdminLocales();

  const localeOptions = React.useMemo(
    () => [{ value: '*', label: t('admin.siteSettings.detail.globalOption') }, ...appLocaleOptions],
    [appLocaleOptions, t],
  );

  const localeFromQuery = React.useMemo(() => {
    const q = sp.get('locale');
    return (q ?? '').trim();
  }, [sp]);

  const initialLocale = React.useMemo(() => {
    const qLocale = localeFromQuery === '*' ? '*' : toShortLocale(localeFromQuery);

    if (qLocale && localeOptions.some((x) => x.value === qLocale)) return qLocale;

    if (defaultLocaleFromDb && localeOptions.some((x) => x.value === defaultLocaleFromDb))
      return defaultLocaleFromDb;

    const firstNonGlobal = localeOptions.find((x) => x.value !== '*');
    return firstNonGlobal?.value || localeOptions?.[0]?.value || '';
  }, [localeFromQuery, localeOptions, defaultLocaleFromDb]);

  const [selectedLocale, setSelectedLocale] = React.useState<string>('');

  // init/repair selectedLocale
  React.useEffect(() => {
    if (!localeOptions.length) return;

    setSelectedLocale((prev) => {
      if (prev && localeOptions.some((x) => x.value === prev)) return prev;
      return initialLocale || '';
    });
  }, [localeOptions, initialLocale]);

  // keep URL in sync
  React.useEffect(() => {
    if (!settingKey || !selectedLocale) return;

    const cur = localeFromQuery === '*' ? '*' : toShortLocale(localeFromQuery);
    if (cur === selectedLocale) return;

    const qs = new URLSearchParams(Array.from(sp.entries()));
    qs.set('locale', selectedLocale);

    router.replace(`/admin/site-settings/${encodeURIComponent(settingKey)}?${qs.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingKey, selectedLocale]);

  // load row for key+locale (same pattern as /pages)
  const listArgs = React.useMemo(() => {
    if (!settingKey || !selectedLocale) return undefined;
    return { keys: [settingKey], locale: selectedLocale, limit: 10, offset: 0 };
  }, [settingKey, selectedLocale]);

  const {
    data: rows,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery(listArgs as any, { skip: !listArgs });

  const rowFromList: SiteSetting | null = React.useMemo(() => {
    const arr = Array.isArray(rows) ? (rows as SiteSetting[]) : [];
    const exact = arr.find(
      (r) => String(r?.key || '') === settingKey && String(r?.locale || '') === selectedLocale,
    );
    if (exact) return exact;

    const byKey = arr.find((r) => String(r?.key || '') === settingKey);
    return byKey || null;
  }, [rows, settingKey, selectedLocale]);

  // fallback-aware single read (shows effective locale row if selected locale doesn't exist)
  const resolvedQ = useGetSiteSettingAdminByKeyQuery(
    { key: settingKey, locale: selectedLocale },
    { skip: !settingKey || !selectedLocale },
  );

  const resolvedRow = (resolvedQ.data ?? null) as any as SiteSetting | null;

  const row: SiteSetting | null = rowFromList ?? resolvedRow;

  const effectiveLocale = React.useMemo(() => {
    const loc = (resolvedRow as any)?.locale;
    return loc === null || loc === undefined ? '' : String(loc).trim();
  }, [resolvedRow]);

  const isFallback =
    !rowFromList && !!resolvedRow && effectiveLocale && effectiveLocale !== selectedLocale;

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const busy =
    isLoading ||
    isFetching ||
    resolvedQ.isLoading ||
    resolvedQ.isFetching ||
    isSaving ||
    isDeleting ||
    isLocalesLoading ||
    isLocalesFetching;

  const handleSave = async (args: { key: string; locale: string; value: SettingValue }) => {
    try {
      if (String(args.key).toLowerCase() === 'site_meta_default' && args.locale === '*') {
        toast.error(t('admin.siteSettings.detail.siteMetaDefaultGlobalGuard'));
        return;
      }
      await updateSetting({ key: args.key, locale: args.locale, value: args.value }).unwrap();
      toast.success(t('admin.siteSettings.detail.updated', { key: args.key, locale: args.locale }));
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || t('admin.siteSettings.messages.error');
      toast.error(msg);
    }
  };

  const handleDelete = async (args: { key: string; locale?: string }) => {
    try {
      await deleteSetting({ key: args.key, locale: args.locale }).unwrap();
      toast.success(
        t('admin.siteSettings.detail.deleted', { key: args.key, locale: args.locale || '' }),
      );
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || t('admin.siteSettings.messages.error');
      toast.error(msg);
    }
  };

  const renderStructured = React.useMemo(() => {
    if (!settingKey) return JsonStructuredRenderer;

    if (isSeoKey(settingKey)) {
      if (String(settingKey).toLowerCase() === 'site_meta_default') return JsonStructuredRenderer;
      return SeoStructuredRenderer;
    }

    if (isGeneralKey(settingKey)) {
      if (settingKey === 'contact_info') return ContactStructuredRenderer;
      if (settingKey === 'socials') return SocialsStructuredRenderer;
      if (settingKey === 'company_profile') return CompanyStructuredRenderer;
      if (settingKey === 'ui_header') return UiHeaderStructuredRenderer;
      if (settingKey === 'businessHours') return BusinessHoursStructuredRenderer;
    }

    return JsonStructuredRenderer;
  }, [settingKey]);

  const backHref = '/admin/site-settings';

  if (!settingKey) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
          <CardHeader className="p-10 text-center">
            <CardTitle className="font-serif text-3xl text-gm-text">{t('admin.siteSettings.detail.keyMissingTitle', null, 'Ayar Anahtarı Eksik')}</CardTitle>
            <CardDescription className="text-gm-muted italic font-serif opacity-70 text-lg mt-2">{t('admin.siteSettings.detail.keyMissingDesc', null, 'Lütfen geçerli bir ayar anahtarı seçin.')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!busy && (!appLocaleOptions || appLocaleOptions.length === 0)) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
          <CardHeader className="p-10 text-center">
            <CardTitle className="font-serif text-3xl text-gm-text">{t('admin.siteSettings.detail.localesMissingTitle', null, 'Dil Seçenekleri Bulunamadı')}</CardTitle>
            <CardDescription className="text-gm-muted italic font-serif opacity-70 text-lg mt-2">
              {t('admin.siteSettings.detail.localesMissingDesc', null, 'Dil listesi boş döndü.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-10">
            <Button asChild variant="outline" className="rounded-full border-gm-border-soft hover:bg-gm-surface/40 h-12 px-8 text-[10px] font-bold tracking-widest uppercase">
              <Link prefetch={false} href={backHref}>
                {t('admin.siteSettings.detail.localesMissingAction', null, 'Listeye Dön')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="rounded-full -ml-3 hover:bg-gm-surface group transition-all"
            >
              <Link prefetch={false} href={backHref}>
                <span className="sr-only">Geri</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left size-4 group-hover:-translate-x-1 transition-transform"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              </Link>
            </Button>
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              {t('admin.siteSettings.title', null, 'Site Ayarları')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text flex items-center gap-3">
            {t('admin.siteSettings.detail.editTitle', null, 'Ayar Detayı')}
            <code className="text-gm-gold bg-gm-gold/10 px-3 py-1 rounded-xl text-2xl border border-gm-gold/20 shadow-sm">{settingKey}</code>
          </h1>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">{t('admin.siteSettings.detail.localeLabel', null, 'Dil Seçimi')}</Label>
            <Select
              value={selectedLocale || ''}
              onValueChange={(v) => setSelectedLocale(v === '*' ? '*' : toShortLocale(v))}
              disabled={busy || !localeOptions.length}
            >
              <SelectTrigger className="w-60 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 text-sm focus:ring-gm-gold/50 transition-all">
                <SelectValue placeholder={t('admin.siteSettings.filters.selectLanguage', null, 'Dil Seçin')} />
              </SelectTrigger>
              <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl shadow-2xl">
                {localeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={busy}
            title={t('admin.common.refresh', null, 'Yenile')}
            className="rounded-full border-gm-border-soft px-6 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-primary/5 shadow-lg backdrop-blur-sm"
          >
            <RefreshCcw className="size-4" />
          </Button>

          {selectedLocale && <Badge variant="outline" className="border-gm-gold/30 bg-gm-gold/5 text-gm-gold px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] h-12">{selectedLocale}</Badge>}
          {busy && <Badge variant="outline" className="border-gm-border-soft bg-gm-surface/40 text-gm-muted px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] h-12">{t('admin.siteSettings.messages.loading', null, 'Yükleniyor...')}</Badge>}
        </div>
      </div>

      {!selectedLocale ? (
        <div className="rounded-[24px] border border-gm-border-soft bg-gm-surface/20 p-6 text-sm text-gm-muted text-center font-serif italic backdrop-blur-sm">
          {t('admin.siteSettings.detail.loadingLocale', null, 'Dil seçeneği yükleniyor...')}
        </div>
      ) : (
        <div className="space-y-6">
          {isFallback ? (
            <div className="rounded-[24px] border border-gm-gold/30 bg-gm-gold/5 p-6 text-sm text-gm-gold font-serif italic backdrop-blur-sm shadow-inner text-center">
              {t('admin.siteSettings.detail.fallbackNotice', {
                selectedLocale,
                effectiveLocale,
              }, `Not: "${selectedLocale}" için özel değer bulunamadı. Şu an "${effectiveLocale}" değeri gösteriliyor.`)}
            </div>
          ) : null}

          {!row && !busy ? (
            <div className="rounded-[24px] border border-gm-border-soft bg-gm-surface/20 p-6 text-sm text-gm-muted font-serif italic backdrop-blur-sm text-center">
              {t('admin.siteSettings.detail.noRecordNotice', { key: settingKey, locale: selectedLocale }, `Kayıt bulunamadı.`)}
            </div>
          ) : null}

          <SiteSettingsForm
            settingKey={settingKey}
            locale={selectedLocale}
            row={
              row
                ? ({
                    ...row,
                    value: coerceSettingValue((row as any).value),
                  } as any)
                : null
            }
            disabled={busy}
            initialMode="structured"
            onSave={handleSave}
            onDelete={async ({ key, locale }) => handleDelete({ key, locale })}
            renderStructured={(ctx) => (
              <div className="space-y-8">
                {React.createElement(renderStructured as any, {
                  value: ctx.value,
                  setValue: ctx.setValue,
                  disabled: ctx.disabled,
                  settingKey,
                  locale: selectedLocale,
                })}

                <MediaFieldsEditor
                  settingKey={settingKey}
                  value={ctx.value}
                  setValue={ctx.setValue}
                  disabled={ctx.disabled}
                />
              </div>
            )}
          />
        </div>
      )}

      <div className="text-[10px] text-gm-muted uppercase tracking-[0.15em] opacity-60 text-center pt-8 border-t border-gm-border-soft/50">
        {t('admin.siteSettings.detail.note', null, 'Not: Değişiklikler genellikle hemen aktif olur.')}
      </div>
    </div>
  );
}
