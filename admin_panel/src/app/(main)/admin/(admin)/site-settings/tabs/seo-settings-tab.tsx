// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/tabs/seo-settings-tab.tsx
// SEO Ayarları — Sayfa-bazlı inline düzenleme + canlı önizleme
// Bereketfide pattern (sade kart-liste + collapsible + SERP/OG preview)
// =============================================================

'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { cn } from '@/lib/utils';
import {
  useGetSiteSettingAdminByKeyQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';
import { getDefaultSiteNameForSeo, getPublicSiteHostname } from '@/lib/admin-brand';

const PAGE_KEYS = [
  { key: 'home',    path: '/' },
  { key: 'about',   path: '/about' },
  { key: 'contact', path: '/contact' },
] as const;

type PageSeo = {
  title: string;
  description: string;
  og_image: string;
  no_index: boolean;
};

function coerce(v: any): any {
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

function extractPages(raw: any): Record<string, PageSeo> {
  const obj = coerce(raw?.value ?? raw) ?? {};
  const result: Record<string, PageSeo> = {};
  for (const cfg of PAGE_KEYS) {
    const p = obj[cfg.key];
    result[cfg.key] = {
      title: String(p?.title ?? ''),
      description: String(p?.description ?? ''),
      og_image: String(p?.og_image ?? ''),
      no_index: Boolean(p?.no_index),
    };
  }
  return result;
}

export type SeoSettingsTabProps = {
  locale: string;
  settingPrefix?: string;
};

export const SeoSettingsTab: React.FC<SeoSettingsTabProps> = ({ locale, settingPrefix }) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const fullKey = `${settingPrefix || ''}seo_pages`;

  const { data, isLoading, isFetching, refetch } = useGetSiteSettingAdminByKeyQuery(
    { key: fullKey, locale },
    { refetchOnMountOrArgChange: true },
  );

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const busy = isLoading || isFetching || isSaving;

  const previewDomain = useMemo(() => getPublicSiteHostname(), []);
  const defaultSiteLabel = useMemo(() => getDefaultSiteNameForSeo(), []);

  const serverPages = useMemo(() => extractPages(data), [data]);
  const [localPages, setLocalPages] = useState<Record<string, PageSeo> | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['home']));

  React.useEffect(() => {
    if (data) setLocalPages(extractPages(data));
  }, [data]);

  const pages = localPages ?? serverPages;

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => setExpandedKeys(new Set(PAGE_KEYS.map((c) => c.key)));
  const collapseAll = () => setExpandedKeys(new Set());

  const updatePage = (key: string, patch: Partial<PageSeo>) => {
    setLocalPages((prev) => {
      const base = prev ?? serverPages;
      return { ...base, [key]: { ...base[key], ...patch } };
    });
  };

  const handleSave = async () => {
    if (!localPages) return;
    try {
      await updateSetting({ key: fullKey, locale, value: localPages as any }).unwrap();
      toast.success(t('admin.siteSettings.seo.inline.saved', {}, 'SEO ayarları kaydedildi'));
      await refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || t('admin.siteSettings.seo.inline.saveError', {}, 'Kayıt hatası'));
    }
  };

  const isDirty = localPages && JSON.stringify(localPages) !== JSON.stringify(serverPages);

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="bg-gm-surface/40 p-8 border-b border-gm-border-soft gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="font-serif text-2xl text-gm-text">
              {t('admin.siteSettings.seo.inline.title', null, 'SEO Ayarları')}
            </CardTitle>
            <CardDescription className="text-gm-muted font-serif italic opacity-80">
              {t(
                'admin.siteSettings.seo.inline.description',
                null,
                'Her sayfa için title, description, OG görseli ve indexleme ayarı.'
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-gm-gold/30 bg-gm-gold/5 text-gm-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]">
              {locale}
            </Badge>
            {isDirty && (
              <Badge variant="outline" className="border-gm-warning/30 bg-gm-warning/10 text-gm-warning px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm animate-pulse">
                {t('admin.siteSettings.seo.inline.dirty', null, 'Kaydedilmedi')}
              </Badge>
            )}
            <Button 
              type="button" 
              onClick={handleSave} 
              disabled={busy || !isDirty}
              className="rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-light h-10 px-6 text-[10px] font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] disabled:opacity-50 disabled:shadow-none ml-2"
            >
              <Save className="mr-2 size-4" />
              {t('admin.siteSettings.seo.inline.save', null, 'Kaydet')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        {busy && !localPages && (
          <div className="flex justify-center py-10 opacity-50 animate-pulse">
            <Badge variant="outline" className="border-gm-border-soft bg-gm-surface text-gm-muted px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em]">
              {t('admin.siteSettings.seo.inline.loading', null, 'Yükleniyor...')}
            </Badge>
          </div>
        )}

        <div className="flex gap-3 pb-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={expandAll}
            className="rounded-full border-gm-border-soft hover:bg-gm-surface/40 hover:text-gm-text h-10 px-5 text-[10px] font-bold tracking-widest uppercase transition-all"
          >
            <ChevronDown className="mr-2 size-3.5" />
            {t('admin.siteSettings.seo.inline.expandAll', null, 'Tümünü Aç')}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={collapseAll}
            className="rounded-full border-gm-border-soft hover:bg-gm-surface/40 hover:text-gm-text h-10 px-5 text-[10px] font-bold tracking-widest uppercase transition-all"
          >
            <ChevronUp className="mr-2 size-3.5" />
            {t('admin.siteSettings.seo.inline.collapseAll', null, 'Tümünü Kapat')}
          </Button>
        </div>

        <div className="space-y-4">
          {PAGE_KEYS.map((cfg) => {
            const page = pages[cfg.key] || { title: '', description: '', og_image: '', no_index: false };
            const isExpanded = expandedKeys.has(cfg.key);
            const pageLabel = t(`admin.siteSettings.seo.pageLabels.${cfg.key}`, null, cfg.key);

            return (
              <div key={cfg.key} className={cn(
                "rounded-[24px] border transition-all duration-300 overflow-hidden",
                isExpanded ? "border-gm-gold/30 bg-gm-surface/30 shadow-lg" : "border-gm-border-soft bg-gm-surface/10 hover:bg-gm-surface/20"
              )}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-5 text-left focus:outline-none"
                  onClick={() => toggleExpand(cfg.key)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex items-center justify-center size-10 rounded-full transition-colors",
                      isExpanded ? "bg-gm-gold/10 text-gm-gold border border-gm-gold/20" : "bg-gm-surface/40 text-gm-muted border border-gm-border-soft"
                    )}>
                      <Globe className="size-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "font-serif text-lg transition-colors",
                          isExpanded ? "text-gm-gold" : "text-gm-text"
                        )}>{pageLabel}</span>
                        <code className="text-[10px] text-gm-muted/70 font-mono tracking-wide bg-gm-bg-deep px-2 py-0.5 rounded-lg border border-gm-border-soft/50">{cfg.path}</code>
                        {page.no_index && (
                          <Badge variant="outline" className="border-gm-error/30 bg-gm-error/10 text-gm-error px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]">
                            noindex
                          </Badge>
                        )}
                      </div>
                      {!isExpanded && page.title && (
                        <p className="mt-1.5 text-xs text-gm-muted truncate max-w-xl font-serif italic opacity-80">
                          {page.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center justify-center size-8 rounded-full transition-colors",
                    isExpanded ? "bg-gm-gold/10" : "bg-gm-surface/40 hover:bg-gm-gold/10"
                  )}>
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-gm-gold" />
                    ) : (
                      <ChevronDown className="size-4 text-gm-muted transition-colors" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gm-border-soft p-6 bg-gm-bg-deep/30">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
                      {/* Sol: Form */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                            {t('admin.siteSettings.seo.inline.fieldTitle', null, 'Başlık (title)')}
                          </Label>
                          <Input
                            value={page.title}
                            onChange={(e) => updatePage(cfg.key, { title: e.target.value })}
                            disabled={busy}
                            className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-serif text-gm-text transition-all"
                            placeholder={t(
                              'admin.siteSettings.seo.inline.placeholderTitle',
                              null,
                              `${defaultSiteLabel} — ...`
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between ml-1">
                            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase">
                              {t('admin.siteSettings.seo.inline.fieldDescription', null, 'Açıklama (description)')}
                            </Label>
                            <span className={cn(
                              "text-[10px] font-mono",
                              page.description.length > 160 ? "text-gm-warning" : "text-gm-muted/60"
                            )}>
                              {page.description.length} / 160
                            </span>
                          </div>
                          <Textarea
                            value={page.description}
                            onChange={(e) => updatePage(cfg.key, { description: e.target.value })}
                            disabled={busy}
                            rows={3}
                            className="text-sm bg-gm-bg-deep border-gm-border-soft rounded-2xl p-4 focus:ring-gm-gold/50 focus:border-gm-gold/50 font-serif leading-relaxed text-gm-text transition-all resize-y"
                            placeholder={t(
                              'admin.siteSettings.seo.inline.placeholderDescription',
                              null,
                              'Sayfanın kısa özeti — ideal 140-160 karakter.'
                            )}
                          />
                        </div>

                        <div className="bg-gm-surface/20 border border-gm-border-soft rounded-3xl p-5">
                          <AdminImageUploadField
                            label={t('admin.siteSettings.seo.inline.ogImage', null, 'OG Görsel (1200×630)')}
                            folder={`seo/${cfg.key}`}
                            bucket="public"
                            metadata={{ module_key: 'seo', page: cfg.key, locale }}
                            value={page.og_image}
                            onChange={(url) => updatePage(cfg.key, { og_image: url })}
                            disabled={busy}
                          />
                        </div>

                        <div className="flex items-center gap-4 bg-gm-surface/20 border border-gm-border-soft rounded-2xl p-4">
                          <Switch
                            checked={page.no_index}
                            onCheckedChange={(v) => updatePage(cfg.key, { no_index: v })}
                            disabled={busy}
                            className="data-[state=checked]:bg-gm-error"
                          />
                          <Label className="text-sm font-serif text-gm-text">
                            {t(
                              'admin.siteSettings.seo.inline.noindex',
                              null,
                              'Bu sayfayı arama motorlarından gizle (noindex)'
                            )}
                          </Label>
                        </div>
                      </div>

                      {/* Sağ: Önizlemeler */}
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                            {t('admin.siteSettings.seo.inline.googlePreview', null, 'Google Önizleme')}
                          </Label>
                          <div className="rounded-[20px] border border-gm-border-soft bg-[#202124] p-5 shadow-inner">
                            <div className="space-y-1.5">
                              <p className="text-[11px] text-[#dadce0] truncate font-sans">
                                {previewDomain} › {locale}
                                {cfg.path === '/' ? '' : cfg.path}
                              </p>
                              <p className="text-[18px] text-[#8ab4f8] truncate font-sans hover:underline cursor-pointer">
                                {page.title ||
                                  t('admin.siteSettings.seo.inline.siteName', null, defaultSiteLabel)}
                              </p>
                              <p className="text-[13px] text-[#bdc1c6] line-clamp-2 leading-snug font-sans">
                                {page.description ||
                                  t(
                                    'admin.siteSettings.seo.inline.noDescription',
                                    null,
                                    'Henüz açıklama girilmedi.'
                                  )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                            {t(
                              'admin.siteSettings.seo.inline.socialPreview',
                              null,
                              'Sosyal Medya Önizleme'
                            )}
                          </Label>
                          <div className="overflow-hidden rounded-[20px] border border-gm-border-soft bg-gm-bg-deep shadow-inner flex flex-col">
                            <div className="aspect-[1.91/1] bg-gm-surface/50 border-b border-gm-border-soft relative flex items-center justify-center">
                              {page.og_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={page.og_image}
                                  alt=""
                                  className="absolute inset-0 h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="text-center space-y-2 opacity-50">
                                  <Globe className="size-8 mx-auto text-gm-muted" />
                                  <span className="block text-[10px] font-bold text-gm-muted uppercase tracking-widest">
                                    {t(
                                      'admin.siteSettings.seo.inline.noOgImage',
                                      null,
                                      'OG görsel yok'
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="p-4 space-y-1 bg-gm-surface/20 backdrop-blur-sm">
                              <p className="text-[10px] text-gm-muted font-bold uppercase tracking-widest">
                                {previewDomain}
                              </p>
                              <p className="text-sm font-semibold text-gm-text truncate">
                                {page.title ||
                                  t('admin.siteSettings.seo.inline.siteName', null, defaultSiteLabel)}
                              </p>
                              <p className="text-xs text-gm-muted/80 line-clamp-2 leading-relaxed">
                                {page.description ||
                                  t(
                                    'admin.siteSettings.seo.inline.noDescription',
                                    null,
                                    'Henüz açıklama girilmedi.'
                                  )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isDirty && (
          <div className="flex justify-end pt-6 border-t border-gm-border-soft">
            <Button 
              type="button" 
              onClick={handleSave} 
              disabled={busy}
              className="rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-light h-12 px-8 text-[10px] font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
            >
              <Save className="mr-2 size-4" />
              {t('admin.siteSettings.seo.inline.saveAll', null, 'Tümünü Kaydet')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
