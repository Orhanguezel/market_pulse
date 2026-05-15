import 'server-only';

import type { Metadata } from 'next';

import { normPath, absUrlJoin } from '@/integrations/shared';
import { buildMetadataFromSeo, fetchSeoObject, fetchUiSectionObject, readUiText } from '@/seo/server';

type AuthKind = 'login' | 'register' | 'logout';

const PATH_BY_KIND: Record<AuthKind, string> = {
  login: '/login',
  register: '/register',
  logout: '/logout',
};

export async function buildAuthPageMetadata(locale: string, kind: AuthKind): Promise<Metadata> {
  const [seo, ui] = await Promise.all([fetchSeoObject(locale), fetchUiSectionObject('ui_auth', locale)]);

  const pathname = normPath(PATH_BY_KIND[kind]);
  const base = await buildMetadataFromSeo(seo, { locale, pathname });

  const titleKey = `ui_auth_${kind}_meta_title`;
  const descKey = `ui_auth_${kind}_meta_description`;

  const legacyTitleKey = `${kind}_meta_title`;
  const legacyDescKey = `${kind}_meta_desc`;

  const pageTitle = readUiText(ui, titleKey) || readUiText(ui, legacyTitleKey, '');
  const pageDescription = readUiText(ui, descKey) || readUiText(ui, legacyDescKey, '');

  const ogRaw = readUiText(ui, `ui_auth_${kind}_og_image`, '');
  const baseUrl = base.metadataBase?.toString() || '';
  const ogAbs = ogRaw ? absUrlJoin(baseUrl, ogRaw) : '';

  return {
    ...base,
    ...(pageTitle ? { title: pageTitle } : {}),
    ...(pageDescription ? { description: pageDescription } : {}),
    // Auth pages: generally should not be indexed
    robots: { index: false, follow: false },
    openGraph: {
      ...(base.openGraph || {}),
      ...(pageTitle ? { title: pageTitle } : {}),
      ...(pageDescription ? { description: pageDescription } : {}),
      ...(ogAbs ? { images: [{ url: ogAbs }] } : {}),
    },
    twitter: {
      ...(base.twitter || {}),
      ...(ogAbs ? { images: [ogAbs] } : {}),
    },
  };
}

