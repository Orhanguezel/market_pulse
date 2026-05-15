'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRequestPasswordResetMutation } from '@/integrations/rtk/hooks';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath, normalizeError } from '@/integrations/shared';
import { getSampleEmailPlaceholder } from '@/lib/site-config';

export default function ForgotPasswordPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_auth', locale as any);

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [requestReset, { isLoading }] = useRequestPasswordResetMutation();

  const loginHref = localizePath(locale, '/login');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError(
        locale === 'de'
          ? 'Bitte geben Sie Ihre E-Mail-Adresse ein.'
          : locale === 'tr'
            ? 'Lütfen e-posta adresinizi girin.'
            : 'Please enter your email address.',
      );
      return;
    }

    try {
      await requestReset({ email: email.trim().toLowerCase() }).unwrap();
      setSent(true);
    } catch (err) {
      setFormError(normalizeError(err as any).message || 'Error');
    }
  };

  if (sent) {
    return (
      <section className="bg-bg-primary py-20 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-bg-card p-8 md:p-12 rounded-lg shadow-soft text-center">
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-light text-text-primary mb-3">
              {locale === 'de'
                ? 'E-Mail gesendet'
                : locale === 'tr'
                  ? 'E-posta Gönderildi'
                  : 'Email Sent'}
            </h2>
            <p className="text-text-secondary mb-6">
              {locale === 'de'
                ? 'Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.'
                : locale === 'tr'
                  ? 'Bu e-posta adresiyle bir hesap varsa, şifre sıfırlama bağlantısı gönderildi. Lütfen e-postanızı kontrol edin.'
                  : 'If an account with that email exists, we have sent a password reset link. Please check your email.'}
            </p>
            <Link
              href={loginHref}
              className="inline-block bg-brand-primary text-text-on-dark font-bold py-3 px-6 rounded-sm hover:bg-brand-hover transition-all text-sm uppercase tracking-widest"
            >
              {locale === 'de' ? 'Zurück zum Login' : locale === 'tr' ? 'Giriş Sayfasına Dön' : 'Back to Login'}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-bg-primary py-20 min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-bg-card-hover/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-md mx-auto bg-bg-card p-8 md:p-12 rounded-lg shadow-soft">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-serif font-light text-text-primary mb-3">
              {locale === 'de'
                ? 'Passwort vergessen'
                : locale === 'tr'
                  ? 'Şifremi Unuttum'
                  : 'Forgot Password'}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {locale === 'de'
                ? 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.'
                : locale === 'tr'
                  ? 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.'
                  : 'Enter your email address and we will send you a reset link.'}
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="bg-error/5 border border-error/20 text-error px-4 py-3 rounded-md mb-6 text-sm flex items-start gap-2"
            >
              <span className="font-medium">{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">
                {ui('login_email_label', 'Email')}
              </label>
              <input
                id="reset-email"
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

            <button
              type="submit"
              className="w-full bg-brand-primary text-text-on-dark font-bold py-3.5 px-4 rounded-sm hover:bg-brand-hover transition-all duration-300 shadow-soft hover:shadow-medium disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center uppercase tracking-widest text-sm"
              disabled={isLoading}
            >
              {isLoading
                ? (locale === 'de' ? 'Wird gesendet...' : locale === 'tr' ? 'Gönderiliyor...' : 'Sending...')
                : (locale === 'de' ? 'Link senden' : locale === 'tr' ? 'Bağlantı Gönder' : 'Send Reset Link')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href={loginHref}
              className="text-sm text-text-secondary hover:text-brand-primary transition-all"
            >
              {locale === 'de' ? '← Zurück zum Login' : locale === 'tr' ? '← Giriş Sayfasına Dön' : '← Back to Login'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
