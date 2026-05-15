'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useConfirmPasswordResetMutation } from '@/integrations/rtk/hooks';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath, normalizeError } from '@/integrations/shared';

export default function PasswordResetPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_auth', locale as any);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [confirmReset, { isLoading }] = useConfirmPasswordResetMutation();

  const loginHref = localizePath(locale, '/login');

  if (!token) {
    return (
      <section className="bg-bg-primary py-20 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-bg-card p-8 md:p-12 rounded-lg shadow-soft text-center">
            <div className="w-16 h-16 bg-warning/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-light text-text-primary mb-3">
              {locale === 'de' ? 'Ungültiger Link' : locale === 'tr' ? 'Geçersiz Bağlantı' : 'Invalid Link'}
            </h2>
            <p className="text-text-secondary mb-6">
              {locale === 'de'
                ? 'Kein Zurücksetzungs-Token gefunden. Bitte fordern Sie einen neuen Link an.'
                : locale === 'tr'
                  ? 'Sıfırlama tokeni bulunamadı. Lütfen yeni bir bağlantı talep edin.'
                  : 'No reset token found. Please request a new link.'}
            </p>
            <Link
              href={localizePath(locale, '/forgot-password')}
              className="inline-block bg-brand-primary text-text-on-dark font-bold py-3 px-6 rounded-sm hover:bg-brand-hover transition-all text-sm"
            >
              {locale === 'de' ? 'Neuen Link anfordern' : locale === 'tr' ? 'Yeni Bağlantı Talep Et' : 'Request New Link'}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (success) {
    return (
      <section className="bg-bg-primary py-20 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-bg-card p-8 md:p-12 rounded-lg shadow-soft text-center">
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-light text-text-primary mb-3">
              {locale === 'de'
                ? 'Passwort aktualisiert!'
                : locale === 'tr'
                  ? 'Şifre Güncellendi!'
                  : 'Password Updated!'}
            </h2>
            <p className="text-text-secondary mb-6">
              {locale === 'de'
                ? 'Ihr Passwort wurde erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.'
                : locale === 'tr'
                  ? 'Şifreniz başarıyla sıfırlandı. Şimdi giriş yapabilirsiniz.'
                  : 'Your password has been successfully reset. You can now sign in.'}
            </p>
            <Link
              href={loginHref}
              className="inline-block bg-brand-primary text-text-on-dark font-bold py-3 px-6 rounded-sm hover:bg-brand-hover transition-all text-sm uppercase tracking-widest"
            >
              {locale === 'de' ? 'Zum Login' : locale === 'tr' ? 'Giriş Yap' : 'Sign In'}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError(
        locale === 'de'
          ? 'Das Passwort muss mindestens 6 Zeichen lang sein.'
          : locale === 'tr'
            ? 'Şifre en az 6 karakter olmalıdır.'
            : 'Password must be at least 6 characters.',
      );
      return;
    }

    if (password !== confirmPwd) {
      setFormError(
        locale === 'de'
          ? 'Die Passwörter stimmen nicht überein.'
          : locale === 'tr'
            ? 'Şifreler eşleşmiyor.'
            : 'Passwords do not match.',
      );
      return;
    }

    try {
      await confirmReset({ token, password }).unwrap();
      setSuccess(true);
    } catch (err) {
      const msg = normalizeError(err as any).message;
      setFormError(
        msg ||
        (locale === 'de'
          ? 'Fehler beim Zurücksetzen. Der Link ist möglicherweise abgelaufen.'
          : locale === 'tr'
            ? 'Sıfırlama başarısız. Bağlantının süresi dolmuş olabilir.'
            : 'Reset failed. The link may have expired.'),
      );
    }
  };

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
                ? 'Neues Passwort festlegen'
                : locale === 'tr'
                  ? 'Yeni Şifre Belirle'
                  : 'Set New Password'}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {locale === 'de'
                ? 'Geben Sie Ihr neues Passwort ein.'
                : locale === 'tr'
                  ? 'Yeni şifrenizi girin.'
                  : 'Enter your new password.'}
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
              <label htmlFor="new-password" className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">
                {locale === 'de' ? 'Neues Passwort' : locale === 'tr' ? 'Yeni Şifre' : 'New Password'}
              </label>
              <input
                id="new-password"
                type="password"
                className="w-full px-4 py-3 border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all bg-bg-card placeholder:text-text-muted text-text-primary"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">
                {locale === 'de' ? 'Passwort bestätigen' : locale === 'tr' ? 'Şifre Tekrar' : 'Confirm Password'}
              </label>
              <input
                id="confirm-password"
                type="password"
                className="w-full px-4 py-3 border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all bg-bg-card placeholder:text-text-muted text-text-primary"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-primary text-text-on-dark font-bold py-3.5 px-4 rounded-sm hover:bg-brand-hover transition-all duration-300 shadow-soft hover:shadow-medium disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center uppercase tracking-widest text-sm"
              disabled={isLoading}
            >
              {isLoading
                ? (locale === 'de' ? 'Wird gespeichert...' : locale === 'tr' ? 'Kaydediliyor...' : 'Saving...')
                : (locale === 'de' ? 'Passwort speichern' : locale === 'tr' ? 'Şifreyi Kaydet' : 'Save Password')}
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
