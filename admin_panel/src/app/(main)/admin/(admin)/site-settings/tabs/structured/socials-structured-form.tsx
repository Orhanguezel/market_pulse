
// =============================================================
// FILE: src/components/admin/site-settings/structured/SocialsStructuredForm.tsx
// =============================================================

"use client";

import React from "react";
import { z } from "zod";
import { useAdminTranslations } from "@/i18n";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const socialsSchema = z
  .object({
    instagram: z.string().trim().optional(),
    facebook: z.string().trim().optional(),
    linkedin: z.string().trim().optional(),
    youtube: z.string().trim().optional(),
    x: z.string().trim().optional(),
  })
  .strict();

export type SocialsFormState = z.infer<typeof socialsSchema>;

export type SocialsStructuredFormProps = {
  value: any;
  onChange: (next: SocialsFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: SocialsFormState;
};

const safeObj = (v: any) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);

export function socialsObjToForm(v: any, seed: SocialsFormState): SocialsFormState {
  const base = safeObj(v) || seed;
  const parsed = socialsSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function socialsFormToObj(s: SocialsFormState) {
  return socialsSchema.parse({
    instagram: s.instagram?.trim() || "",
    facebook: s.facebook?.trim() || "",
    linkedin: s.linkedin?.trim() || "",
    youtube: s.youtube?.trim() || "",
    x: s.x?.trim() || "",
  });
}

export const SocialsStructuredForm: React.FC<SocialsStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const s =
    (seed || { instagram: "", facebook: "", linkedin: "", youtube: "", x: "" }) as SocialsFormState;
  const form = socialsObjToForm(value, s);

  const fields = [
    ["instagram", t("admin.siteSettings.structured.socials.labels.instagram")],
    ["facebook", t("admin.siteSettings.structured.socials.labels.facebook")],
    ["linkedin", t("admin.siteSettings.structured.socials.labels.linkedin")],
    ["youtube", t("admin.siteSettings.structured.socials.labels.youtube")],
    ["x", t("admin.siteSettings.structured.socials.labels.x")],
  ] as const;

  return (
    <div className="space-y-4">
      <Alert variant="default" className="py-2">
        <AlertDescription className="text-sm">
          {t("admin.siteSettings.structured.socials.description")}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map(([k, label]) => (
          <div className="space-y-2" key={k}>
            <Label htmlFor={`social-${k}`} className="text-sm">{label}</Label>
            <Input
              id={`social-${k}`}
              className="h-8"
              value={(form as any)[k] || ""}
              onChange={(e) => onChange({ ...(form as any), [k]: e.target.value })}
              disabled={disabled}
            />
            {errors?.[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

SocialsStructuredForm.displayName = "SocialsStructuredForm";
