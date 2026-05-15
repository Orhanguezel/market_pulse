'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useListReviewsPublicQuery } from '@/integrations/rtk/hooks';
import type { ReviewDto } from '@/integrations/shared';
import { safeStr, excerpt, clampRating } from '@/integrations/shared';

import { useResolvedLocale, useUiSection } from '@/i18n';
import FeedbackFormModal from './FeedbackFormModal';
import { getPublicAppName } from '@/lib/site-config';

type FeedbackSlide = {
  id: string;
  name: string;
  title: string;
  text: string;
  rating: number;
};

const TARGET_TYPE = 'testimonial';
const TARGET_ID = process.env.NEXT_PUBLIC_FEEDBACK_TARGET_ID?.trim() || 'site';

const Feedback: React.FC<{ locale?: string }> = ({ locale: explicitLocale }) => {
  const locale = useResolvedLocale(explicitLocale);
  const { ui } = useUiSection('ui_feedback', locale);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data, isLoading } = useListReviewsPublicQuery({
    minRating: 1, limit: 12, orderBy: 'display_order', order: 'asc',
    locale, approved: 1, active: 1, target_type: TARGET_TYPE, target_id: TARGET_ID,
  }, { skip: !mounted });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const slides: FeedbackSlide[] = useMemo(() => {
    const list: ReviewDto[] = Array.isArray(data) ? data : [];
    return list.map((r) => ({
      id: String(r.id),
      name: safeStr(r.name),
      title: safeStr((r as any).title),
      text: excerpt(safeStr(r.comment), 280),
      rating: clampRating(Number(r.rating || 5)) | 0,
    }));
  }, [data]);

  const t = useMemo(() => ({
    title: safeStr(ui('ui_feedback_title')) || 'Kundenstimmen',
    paragraph: safeStr(ui('ui_feedback_paragraph')),
    writeBtn: safeStr(ui('ui_feedback_write_button')) || 'Bewertung schreiben',
    modalTitle: safeStr(ui('ui_feedback_modal_title')),
    close: safeStr(ui('ui_common_close')) || 'Close',
    submit: safeStr(ui('ui_feedback_submit')) || 'Submit',
    sending: safeStr(ui('ui_feedback_sending')) || 'Sending...',
    fName: safeStr(ui('ui_feedback_field_name')) || 'Name',
    fEmail: safeStr(ui('ui_feedback_field_email')) || 'Email',
    fRating: safeStr(ui('ui_feedback_field_rating')) || 'Rating',
    fComment: safeStr(ui('ui_feedback_field_comment')) || 'Comment',
    errName: safeStr(ui('ui_feedback_error_name')) || 'Name required',
    errEmail: safeStr(ui('ui_feedback_error_email')) || 'Invalid email',
    errComment: safeStr(ui('ui_feedback_error_comment')) || 'Comment required',
    errGeneric: safeStr(ui('ui_feedback_error_generic')) || 'Error occurred',
    okMsg: safeStr(ui('ui_feedback_success')) || 'Review submitted successfully!',
  }), [ui]);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  if (!isLoading && slides.length === 0) return null;

  const displaySlides = slides.slice(0, 3);

  return (
    <section className="bg-bg-secondary py-28 lg:py-36" style={{ padding: '7rem 4%' }}>
      {/* Header */}
      <div className="text-center max-w-[600px] mx-auto mb-16 reveal">
        <span className="section-label">
          {ui('ui_feedback_sublabel', locale === 'de' ? 'Kundenstimmen' : locale === 'tr' ? 'Yorumlar' : 'Testimonials')}
        </span>
        <h2 className="font-serif text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.2] mb-5">
          {t.title}
        </h2>
        {t.paragraph && (
          <p className="text-text-secondary font-light leading-[1.8] text-base max-w-[560px] mx-auto">{t.paragraph}</p>
        )}
      </div>

      {/* Testimonial Grid */}
      <div className="max-w-[1200px] mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-card border border-border-light p-10 animate-pulse">
                <div className="flex gap-1 mb-5">
                  {[1,2,3,4,5].map((s) => <div key={s} className="w-4 h-4 bg-bg-card-hover rounded" />)}
                </div>
                <div className="h-4 bg-bg-card-hover rounded w-full mb-3" />
                <div className="h-4 bg-bg-card-hover rounded w-5/6 mb-3" />
                <div className="h-4 bg-bg-card-hover rounded w-4/6 mb-8" />
                <div className="h-4 bg-bg-card-hover rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displaySlides.map((slide, i) => (
              <div
                key={slide.id}
                className={`bg-bg-card border border-border-light p-10 transition-all duration-400 hover:border-border-hover reveal reveal-delay-${i + 1}`}
              >
                {/* Stars */}
                <div className="flex gap-[3px] mb-5 text-brand-primary text-[0.85rem]">
                  {Array.from({ length: slide.rating }, (_, j) => (
                    <span key={j}>&#9733;</span>
                  ))}
                </div>

                {/* Title */}
                {slide.title && (
                  <h3 className="font-serif text-lg font-normal text-text-primary mb-3">{slide.title}</h3>
                )}

                {/* Quote */}
                <blockquote className="text-[0.95rem] text-text-secondary leading-[1.8] font-light italic mb-6">
                  &ldquo;{slide.text}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3 pt-5 border-t border-border-light">
                  <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[0.85rem] font-medium"
                    style={{ background: 'linear-gradient(135deg, var(--color-gold-700), var(--color-gold-400))' }}>
                    <span className="text-deep">{slide.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div>
                    <div className="text-[0.85rem] font-normal text-text-primary">{slide.name}</div>
                    <div className="text-[0.72rem] text-text-muted tracking-[0.05em]">{getPublicAppName()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Write review button */}
        <div className="text-center mt-12">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-outline-premium"
          >
            {t.writeBtn}
          </button>
        </div>
      </div>

      {isModalOpen && <FeedbackFormModal locale={locale} t={t} onClose={closeModal} />}
    </section>
  );
};

export default Feedback;
