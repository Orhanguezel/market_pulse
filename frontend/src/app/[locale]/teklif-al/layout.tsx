import type { Metadata } from 'next';
import type React from 'react';

import { getPublicAppName } from '@/lib/site-config';

type RouteParams = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const appName = getPublicAppName();
  const short = locale.split('-')[0]?.toLowerCase();

  if (short === 'en') {
    return {
      title: 'Get a Quote',
      description: `Request a quote or a demo from ${appName}. Tell us about your business and we will get back to you quickly.`,
    };
  }
  if (short === 'de') {
    return {
      title: 'Angebot anfordern',
      description: `Fordern Sie ein Angebot oder eine Demo von ${appName} an. Erzählen Sie uns von Ihrem Unternehmen und wir melden uns schnell bei Ihnen.`,
    };
  }
  return {
    title: 'Teklif Al',
    description: `${appName} için teklif veya demo talep edin. İşletmenizi ve ihtiyaçlarınızı paylaşın, ekibimiz kısa süre içinde size dönüş yapsın.`,
  };
}

export default function TeklifAlLayout({ children }: { children: React.ReactNode }) {
  return children;
}
