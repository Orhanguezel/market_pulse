// =============================================================
// FILE: src/components/containers/auth/Login.tsx
// FINAL – Auth Login
// - Tailwind v4 Semantic Tokens
// - Standard list of inputs
// =============================================================

'use client';

import React, { useState, useMemo, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  useLoginMutation,
  useLazyStatusQuery,
} from '@/integrations/rtk/hooks';
import { tokenStore } from '@/integrations/rtk/token';
import { normalizeError } from '@/integrations/shared';
import { useSearchParams } from 'next/navigation';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

// i18n
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { getSampleEmailPlaceholder } from '@/lib/site-config';

function trimSlash(x: string) {
  return String(x || '').replace(/\/+$/, '');
}

const Login: React.FC = () => {
  const router = useRouter();
  const locale = useLocaleShort();
  const searchParams = useSearchParams();
  const { ui } = useUiSection('ui_auth', locale as any);

  // Login sonrası dönüş URL'i: ?next=/tr/booking?... → kullanıcı orijinal sayfasına döner
  const nextHref = useMemo(() => {
    const raw = searchParams.get('next') || '';
    if (raw && raw.startsWith('/')) return raw;
    return localizePath(locale, '/dashboard');
  }, [searchParams, locale]);
  const hasExplicitNext = useMemo(() => {
    const raw = searchParams.get('next') || '';
    return raw.startsWith('/');
  }, [searchParams]);

  const registerHref = useMemo(() => localizePath(locale, '/register'), [locale]);
  const forgotPasswordHref = useMemo(() => localizePath(locale, '/forgot-password'), [locale]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [login, loginState] = useLoginMutation();
  const [fetchStatus] = useLazyStatusQuery();

  const isLoading = loginState.isLoading;

  const apiErrorMessage = useMemo(() => {
    if (!loginState.error) return null;
    return normalizeError(loginState.error).message;
  }, [loginState.error]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError(
        ui('login_error_required', 'E-posta ve şifre zorunludur.'),
      );
      return;
    }

    try {
      const resp = await login({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();

      if (resp.access_token) {
        tokenStore.set(resp.access_token);
      }

      if (typeof window !== 'undefined' && resp.user) {
        window.localStorage.setItem('user', JSON.stringify(resp.user));
      }

      const adminBase = trimSlash(String(process.env.NEXT_PUBLIC_ADMIN_URL || '').trim());
      if (typeof window !== 'undefined' && adminBase && !hasExplicitNext) {
        try {
          const status = await fetchStatus(undefined).unwrap();
          if (status?.authenticated === true && status?.is_admin === true) {
            window.location.assign(`${adminBase}/admin`);
            return;
          }
        } catch {
          // status check failed -> normal user flow
        }
      }

      router.push(nextHref);
    } catch {
      // Error is handled via loginState.error
    }
  };

  const errorToShow = formError || apiErrorMessage;

  return (
    <section className="bg-bg-primary py-20 min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-bg-card-hover/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-md mx-auto bg-bg-card p-8 md:p-12 rounded-lg shadow-soft">
          
          <div className="text-center mb-8">
            <h3 className="text-3xl font-serif font-light text-text-primary mb-3">
              {ui('login_title', 'Giriş Yap')}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {ui('login_lead', 'Hesabınıza giriş yapın veya yeni bir hesap oluşturun.')}{' '}
              <Link
                href={registerHref}
                className="text-brand-primary font-bold hover:text-brand-hover transition-colors"
              >
                {ui('login_register_link', 'Hesap oluştur')}
              </Link>
              .
            </p>
          </div>

          {errorToShow && (
            <div
              role="alert"
              aria-live="polite"
              className="bg-error/5 border border-error/20 text-error px-4 py-3 rounded-md mb-6 text-sm flex items-start gap-2"
            >
              <span className="mt-0.5" aria-hidden>
                ⚠️
              </span>
              <span className="font-medium">{errorToShow}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">
                {ui('login_email_label', 'E-posta')}
              </label>
              <input
                id="login-email"
                type="email"
                className="w-full px-4 py-3 border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all bg-bg-card placeholder:text-text-muted text-text-primary"
                placeholder={ui(
                  'login_email_placeholder',
                  getSampleEmailPlaceholder(locale),
                )}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">
                {ui('login_password_label', 'Şifre')}
              </label>
              <input
                id="login-password"
                type="password"
                className="w-full px-4 py-3 border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all bg-bg-card placeholder:text-text-muted text-text-primary"
                placeholder={ui('login_password_placeholder', 'Şifreniz')}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-border-medium rounded cursor-pointer accent-brand-primary"
                  disabled={isLoading}
                />
                <label
                  className="ml-2 block text-sm text-text-secondary cursor-pointer select-none"
                  htmlFor="remember-me"
                >
                  {ui('login_remember_me', 'Beni hatırla')}
                </label>
              </div>
              <Link
                href={forgotPasswordHref}
                className="text-sm text-brand-primary hover:text-brand-hover hover:underline transition-all"
              >
                {ui('login_forgot_password', 'Şifremi unuttum?')}
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-primary text-text-on-dark font-bold py-3.5 px-4 rounded-sm hover:bg-brand-hover transition-all duration-300 shadow-soft hover:shadow-medium disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center uppercase tracking-widest text-sm"
              disabled={isLoading}
            >
              {loginState.isLoading
                ? ui('login_loading', 'Giriş yapılıyor...')
                : ui('login_submit', 'Giriş Yap')}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light" />
            </div>
            <div className="relative">
              <span className="px-3 bg-bg-card text-text-muted text-sm uppercase tracking-wider font-medium">
                {ui('login_or', 'veya')}
              </span>
            </div>
          </div>

          <SocialLoginButtons nextHref={nextHref} layout="row" />

          <div className="mt-8 text-center">
             <p className="text-sm text-text-secondary">
               {ui('login_no_account', 'Hesabınız yok mu?')}{' '}
               <Link
                 href={registerHref}
                 className="text-brand-primary font-bold hover:text-brand-hover hover:underline transition-all"
               >
                 {ui('login_register_cta', 'Buradan kayıt olun')}
               </Link>
             </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
