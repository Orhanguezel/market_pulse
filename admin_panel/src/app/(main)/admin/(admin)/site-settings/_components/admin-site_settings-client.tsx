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
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              {t('admin.common.systemConfig', null, 'Sistem Yapılandırması')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('title')}</h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            {t('description')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-full md:w-64 space-y-2">
            <label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">
              {t('admin.common.languageSelect', null, 'Dil Seçimi')}
            </label>
            <Select value={locale} onValueChange={setLocale} disabled={disabled || isGlobalTab}>
              <SelectTrigger className={cn(
                "bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 text-sm focus:ring-gm-gold/50 transition-all",
                isGlobalTab && "opacity-50 grayscale"
              )}>
                <SelectValue placeholder="Dil Seçin" />
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
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">
        {/* Navigation Sidebar */}
        <aside className="space-y-6">
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden p-6 backdrop-blur-sm shadow-xl">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const isActive = tab === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => setTab(item.value as SettingsTab)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group",
                      isActive 
                        ? "bg-gm-gold/10 text-gm-gold shadow-sm border border-gm-gold/20" 
                        : "text-gm-muted hover:bg-gm-surface/40 hover:text-gm-text border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("size-4 transition-colors", isActive ? "text-gm-gold" : "text-gm-muted/70 group-hover:text-gm-text/70")} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="size-3 text-gm-gold" />}
                  </button>
                );
              })}
            </nav>
          </Card>

          <Card className="bg-gm-gold/[0.02] border border-gm-gold/10 rounded-[32px] p-8 text-center space-y-4 backdrop-blur-sm shadow-inner">
            <div className="size-12 rounded-full bg-gm-gold/10 flex items-center justify-center mx-auto text-gm-gold shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <Globe className="size-5" />
            </div>
            <h4 className="font-serif text-lg text-gm-text">{t('admin.common.globalSettings', null, 'Global Ayarlar')}</h4>
            <p className="text-[10px] text-gm-muted leading-relaxed uppercase tracking-[0.15em] opacity-80">
              Bazı ayarlar tüm diller için ortaktır ve "Global" olarak işaretlenmiştir.
            </p>
          </Card>
        </aside>

        {/* Content Area */}
        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[40px] overflow-hidden min-h-[700px] relative backdrop-blur-sm shadow-xl">
          <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none">
            {React.createElement(menuItems.find(m => m.value === tab)?.icon || Settings, {
              className: "w-80 h-80"
            })}
          </div>
          
          <CardHeader className="p-10 border-b border-gm-border-soft bg-gm-surface/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-3xl text-gm-text">
                  {menuItems.find(m => m.value === tab)?.label}
                </CardTitle>
                <CardDescription className="font-serif italic text-lg text-gm-muted opacity-70 mt-2">
                  Yapılandırma detaylarını güncelleyin.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isGlobalTab && (
                  <Badge className="bg-gm-gold text-gm-bg hover:bg-gm-gold px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-gm-gold/20">
                    GLOBAL
                  </Badge>
                )}
                {!isGlobalTab && (
                  <Badge variant="outline" className="border-gm-gold/30 bg-gm-gold/5 text-gm-gold px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em]">
                    {locale}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-10">
            <div className="relative z-10 animate-in fade-in zoom-in-95 duration-500">
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
                      className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm transition-all"
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
