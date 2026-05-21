// =============================================================
// FILE: src/app/(main)/admin/dashboard/_components/admin-auth-gate.tsx
// FINAL — Admin Auth Gate (RTK status)
// - NO manual fetch
// - Redirects to /auth/login when not admin
// =============================================================

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useStatusQuery } from '@/integrations/hooks';
import type { AuthStatusResponse } from '@/integrations/shared';
import { normalizeMeFromStatus } from '@/integrations/shared';
import { tokenStore } from '@/integrations/core/token';

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasToken = Boolean(tokenStore.get());

  // RTK GET /auth/status
  const q = useStatusQuery(undefined, { skip: !hasToken });

  React.useEffect(() => {
    if (!hasToken) {
      router.replace('/auth/login');
      return;
    }

    if (q.isFetching) return;
    if (q.isUninitialized) return;

    const data = q.data as AuthStatusResponse | undefined;
    const me = normalizeMeFromStatus(data);

    if (!me || me.isAdmin !== true) {
      router.replace('/auth/login');
    }
  }, [hasToken, q.isFetching, q.isUninitialized, q.data, router]);

  // Loading state (blank or skeleton)
  if (!hasToken || q.isFetching || q.isUninitialized) {
    return null; // istersen burada spinner/skeleton bas
  }

  // If unauthorized, effect will redirect; avoid flashing UI
  const me = normalizeMeFromStatus(q.data as AuthStatusResponse | undefined);
  if (!me || me.isAdmin !== true) return null;

  return <>{children}</>;
}
