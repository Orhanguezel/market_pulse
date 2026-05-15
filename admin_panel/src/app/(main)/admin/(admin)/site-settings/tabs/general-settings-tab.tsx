// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/tabs/general-settings-tab.tsx
// Genel Ayarlar — Sade kart-liste pattern (bereketfide)
// 5 yönetilen anahtar: contact_info, socials, businessHours, company_profile, ui_header
// Her satır → Düzenle sayfasına link (chevron). GLOBAL/LOCALE badge'leri kaldırıldı.
// =============================================================

'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { RefreshCcw, Plus, ChevronRight } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { cn } from '@/lib/utils';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';

import type { SiteSetting, SettingValue } from '@/integrations/shared';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const GENERAL_KEYS = [
  'contact_info',
  'company_profile',
  'socials',
] as const;

type GeneralKey = (typeof GENERAL_KEYS)[number];

const DEFAULTS_BY_KEY: Record<GeneralKey, SettingValue> = {
  contact_info: { phone: '', email: '', address: '', whatsapp: '' },
  company_profile: { company_name: '', slogan: '', about: '' },
  socials: { instagram: '', facebook: '', linkedin: '', youtube: '', x: '' },
};

function isGeneralKey(k: string): k is GeneralKey {
  return (GENERAL_KEYS as readonly string[]).includes(k);
}

/** JSON value'yu kısa, insanca özete çevir */
function summariseValue(v: SettingValue | undefined): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    return `${v.length} kayıt`;
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>);
    const filled = entries.filter(([, val]) => val !== '' && val !== null && val !== undefined);
    if (filled.length === 0) return '';
    const strs = filled.slice(0, 2).map(([key, val]) => {
      if (val && typeof val === 'object') return key;
      return String(val);
    });
    return strs.join(', ') + (filled.length > 2 ? ` +${filled.length - 2}` : '');
  }
  return '';
}

type RowData = {
  key: GeneralKey;
  hasValue: boolean;
  editLocale: string;
  value: SettingValue | undefined;
};

function buildRows(rows: any[], locale: string): RowData[] {
  const only = rows.filter((r: any) => r && isGeneralKey(r.key));
  const byKey = new Map<GeneralKey, { global?: SiteSetting; local?: SiteSetting }>();

  for (const r of only) {
    const key = r.key as GeneralKey;
    const entry = byKey.get(key) || {};
    if (r.locale === '*') entry.global = r;
    if (r.locale === locale) entry.local = r;
    byKey.set(key, entry);
  }

  return GENERAL_KEYS.map((k) => {
    const entry = byKey.get(k) || {};
    const hasLocal = Boolean(entry.local);
    const hasGlobal = Boolean(entry.global);
    const value = hasLocal ? entry.local?.value : hasGlobal ? entry.global?.value : undefined;
    const editLocale = hasLocal ? locale : '*';

    return { key: k, hasValue: hasLocal || hasGlobal, editLocale, value };
  });
}

function editHref(key: string, locale: string) {
  return `/admin/site-settings/${encodeURIComponent(key)}?locale=${encodeURIComponent(locale)}`;
}

function errMsg(err: any, fallback: string): string {
  return err?.data?.error?.message || err?.data?.message || err?.message || fallback;
}

