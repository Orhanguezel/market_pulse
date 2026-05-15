// =============================================================
// FILE: src/components/containers/faqs/FaqsPageContent.tsx
//s Massage – Full FAQs Page Content [FINAL]
// - Tailwind v4 Semantic Tokens
// - Standard Accordion
// =============================================================

'use client';

import React, { useMemo, useState, useEffect, useId, useCallback } from 'react';

import { useListFaqsQuery } from '@/integrations/rtk/hooks';
import type { FaqDto } from '@/integrations/shared';
import { normalizeFaq, safeStr } from '@/integrations/shared';
import { faqPage } from '@/seo/jsonld';
import JsonLd from '@/seo/JsonLd';

// i18n
import { useLocaleShort, useUiSection } from '@/i18n';
import { getPublicAppName } from '@/lib/site-config';

const FaqsPageContent: React.FC = () => {
  const uid = useId();
  const locale = useLocaleShort();
  const app = getPublicAppName();

  const { ui } = useUiSection('ui_faqs', locale as any);
  const t = useCallback((key: string, fallback: string) => ui(key, fallback), [ui]);

  // UI Strings
  const kickerPrefix = safeStr(t('ui_faqs_kicker_prefix', app));
  const kickerLabel = safeStr(t('ui_faqs_kicker_label', 'Sıkça Sorulan Sorular'));

  const titlePrefix = safeStr(t('ui_faqs_page_title_prefix', 'Common'));
  const titleMark = safeStr(t('ui_faqs_page_title_mark', 'Questions'));

  const intro = safeStr(
    t(
      'ui_faqs_intro',
      `${app} hakkında merak ettiğiniz cevapları bulun.`,
    ),
  );

  const emptyText = safeStr(t('ui_faqs_empty', 'There are no FAQs to display at the moment.'));
  const untitled = safeStr(t('ui_faqs_untitled', 'Untitled question'));
  const noAnswer = safeStr(
    t('ui_faqs_no_answer', 'No answer has been provided for this question yet.'),
  );
  const footerNote = safeStr(
    t(
      'ui_faqs_footer_note',
      'If you cannot find the answer you are looking for, please contact us.',
    ),
  );

  const { data = [], isLoading } = useListFaqsQuery(
    {
      is_active: 1,
      sort: 'display_order',
      orderDir: 'asc',
      limit: 200,
      locale,
    } as any,
    { skip: !locale },
  );

  const faqs = useMemo(() => {
    const list = (Array.isArray(data) ? data : []) as FaqDto[];

    return list
      .map((dto) => normalizeFaq(dto))
      .filter((f) => !!f && !!f.is_active)
      .sort((a, b) => {
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        const ac = safeStr(a.created_at);
        const bc = safeStr(b.created_at);
        return ac.localeCompare(bc);
      });
  }, [data]);

  const hasFaqs = faqs.length > 0;

  // FAQPage JSON-LD schema
  const faqSchema = useMemo(() => {
    if (!hasFaqs) return null;
    return faqPage(
      faqs.map((f) => ({
        question: safeStr(f.question) || '',
        answer: safeStr(f.answer) || '',
      })),
    );
  }, [faqs, hasFaqs]);

  // open state (first item auto-open)
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFaqs) {
      setOpenId(null);
      return;
    }
    if (openId == null) setOpenId(safeStr(faqs[0]?.id) || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFaqs, faqs]); // run only when list changes

  return (
    <section className="bg-bg-primary py-20 min-h-screen">
      {faqSchema && <JsonLd data={faqSchema} id="faq-page" />}
      <div className="container mx-auto px-4">
        {/* HEADER */}
        <div className="text-center mb-16 max-w-3xl mx-auto" data-aos="fade-up">
          <span className="text-brand-primary font-bold text-sm uppercase tracking-widest block mb-3">
            <span>{kickerPrefix}</span> {kickerLabel}
          </span>

          <h2 className="text-4xl md:text-5xl font-serif font-light text-text-primary mb-6">
            {titlePrefix}{' '}
            <span className="text-brand-primary border-b-2 border-brand-primary/20 pb-1">
              {titleMark}
            </span>
          </h2>

          {intro && <p className="text-text-secondary text-lg leading-relaxed">{intro}</p>}
        </div>

        {/* ACCORDION */}
        <div className="max-w-4xl mx-auto" data-aos="fade-up" data-aos-delay="200">
          <div className="space-y-4">
            {/* EMPTY */}
            {!isLoading && !hasFaqs && (
              <div className="bg-bg-card p-8 shadow-soft text-center border border-border-light">
                <p className="text-text-muted">{emptyText}</p>
              </div>
            )}

            {/* LOADING */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-bg-card p-6 border border-border-light shadow-soft animate-pulse"
                  >
                    <div className="h-6 bg-bg-card-hover rounded w-2/3 mb-4" />
                    <div className="h-4 bg-bg-card-hover rounded w-full" />
                  </div>
                ))}
              </div>
            )}

            {/* ITEMS */}
            {faqs.map((faq, idx) => {
              const id = safeStr(faq.id) || `${uid}-${idx}`;
              const isOpen = openId === id;

              const headingId = `faqHeading-${id}`;
              const panelId = `faqCollapse-${id}`;

              const q = safeStr(faq.question) || untitled;
              const a = safeStr(faq.answer);

              return (
                <div
                  className="bg-bg-card border border-border-light shadow-soft overflow-hidden transition-all duration-300 hover:border-brand-primary/20 hover:shadow-medium"
                  key={id}
                >
                  <h2>
                    <button
                      type="button"
                      className={`w-full text-left px-6 py-5 flex justify-between items-center font-bold text-lg md:text-xl transition-colors ${
                        isOpen ? 'text-brand-primary' : 'text-text-primary hover:text-brand-primary'
                      }`}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      id={headingId}
                      onClick={() => setOpenId((prev) => (prev === id ? null : id))}
                    >
                      <span className="font-serif">{q}</span>
                      <span
                        className={`ml-4 transform transition-transform duration-300 flex-shrink-0 w-8 h-8 flex items-center justify-center bg-bg-card ${isOpen ? 'rotate-180 bg-brand-primary/10 text-brand-primary' : 'text-text-muted'}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </span>
                    </button>
                  </h2>

                  <div
                    id={panelId}
                    className={`transition-all duration-300 ease-in-out overflow-hidden bg-bg-card/50 ${
                      isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                    aria-labelledby={headingId}
                  >
                    <div className="p-6 pt-2 text-text-secondary leading-relaxed border-t border-border-light/50">
                      {a ? (
                        <div
                          className="prose prose-rose max-w-none"
                          dangerouslySetInnerHTML={{ __html: a }}
                        />
                      ) : (
                        <p className="text-text-muted italic text-sm">{noAnswer}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FOOTER NOTE */}
          {footerNote && (
            <div className="text-center mt-12 bg-bg-card/50 backdrop-blur-sm p-6 border border-border-light">
              <p className="text-text-secondary font-medium mb-0">{footerNote}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FaqsPageContent;
