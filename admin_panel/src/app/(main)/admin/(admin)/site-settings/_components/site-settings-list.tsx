'use client';

import * as React from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Database } from 'lucide-react';

import type { SiteSetting, SettingValue } from '@/integrations/shared';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/* ----------------------------- helpers ----------------------------- */

function isSeoKey(key: string): boolean {
  const k = String(key || '')
    .trim()
    .toLowerCase();
  if (!k) return false;

  return (
    k === 'seo' ||
    k === 'site_seo' ||
    k === 'site_meta_default' ||
    k.startsWith('seo_') ||
    k.startsWith('seo|') ||
    k.startsWith('site_seo|') ||
    k.startsWith('ui_seo') ||
    k.startsWith('ui_seo_')
  );
}

function coercePreviewValue(input: SettingValue): SettingValue {
  if (input === null || input === undefined) return input;
  if (typeof input === 'object') return input;

  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return input;
    const looksJson = (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));
    if (!looksJson) return input;
    try {
      return JSON.parse(s) as any;
    } catch {
      return input;
    }
  }

  return input;
}

/* ----------------------------- types ----------------------------- */

export type SiteSettingsListProps = {
  settings?: SiteSetting[];
  loading: boolean;
  onEdit?: (setting: SiteSetting) => void;
  onDelete?: (setting: SiteSetting) => void;
  getEditHref?: (setting: SiteSetting) => string;
  selectedLocale: string;
};

/* ----------------------------- component ----------------------------- */

export const SiteSettingsList: React.FC<SiteSettingsListProps> = ({
  settings,
  loading,
  onEdit,
  onDelete,
  getEditHref,
  selectedLocale,
}) => {
  const t = useAdminT('admin.siteSettings');
  const adminLocale = usePreferencesStore((s) => s.adminLocale);

  const filtered = React.useMemo(() => {
    const arr = Array.isArray(settings) ? settings : [];
    if (selectedLocale === '*') return arr.filter((s) => s && !isSeoKey(s.key));
    return arr;
  }, [settings, selectedLocale]);

  const hasData = filtered.length > 0;
  const dash = '—';

  const formatValuePreviewI18n = (v: SettingValue): string => {
    const vv = coercePreviewValue(v);
    if (vv === null || vv === undefined) return dash;

    if (typeof vv === 'string') {
      const s = vv.trim();
      if (s.length <= 80) return s;
      return `${s.slice(0, 77)}...`;
    }

    if (typeof vv === 'number' || typeof vv === 'boolean') return String(vv);

    if (Array.isArray(vv)) {
      if (vv.length === 0) return '[]';
      return `Array [${vv.length} items]`;
    }

    if (typeof vv === 'object') {
      const keys = Object.keys(vv);
      if (keys.length === 0) return '{}';
      if (keys.length <= 3) return `{ ${keys.join(', ')} }`;
      return `Object {${keys.length} fields}`;
    }

    try {
      const s = JSON.stringify(vv);
      if (s.length <= 80) return s;
      return `${s.slice(0, 77)}...`;
    } catch {
      return String(vv as any);
    }
  };

  const formatDateI18n = (v?: string | null): string => {
    if (!v) return dash;
    try {
      return new Date(v).toLocaleString(adminLocale || undefined);
    } catch {
      return dash;
    }
  };

  const renderEditAction = (s: SiteSetting) => {
    const href = getEditHref?.(s);

    if (href) {
      return (
        <Button asChild size="sm" variant="ghost" className="h-8 rounded-md px-3 text-xs font-medium hover:bg-gm-surface/30">
          <Link prefetch={false} href={href}>
            <Pencil className="mr-2 size-4" />
            {t('admin.common.edit', null, 'Düzenle')}
          </Link>
        </Button>
      );
    }

    if (onEdit) {
      return (
        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(s)} className="h-8 rounded-md px-3 text-xs font-medium hover:bg-gm-surface/30">
          <Pencil className="mr-2 size-4" />
          {t('admin.common.edit', null, 'Düzenle')}
        </Button>
      );
    }

    return null;
  };

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-gm-surface/20">
            <TableRow className="border-gm-border-soft hover:bg-transparent">
              <TableHead className="w-[25%] px-4 py-3 text-xs font-semibold text-gm-muted">Ayar Anahtarı</TableHead>
              <TableHead className="w-[8%] py-3 text-xs font-semibold text-gm-muted">Dil</TableHead>
              <TableHead className="w-[35%] py-3 text-xs font-semibold text-gm-muted">Değer Özeti</TableHead>
              <TableHead className="w-[15%] py-3 text-xs font-semibold text-gm-muted">Son Güncelleme</TableHead>
              <TableHead className="w-[17%] px-4 py-3 text-right text-xs font-semibold text-gm-muted">İşlemler</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {hasData ? (
              filtered.map((s) => (
                <TableRow key={`${s.key}_${s.locale || 'none'}`} className="group border-gm-border-soft transition-colors hover:bg-gm-surface/10">
                  <TableCell className="px-4 py-4 font-mono text-sm text-gm-text">
                    {s.key}
                  </TableCell>

                  <TableCell className="py-4">
                    {s.locale ? (
                      <Badge variant="outline" className="rounded-md border-gm-border-soft bg-gm-surface/10 px-2 py-0.5 text-xs font-medium text-gm-text">{s.locale}</Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-md border-gm-border-soft bg-gm-surface/10 px-2 py-0.5 text-xs font-medium text-gm-muted">GLOBAL</Badge>
                    )}
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="max-w-md overflow-hidden text-ellipsis text-xs text-gm-muted">
                      <code className="rounded-md border border-gm-border-soft/50 bg-gm-surface/20 px-2 py-1 font-mono">
                        {formatValuePreviewI18n(s.value)}
                      </code>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <span className="font-mono text-xs text-gm-muted">
                      {formatDateI18n(s.updated_at)}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {renderEditAction(s)}
                      {onDelete ? (
                        <button
                          type="button"
                          className="rounded-md border border-transparent p-2 text-gm-error/70 transition-colors hover:border-gm-error/20 hover:bg-gm-error/10 hover:text-gm-error"
                          onClick={() => onDelete(s)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4 text-gm-muted">
                    <Database className="h-10 w-10" />
                    <span className="text-sm">{loading ? 'Yükleniyor...' : 'Kayıt bulunamadı.'}</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

SiteSettingsList.displayName = 'SiteSettingsList';
