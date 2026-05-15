'use client';

// =============================================================
// FILE: src/components/admin/site-settings/tabs/CloudinarySettingsTab.tsx
// Cloudinary / Storage Ayarları Tab (GLOBAL) – shadcn/ui aligned
// - NO bootstrap classes
// - Uses Card + Label/Input + Buttons + Badge
// - Keeps existing RTK logic (list/update/diag)
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useLazyDiagCloudinaryAdminQuery,
} from '@/integrations/hooks';

import type { SiteSetting } from '@/integrations/shared';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type CloudinarySettingsTabProps = {
  locale: string; // UI badge için dursun
};

const STORAGE_KEYS = [
  'storage_driver',
  'storage_local_root',
  'storage_local_base_url',
  'storage_cdn_public_base',
  'storage_public_api_base',
  'cloudinary_cloud_name',
  'cloudinary_api_key',
  'cloudinary_api_secret',
  'cloudinary_folder',
  'cloudinary_unsigned_preset',
] as const;

type StorageKey = (typeof STORAGE_KEYS)[number];
type StorageForm = Record<StorageKey, string>;

const EMPTY_FORM: StorageForm = {
  storage_driver: '',
  storage_local_root: '',
  storage_local_base_url: '',
  storage_cdn_public_base: '',
  storage_public_api_base: '',
  cloudinary_cloud_name: '',
  cloudinary_api_key: '',
  cloudinary_api_secret: '',
  cloudinary_folder: '',
  cloudinary_unsigned_preset: '',
};

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function toMap(settings?: any) {
  const map = new Map<string, any>();
  if (settings) for (const s of settings) map.set(String(s.key), s);
  return map;
}

function errMsg(err: any, fallback: string): string {
  return (
    err?.data?.error?.message ||
    err?.data?.message ||
    err?.message ||
    fallback
  );
}

