'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Save, Trash2, Code2, LayoutTemplate } from 'lucide-react';

import type { SiteSetting, SettingValue } from '@/integrations/shared';
import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/* ----------------------------- types ----------------------------- */

export type SiteSettingsFormMode = 'structured' | 'raw';

export type SiteSettingsFormProps = {
  settingKey: string;
  locale: string;
  row?: SiteSetting | null;
  disabled?: boolean;
  initialMode?: SiteSettingsFormMode;

  onSave: (args: { key: string; locale: string; value: SettingValue }) => Promise<void>;
  onDelete?: (args: { key: string; locale?: string }) => Promise<void>;

  renderStructured?: (ctx: {
    key: string;
    locale: string;
    value: any;
    setValue: (next: any) => void;
    disabled?: boolean;
  }) => React.ReactNode;

  showImageUpload?: boolean;

  imageUpload?: {
    label?: string;
    helperText?: React.ReactNode;
    bucket?: string;
    folder?: string;
    metadata?: Record<string, string | number | boolean>;
    value?: string;
    onChange?: (url: string) => void;

    /** optional: open storage library */
    openLibraryHref?: string;
    onOpenLibraryClick?: () => void;
  };
};

/* ----------------------------- helpers ----------------------------- */

export function coerceSettingValue(input: any): any {
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

function prettyStringify(v: any) {
  try {
    return JSON.stringify(v ?? {}, null, 2);
  } catch {
    return '';
  }
}

function parseRawOrString(text: string): SettingValue {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as any;
  } catch {
    return trimmed;
  }
}

function errMsg(err: any, fallback: string): string {
  return (
    err?.data?.error?.message ||
    err?.data?.message ||
    err?.message ||
    fallback
  );
}

/* ----------------------------- component ----------------------------- */

