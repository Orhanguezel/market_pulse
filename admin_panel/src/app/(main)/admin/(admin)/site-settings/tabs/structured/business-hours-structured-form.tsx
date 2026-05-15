// =============================================================
// FILE: src/components/admin/site-settings/structured/BusinessHoursStructuredForm.tsx
// =============================================================

'use client';

import React from 'react';
import { z } from 'zod';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const dayEnum = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
const hhmm = z
  .string()
  .trim()
  .refine((s) => /^\d{2}:\d{2}$/.test(s), 'Saat formatı HH:MM olmalı (örn 09:00)');

export const businessHourRowSchema = z
  .object({
    day: dayEnum,
    open: hhmm,
    close: hhmm,
    closed: z.boolean().default(false),
  })
  .strict();

export const businessHoursSchema = z.array(businessHourRowSchema).default([]);

export type BusinessHoursFormState = z.infer<typeof businessHoursSchema>;

export type BusinessHoursStructuredFormProps = {
  value: any;
  onChange: (next: BusinessHoursFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: BusinessHoursFormState;
};

export function businessHoursObjToForm(
  v: any,
  seed: BusinessHoursFormState,
): BusinessHoursFormState {
  const base = Array.isArray(v) ? v : seed;
  const parsed = businessHoursSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function businessHoursFormToObj(s: BusinessHoursFormState) {
  return businessHoursSchema.parse(
    (s || []).map((r) => ({
      day: r.day,
      open: r.open,
      close: r.close,
      closed: !!r.closed,
    })),
  );
}

export const BusinessHoursStructuredForm: React.FC<BusinessHoursStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const s = (seed ||
    ([
      { day: 'mon', open: '09:00', close: '18:00', closed: false },
      { day: 'tue', open: '09:00', close: '18:00', closed: false },
      { day: 'wed', open: '09:00', close: '18:00', closed: false },
      { day: 'thu', open: '09:00', close: '18:00', closed: false },
      { day: 'fri', open: '09:00', close: '18:00', closed: false },
      { day: 'sat', open: '10:00', close: '14:00', closed: false },
      { day: 'sun', open: '00:00', close: '00:00', closed: true },
    ] as any)) as BusinessHoursFormState;

  const form = businessHoursObjToForm(value, s);

  const dayLabel: Record<string, string> = {
    mon: t('admin.siteSettings.structured.businessHours.days.mon', undefined, 'Mon'),
    tue: t('admin.siteSettings.structured.businessHours.days.tue', undefined, 'Tue'),
    wed: t('admin.siteSettings.structured.businessHours.days.wed', undefined, 'Wed'),
    thu: t('admin.siteSettings.structured.businessHours.days.thu', undefined, 'Thu'),
    fri: t('admin.siteSettings.structured.businessHours.days.fri', undefined, 'Fri'),
    sat: t('admin.siteSettings.structured.businessHours.days.sat', undefined, 'Sat'),
    sun: t('admin.siteSettings.structured.businessHours.days.sun', undefined, 'Sun'),
  };

  const setRow = (idx: number, patch: Partial<(typeof form)[number]>) => {
    const next = [...form];
    next[idx] = { ...next[idx], ...patch } as any;
    onChange(next);
  };

  const addRow = () => {
    onChange([
      ...(form || []),
      { day: 'mon', open: '09:00', close: '18:00', closed: false } as any,
    ]);
  };

  const removeRow = (idx: number) => {
    const next = [...form];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <Alert variant="default" className="py-2">
        <AlertDescription className="text-sm">
          {t('admin.siteSettings.structured.businessHours.description')}
        </AlertDescription>
      </Alert>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">{t('admin.siteSettings.structured.businessHours.columns.day')}</TableHead>
              <TableHead className="w-40">{t('admin.siteSettings.structured.businessHours.columns.open')}</TableHead>
              <TableHead className="w-40">{t('admin.siteSettings.structured.businessHours.columns.close')}</TableHead>
              <TableHead className="w-32">{t('admin.siteSettings.structured.businessHours.columns.closed')}</TableHead>
              <TableHead className="text-right w-24"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {form.map((r, idx) => (
              <TableRow key={`${r.day}_${idx}`}>
                <TableCell>
                  <Select
                    value={r.day}
                    onValueChange={(value) => setRow(idx, { day: value as any })}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((d) => (
                        <SelectItem key={d} value={d}>
                          {dayLabel[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.[`${idx}.day`] && (
                    <p className="text-xs text-destructive">{errors[`${idx}.day`]}</p>
                  )}
                </TableCell>

                <TableCell>
                  <Input
                    className="h-8 font-mono"
                    value={r.open}
                    onChange={(e) => setRow(idx, { open: e.target.value })}
                    placeholder="09:00"
                    disabled={disabled || !!r.closed}
                  />
                  {errors?.[`${idx}.open`] && (
                    <p className="text-xs text-destructive">{errors[`${idx}.open`]}</p>
                  )}
                </TableCell>

                <TableCell>
                  <Input
                    className="h-8 font-mono"
                    value={r.close}
                    onChange={(e) => setRow(idx, { close: e.target.value })}
                    placeholder="18:00"
                    disabled={disabled || !!r.closed}
                  />
                  {errors?.[`${idx}.close`] && (
                    <p className="text-xs text-destructive">{errors[`${idx}.close`]}</p>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`closed-${idx}`}
                      checked={!!r.closed}
                      onCheckedChange={(checked) => setRow(idx, { closed: !!checked })}
                      disabled={disabled}
                    />
                    <Label htmlFor={`closed-${idx}`} className="text-xs">
                      {t('admin.siteSettings.structured.businessHours.closedLabel')}
                    </Label>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeRow(idx)}
                    disabled={disabled}
                  >
                    {t('admin.siteSettings.structured.businessHours.removeRow')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {errors?.form && <p className="p-3 text-xs text-destructive">{errors.form}</p>}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled}
        >
          {t('admin.siteSettings.structured.businessHours.addRow')}
        </Button>
      </div>
    </div>
  );
};

BusinessHoursStructuredForm.displayName = 'BusinessHoursStructuredForm';