export const CloudinarySettingsTab: React.FC<CloudinarySettingsTabProps> = ({ locale }) => {
  const {
    data: settings,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery({
    keys: STORAGE_KEYS as unknown as string[],
    // GLOBAL => locale yok
  });

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const [runDiag, { data: diagResult, isFetching: isTesting, error: diagError }] =
    useLazyDiagCloudinaryAdminQuery();

  const [form, setForm] = React.useState<StorageForm>(EMPTY_FORM);

  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  React.useEffect(() => {
    const map = toMap(settings);
    const next: StorageForm = { ...EMPTY_FORM };
    STORAGE_KEYS.forEach((k) => (next[k] = valueToString(map.get(k)?.value)));
    setForm(next);
  }, [settings]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving || isTesting;

  const handleChange = (field: StorageKey, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (busy) return;

    try {
      for (const key of STORAGE_KEYS) {
        await updateSetting({ key, locale: '*', value: form[key].trim() }).unwrap();
      }
      toast.success(t('admin.siteSettings.cloudinary.saved'));
      await refetch();
    } catch (err: any) {
      toast.error(errMsg(err, t('admin.siteSettings.messages.error')));
    }
  };

  const handleTest = async () => {
    if (busy) return;

    try {
      const res = await runDiag().unwrap();
      if (res?.ok) {
        toast.success(
          t('admin.siteSettings.cloudinary.testSuccess', {
            cloud: res.cloud,
            publicId: res.uploaded?.public_id || ''
          })
        );
      } else {
        toast.error(t('admin.siteSettings.cloudinary.testFailedConsole'));
        // eslint-disable-next-line no-console
        console.error('Cloudinary diag (unexpected response):', res);
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Cloudinary diag error:', err);

      const status = err?.status;
      const data = err?.data as any;

      if (status === 501) {
        const reason = data?.reason;
        if (reason === 'driver_is_local') {
          toast.error(t('admin.siteSettings.cloudinary.testFailedLocal'));
        } else {
          toast.error(t('admin.siteSettings.cloudinary.testFailedConfig'));
        }
        return;
      }

      if (status === 502) {
        const step = data?.step;
        const msg =
          data?.error?.msg ||
          data?.error?.message ||
          data?.message ||
          err?.message ||
          'Cloudinary test failed.';
        toast.error(t('admin.siteSettings.cloudinary.testFailedStep', { step: step || 'unknown', message: msg }));
        return;
      }

      toast.error(
        data?.error?.msg ||
          data?.error?.message ||
          data?.message ||
          err?.message ||
          t('admin.siteSettings.messages.error')
      );
    }
  };

  const lastTestInfo = React.useMemo(() => {
    if (isTesting) return t('admin.siteSettings.cloudinary.testInfoTesting');
    if (diagResult?.ok) return t('admin.siteSettings.cloudinary.testInfoSuccess', { cloud: diagResult.cloud });
    if (diagError) return t('admin.siteSettings.cloudinary.testInfoError');
    return t('admin.siteSettings.cloudinary.testInfo');
  }, [isTesting, diagResult, diagError, t]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{t('admin.siteSettings.cloudinary.title')}</CardTitle>
              <CardDescription>
                {t('admin.siteSettings.cloudinary.description')}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {t('admin.siteSettings.cloudinary.badge', { locale: locale || '—' })}
              </Badge>

              <Button type="button" variant="outline" onClick={() => refetch()} disabled={busy}>
                {t('admin.siteSettings.actions.refresh')}
              </Button>

              {busy ? <Badge variant="outline">{t('admin.siteSettings.messages.loading')}</Badge> : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Form grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="storage_driver">{t('admin.siteSettings.cloudinary.storageDriver')}</Label>
              <Input
                id="storage_driver"
                value={form.storage_driver}
                onChange={(e) => handleChange('storage_driver', e.target.value)}
                placeholder={t('admin.siteSettings.cloudinary.storageDriverPlaceholder')}
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.siteSettings.cloudinary.storageDriverHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage_local_root">{t('admin.siteSettings.cloudinary.localRoot')}</Label>
              <Input
                id="storage_local_root"
                value={form.storage_local_root}
                onChange={(e) => handleChange('storage_local_root', e.target.value)}
                placeholder={t('admin.siteSettings.cloudinary.localRootPlaceholder')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage_local_base_url">{t('admin.siteSettings.cloudinary.localBaseUrl')}</Label>
              <Input
                id="storage_local_base_url"
                value={form.storage_local_base_url}
                onChange={(e) => handleChange('storage_local_base_url', e.target.value)}
                placeholder={t('admin.siteSettings.cloudinary.localBaseUrlPlaceholder')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label htmlFor="storage_cdn_public_base">{t('admin.siteSettings.cloudinary.cdnPublicBase')}</Label>
              <Input
                id="storage_cdn_public_base"
                value={form.storage_cdn_public_base}
                onChange={(e) => handleChange('storage_cdn_public_base', e.target.value)}
                placeholder={t('admin.siteSettings.cloudinary.cdnPublicBasePlaceholder')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-2">
              <Label htmlFor="storage_public_api_base">{t('admin.siteSettings.cloudinary.publicApiBase')}</Label>
              <Input
                id="storage_public_api_base"
                value={form.storage_public_api_base}
                onChange={(e) => handleChange('storage_public_api_base', e.target.value)}
                placeholder={t('admin.siteSettings.cloudinary.publicApiBasePlaceholder')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloudinary_cloud_name">{t('admin.siteSettings.cloudinary.cloudName')}</Label>
              <Input
                id="cloudinary_cloud_name"
                value={form.cloudinary_cloud_name}
                onChange={(e) => handleChange('cloudinary_cloud_name', e.target.value)}
                placeholder={t('admin.siteSettings.cloudinary.cloudNamePlaceholder')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloudinary_api_key">{t('admin.siteSettings.cloudinary.apiKey')}</Label>
              <Input
                id="cloudinary_api_key"
                value={form.cloudinary_api_key}
                onChange={(e) => handleChange('cloudinary_api_key', e.target.value)}
                placeholder={t('admin.siteSettings.cloudinary.apiKeyPlaceholder')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloudinary_api_secret">{t('admin.siteSettings.cloudinary.apiSecret')}</Label>
              <Input
                id="cloudinary_api_secret"
                value={form.cloudinary_api_secret}
                onChange={(e) => handleChange('cloudinary_api_secret', e.target.value)}
                placeholder={t('admin.siteSettings.cloudinary.apiSecretPlaceholder')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2 md:col-span-1 lg:col-span-1">
              <Label htmlFor="cloudinary_folder">{t('admin.siteSettings.cloudinary.folder')}</Label>
              <Input
                id="cloudinary_folder"
                value={form.cloudinary_folder}
                onChange={(e) => handleChange('cloudinary_folder', e.target.value)}
                placeholder={t('admin.siteSettings.cloudinary.folderPlaceholder')}
                disabled={busy}
              />
            </div>

            <div className="space-y-2 md:col-span-1 lg:col-span-2">
              <Label htmlFor="cloudinary_unsigned_preset">{t('admin.siteSettings.cloudinary.unsignedPreset')}</Label>
              <Input
                id="cloudinary_unsigned_preset"
                value={form.cloudinary_unsigned_preset}
                onChange={(e) => handleChange('cloudinary_unsigned_preset', e.target.value)}
                placeholder={t('admin.siteSettings.cloudinary.unsignedPresetPlaceholder')}
                disabled={busy}
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-muted-foreground">{lastTestInfo}</p>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={handleTest}>
                {isTesting ? t('admin.siteSettings.cloudinary.testing') : t('admin.siteSettings.cloudinary.testButton')}
              </Button>

              <Button type="button" variant="default" disabled={busy} onClick={handleSave}>
                {isSaving ? t('admin.siteSettings.actions.saving') : t('admin.siteSettings.actions.save')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

CloudinarySettingsTab.displayName = 'CloudinarySettingsTab';
