'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

import { LoginForm } from '../_components/login-form';
import { useLocaleContext } from '@/i18n';
import type { AdminBrandingConfig } from '@/config/app-config';
import { DEFAULT_BRANDING } from '@/config/app-config';
import { getSelectedTenantKey } from '@/integrations/core/tenant';
import { useListTenantsQuery } from '@/integrations/hooks';

function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
    </div>
  );
}

export function LoginClient({ branding }: { branding: AdminBrandingConfig }) {
  const { t } = useLocaleContext();
  const { data: tenants = [] } = useListTenantsQuery();
  const [tenantKey, setTenantKey] = useState('');

  useEffect(() => {
    setTenantKey(getSelectedTenantKey());
  }, []);

  const activeTenant = useMemo(() => (
    tenants.find((tenant) => tenant.key === tenantKey) ?? tenants[0] ?? null
  ), [tenants, tenantKey]);

  const b = useMemo<AdminBrandingConfig>(() => {
    const base = {
      ...DEFAULT_BRANDING,
      ...branding,
      meta: { ...DEFAULT_BRANDING.meta, ...branding.meta },
    };
    if (!activeTenant) return base;
    const tenantBranding = activeTenant.branding ?? {};
    const tenantName = String(tenantBranding.appName || tenantBranding.displayName || activeTenant.name || base.app_name);
    return {
      ...base,
      app_name: tenantName,
      app_copyright: String(tenantBranding.displayName || activeTenant.name || base.app_copyright),
      logo_url: String(tenantBranding.logoUrl || base.logo_url || ''),
      admin_login_heading: tenantName,
      meta: {
        ...base.meta,
        title: tenantName,
        og_title: tenantName,
      },
    };
  }, [activeTenant, branding]);

  useEffect(() => {
    const title = b.meta.title || b.app_name;
    if (title) document.title = title;
  }, [b.meta.title, b.app_name]);

  const leftHeading =
    (b.admin_login_heading || '').trim() || t('admin.auth.login.welcomeBack');
  const leftQuote = (b.admin_login_quote || '').trim() || t('admin.auth.login.heroTagline');
  const bgUrl =
    (b.admin_login_background_url || '').trim() ||
    DEFAULT_BRANDING.admin_login_background_url;

  return (
    <div className="flex min-h-dvh bg-[var(--brand-cream)]">
      <div className="relative hidden lg:block lg:w-3/5 xl:w-2/3 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-110"
          style={{ backgroundImage: `url("${bgUrl.replace(/"/g, '')}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--brand-cream)]" />

        <div className="absolute bottom-12 left-12 right-12 z-10">
          <div className="backdrop-blur-md bg-[var(--brand-ink)]/20 p-8 rounded-2xl border border-white/10 max-w-xl">
            <h2 className="font-serif text-white text-4xl mb-4 leading-tight">{leftHeading}</h2>
            <p className="text-white/70 text-lg font-light tracking-wide italic">&quot;{leftQuote}&quot;</p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-8 lg:w-2/5 xl:w-1/3">
        <div className="w-full max-w-md space-y-12 reveal">
          <div className="space-y-6 text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[var(--brand-gold)]/10 border border-[var(--brand-gold-border)] shadow-glow-primary mb-8">
              <ShieldCheck className="size-10 text-[var(--brand-gold)]" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-[var(--brand-ink)] text-3xl tracking-tight">
                {t('admin.auth.login.title')}
              </h1>
              <p className="text-muted-foreground text-sm font-light">
                {t('admin.auth.login.description')}
              </p>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-sm p-8 rounded-3xl border border-white/60 shadow-xl space-y-6">
            <Suspense fallback={<LoginFormFallback />}>
              <LoginForm />
            </Suspense>

            <div className="pt-4 border-t border-[var(--brand-gold-border)]">
              <p className="text-center text-muted-foreground text-[10px] uppercase tracking-[0.2em]">
                {t('admin.auth.login.noAccess')}{' '}
                <Link
                  prefetch={false}
                  href="#"
                  className="text-[var(--brand-gold)] font-bold hover:opacity-80 transition-opacity"
                >
                  {t('admin.auth.login.contactAdmin')}
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-[var(--brand-gold-strong)]/40 text-[10px] font-mono">
            {t('admin.auth.login.copyrightLine', {
              year: new Date().getFullYear(),
              app: b.app_name || 'Admin',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
