// =============================================================
// FILE: src/components/admin/site-settings/tabs/SmtpSettingsTab.tsx
// SMTP / E-posta Ayarları Tab (GLOBAL) – style aligned
// ✅ i18n enabled
// =============================================================

import React from 'react';
import { toast } from 'sonner';
import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useSendTestMailMutation,
} from '@/integrations/hooks';

import type { SettingValue, SiteSetting } from '@/integrations/shared';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { getDefaultSiteNameForSeo, getPublicSiteHostname } from '@/lib/admin-brand';

export type SmtpSettingsTabProps = {
  locale: string; // UI badge için dursun, GLOBAL tab
};

const SMTP_KEYS = [
  'smtp_host',
  'smtp_port',
  'smtp_username',
  'smtp_password',
  'smtp_from_email',
  'smtp_from_name',
  'smtp_ssl',
] as const;

type SmtpKey = (typeof SMTP_KEYS)[number];

type SmtpForm = {
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
  smtp_ssl: boolean;
};

const EMPTY_FORM: SmtpForm = {
  smtp_host: '',
  smtp_port: '',
  smtp_username: '',
  smtp_password: '',
  smtp_from_email: '',
  smtp_from_name: '',
  smtp_ssl: false,
};

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function toBool(v: unknown): boolean {
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const t = v.trim().toLowerCase();
    return t === '1' || t === 'true' || t === 'yes' || t === 'on';
  }
  return false;
}

function toMap(settings?: any) {
  const map = new Map<string, any>();
  if (settings) for (const s of settings) map.set(s.key, s);
  return map;
}

