'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { ShieldCheck } from 'lucide-react';

import { RegisterForm } from '../_components/register-form';
import { useAdminTranslations } from '@/i18n';
import { useLocaleShort } from '@/i18n/useLocaleShort';

function RegisterFormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
    </div>
  );
}

export default function Register() {
  const locale = useLocaleShort();
  const t = useAdminTranslations(locale);

  return (
    <div className="flex min-h-dvh">
      {/* Sol panel */}
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <div className="mx-auto flex size-24 items-center justify-center rounded-md border border-primary-foreground/20">
              <ShieldCheck className="size-10 text-primary-foreground" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">
                {t('admin.auth.register.createAccount')}
              </h1>
              <p className="text-primary-foreground/80 text-xl">
                {t('admin.auth.register.continueRegister')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">{t('admin.auth.register.title')}</div>
            <div className="mx-auto max-w-xl text-muted-foreground">
              {t('admin.auth.register.description')}
            </div>
          </div>

          <div className="space-y-4">
            <Suspense fallback={<RegisterFormFallback />}>
              <RegisterForm />
            </Suspense>

            <p className="text-center text-muted-foreground text-xs">
              {t('admin.auth.register.alreadyHaveAccount')}{' '}
              <Link
                prefetch={false}
                href="/auth/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t('admin.auth.register.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
