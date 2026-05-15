// src/layout/header/Header.tsx
// Sync passthrough — async olamaz çünkü parent ClientLayout 'use client'.
// Menu items SSR fetch'i app/[locale]/layout.tsx (server component) içinde yapılır,
// initialMenuItems props zincirinden geçer.

import React from 'react';
import HeaderClient from './HeaderClient';
import type { PublicMenuItemDto } from '@/integrations/shared';

type SimpleBrand = {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  socials?: Record<string, string>;
};

export type HeaderProps = {
  brand?: SimpleBrand;
  locale?: string;
  initialMenuItems?: PublicMenuItemDto[];
};

export default function Header({ brand, locale, initialMenuItems }: HeaderProps) {
  return <HeaderClient brand={brand} locale={locale} initialMenuItems={initialMenuItems} />;
}