export const SmtpSettingsTab: React.FC<SmtpSettingsTabProps> = ({ locale }) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const fromEmailPh = `noreply@${getPublicSiteHostname()}`;
  const fromNamePh = getDefaultSiteNameForSeo();

  const {
    data: settings,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery({
    keys: SMTP_KEYS as unknown as string[],
    // GLOBAL => locale göndermiyoruz
  });

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [sendTestMail, { isLoading: isTesting }] = useSendTestMailMutation();

  const [form, setForm] = React.useState<SmtpForm>(EMPTY_FORM);
  const [testEmail, setTestEmail] = React.useState<string>('');

  React.useEffect(() => {
    const map = toMap(settings);
    const next: SmtpForm = { ...EMPTY_FORM };

    next.smtp_host = valueToString(map.get('smtp_host')?.value);
    next.smtp_port = valueToString(map.get('smtp_port')?.value);
    next.smtp_username = valueToString(map.get('smtp_username')?.value);
    next.smtp_password = valueToString(map.get('smtp_password')?.value);
    next.smtp_from_email = valueToString(map.get('smtp_from_email')?.value);
    next.smtp_from_name = valueToString(map.get('smtp_from_name')?.value);
    next.smtp_ssl = toBool(map.get('smtp_ssl')?.value);

    setForm(next);
  }, [settings]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving || isTesting;

  const handleChange = (field: Exclude<SmtpKey, 'smtp_ssl'>, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleSsl = () => {
    setForm((prev) => ({ ...prev, smtp_ssl: !prev.smtp_ssl }));
  };

  const handleSave = async () => {
    try {
      const updates: { key: SmtpKey; value: SettingValue }[] = [
        { key: 'smtp_host', value: form.smtp_host.trim() },
        { key: 'smtp_port', value: form.smtp_port.trim() || '' },
        { key: 'smtp_username', value: form.smtp_username.trim() },
        { key: 'smtp_password', value: form.smtp_password },
        { key: 'smtp_from_email', value: form.smtp_from_email.trim() },
        { key: 'smtp_from_name', value: form.smtp_from_name.trim() },
        { key: 'smtp_ssl', value: form.smtp_ssl },
      ];

      for (const u of updates) {
        await updateSetting({ key: u.key, locale: '*', value: u.value }).unwrap();
      }

      toast.success(t('admin.siteSettings.smtp.saved'));
      await refetch();
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || t('admin.siteSettings.smtp.saved');
      toast.error(msg);
    }
  };

  const handleSendTest = async () => {
    try {
      const trimmedTest = testEmail.trim();
      const fromEmail = form.smtp_from_email.trim();

      if (trimmedTest) await sendTestMail({ to: trimmedTest }).unwrap();
      else if (fromEmail) await sendTestMail({ to: fromEmail }).unwrap();
      else await sendTestMail().unwrap();

      toast.success(t('admin.siteSettings.smtp.testSent'));
    } catch (err: any) {
      const msg = err?.data?.error?.details || err?.data?.error?.message || err?.message;
      toast.error(msg || t('admin.siteSettings.smtp.testSent'));
    }
  };

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="bg-gm-surface/40 p-8 border-b border-gm-border-soft gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="font-serif text-2xl text-gm-text">
              {t('admin.siteSettings.smtp.title', null, 'SMTP Ayarları')}
            </CardTitle>
            <CardDescription className="text-gm-muted font-serif italic opacity-80">
              {t('admin.siteSettings.smtp.description', null, 'E-posta gönderim ayarlarını yönetin.')}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-gm-gold/30 bg-gm-gold/5 text-gm-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]">
              {t('admin.siteSettings.smtp.badge', { locale: locale || '—' }, 'GLOBAL')}
            </Badge>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={refetch} 
              disabled={busy}
              className="rounded-full border-gm-border-soft hover:bg-gm-surface/40 hover:text-gm-text h-10 px-5 text-[10px] font-bold tracking-widest uppercase transition-all"
            >
              {t('admin.common.refresh', null, 'Yenile')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        {busy && (
          <div className="flex justify-center py-4 opacity-50 animate-pulse">
            <Badge variant="outline" className="border-gm-border-soft bg-gm-surface text-gm-muted px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em]">
              {t('admin.common.loading', null, 'Yükleniyor...')}
            </Badge>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="space-y-2 md:col-span-6">
            <Label htmlFor="smtp-host" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
              {t('admin.siteSettings.smtp.host', null, 'SMTP Sunucusu')}
            </Label>
            <Input
              id="smtp-host"
              value={form.smtp_host}
              onChange={(e) => handleChange('smtp_host', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.hostPlaceholder', null, 'örn: smtp.mail.com')}
              disabled={busy}
              className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-sans text-gm-text transition-all"
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="smtp-port" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
              {t('admin.siteSettings.smtp.port', null, 'Port')}
            </Label>
            <Input
              id="smtp-port"
              value={form.smtp_port}
              onChange={(e) => handleChange('smtp_port', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.portPlaceholder', null, '587')}
              disabled={busy}
              className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-sans text-gm-text transition-all"
            />
          </div>

          <div className="flex items-end md:col-span-3">
            <div className="flex items-center space-x-3 bg-gm-surface/20 border border-gm-border-soft rounded-2xl p-3 h-12 w-full px-5">
              <Switch
                id="smtp-ssl"
                checked={form.smtp_ssl}
                onCheckedChange={handleToggleSsl}
                disabled={busy}
                className="data-[state=checked]:bg-gm-gold"
              />
              <Label htmlFor="smtp-ssl" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase cursor-pointer">
                {t('admin.siteSettings.smtp.ssl', null, 'SSL/TLS Kullan')}
              </Label>
            </div>
          </div>

          <div className="space-y-2 md:col-span-6">
            <Label htmlFor="smtp-username" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
              {t('admin.siteSettings.smtp.username', null, 'Kullanıcı Adı')}
            </Label>
            <Input
              id="smtp-username"
              value={form.smtp_username}
              onChange={(e) => handleChange('smtp_username', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.usernamePlaceholder', null, 'user@mail.com')}
              disabled={busy}
              className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-sans text-gm-text transition-all"
            />
          </div>

          <div className="space-y-2 md:col-span-6">
            <Label htmlFor="smtp-password" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
              {t('admin.siteSettings.smtp.password', null, 'Şifre')}
            </Label>
            <Input
              id="smtp-password"
              type="password"
              value={form.smtp_password}
              onChange={(e) => handleChange('smtp_password', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.passwordPlaceholder', null, '********')}
              disabled={busy}
              className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-sans text-gm-text transition-all"
            />
          </div>

          <div className="space-y-2 md:col-span-6">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="smtp-from-email" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase block">
                {t('admin.siteSettings.smtp.fromEmail', null, 'Gönderici E-posta')}
              </Label>
              <p className="text-[10px] text-gm-muted font-mono opacity-60">
                {t('admin.siteSettings.smtp.fromEmailHelp', null, 'Zorunlu değilse boş bırakın.')}
              </p>
            </div>
            <Input
              id="smtp-from-email"
              value={form.smtp_from_email}
              onChange={(e) => handleChange('smtp_from_email', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.fromEmailPlaceholder', null, fromEmailPh)}
              disabled={busy}
              className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-sans text-gm-text transition-all"
            />
          </div>

          <div className="space-y-2 md:col-span-6">
            <Label htmlFor="smtp-from-name" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
              {t('admin.siteSettings.smtp.fromName', null, 'Gönderici Adı')}
            </Label>
            <Input
              id="smtp-from-name"
              value={form.smtp_from_name}
              onChange={(e) => handleChange('smtp_from_name', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.fromNamePlaceholder', null, fromNamePh)}
              disabled={busy}
              className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-sans text-gm-text transition-all"
            />
          </div>
        </div>

        <Separator className="bg-gm-border-soft my-8" />

        <div className="bg-gm-surface/30 border border-gm-border-soft rounded-[24px] p-6">
          <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="test-email" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase block">
                  {t('admin.siteSettings.smtp.testEmail', null, 'Test E-postası')}
                </Label>
                <p className="text-[10px] text-gm-muted font-mono opacity-60">
                  {t('admin.siteSettings.smtp.testEmailHelp', null, 'Boş bırakılırsa admin adresine gönderilir.')}
                </p>
              </div>
              <Input
                id="test-email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder={t('admin.siteSettings.smtp.testEmailPlaceholder', null, 'test@example.com')}
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-sans text-gm-text transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                disabled={busy} 
                onClick={handleSendTest}
                className="rounded-full border-gm-border-soft hover:bg-gm-surface/40 hover:text-gm-text h-12 px-6 text-[10px] font-bold tracking-widest uppercase transition-all w-full sm:w-auto"
              >
                {isTesting ? t('admin.siteSettings.smtp.sendingTest', null, 'Test Gönderiliyor...') : t('admin.siteSettings.smtp.sendTest', null, 'Test Gönder')}
              </Button>

              <Button 
                type="button" 
                disabled={busy} 
                onClick={handleSave}
                className="rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-light h-12 px-8 text-[10px] font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] w-full sm:w-auto"
              >
                {isSaving ? t('admin.common.saving', null, 'Kaydediliyor...') : t('admin.common.save', null, 'Kaydet')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
