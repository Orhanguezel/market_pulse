'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw, Save, Code } from 'lucide-react';
import { useGetSiteSettingAdminByKeyQuery, useUpdateSiteSettingAdminMutation } from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export function CustomCssTab() {
  const { data: settingRow, isLoading, isFetching, refetch } = useGetSiteSettingAdminByKeyQuery('custom_css');
  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const [cssValue, setCssValue] = React.useState('');

  React.useEffect(() => {
    if (settingRow?.value !== undefined) {
      setCssValue(typeof settingRow.value === 'string' ? settingRow.value : '');
    }
  }, [settingRow?.value]);

  const busy = isLoading || isFetching || isSaving;

  const handleSave = async () => {
    try {
      await updateSetting({
        key: 'custom_css',
        value: cssValue,
        locale: '*',
      }).unwrap();
      toast.success('Özel CSS kaydedildi. 5 dakika içinde yansır.');
    } catch (err) {
      toast.error('Kaydetme hatası.');
    }
  };

  const t = useAdminT('admin.siteSettings');
  
  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="bg-gm-surface/40 p-8 border-b border-gm-border-soft gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="font-serif text-2xl text-gm-text flex items-center gap-3">
              <Code className="size-5 text-gm-gold" />
              {t('customCss.title', null, 'Özel CSS (Global)')}
            </CardTitle>
            <CardDescription className="text-gm-muted font-serif italic opacity-80">
              {t('customCss.description', null, 'Frontend tarafına enjekte edilecek global CSS kuralları.')}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isLoading && (
              <Badge variant="outline" className="border-gm-border-soft bg-gm-surface text-gm-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
                {t('admin.common.loading', null, 'Yükleniyor...')}
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={busy}
              title={t('admin.common.refresh', null, 'Yenile')}
              className="rounded-full border-gm-border-soft hover:bg-gm-surface/40 hover:text-gm-text h-10 px-5 text-[10px] font-bold tracking-widest uppercase transition-all"
            >
              <RefreshCcw className="mr-2 size-3.5" />
              {t('admin.common.refresh', null, 'Yenile')}
            </Button>
            <Button 
              type="button" 
              onClick={handleSave} 
              disabled={busy}
              className="rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-light h-10 px-6 text-[10px] font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] disabled:opacity-50 disabled:shadow-none"
            >
              <Save className="mr-2 size-4" />
              {isSaving ? t('admin.common.saving', null, 'Kaydediliyor...') : t('admin.common.save', null, 'Kaydet')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between ml-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gm-gold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gm-gold/50" />
              {t('customCss.editorTitle', null, 'CSS Editörü')}
            </h3>
            <p className="text-[10px] text-gm-muted font-mono opacity-60">
              {t('customCss.editorDesc', null, 'Buradaki CSS, globals.css sonrasına enjekte edilir.')}
            </p>
          </div>
          <Textarea
            value={cssValue}
            onChange={(e) => setCssValue(e.target.value)}
            placeholder="body { background: #000; }"
            className="min-h-[400px] font-mono text-[13px] leading-relaxed bg-[#1e1e1e] border-gm-border-soft rounded-[24px] p-6 focus:ring-gm-gold/50 focus:border-gm-gold/50 text-[#d4d4d4] transition-all resize-y shadow-inner"
            disabled={busy}
            spellCheck={false}
          />
          <div className="mt-4 flex items-center gap-3 px-2">
            <Badge variant="outline" className="border-gm-gold/30 bg-gm-gold/5 text-gm-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]">
              {t('admin.common.info', null, 'BİLGİ')}
            </Badge>
            <span className="text-[11px] text-gm-muted font-serif italic">
              {t('customCss.cacheWarning', null, 'CSS değişiklikleri sunucu tarafında 5 dakika önbelleğe alınır.')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
