// =============================================================
// FILE: src/components/containers/auth/Logout.tsx
// FINAL – Auth Logout
// =============================================================

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogoutMutation } from '@/integrations/rtk/hooks';
import { tokenStore } from '@/integrations/rtk/token';
import { normalizeError } from '@/integrations/shared';

// i18n
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

const Logout: React.FC = () => {
  const router = useRouter();
  const [logout, logoutState] = useLogoutMutation();

  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_auth', locale as any);

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      try {
        await logout().unwrap();
      } catch (err) {
        if (!canceled) {
          const n = normalizeError(err as any);
          console.warn('logout error:', n.message);
        }
      } finally {
        tokenStore.set(null);
        if (!canceled) {
          router.push(localizePath(locale, '/login'));
        }
      }
    };
    run();
    return () => {
      canceled = true;
    };
  }, [logout, router, locale]);

  return (
    <section className="bg-bg-primary min-h-screen pt-32 pb-32 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="p-10 bg-bg-card rounded-lg shadow-soft border border-border-light">
            <div className="mb-6 flex justify-center">
               <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
            
            <h3 className="text-2xl font-serif font-light text-text-primary mb-4">
              {ui('logout_title', 'Signing out...')}
            </h3>
            
            <p className="text-text-secondary leading-relaxed mb-4">
              {ui('logout_lead', 'Please wait session is being cleared.')}
            </p>

            {logoutState.isError && (
              <p
                role="alert"
                aria-live="polite"
                className="text-rose-600 text-sm bg-rose-50 p-2 rounded inline-block border border-rose-100"
              >
                {ui('logout_error', 'Problem signing out on server, but local session cleared.')}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Logout;
