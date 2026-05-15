// =============================================================
// FILE: src/i18n/IntlProviderClient.tsx
// =============================================================
"use client";

import * as React from "react";

type Props = {
  locale: string;
  messages: Record<string, unknown>;
  children: React.ReactNode;
};

/**
 * Not:
 * Bu projede şu anda next-intl kullanılmıyor.
 * Wrapper sadece children'ı döndürür.
 */
export default function IntlProviderClient({ children }: Props) {
  return <>{children}</>;
}
