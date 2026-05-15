'use client';

import React from 'react';
import { StoreProvider } from '@/store';
import LangBoot from '@/i18n/LangBoot';
import ThemeProvider from '@/components/system/ThemeProvider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider>
        <LangBoot />
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </StoreProvider>
  );
}
