'use client';

import React, { useMemo } from 'react';
import Banner from '@/layout/banner/Breadcrum';
import PrivacyNoticePageContent from '@/components/containers/legal/PrivacyNoticePageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText } from '@/integrations/shared';
import { safeStr } from '@/integrations/shared';

export default function PrivacyNoticePage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_privacy_notice', locale as any);

  const bannerTitle = useMemo(() => {
    const key = 'ui_privacy_notice_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : 'Privacy Notice';
  }, [ui]);

  return (
    <>
      <LayoutSeoBridge title={bannerTitle} noindex={false} />
      <Banner title={bannerTitle} />

      <section className="container mx-auto py-16 px-4 bg-bg-primary">
        <PrivacyNoticePageContent />
      </section>
    </>
  );
}
