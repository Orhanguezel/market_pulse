import type { Metadata } from 'next';
import type React from 'react';

import { buildAuthPageMetadata } from '../_authMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return await buildAuthPageMetadata(locale, 'login');
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

