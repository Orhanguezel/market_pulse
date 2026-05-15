'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';

import { useSocialLoginMutation } from '@/integrations/rtk/public/auth.endpoints';
import { tokenStore } from '@/integrations/rtk/token';
import { normalizeError } from '@/integrations/shared';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';

// ─── Facebook SDK type minimal ───────────────────────────────
type FBAuthResponse = { accessToken: string };
type FBLoginResponse = { authResponse?: FBAuthResponse };
type FBUserInfo = { email?: string; id?: string; name?: string };
type FBSDK = {
  init: (cfg: { appId?: string; cookie: boolean; xfbml: boolean; version: string }) => void;
  login: (
    cb: (resp: FBLoginResponse) => void,
    opts: { scope: string },
  ) => void;
  api: (path: string, params: { fields: string }, cb: (info: FBUserInfo) => void) => void;
};
declare global {
  interface Window {
    FB?: FBSDK;
    AppleID?: {
      auth: {
        init: (cfg: {
          clientId: string;
          scope: string;
          redirectURI: string;
          state: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: { id_token: string; code?: string };
          user?: {
            email?: string;
            name?: { firstName?: string; lastName?: string };
          };
        }>;
      };
    };
  }
}

type Props = {
  /** Login sonrası gidilecek URL (yoksa dashboard) */
  nextHref?: string;
  /** Sıralama: row (yan yana) | column (alt alta) */
  layout?: 'row' | 'column';
  className?: string;
};

// ─── Inner ───────────────────────────────────────────────────
function SocialButtonsInner({
  onGoogleClick,
  canUseGoogle,
  canUseFacebook,
  canUseApple,
  layout = 'row',
  className,
  isLoading,
}: {
  onGoogleClick?: () => void;
  canUseGoogle: boolean;
  canUseFacebook: boolean;
  canUseApple: boolean;
  layout?: 'row' | 'column';
  className?: string;
  isLoading: boolean;
}) {
  const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

  React.useEffect(() => {
    if (!canUseApple || !appleClientId || typeof window === 'undefined') return;

    // 1) AppleID JS SDK'yı yükle (idempotent)
    const SDK_ID = 'apple-id-sdk';
    if (!document.getElementById(SDK_ID)) {
      const s = document.createElement('script');
      s.id = SDK_ID;
      s.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    }

    // 2) SDK hazır olunca init et
    const t = setInterval(() => {
      if (window.AppleID) {
        clearInterval(t);
        try {
          window.AppleID.auth.init({
            clientId: appleClientId,
            scope: 'name email',
            redirectURI: appleRedirectUri || `${window.location.origin}/auth/apple/callback`,
            state: crypto.randomUUID(),
            usePopup: true,
          });
        } catch (e) {
          console.error('AppleID init failed', e);
        }
      }
    }, 500);
    return () => clearInterval(t);
  }, [appleClientId, appleRedirectUri, canUseApple]);

  const handleAppleLogin = async () => {
    if (!canUseApple || !appleClientId || !window.AppleID) return;
    try {
      const data = await window.AppleID.auth.signIn();
      const fullName = data.user?.name
        ? `${data.user.name.firstName ?? ''} ${data.user.name.lastName ?? ''}`.trim()
        : undefined;

      const evt = new CustomEvent('gm:apple-token', {
        detail: {
          identity_token: data.authorization.id_token,
          authorization_code: data.authorization.code,
          apple_user_name: fullName,
          email: data.user?.email,
        },
      });
      window.dispatchEvent(evt);
    } catch (err) {
      console.warn('Apple sign-in cancelled', err);
    }
  };

  const handleFacebook = useCallback(() => {
    if (!canUseFacebook) return;

    const init = () => {
      const FB = window.FB;
      if (!FB) return;
      FB.init({ appId: facebookAppId, cookie: true, xfbml: false, version: 'v19.0' });
      FB.login(
        (resp) => {
          if (!resp.authResponse) return;
          const accessToken = resp.authResponse.accessToken;
          FB.api('/me', { fields: 'email,name,id' }, (info) => {
            const evt = new CustomEvent('gm:fb-token', {
              detail: { accessToken, email: info.email },
            });
            window.dispatchEvent(evt);
          });
        },
        { scope: 'email,public_profile' },
      );
    };

    const exists = document.getElementById('facebook-jssdk');
    if (exists) {
      init();
    } else {
      const s = document.createElement('script');
      s.id = 'facebook-jssdk';
      s.src = 'https://connect.facebook.net/tr_TR/sdk.js';
      s.async = true;
      s.defer = true;
      s.onload = init;
      document.body.appendChild(s);
    }
  }, [canUseFacebook, facebookAppId]);

  if (!canUseGoogle && !canUseFacebook && !canUseApple) return null;

  const containerCls =
    layout === 'row' ? 'grid gap-3 sm:grid-cols-2' : 'flex flex-col gap-3';

  return (
    <div className={['space-y-4', className].filter(Boolean).join(' ')}>
      <div className={containerCls}>
        {canUseGoogle && (
          <button
            type="button"
            onClick={onGoogleClick}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-3 rounded-sm border border-(--gm-border-soft) bg-(--gm-surface) px-4 py-3 text-sm font-medium text-(--gm-text) transition-all hover:border-(--gm-gold)/40 hover:bg-(--gm-surface) hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <img src="/icons/google.png" alt="" width={18} height={18} />
            <span>Google ile devam et</span>
          </button>
        )}
        {canUseFacebook && (
          <button
            type="button"
            onClick={handleFacebook}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-3 rounded-sm border border-(--gm-border-soft) bg-(--gm-surface) px-4 py-3 text-sm font-medium text-(--gm-text) transition-all hover:border-(--gm-gold)/40 hover:bg-(--gm-surface) hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <img src="/icons/facebook.png" alt="" width={18} height={18} />
            <span>Facebook ile devam et</span>
          </button>
        )}
        {canUseApple && (
          <button
            type="button"
            onClick={handleAppleLogin}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-3 rounded-sm border border-(--gm-border-soft) bg-(--gm-surface) px-4 py-3 text-sm font-medium text-(--gm-text) transition-all hover:border-(--gm-gold)/40 hover:bg-(--gm-surface) hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 384 512" width={18} height={18} fill="currentColor" className="text-(--gm-text)">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            <span>Apple ile devam et</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Google + listener wrapper ───────────────────────────────
function WithGoogle({ nextHref, layout, className }: Props) {
  const router = useRouter();
  const locale = useLocaleShort();
  const [socialLogin, { isLoading }] = useSocialLoginMutation();

  const finish = useCallback(
    async (payload: any) => {
      try {
        const resp = await socialLogin(payload).unwrap();
        if ((resp as any).access_token) tokenStore.set((resp as any).access_token);
        if (typeof window !== 'undefined' && (resp as any).user) {
          window.localStorage.setItem('user', JSON.stringify((resp as any).user));
        }
        toast.success('Giriş başarılı');
        router.push(nextHref || localizePath(locale, '/dashboard'));
      } catch (err) {
        toast.error(normalizeError(err).message || 'Sosyal giriş başarısız.');
      }
    },
    [socialLogin, router, nextHref, locale],
  );

  // Custom event listeners
  React.useEffect(() => {
    const fbHandler = (e: Event) => {
      const ce = e as CustomEvent<{ accessToken: string; email?: string }>;
      finish({
        type: 'facebook',
        access_token: ce.detail.accessToken,
        email: ce.detail.email,
      });
    };
    const appleHandler = (e: Event) => {
      const ce = e as CustomEvent<any>;
      finish({
        type: 'apple',
        ...ce.detail,
      });
    };
    window.addEventListener('gm:fb-token', fbHandler as EventListener);
    window.addEventListener('gm:apple-token', appleHandler as EventListener);
    return () => {
      window.removeEventListener('gm:fb-token', fbHandler as EventListener);
      window.removeEventListener('gm:apple-token', appleHandler as EventListener);
    };
  }, [finish]);

  const triggerGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      if (!tokenResponse.access_token) return;
      finish({ type: 'google', access_token: tokenResponse.access_token });
    },
    onError: () => toast.error('Google ile giriş iptal edildi.'),
    scope: 'email profile',
  });

  return (
    <SocialButtonsInner
      canUseGoogle
      canUseFacebook={Boolean(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID)}
      canUseApple={Boolean(process.env.NEXT_PUBLIC_APPLE_CLIENT_ID)}
      layout={layout}
      className={className}
      isLoading={isLoading}
      onGoogleClick={() => triggerGoogle()}
    />
  );
}

// ─── Public component ────────────────────────────────────────
export default function SocialLoginButtons(props: Props) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

  if (!googleClientId && !facebookAppId && !appleClientId) return null;

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <WithGoogle {...props} />
      </GoogleOAuthProvider>
    );
  }

  // Sadece Facebook varsa, Google provider'a sarmadan render et
  return (
    <FacebookOnly {...props} />
  );
}

