'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { 
  Search, 
  Settings, 
  Globe, 
  ShieldCheck, 
  Palette, 
  Code, 
  Mail, 
  Sliders, 
  Database, 
  ChevronRight
} from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { SiteSettingsList } from './site-settings-list';

// tabs (content sources)
import { GeneralSettingsTab } from '../tabs/general-settings-tab';
import { SeoSettingsTab } from '../tabs/seo-settings-tab';
import { SmtpSettingsTab } from '../tabs/smtp-settings-tab';
import { CloudinarySettingsTab } from '../tabs/cloudinary-settings-tab';
import { BrandMediaTab } from '../tabs/brand-media-tab';
import { ApiSettingsTab } from '../tabs/api-settings-tab';
import { LocalesSettingsTab } from '../tabs/locales-settings-tab';
import { BrandingSettingsTab } from '../tabs/branding-settings-tab';
import { BrandColorsTab } from '../tabs/brand-colors-tab';
import { DesignTokensTab } from '../tabs/design-tokens-tab';
import { CustomCssTab } from '../tabs/custom-css-tab';

import type { SiteSetting } from '@/integrations/shared';
import {
  useGetAppLocalesAdminQuery,
  useGetDefaultLocaleAdminQuery,
  useListSiteSettingsAdminQuery,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/hooks';

type SettingsTab =
  | 'list'
  | 'global_list'
  | 'general'
  | 'seo'
  | 'smtp'
  | 'cloudinary'
  | 'brand_media'
  | 'api'
  | 'locales'
  | 'branding'
  | 'brand_colors'
  | 'design_tokens'
  | 'custom_css';

function ListPanel({
  locale,
  search,
  onDeleteRow,
}: {
  locale: string;
  search: string;
  onDeleteRow: (row: SiteSetting) => void;
}) {
  const qArgs = React.useMemo(() => ({
    locale,
    q: search.trim() || undefined,
    sort: 'key' as const,
    order: 'asc' as const,
    limit: 200,
    offset: 0,
  }), [locale, search]);

  const listQ = useListSiteSettingsAdminQuery(qArgs, { skip: !locale, refetchOnMountOrArgChange: true });
  const loading = listQ.isLoading || listQ.isFetching;

  return (
    <SiteSettingsList
      settings={(listQ.data ?? []) as SiteSetting[]}
      loading={loading}
      selectedLocale={locale}
      onDelete={onDeleteRow}
      getEditHref={(s) => `/admin/site-settings/${encodeURIComponent(String(s.key || ''))}?locale=${encodeURIComponent(locale)}`}
    />
  );
}

export default function AdminSiteSettingsClient() {
  const t = useAdminT('admin.siteSettings');
  const localesQ = useGetAppLocalesAdminQuery();
  const defaultLocaleQ = useGetDefaultLocaleAdminQuery();

  const [tab, setTab] = React.useState<SettingsTab>('design_tokens');
  const [search, setSearch] = React.useState('');
  const [locale, setLocale] = React.useState<string>('tr');

  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const disabled = localesQ.isFetching || defaultLocaleQ.isFetching || isDeleting;

  const localeOptions = React.useMemo(() => {
    const items = Array.isArray(localesQ.data) ? localesQ.data : [];
    return items.map((x: any) => ({
      value: String(x.code),
      label: x.label ? `${x.label} (${x.code})` : x.code,
      isDefault: x.is_default === true,
      isActive: x.is_active !== false,
    }));
  }, [localesQ.data]);

  const handleDeleteRow = async (row: SiteSetting) => {
    const key = String(row?.key || '').trim();
    if (!key) return;
    if (!window.confirm(t('messages.deleteConfirm', { key }))) return;
    try {
      await deleteSetting({ key, locale: row.locale ?? undefined }).unwrap();
      toast.success(t('messages.deleted'));
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const isGlobalTab = ['global_list', 'smtp', 'brand_media', 'locales', 'branding', 'brand_colors', 'design_tokens', 'custom_css'].includes(tab);

  const menuItems = [
    { value: 'design_tokens', label: t('tabs.design_tokens', null, 'Tasarım Tokenları'), icon: Palette },
    { value: 'branding', label: t('tabs.branding', null, 'Marka & Kimlik'), icon: ShieldCheck },
    { value: 'brand_colors', label: t('tabs.brand_colors', null, 'Marka Renkleri'), icon: Palette },
    { value: 'general', label: t('tabs.general', null, 'Genel Ayarlar'), icon: Settings },
    { value: 'seo', label: t('tabs.seo', null, 'SEO & Meta'), icon: Globe },
    { value: 'api', label: t('tabs.api', null, 'API & Entegrasyon'), icon: Sliders },
    { value: 'smtp', label: t('tabs.smtp', null, 'E-posta (SMTP)'), icon: Mail },
    { value: 'custom_css', label: t('tabs.custom_css', null, 'Özel CSS'), icon: Code },
    { value: 'list', label: t('tabs.list', null, 'Tüm Kayıtlar'), icon: Database },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="border-b border-gm-border-soft pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-gm-muted">
              {t('admin.common.systemConfig', null, 'Sistem Yapılandırması')}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gm-text">{t('title')}</h1>
            <p className="max-w-3xl text-sm leading-6 text-gm-muted">
              {t('description')}
            </p>
          </div>

          <div className="w-full space-y-1.5 lg:w-72">
            <label className="text-xs font-medium text-gm-muted">
              {t('admin.common.languageSelect', null, 'Dil Seçimi')}
            </label>
            <Select value={locale} onValueChange={setLocale} disabled={disabled || isGlobalTab}>
              <SelectTrigger className={cn(
                "h-10 rounded-md border-gm-border-soft bg-gm-surface/20 text-sm focus:ring-1 focus:ring-gm-primary/40",
                isGlobalTab && "opacity-60"
              )}>
                <SelectValue placeholder="Dil Seçin" />
              </SelectTrigger>
              <SelectContent className="rounded-md border-gm-border-soft bg-gm-bg-deep shadow-lg">
                {localeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="rounded-sm">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <Card className="overflow-hidden rounded-md border-gm-border-soft bg-gm-surface/10 shadow-none">
            <nav className="p-2">
              {menuItems.map((item) => {
                const isActive = tab === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => setTab(item.value as SettingsTab)}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors",
                      isActive 
                        ? "border-gm-border-soft bg-gm-surface/40 text-gm-text" 
                        : "border-transparent text-gm-muted hover:bg-gm-surface/20 hover:text-gm-text"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("size-4", isActive ? "text-gm-text" : "text-gm-muted")} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="size-4 text-gm-muted" />}
                  </button>
                );
              })}
            </nav>
          </Card>

          <Card className="rounded-md border-gm-border-soft bg-gm-surface/10 shadow-none">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gm-text">
                <Globe className="size-4 text-gm-muted" />
                {t('admin.common.globalSettings', null, 'Global Ayarlar')}
              </div>
              <p className="text-xs leading-5 text-gm-muted">
              Bazı ayarlar tüm diller için ortaktır ve "Global" olarak işaretlenmiştir.
            </p>
            </CardContent>
          </Card>
        </aside>

        <Card className="min-h-[700px] overflow-hidden rounded-md border-gm-border-soft bg-gm-surface/10 shadow-none">
          <CardHeader className="border-b border-gm-border-soft bg-gm-surface/20 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-gm-text">
                  {menuItems.find(m => m.value === tab)?.label}
                </CardTitle>
                <CardDescription className="text-sm text-gm-muted">
                  Yapılandırma detaylarını güncelleyin.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isGlobalTab && (
                  <Badge className="rounded-md bg-gm-surface text-gm-text hover:bg-gm-surface px-3 py-1 text-xs font-medium">
                    GLOBAL
                  </Badge>
                )}
                {!isGlobalTab && (
                  <Badge variant="outline" className="rounded-md border-gm-border-soft bg-gm-surface/10 px-3 py-1 text-xs font-medium text-gm-text">
                    {locale}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="animate-in fade-in duration-300">
              {tab === 'design_tokens' && <DesignTokensTab />}
              {tab === 'branding' && <BrandingSettingsTab />}
              {tab === 'brand_colors' && <BrandColorsTab />}
              {tab === 'general' && <GeneralSettingsTab locale={locale} />}
              {tab === 'seo' && <SeoSettingsTab locale={locale} />}
              {tab === 'api' && <ApiSettingsTab locale={locale} />}
              {tab === 'smtp' && <SmtpSettingsTab locale={locale} />}
              {tab === 'custom_css' && <CustomCssTab />}
              {tab === 'list' && (
                <div className="space-y-8">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
                    <Input 
                      placeholder={t('admin.common.searchPlaceholder', null, 'Ayar anahtarı ara...')}
                      value={search} 
                      onChange={e => setSearch(e.target.value)} 
                      className="h-10 rounded-md border-gm-border-soft bg-gm-surface/20 pl-10 text-sm focus:ring-1 focus:ring-gm-primary/40"
                    />
                  </div>
                  <ListPanel locale={locale} search={search} onDeleteRow={handleDeleteRow} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
