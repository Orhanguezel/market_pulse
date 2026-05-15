'use client';

import React, { useMemo } from 'react';
import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import {
  pickFirstPublished,
  CMS_FALLBACK_CSS,
  downgradeH1ToH2,
  extractHtmlFromAny,
} from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';

const PrivacyNoticePageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_privacy_notice', locale as any);

  const { data, isLoading, isError } = useListCustomPagesPublicQuery({
    module_key: 'privacy_notice',
    locale,
    limit: 10,
    sort: 'created_at',
    orderDir: 'asc',
  });

  const page = useMemo(() => pickFirstPublished((data as any)?.items), [data]);

  const title = useMemo(() => {
    const t = String((page as any)?.title ?? '').trim();
    return (
      t ||
      String(ui('ui_privacy_notice_fallback_title', 'Privacy Notice') || '').trim() ||
      'Privacy Notice'
    );
  }, [page, ui]);

  const html = useMemo(() => {
    const raw = extractHtmlFromAny(page);
    const safe = raw ? downgradeH1ToH2(raw) : '';
    return safe;
  }, [page]);

  return (
    <section className="bg-bg-primary relative min-h-[60vh] py-20 lg:py-32">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-bg-card-hover rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-rose-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {isLoading && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="h-4 bg-bg-card-hover rounded w-full animate-pulse" />
            <div className="h-4 bg-bg-card-hover rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-bg-card-hover rounded w-4/6 animate-pulse" />
          </div>
        )}

        {!isLoading && (isError || !page) && (
          <div className="max-w-4xl mx-auto">
            <div
              className="bg-bg-card border border-border-light text-text-primary px-6 py-4 rounded-xl"
              role="alert"
            >
              {ui('ui_privacy_notice_empty', 'Content not found.')}
            </div>
          </div>
        )}

        {!!page && !isLoading && (
          <div className="max-w-4xl mx-auto">
            <style>{CMS_FALLBACK_CSS}</style>

            <div className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-serif font-light text-text-primary mb-4">
                {title}
              </h1>
              <div className="h-1 w-24 bg-brand-primary mx-auto rounded-full" />
            </div>

            {html ? (
              <article
                className="prose prose-stone prose-lg max-w-none bg-bg-card p-8 md:p-12 shadow-sm border border-border-light cms-html"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div
                className="bg-bg-card border border-border-light text-text-primary px-6 py-4 rounded-xl"
                role="alert"
              >
                {ui('ui_privacy_notice_empty_text', 'Content coming soon.')}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PrivacyNoticePageContent;
