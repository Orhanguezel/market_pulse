'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetSiteSettingAdminByKeyQuery, useUpdateSiteSettingAdminMutation } from '@/integrations/hooks';

type BrandConfig = {
  primaryHex: string;
  primaryHexDark: string;
  accentHex: string;
  accentHexDark: string;
  sidebarBgCss: string;
  logoUrl: string;
  faviconUrl: string;
};

const FALLBACK: BrandConfig = {
  primaryHex: '#E8A598',
  primaryHexDark: '#D88D7E',
  accentHex: '#22c55e',
  accentHexDark: '#4ade80',
  sidebarBgCss: 'oklch(0.97 0.02 145)',
  logoUrl: '',
  faviconUrl: '',
};

export function BrandColorsTab() {
  const { data, isFetching } = useGetSiteSettingAdminByKeyQuery('brand_config');
  const [updateSetting, { isLoading }] = useUpdateSiteSettingAdminMutation();
  const [form, setForm] = React.useState<BrandConfig>(FALLBACK);

  React.useEffect(() => {
    const value = data?.value;
    if (!value || typeof value !== 'object') {
      setForm(FALLBACK);
      return;
    }

    const v = value as Partial<BrandConfig>;
    setForm({
      primaryHex: v.primaryHex || FALLBACK.primaryHex,
      primaryHexDark: v.primaryHexDark || FALLBACK.primaryHexDark,
      accentHex: v.accentHex || FALLBACK.accentHex,
      accentHexDark: v.accentHexDark || FALLBACK.accentHexDark,
      sidebarBgCss: v.sidebarBgCss || FALLBACK.sidebarBgCss,
      logoUrl: v.logoUrl || FALLBACK.logoUrl,
      faviconUrl: v.faviconUrl || FALLBACK.faviconUrl,
    });
  }, [data?.value]);

  const onSave = async () => {
    try {
      await updateSetting({
        key: 'brand_config',
        value: form,
        locale: '*',
      }).unwrap();
      toast.success('Marka renkleri kaydedildi');
    } catch {
      toast.error('Marka renkleri kaydedilemedi');
    }
  };

  const busy = isFetching || isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marka Renkleri</CardTitle>
        <CardDescription>
          Bu ayarlar uygulama acilisinda CSS degiskenlerini override eder.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="brand-primary">Primary</Label>
          <Input
            id="brand-primary"
            type="color"
            value={form.primaryHex}
            onChange={(e) => setForm((p) => ({ ...p, primaryHex: e.target.value }))}
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-primary-dark">Primary Dark</Label>
          <Input
            id="brand-primary-dark"
            type="color"
            value={form.primaryHexDark}
            onChange={(e) => setForm((p) => ({ ...p, primaryHexDark: e.target.value }))}
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-accent">Accent</Label>
          <Input
            id="brand-accent"
            type="color"
            value={form.accentHex}
            onChange={(e) => setForm((p) => ({ ...p, accentHex: e.target.value }))}
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-accent-dark">Accent Dark</Label>
          <Input
            id="brand-accent-dark"
            type="color"
            value={form.accentHexDark}
            onChange={(e) => setForm((p) => ({ ...p, accentHexDark: e.target.value }))}
            disabled={busy}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="brand-sidebar-bg">Sidebar Background CSS</Label>
          <Input
            id="brand-sidebar-bg"
            value={form.sidebarBgCss}
            onChange={(e) => setForm((p) => ({ ...p, sidebarBgCss: e.target.value }))}
            disabled={busy}
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={onSave} disabled={busy}>
            Kaydet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
