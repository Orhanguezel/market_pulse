import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { Inter, Playfair_Display } from 'next/font/google';

import HomeContent from '@/components/containers/home/HomeContent';
import { Providers } from './providers';
import ClientLayout from './ClientLayout';
import { getDefaultLocale } from '@/i18n/server';
import { buildMetadataFromSeo, fetchSeoObject } from '@/seo/server';

// Configure fonts
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-serif',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getDefaultLocale();
  const seo = await fetchSeoObject(locale);
  // Root home page canonical should point to the root "/"
  return await buildMetadataFromSeo(seo, { locale, pathname: '/' });
}

export default async function RootPage() {
  const locale = await getDefaultLocale();
  return (
    <div className={`font-sans antialiased text-text-primary bg-bg-primary ${inter.variable} ${playfair.variable}`}>
       <Providers>
         <Suspense fallback={null}>
           <ClientLayout locale={locale}>
             <HomeContent locale={locale} />
           </ClientLayout>
         </Suspense>
       </Providers>
    </div>
  );
}
