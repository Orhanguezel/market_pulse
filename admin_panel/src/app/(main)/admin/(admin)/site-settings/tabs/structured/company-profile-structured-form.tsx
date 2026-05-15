// =============================================================
// FILE: src/components/admin/site-settings/structured/CompanyProfileStructuredForm.tsx
// =============================================================

'use client';

import React from 'react';
import { z } from 'zod';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const companyProfileSchema = z
  .object({
    company_name: z.string().trim().optional(),
    slogan: z.string().trim().optional(),
    about: z.string().trim().optional(),
  })
  .strict();

export type CompanyProfileFormState = z.infer<typeof companyProfileSchema>;

export type CompanyProfileStructuredFormProps = {
  value: any;
  onChange: (next: CompanyProfileFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: CompanyProfileFormState;
};

const safeObj = (v: any) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

export function companyObjToForm(v: any, seed: CompanyProfileFormState): CompanyProfileFormState {
  const base = safeObj(v) || seed;
  const parsed = companyProfileSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function companyFormToObj(s: CompanyProfileFormState) {
  return companyProfileSchema.parse({
    company_name: s.company_name?.trim() || '',
    slogan: s.slogan?.trim() || '',
    about: s.about?.trim() || '',
  });
}

export const CompanyProfileStructuredForm: React.FC<CompanyProfileStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const s = (seed || {
    company_name: '',
    slogan: '',
    about: '',
  }) as CompanyProfileFormState;
  const form = companyObjToForm(value, s);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="company-name" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.companyName')}</Label>
        <Input
          id="company-name"
          className="h-8"
          value={form.company_name || ''}
          onChange={(e) => onChange({ ...form, company_name: e.target.value })}
          disabled={disabled}
        />
        {errors?.company_name && <p className="text-xs text-destructive">{errors.company_name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-slogan" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.slogan')}</Label>
        <Input
          id="company-slogan"
          className="h-8"
          value={form.slogan || ''}
          onChange={(e) => onChange({ ...form, slogan: e.target.value })}
          disabled={disabled}
        />
        {errors?.slogan && <p className="text-xs text-destructive">{errors.slogan}</p>}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="company-about" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.about')}</Label>
        <Textarea
          id="company-about"
          rows={6}
          value={form.about || ''}
          onChange={(e) => onChange({ ...form, about: e.target.value })}
          disabled={disabled}
          className="text-sm"
        />
        {errors?.about && <p className="text-xs text-destructive">{errors.about}</p>}
      </div>
    </div>
  );
};

CompanyProfileStructuredForm.displayName = 'CompanyProfileStructuredForm';
