'use client';

import React, { useMemo } from 'react';
import Banner from '@/layout/banner/Breadcrum';
import TermsPageContent from '@/components/containers/legal/TermsPageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText, safeStr } from '@/integrations/shared';

export default function KullanimSartlariPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_terms', locale as any);

  const bannerTitle = useMemo(() => {
    const key = 'ui_terms_fallback_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'Kullanım Şartları';
  }, [ui]);

  return (
    <>
      <LayoutSeoBridge title={bannerTitle} noindex={false} />
      <Banner title={bannerTitle} />

      <section className="container mx-auto py-16 px-4 bg-bg-primary">
        <TermsPageContent />
      </section>
    </>
  );
}
