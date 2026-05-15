'use client';

// =============================================================
// FILE: site-settings/tabs/branding-settings-tab.tsx
// Admin Panel Branding Ayarları (GLOBAL)
// - Site adı, copyright, html lang, favicon, meta/OG bilgileri
// - ui_admin_config.branding alt-objesi olarak saklanır
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import {
  useGetSiteSettingAdminByKeyQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';

import { DEFAULT_BRANDING, type AdminBrandingConfig } from '@/config/app-config';

type BrandingForm = {
  app_name: string;
  app_copyright: string;
  html_lang: string;
  theme_color: string;
  favicon_16: string;
  favicon_32: string;
  favicon_url: string;
  logo_url: string;
  apple_touch_icon: string;
  admin_login_heading: string;
  admin_login_quote: string;
  admin_login_background_url: string;
  meta_title: string;
  meta_description: string;
  og_url: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_card: string;
};

const EMPTY_FORM: BrandingForm = {
  app_name: '',
  app_copyright: '',
  html_lang: '',
  theme_color: '',
  favicon_16: '',
  favicon_32: '',
  favicon_url: '',
  logo_url: '',
  apple_touch_icon: '',
  admin_login_heading: '',
  admin_login_quote: '',
  admin_login_background_url: '',
  meta_title: '',
  meta_description: '',
  og_url: '',
  og_title: '',
  og_description: '',
  og_image: '',
  twitter_card: '',
};

function brandingToForm(b: AdminBrandingConfig): BrandingForm {
  return {
    app_name: b.app_name || '',
    app_copyright: b.app_copyright || '',
    html_lang: b.html_lang || '',
    theme_color: b.theme_color || '',
    favicon_16: b.favicon_16 || '',
    favicon_32: b.favicon_32 || '',
    favicon_url: b.favicon_url || '',
    logo_url: b.logo_url || '',
    apple_touch_icon: b.apple_touch_icon || '',
    admin_login_heading: b.admin_login_heading || '',
    admin_login_quote: b.admin_login_quote || '',
    admin_login_background_url: b.admin_login_background_url || '',
    meta_title: b.meta?.title || '',
    meta_description: b.meta?.description || '',
    og_url: b.meta?.og_url || '',
    og_title: b.meta?.og_title || '',
    og_description: b.meta?.og_description || '',
    og_image: b.meta?.og_image || '',
    twitter_card: b.meta?.twitter_card || '',
  };
}

function formToBranding(f: BrandingForm): AdminBrandingConfig {
  return {
    app_name: f.app_name.trim(),
    app_copyright: f.app_copyright.trim(),
    html_lang: f.html_lang.trim(),
    theme_color: f.theme_color.trim(),
    favicon_16: f.favicon_16.trim(),
    favicon_32: f.favicon_32.trim(),
    favicon_url: f.favicon_url.trim(),
    logo_url: f.logo_url.trim(),
    apple_touch_icon: f.apple_touch_icon.trim(),
    admin_login_heading: f.admin_login_heading.trim(),
    admin_login_quote: f.admin_login_quote.trim(),
    admin_login_background_url: f.admin_login_background_url.trim(),
    meta: {
      title: f.meta_title.trim(),
      description: f.meta_description.trim(),
      og_url: f.og_url.trim(),
      og_title: f.og_title.trim(),
      og_description: f.og_description.trim(),
      og_image: f.og_image.trim(),
      twitter_card: f.twitter_card.trim(),
    },
  };
}

export const BrandingSettingsTab: React.FC = () => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const {
    data: configRow,
    isLoading,
    isFetching,
    refetch,
  } = useGetSiteSettingAdminByKeyQuery('ui_admin_config');

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const [form, setForm] = React.useState<BrandingForm>(EMPTY_FORM);

  // Parse existing config and extract branding
  const fullConfig = React.useMemo(() => {
    if (!configRow?.value) return null;
    try {
      return typeof configRow.value === 'string' ? JSON.parse(configRow.value) : configRow.value;
    } catch {
      return null;
    }
  }, [configRow]);

  React.useEffect(() => {
    if (!fullConfig) return;
    const branding = fullConfig.branding;
    if (branding) {
      setForm(brandingToForm({ ...DEFAULT_BRANDING, ...branding, meta: { ...DEFAULT_BRANDING.meta, ...branding.meta } }));
    } else {
      setForm(brandingToForm(DEFAULT_BRANDING));
    }
  }, [fullConfig]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving;

  const handleChange = (field: keyof BrandingForm, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    try {
      // Merge branding back into full config
      const newBranding = formToBranding(form);
      const merged = {
        ...(fullConfig || {}),
        branding: newBranding,
      };

      await updateSetting({
        key: 'ui_admin_config',
        value: merged,
        locale: '*',
      }).unwrap();

      toast.success(t('admin.siteSettings.branding.saved'));
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || t('admin.siteSettings.branding.saveError');
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t('admin.siteSettings.branding.title')}</CardTitle>
            <CardDescription>{t('admin.siteSettings.branding.description')}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t('admin.siteSettings.badges.global')}</Badge>
            {busy && <Badge variant="outline">{t('admin.siteSettings.messages.loading')}</Badge>}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={busy}
              title={t('admin.siteSettings.actions.refresh')}
            >
              <RefreshCcw className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Identity */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t('admin.siteSettings.branding.identity')}
          </legend>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="branding_app_name">
                {t('admin.siteSettings.branding.fields.appName')}
              </Label>
              <Input
                id="branding_app_name"
                value={form.app_name}
                onChange={(e) => handleChange('app_name', e.target.value)}
                placeholder="My Admin Panel"
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branding_app_copyright">
                {t('admin.siteSettings.branding.fields.copyright')}
              </Label>
              <Input
                id="branding_app_copyright"
                value={form.app_copyright}
                onChange={(e) => handleChange('app_copyright', e.target.value)}
                placeholder="Company Name"
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branding_html_lang">
                {t('admin.siteSettings.branding.fields.htmlLang')}
              </Label>
              <Input
                id="branding_html_lang"
                value={form.html_lang}
                onChange={(e) => handleChange('html_lang', e.target.value)}
                placeholder="de"
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.siteSettings.branding.fields.htmlLangHelp')}
              </p>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t('admin.siteSettings.branding.adminLogin')}
          </legend>
          <p className="text-xs text-muted-foreground">
            {t('admin.siteSettings.branding.adminLoginHelp')}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="branding_admin_login_heading">
                {t('admin.siteSettings.branding.fields.adminLoginHeading')}
              </Label>
              <Input
                id="branding_admin_login_heading"
                value={form.admin_login_heading}
                onChange={(e) => handleChange('admin_login_heading', e.target.value)}
                placeholder={t('admin.siteSettings.branding.placeholders.adminLoginHeading')}
                disabled={busy}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="branding_admin_login_quote">
                {t('admin.siteSettings.branding.fields.adminLoginQuote')}
              </Label>
              <Textarea
                id="branding_admin_login_quote"
                rows={3}
                value={form.admin_login_quote}
                onChange={(e) => handleChange('admin_login_quote', e.target.value)}
                placeholder={t('admin.siteSettings.branding.placeholders.adminLoginQuote')}
                disabled={busy}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <AdminImageUploadField
                label={t('admin.siteSettings.branding.fields.adminLoginBackground')}
                value={form.admin_login_background_url}
                onChange={(url) => handleChange('admin_login_background_url', url)}
                disabled={busy}
                previewAspect="16x9"
                previewObjectFit="cover"
                metadata={{ tag: 'admin_login_background' }}
              />
            </div>
          </div>
        </fieldset>

        {/* Visual */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t('admin.siteSettings.branding.visual')}
          </legend>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branding_theme_color">
                {t('admin.siteSettings.branding.fields.themeColor')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="branding_theme_color"
                  value={form.theme_color}
                  onChange={(e) => handleChange('theme_color', e.target.value)}
                  placeholder="#FDFCFB"
                  disabled={busy}
                  className="flex-1"
                />
                {form.theme_color && (
                  <div
                    className="size-9 shrink-0 rounded-md border"
                    style={{ backgroundColor: form.theme_color }}
                  />
                )}
              </div>
            </div>

            <AdminImageUploadField
              label={t('admin.siteSettings.branding.fields.ogImage')}
              value={form.og_image}
              onChange={(url) => handleChange('og_image', url)}
              disabled={busy}
              previewAspect="16x9"
              previewObjectFit="cover"
              metadata={{ tag: 'branding_og_image' }}
            />

            <AdminImageUploadField
              label={t('admin.siteSettings.branding.fields.favicon16')}
              value={form.favicon_16}
              onChange={(url) => handleChange('favicon_16', url)}
              disabled={busy}
              previewAspect="1x1"
              previewObjectFit="contain"
              metadata={{ tag: 'branding_favicon' }}
            />

            <AdminImageUploadField
              label={t('admin.siteSettings.branding.fields.favicon32')}
              value={form.favicon_32}
              onChange={(url) => handleChange('favicon_32', url)}
              disabled={busy}
              previewAspect="1x1"
              previewObjectFit="contain"
              metadata={{ tag: 'branding_favicon' }}
            />

            <AdminImageUploadField
              label={t('admin.siteSettings.branding.fields.faviconUrl') || 'Favicon'}
              value={form.favicon_url}
              onChange={(url) => handleChange('favicon_url', url)}
              disabled={busy}
              previewAspect="1x1"
              previewObjectFit="contain"
              metadata={{ tag: 'branding_favicon' }}
            />

            <AdminImageUploadField
              label={t('admin.siteSettings.branding.fields.logoUrl') || 'Logo'}
              value={form.logo_url}
              onChange={(url) => handleChange('logo_url', url)}
              disabled={busy}
              previewAspect="1x1"
              previewObjectFit="contain"
              metadata={{ tag: 'branding_logo' }}
            />

            <AdminImageUploadField
              label={t('admin.siteSettings.branding.fields.appleTouchIcon')}
              value={form.apple_touch_icon}
              onChange={(url) => handleChange('apple_touch_icon', url)}
              disabled={busy}
              previewAspect="1x1"
              previewObjectFit="contain"
              metadata={{ tag: 'branding_apple_touch_icon' }}
            />
          </div>
        </fieldset>

        {/* Meta / SEO */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t('admin.siteSettings.branding.metaSeo')}
          </legend>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branding_meta_title">
                {t('admin.siteSettings.branding.fields.metaTitle')}
              </Label>
              <Input
                id="branding_meta_title"
                value={form.meta_title}
                onChange={(e) => handleChange('meta_title', e.target.value)}
                placeholder="Site Title"
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branding_og_url">
                {t('admin.siteSettings.branding.fields.ogUrl')}
              </Label>
              <Input
                id="branding_og_url"
                value={form.og_url}
                onChange={(e) => handleChange('og_url', e.target.value)}
                placeholder="https://example.com/"
                disabled={busy}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branding_meta_description">
              {t('admin.siteSettings.branding.fields.metaDescription')}
            </Label>
            <Textarea
              id="branding_meta_description"
              rows={3}
              value={form.meta_description}
              onChange={(e) => handleChange('meta_description', e.target.value)}
              placeholder="Site description..."
              disabled={busy}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branding_og_title">
                {t('admin.siteSettings.branding.fields.ogTitle')}
              </Label>
              <Input
                id="branding_og_title"
                value={form.og_title}
                onChange={(e) => handleChange('og_title', e.target.value)}
                placeholder="OG Title"
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branding_twitter_card">
                {t('admin.siteSettings.branding.fields.twitterCard')}
              </Label>
              <Input
                id="branding_twitter_card"
                value={form.twitter_card}
                onChange={(e) => handleChange('twitter_card', e.target.value)}
                placeholder="summary_large_image"
                disabled={busy}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branding_og_description">
              {t('admin.siteSettings.branding.fields.ogDescription')}
            </Label>
            <Textarea
              id="branding_og_description"
              rows={3}
              value={form.og_description}
              onChange={(e) => handleChange('og_description', e.target.value)}
              placeholder="OG Description..."
              disabled={busy}
            />
          </div>
        </fieldset>

        {/* Save */}
        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={busy}>
            {isSaving ? t('admin.siteSettings.actions.saving') : t('admin.siteSettings.actions.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