function FacebookOnly({ nextHref, layout, className }: Props) {
  const router = useRouter();
  const locale = useLocaleShort();
  const [socialLogin, { isLoading }] = useSocialLoginMutation();

  const finish = useCallback(
    async (payload: any) => {
      try {
        const resp = await socialLogin(payload).unwrap();
        if ((resp as any).access_token) tokenStore.set((resp as any).access_token);
        if (typeof window !== 'undefined' && (resp as any).user) {
          window.localStorage.setItem('user', JSON.stringify((resp as any).user));
        }
        toast.success('Giriş başarılı');
        router.push(nextHref || localizePath(locale, '/dashboard'));
      } catch (err) {
        toast.error(normalizeError(err).message || 'Sosyal giriş başarısız.');
      }
    },
    [socialLogin, router, nextHref, locale],
  );

  React.useEffect(() => {
    const fbHandler = (e: Event) => {
      const ce = e as CustomEvent<{ accessToken: string; email?: string }>;
      finish({
        type: 'facebook',
        access_token: ce.detail.accessToken,
        email: ce.detail.email,
      });
    };
    const appleHandler = (e: Event) => {
      const ce = e as CustomEvent<any>;
      finish({
        type: 'apple',
        ...ce.detail,
      });
    };
    window.addEventListener('gm:fb-token', fbHandler as EventListener);
    window.addEventListener('gm:apple-token', appleHandler as EventListener);
    return () => {
      window.removeEventListener('gm:fb-token', fbHandler as EventListener);
      window.removeEventListener('gm:apple-token', appleHandler as EventListener);
    };
  }, [finish]);

  return (
    <SocialButtonsInner
      canUseGoogle={false}
      canUseFacebook={Boolean(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID)}
      canUseApple={Boolean(process.env.NEXT_PUBLIC_APPLE_CLIENT_ID)}
      layout={layout}
      className={className}
      isLoading={isLoading}
    />
  );
}
