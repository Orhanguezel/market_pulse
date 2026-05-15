'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  useConfirmEmailVerificationMutation,
  useSendEmailVerificationMutation,
} from '@/integrations/rtk/hooks';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const mode = searchParams.get('mode');
  const email = searchParams.get('email');
  const locale = useLocaleShort();

  const [confirm, { isLoading }] = useConfirmEmailVerificationMutation();
  const [sendVerification, sendState] = useSendEmailVerificationMutation();
  const [status, setStatus] = useState<'pending' | 'success' | 'error' | 'no_token'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (mode === 'pending' && !token) {
      setStatus('pending');
      setMessage('');
      return;
    }

    if (!token) {
      setStatus('no_token');
      return;
    }

    confirm({ token })
      .unwrap()
      .then((res) => {
        setStatus('success');
        setMessage(res.message || '');
      })
      .catch((err) => {
        setStatus('error');
        const msg =
          (err as any)?.data?.error ||
          (err as any)?.data?.message ||
          'Verification failed';
        setMessage(msg);
      });
  }, [token, confirm]);

  const titleText =
    locale === 'de'
      ? 'E-Mail bestätigen'
      : locale === 'tr'
        ? 'E-postayı Doğrula'
        : 'Verify Email';
  const resendLabel =
    locale === 'de'
      ? 'Bestätigungs-E-Mail erneut senden'
      : locale === 'tr'
        ? 'Doğrulama e-postasını yeniden gönder'
        : 'Resend verification email';

  return (
    <section className="bg-bg-primary py-20 min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-bg-card p-8 md:p-12 rounded-lg shadow-soft text-center">
          {mode === 'pending' && !token ? (
            <>
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-light text-text-primary mb-3">{titleText}</h2>
              <p className="text-text-secondary mb-2">
                {locale === 'de'
                  ? 'Wir haben Ihnen eine Bestätigungs-E-Mail gesendet.'
                  : locale === 'tr'
                    ? 'Size bir doğrulama e-postası gönderdik.'
                    : 'We sent you a verification email.'}
              </p>
              {email ? (
                <p className="text-sm font-medium text-text-primary mb-6">{email}</p>
              ) : null}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={sendState.isLoading}
                  onClick={async () => {
                    try {
                      const res = await sendVerification().unwrap();
                      setMessage(res.message || '');
                    } catch (err) {
                      const msg =
                        (err as any)?.data?.error?.message ||
                        (err as any)?.data?.message ||
                        'verification_email_send_failed';
                      setMessage(msg);
                    }
                  }}
                  className="inline-flex w-full items-center justify-center bg-brand-primary text-text-on-dark font-bold py-3 px-6 rounded-sm hover:bg-brand-hover transition-all disabled:opacity-70"
                >
                  {sendState.isLoading ? '...' : resendLabel}
                </button>
                <Link
                  href={localizePath(locale, '/profile')}
                  className="inline-block w-full border border-border-light bg-bg-card text-text-primary font-semibold py-3 px-6 rounded-sm hover:bg-bg-card-hover transition-all"
                >
                  {locale === 'de' ? 'Zum Profil' : locale === 'tr' ? 'Profile Git' : 'Go to Profile'}
                </Link>
              </div>
              {message ? <p className="mt-4 text-sm text-text-secondary">{message}</p> : null}
            </>
          ) : isLoading || status === 'pending' ? (
            <>
              <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">
                {locale === 'de'
                  ? 'E-Mail wird verifiziert...'
                  : locale === 'tr'
                    ? 'E-posta doğrulanıyor...'
                    : 'Verifying your email...'}
              </p>
            </>
          ) : status === 'success' ? (
            <>
              <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-light text-text-primary mb-3">
                {locale === 'de'
                  ? 'E-Mail bestätigt!'
                  : locale === 'tr'
                    ? 'E-posta doğrulandı!'
                    : 'Email Verified!'}
              </h2>
              <p className="text-text-secondary mb-6">
                {locale === 'de'
                  ? 'Ihre E-Mail-Adresse wurde erfolgreich verifiziert.'
                  : locale === 'tr'
                    ? 'E-posta adresiniz başarıyla doğrulandı.'
                    : 'Your email address has been successfully verified.'}
              </p>
              <Link
                href={localizePath(locale, '/profile')}
                className="inline-block bg-brand-primary text-text-on-dark font-bold py-3 px-6 rounded-sm hover:bg-brand-hover transition-all"
              >
                {locale === 'de' ? 'Zum Profil' : locale === 'tr' ? 'Profile Git' : 'Go to Profile'}
              </Link>
            </>
          ) : status === 'no_token' ? (
            <>
              <div className="w-16 h-16 bg-warning/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-light text-text-primary mb-3">
                {locale === 'de'
                  ? 'Ungültiger Link'
                  : locale === 'tr'
                    ? 'Geçersiz Bağlantı'
                    : 'Invalid Link'}
              </h2>
              <p className="text-text-secondary mb-6">
                {locale === 'de'
                  ? 'Kein Verifizierungstoken gefunden.'
                  : locale === 'tr'
                    ? 'Doğrulama tokeni bulunamadı.'
                    : 'No verification token found.'}
              </p>
              <Link
                href={localizePath(locale, '/register')}
                className="inline-block bg-brand-primary text-text-on-dark font-bold py-3 px-6 rounded-sm hover:bg-brand-hover transition-all"
              >
                {locale === 'de' ? 'Zur Registrierung' : locale === 'tr' ? 'Kayıta Dön' : 'Back to Register'}
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-error/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-light text-text-primary mb-3">
                {locale === 'de'
                  ? 'Verifizierung fehlgeschlagen'
                  : locale === 'tr'
                    ? 'Doğrulama Başarısız'
                    : 'Verification Failed'}
              </h2>
              <p className="text-text-secondary mb-6">
                {message ||
                  (locale === 'de'
                    ? 'Der Link ist ungültig oder abgelaufen.'
                    : locale === 'tr'
                      ? 'Bağlantı geçersiz veya süresi dolmuş.'
                      : 'The link is invalid or has expired.')}
              </p>
              <Link
                href={localizePath(locale, '/profile')}
                className="inline-block bg-brand-primary text-text-on-dark font-bold py-3 px-6 rounded-sm hover:bg-brand-hover transition-all"
              >
                {locale === 'de' ? 'Zum Profil' : locale === 'tr' ? 'Profile Git' : 'Go to Profile'}
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