export const SiteSettingsForm: React.FC<SiteSettingsFormProps> = ({
  settingKey,
  locale,
  row,
  disabled,
  initialMode = 'structured',
  onSave,
  onDelete,
  renderStructured,
  showImageUpload,
  imageUpload,
}) => {
  const router = useRouter();
  const t = useAdminT('admin.siteSettings');
  const adminLocale = usePreferencesStore((s) => s.adminLocale);

  const canStructured = typeof renderStructured === 'function';

  // Mode
  const [mode, setMode] = React.useState<SiteSettingsFormMode>(
    initialMode === 'structured' && !canStructured ? 'raw' : initialMode,
  );

  // structured
  const [structuredValue, setStructuredValue] = React.useState<any>({});

  // raw
  const [rawText, setRawText] = React.useState<string>('');

  const coercedInitial = React.useMemo(() => coerceSettingValue(row?.value), [row?.value]);

  // sync on key/locale/row change
  React.useEffect(() => {
    setStructuredValue(coercedInitial ?? {});
    if (typeof row?.value === 'string') setRawText(row.value ?? '');
    else setRawText(prettyStringify(coercedInitial));
  }, [coercedInitial, row?.value, settingKey, locale]);

  // guard: if structured renderer missing, force raw
  React.useEffect(() => {
    if (mode === 'structured' && !canStructured) setMode('raw');
  }, [mode, canStructured]);

  const openLibraryHref = imageUpload?.openLibraryHref ?? '/admin/storage';
  const onOpenLibraryClick =
    imageUpload?.onOpenLibraryClick ?? (() => router.push(openLibraryHref));

  const handleSave = async () => {
    if (disabled) return;

    try {
      const valueToSave: SettingValue =
        mode === 'raw' ? parseRawOrString(rawText) : (structuredValue as any);

      await onSave({ key: settingKey, locale, value: valueToSave });
      toast.success(t('form.saved', null, 'Ayar kaydedildi.'));
    } catch (err: any) {
      toast.error(
        errMsg(err, t('form.saveError', null, 'Kaydedilirken hata oluştu.'))
      );
    }
  };

  const handleDelete = async () => {
    if (!onDelete || disabled) return;

    const ok = window.confirm(
      t('form.deleteConfirm', { key: settingKey, locale }, 'Bu ayarı silmek istediğinize emin misiniz?')
    );
    if (!ok) return;

    try {
      await onDelete({ key: settingKey, locale });
      toast.success(t('form.deleted', null, 'Ayar silindi.'));
    } catch (err: any) {
      toast.error(
        errMsg(err, t('form.deleteError', null, 'Silinirken hata oluştu.'))
      );
    }
  };

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="gap-6 bg-gm-surface/40 p-8 border-b border-gm-border-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="font-serif text-2xl flex items-center gap-3">
              <span className="text-gm-text">{t('form.title', null, 'Ayar Düzenle')}</span>
              <code className="text-gm-gold bg-gm-gold/10 px-3 py-1.5 rounded-xl text-lg font-mono border border-gm-gold/20 shadow-sm">{settingKey}</code>
              {locale && locale !== '*' ? (
                <Badge variant="outline" className="border-gm-gold/30 bg-gm-gold/5 text-gm-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">{locale}</Badge>
              ) : (
                <Badge variant="outline" className="border-gm-muted/30 bg-gm-muted/5 text-gm-muted px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">GLOBAL</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-gm-muted font-serif italic opacity-80">
              {t('form.description', null, 'Bu ayarın değerini yapılandırın.')}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onDelete ? (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDelete} 
                disabled={disabled}
                className="rounded-full border-gm-error/30 text-gm-error hover:bg-gm-error/10 hover:text-gm-error h-12 px-6 text-[10px] font-bold tracking-widest uppercase transition-all"
              >
                <Trash2 className="mr-2 size-4" />
                {t('admin.common.delete', null, 'Sil')}
              </Button>
            ) : null}

            <Button 
              type="button" 
              onClick={handleSave} 
              disabled={disabled}
              className="rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-light h-12 px-8 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all"
            >
              <Save className="mr-2 size-4" />
              {t('admin.common.save', null, 'Kaydet')}
            </Button>
          </div>
        </div>

        {/* Mode tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as SiteSettingsFormMode)} className="w-full sm:w-auto">
          <TabsList className="bg-gm-bg-deep/50 p-1.5 border border-gm-border-soft rounded-2xl">
            <TabsTrigger 
              value="structured" 
              disabled={!canStructured || !!disabled}
              className="rounded-xl data-[state=active]:bg-gm-surface data-[state=active]:text-gm-gold data-[state=active]:shadow-lg text-[10px] font-bold uppercase tracking-[0.1em] px-6 py-2.5 transition-all flex items-center gap-2"
            >
              <LayoutTemplate className="size-3.5" />
              {t('form.modes.structured', null, 'Görsel Editör')}
            </TabsTrigger>
            <TabsTrigger 
              value="raw" 
              disabled={!!disabled}
              className="rounded-xl data-[state=active]:bg-gm-surface data-[state=active]:text-gm-gold data-[state=active]:shadow-lg text-[10px] font-bold uppercase tracking-[0.1em] px-6 py-2.5 transition-all flex items-center gap-2"
            >
              <Code2 className="size-3.5" />
              {t('form.modes.raw', null, 'Ham JSON/Metin')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        {showImageUpload ? (
          <div className="bg-gm-surface/30 p-6 rounded-3xl border border-gm-border-soft">
            <AdminImageUploadField
              label={imageUpload?.label ?? t('form.imageLabel', null, 'Görsel')}
              helperText={imageUpload?.helperText}
              bucket={imageUpload?.bucket ?? 'public'}
              folder={imageUpload?.folder ?? 'site-media'}
              metadata={imageUpload?.metadata}
              value={(imageUpload?.value ?? '') as any}
              onChange={(url) => imageUpload?.onChange?.(url)}
              disabled={disabled}
              openLibraryHref={openLibraryHref}
              onOpenLibraryClick={onOpenLibraryClick}
            />
          </div>
        ) : null}

        {mode === 'structured' ? (
          canStructured ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              {renderStructured?.({
                key: settingKey,
                locale,
                value: structuredValue,
                setValue: setStructuredValue,
                disabled,
              })}
            </div>
          ) : (
            <Alert className="bg-gm-warning/10 border-gm-warning/30 text-gm-warning rounded-2xl">
              <AlertTitle className="font-serif">{t('form.structuredMissingTitle', null, 'Görsel Editör Yok')}</AlertTitle>
              <AlertDescription className="opacity-80">
                {t('form.structuredMissingDesc', null, 'Bu ayar için görsel editör mevcut değil. Lütfen Ham JSON/Metin sekmesini kullanın.')}
              </AlertDescription>
            </Alert>
          )
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="text-sm text-gm-muted font-serif italic">
              {t('form.rawHelp', null, 'Ham veriyi doğrudan düzenleyebilirsiniz. Geçerli bir JSON kullanmaya özen gösterin.')}
            </div>

            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={14}
              disabled={disabled}
              spellCheck={false}
              className="font-mono text-sm leading-relaxed bg-gm-bg-deep border-gm-border-soft rounded-2xl p-6 focus:ring-gm-gold/50 focus:border-gm-gold/50 text-gm-text shadow-inner transition-all resize-y"
              placeholder={t('form.rawPlaceholder', null, '{"key": "value"}')}
            />

            <div className="text-[10px] text-gm-muted uppercase tracking-[0.1em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gm-gold/50" />
              {t('form.rawTip', null, 'Not: JSON parse edilemezse ham metin olarak kaydedilir.')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

SiteSettingsForm.displayName = 'SiteSettingsForm';