export type GeneralSettingsTabProps = {
  locale: string;
  settingPrefix?: string;
};

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({ locale, settingPrefix }) => {
  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const adminLocale = usePreferencesStore((s) => s.adminLocale) || 'tr';
  const t = useAdminTranslations(adminLocale || undefined);

  const withPrefix = React.useCallback(
    (key: string) => `${settingPrefix || ''}${key}`,
    [settingPrefix],
  );
  const stripPrefix = React.useCallback(
    (key: string) =>
      settingPrefix && key.startsWith(settingPrefix) ? key.slice(settingPrefix.length) : key,
    [settingPrefix],
  );

  const listArgsGlobal = React.useMemo(
    () => ({ locale: '*', keys: GENERAL_KEYS.map((key) => withPrefix(key)) as unknown as string[] }),
    [withPrefix],
  );
  const listArgsLocale = React.useMemo(
    () => ({ locale, keys: GENERAL_KEYS.map((key) => withPrefix(key)) as unknown as string[] }),
    [locale, withPrefix],
  );

  const qGlobal = useListSiteSettingsAdminQuery(listArgsGlobal as any, { skip: !locale });
  const qLocale = useListSiteSettingsAdminQuery(listArgsLocale as any, { skip: !locale });

  const rowsMerged = React.useMemo(() => {
    const g = Array.isArray(qGlobal.data) ? qGlobal.data : [];
    const l = Array.isArray(qLocale.data) ? qLocale.data : [];
    return [...g, ...l].map((row: any) => ({ ...row, key: stripPrefix(String(row.key || '')) }));
  }, [qGlobal.data, qLocale.data, stripPrefix]);

  const rows = React.useMemo(() => buildRows(rowsMerged as any[], locale), [rowsMerged, locale]);

  const busy =
    qGlobal.isLoading || qLocale.isLoading || qGlobal.isFetching || qLocale.isFetching || isSaving;

  const refetchAll = async () => {
    await Promise.all([qGlobal.refetch(), qLocale.refetch()]);
  };

  const hasAnyMissing = rows.some((r) => !r.hasValue);

  const createMissing = async () => {
    try {
      for (const r of rows) {
        if (r.hasValue) continue;
        await updateSetting({
          key: withPrefix(r.key),
          locale: '*',
          value: DEFAULTS_BY_KEY[r.key] as any,
        }).unwrap();
      }
      toast.success(
        t(
          'admin.siteSettings.general.globalBootstrapSuccess',
          {},
          'Eksik anahtarlar boş varsayılanlarla oluşturuldu.',
        ),
      );
      await refetchAll();
    } catch (err: any) {
      toast.error(errMsg(err, t('admin.siteSettings.messages.error', {}, 'Hata oluştu')));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between bg-gm-surface/20 p-6 rounded-3xl border border-gm-border-soft backdrop-blur-sm">
        <p className="text-[11px] text-gm-muted uppercase tracking-[0.1em] leading-relaxed max-w-2xl font-bold">
          {t(
            'admin.siteSettings.general.description',
            { locale },
            `Bu sekmedeki ayarlar tüm dillere uygulanır (GLOBAL); ${locale} için override
            eklenmediği sürece varsayılanlar görünür.`
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refetchAll}
          disabled={busy}
          title={t('admin.common.refresh', null, 'Yenile')}
          className="rounded-full border-gm-border-soft h-10 px-5 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-primary/5 hover:text-gm-gold hover:border-gm-gold/30 shrink-0 ml-4"
        >
          <RefreshCcw className="mr-2 size-3.5" />
          {t('admin.common.refresh', null, 'Yenile')}
        </Button>
      </div>

      <div className="space-y-3">
        {rows.map((r) => {
          const summary = summariseValue(r.value);

          return (
            <Link
              key={r.key}
              href={r.hasValue ? editHref(withPrefix(r.key), r.editLocale) : '#'}
              prefetch={false}
              className={cn(
                "group flex items-center justify-between gap-4 rounded-[24px] border border-gm-border-soft bg-gm-surface/10 p-5 transition-all duration-300",
                r.hasValue 
                  ? "hover:bg-gm-surface/30 hover:border-gm-gold/30 hover:shadow-lg cursor-pointer" 
                  : "opacity-60 grayscale"
              )}
              onClick={r.hasValue ? undefined : (e) => e.preventDefault()}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-lg text-gm-text group-hover:text-gm-gold transition-colors">
                    {t(`admin.siteSettings.general.keyLabels.${r.key}`, null, r.key)}
                  </span>
                  {!r.hasValue ? (
                    <Badge variant="outline" className="text-[9px] text-gm-muted uppercase tracking-[0.2em] border-gm-border-soft bg-gm-bg-deep">
                      {t('admin.siteSettings.general.sourceNone', null, 'Boş')}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-gm-muted">
                  {t(`admin.siteSettings.general.keyDescriptions.${r.key}`, null, '')}
                </p>
                {summary ? (
                  <p className="mt-3 truncate font-mono text-[11px] text-gm-gold/80 bg-gm-gold/5 border border-gm-gold/10 inline-block px-3 py-1.5 rounded-lg">
                    {summary}
                  </p>
                ) : null}
              </div>

              {r.hasValue ? (
                <div className="flex items-center justify-center size-10 rounded-full bg-gm-surface/40 group-hover:bg-gm-gold/10 transition-colors shrink-0 border border-gm-border-soft group-hover:border-gm-gold/20">
                  <ChevronRight className="size-4 text-gm-muted group-hover:text-gm-gold transition-transform group-hover:translate-x-0.5" />
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>

      {hasAnyMissing ? (
        <Button
          type="button"
          variant="outline"
          onClick={createMissing}
          disabled={busy}
          className="w-full sm:w-auto rounded-full border-gm-gold/30 text-gm-gold hover:bg-gm-gold/10 h-12 px-6 text-[10px] font-bold tracking-widest uppercase transition-all shadow-sm"
        >
          <Plus className="mr-2 size-4" />
          {t(
            'admin.siteSettings.general.globalBootstrap',
            null,
            'Eksik anahtarları boş varsayılanla oluştur'
          )}
        </Button>
      ) : null}
    </div>
  );
};
