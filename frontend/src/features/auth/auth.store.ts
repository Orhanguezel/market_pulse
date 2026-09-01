'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useMeQuery } from '@/integrations/rtk/hooks';
import { tokenStore } from '@/integrations/rtk/token';
import type { User } from '@/integrations/shared';

type AuthState = {
  isAuthenticated: boolean;
  /** True iken ME sorgusu hala beklemekte; redirect kararı vermeyin. */
  isLoading: boolean;
  /** True olunca isAuthenticated nihai cevabı verir (token yok ya da ME tamamlandı). */
  isReady: boolean;
  user: User | null;
};

export function useAuthStore(): AuthState {
  // Server ve browser'in ilk render'i ayni olmali. Token sadece browser'da
  // okunursa AppShell SSR'da bos, hydration'da spinner render ederek React #418
  // uretir. Hydration sonrasinda snapshot true olur ve ME sorgusu baslar.
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const hasToken = hydrated ? !!tokenStore.get() : false;
  const { data, isLoading, isFetching, isUninitialized, isError } = useMeQuery(undefined, {
    skip: !hasToken,
  });

  return useMemo<AuthState>(() => {
    if (!hydrated) {
      return { isAuthenticated: false, isLoading: true, isReady: false, user: null };
    }
    const user = data?.user ?? null;

    // Token yok → hemen "unauthenticated/ready" durumu
    if (!hasToken) {
      return { isAuthenticated: false, isLoading: false, isReady: true, user: null };
    }

    // Token var ama sorgu bitmedi → loading
    const stillLoading = isUninitialized || isLoading || isFetching;
    if (stillLoading && !isError) {
      return { isAuthenticated: false, isLoading: true, isReady: false, user: null };
    }

    // Sorgu bitti
    return {
      isAuthenticated: !!user,
      isLoading: false,
      isReady: true,
      user,
    };
  }, [data, hasToken, hydrated, isLoading, isFetching, isUninitialized, isError]);
}
