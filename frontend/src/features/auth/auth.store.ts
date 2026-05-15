'use client';

import { useMemo } from 'react';
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
  const hasToken = typeof window !== 'undefined' ? !!tokenStore.get() : false;
  const { data, isLoading, isFetching, isUninitialized, isError } = useMeQuery(undefined, {
    skip: !hasToken,
  });

  return useMemo<AuthState>(() => {
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
  }, [data, hasToken, isLoading, isFetching, isUninitialized, isError]);
}
