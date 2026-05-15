'use client';

// =============================================================
// FILE: src/app/(main)/admin/_components/common/AdminLocaleSelect.tsx
// FINAL — Admin Locale Select (shadcn)
// - Bootstrap yok
// - Loading badge + disabled logic
// - ✅ FIX: empty string value support via sentinel mapping (no breaking change)
// - ✅ FIX: Type safety with proper option type
// =============================================================

import React from 'react';
import { Languages, Loader2 } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type AdminLocaleOption = {
  value: string;
  label?: string; // ✅ FIX: Optional label
};

export type AdminLocaleSelectProps = {
  value: string;
  onChange: (locale: string) => void;
  options: AdminLocaleOption[]; // ✅ FIX: Now accepts both formats
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;

  /**
   * ✅ NEW (non-breaking): allow empty string values safely
   * If you pass options/value containing "", we map it to a sentinel internally.
   */
  allowEmpty?: boolean;
  emptySentinel?: string;
};

const norm = (v: unknown) => String(v ?? '').trim();
const normLocale = (v: unknown) => norm(v).toLowerCase();

export const AdminLocaleSelect: React.FC<AdminLocaleSelectProps> = ({
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  label,
  className,
  allowEmpty = true,
  emptySentinel = '__all__',
}) => {
  const t = useAdminT('admin.common');
  const hasOptions = Array.isArray(options) && options.length > 0;
  const isDisabled = disabled || loading || !hasOptions;

  const resolvedLabel = String(label ?? t('locale')).trim() || t('locale');
  const placeholderText = t('localePlaceholder', undefined, t('locale'));

  const mapToUiValue = React.useCallback(
    (v: string) => {
      const s = norm(v);
      if (!allowEmpty) return s;
      return s === '' ? emptySentinel : s;
    },
    [allowEmpty, emptySentinel],
  );

  const mapFromUiValue = React.useCallback(
    (v: string) => {
      const s = norm(v);
      if (!allowEmpty) return s;
      return s === emptySentinel ? '' : s;
    },
    [allowEmpty, emptySentinel],
  );

  const uiValue = mapToUiValue(norm(value));

  const uiOptions = React.useMemo(() => {
    const arr = Array.isArray(options) ? options : [];
    return arr
      .map((opt) => ({
        value: mapToUiValue(normLocale(opt.value)),
        raw: normLocale(opt.value),
        // ✅ FIX: Handle both label string and optional label
        label: opt.label ? norm(opt.label) : normLocale(opt.value).toUpperCase(),
      }))
      .filter((x) => !!x.value); // sentinel is non-empty, so OK
  }, [options, mapToUiValue]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm">{resolvedLabel}</Label>
        {loading ? (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="size-3.5 animate-spin" />
            {t('loading')}
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <Languages className="size-3.5" />
            {t('locale')}
          </Badge>
        )}
      </div>

      <Select
        value={uiValue}
        onValueChange={(v) => onChange(mapFromUiValue(v))}
        disabled={isDisabled}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholderText} />
        </SelectTrigger>
        <SelectContent>
          {uiOptions.map((opt) => (
            <SelectItem key={`${opt.value}:${opt.label}`} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!hasOptions && !loading ? (
        <div className="text-xs text-muted-foreground">{t('localeOptionsMissing')}</div>
      ) : null}
    </div>
  );
};
