'use client';

import React, { useMemo } from 'react';
import Banner from '@/layout/banner/Breadcrum';
import PublicBanner from '@/components/common/public/Banner';
import BlogPageContent from '@/components/containers/blog/BlogPageContent';
import Feedback from '@/components/containers/feedback/Feedback';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText } from '@/integrations/shared';
import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/shared';
import { safeStr } from '@/integrations/shared';

export default function BlogPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_blog', locale as any);

  // -----------------------------
  // Banner title (UI)
  // -----------------------------
  const bannerTitle = useMemo(() => {
    const key = 'ui_blog_page_title';
    const v = safeStr(ui(key, 'Blog'));
    return isValidUiText(v, key) ? v : 'Blog';
  }, [ui]);

  // -----------------------------
  // Blog custom pages (meta override için: ilk published kayıt)
  // PERF: limit küçük
  // -----------------------------
  const { data: blogData } = useListCustomPagesPublicQuery({
    module_key: 'blog',
    locale,
    limit: 5,
    sort: 'created_at',
    orderDir: 'asc',
  });

  const primary = useMemo<CustomPageDto | null>(() => {
    const items = (blogData?.items ?? []) as any[];
    if (!Array.isArray(items) || items.length === 0) return null;

    for (const it of items) {
      if (it && it.is_published) return it as CustomPageDto;
    }
    return null;
  }, [blogData?.items]);

  // -----------------------------
  // Page SEO (override only what you need)
  // -----------------------------
  const pageTitle = useMemo(() => {
    const key = 'ui_blog_meta_title';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    const mt = safeStr(primary?.meta_title);
    if (mt) return mt;

    const t = safeStr(primary?.title);
    if (t) return t;

    return bannerTitle || 'Blog';
  }, [ui, primary?.meta_title, primary?.title, bannerTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_blog_meta_description';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    const md = safeStr(primary?.meta_description);
    if (md) return md;

    return '';
  }, [ui, primary]);

  const ogImageOverride = useMemo(() => {
    // Just basic handling
    return undefined;
  }, []);

  return (
    <>
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription}
        ogImage={ogImageOverride}
        noindex={false}
      />

      <Banner title={bannerTitle} />

      <div className="bg-bg-primary min-h-[50vh]">
        <section className="container mx-auto py-16 px-4">
          <BlogPageContent />
        </section>

        <section className="container mx-auto pb-16 px-4">
          <PublicBanner placement="blog_inline" variant="slim" count={1} dismissable />
        </section>

        <section className="container mx-auto pb-16 px-4">
          <Feedback />
        </section>
      </div>
    </>
  );
}
