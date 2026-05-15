// =============================================================
// FILE: src/components/common/ReviewList.tsx
// Ortak yorum listesi (public) + reaction/like butonu
// i18n: site_settings.ui_feedback (list_* ve reaction_* key'leri)
// Tailwind v4 + tasarım tokenları (--gm-*).
// =============================================================

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Star, ThumbsUp, ShieldCheck, CornerDownRight } from 'lucide-react';

import {
  useListReviewsPublicQuery,
  useAddReviewReactionPublicMutation,
} from '@/integrations/rtk/hooks';
import type { ReviewDto } from '@/integrations/shared';

import { useResolvedLocale, useUiSection } from '@/i18n';

type ReviewListProps = {
  targetType: string;
  targetId: string;
  locale?: string;
  className?: string;
  showHeader?: boolean;

  /** Optional overrides (e.g. when used as blog comments) */
  titleOverride?: string;
  emptyTextOverride?: string;

  /** Display mode */
  variant?: 'reviews' | 'comments';
  /** Compact tek satır liste (kart yerine inline). Sticky sidebar yanında dar kolonlar için. */
  compact?: boolean;
};

function clampRating(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return Math.max(0, Math.min(5, n));
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.round(clampRating(rating));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`rating ${rating} of 5`}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Star
          key={idx}
          size={size}
          className={
            idx < full
              ? 'fill-(--gm-gold) text-(--gm-gold)'
              : 'text-(--gm-border)'
          }
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function initialsOf(name: string) {
  return (name || '?')
    .split(/\s+/)
    .map((w) => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const ReviewList: React.FC<ReviewListProps> = ({
  targetType,
  targetId,
  locale: localeProp,
  className,
  showHeader = true,
  titleOverride,
  emptyTextOverride,
  variant = 'reviews',
  compact = false,
}) => {
  const resolvedLocale = useResolvedLocale();
  const locale = (localeProp || resolvedLocale || 'tr').split('-')[0];

  const { ui } = useUiSection('ui_feedback', locale as any);

  const title = useMemo(() => {
    const t = String(titleOverride || '').trim();
    return t || ui('ui_feedback_list_title', 'Değerlendirmeler');
  }, [titleOverride, ui]);

  const noReviewsText = useMemo(() => {
    const t = String(emptyTextOverride || '').trim();
    return t || ui('ui_feedback_list_no_reviews', 'Henüz bu danışman için yorum bulunmuyor.');
  }, [emptyTextOverride, ui]);
  const avgRatingLabel = ui('ui_feedback_list_avg_rating', 'Ortalama puan');
  const reviewsSuffix = ui('ui_feedback_list_reviews_suffix', 'yorum');

  const helpfulLabel = ui('ui_feedback_list_helpful', 'Faydalı');
  const likedLabel = ui('ui_feedback_list_liked', 'Teşekkürler');
  const verifiedLabel = ui('ui_feedback_list_verified', 'Doğrulanmış görüşme');
  const consultantReplyLabel = ui('ui_feedback_list_consultant_reply', 'Yanıt');

  const errorText = ui(
    'ui_feedback_list_error',
    'İşlem sırasında bir hata oluştu.',
  );
  const loadingText = ui('ui_feedback_list_loading', 'Yorumlar yükleniyor...');

  const { data, isLoading, isError } = useListReviewsPublicQuery({
    target_type: targetType,
    target_id: targetId,
    locale,
    approved: true,
    active: true,
    orderBy: 'helpful_count',
    order: 'desc',
    limit: 100,
  } as any);

  const [addReaction, { isLoading: isReacting }] = useAddReviewReactionPublicMutation();
  const [reactionReviewId, setReactionReviewId] = useState<string | null>(null);

  const reviews: ReviewDto[] = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    if (!reviews.length) return { avg: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = sum / reviews.length;
    return { avg, count: reviews.length };
  }, [reviews]);

  const formatDate = useCallback(
    (iso: any) => {
      try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString(locale);
      } catch {
        return '';
      }
    },
    [locale],
  );

  const handleLike = async (review: ReviewDto) => {
    try {
      setReactionReviewId(review.id);
      await addReaction({ id: review.id } as any).unwrap();
      toast.success(likedLabel);
    } catch (err) {
      console.error('addReaction error', err);
      toast.error(errorText);
    } finally {
      setReactionReviewId(null);
    }
  };

  return (
    <section className={['mt-12', className].filter(Boolean).join(' ')}>
      {showHeader && (
        <header className="mb-8 pb-6 border-b border-(--gm-border-soft)">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold-deep) uppercase">
                {avgRatingLabel}
              </span>
              <h3 className="font-serif text-2xl md:text-3xl font-light text-(--gm-text) mt-1">
                {title}
              </h3>
            </div>

            {variant === 'reviews' && stats.count > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-serif font-light text-3xl text-(--gm-text) leading-none">
                    {stats.avg.toFixed(1)}
                    <span className="text-base text-(--gm-muted) ml-1">/ 5</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 justify-end">
                    <Stars rating={stats.avg} />
                    <span className="text-xs text-(--gm-muted)">
                      ({stats.count} {reviewsSuffix})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {isLoading && (
        <p className="text-sm text-(--gm-muted) py-8 text-center">{loadingText}</p>
      )}
      {isError && (
        <p className="text-sm text-red-500 py-8 text-center">{errorText}</p>
      )}

      {!isLoading && !isError && reviews.length === 0 && (
        <p className="text-sm italic text-(--gm-muted) py-12 text-center border border-dashed border-(--gm-border-soft) rounded-sm">
          {noReviewsText}
        </p>
      )}

      {!isLoading && !isError && reviews.length > 0 && (
        <div className={compact ? 'divide-y divide-(--gm-border-soft) border-y border-(--gm-border-soft)' : 'grid grid-cols-1 md:grid-cols-2 gap-5'}>
          {reviews.map((r) => {
            const isVerified = Number((r as any).is_verified) === 1;
            const consultantReply = (r as any).consultant_reply as string | undefined;
            const helpfulCount = Number((r as any).helpful_count ?? 0);

            return (
              <article
                key={r.id}
                className={
                  compact
                    ? 'py-4 transition-colors hover:bg-(--gm-gold)/5'
                    : 'bg-(--gm-surface) border border-(--gm-border-soft) rounded-sm p-6 transition-all duration-300 hover:border-(--gm-gold)/40 hover:shadow-card'
                }
              >
                <header className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-(--gm-gold)/10 border border-(--gm-gold)/30 flex items-center justify-center text-(--gm-gold-deep) font-display text-sm shrink-0">
                    {initialsOf(r.name || '')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="font-serif text-base text-(--gm-text) font-medium">
                        {r.name}
                      </strong>
                      {isVerified && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase"
                          style={{
                            color: 'var(--color-success, #4CAF6E)',
                            background: 'rgba(76, 175, 110, 0.10)',
                            border: '1px solid rgba(76, 175, 110, 0.25)',
                          }}
                          title={verifiedLabel}
                        >
                          <ShieldCheck size={11} />
                          {verifiedLabel}
                        </span>
                      )}
                    </div>

                    {variant === 'reviews' && (
                      <div className="mt-1 flex items-center gap-2">
                        <Stars rating={Number(r.rating)} size={12} />
                        <span className="text-xs text-(--gm-muted)">
                          {clampRating(Number(r.rating)).toFixed(1)}/5
                        </span>
                        <span className="text-xs text-(--gm-muted)">·</span>
                        <time
                          className="text-xs text-(--gm-muted)"
                          dateTime={String((r as any).created_at || '')}
                        >
                          {formatDate((r as any).created_at)}
                        </time>
                      </div>
                    )}
                  </div>
                </header>

                {r.comment && (
                  <p className="font-serif italic text-sm leading-relaxed text-(--gm-text-dim)">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}

                {consultantReply && (
                  <div
                    className="mt-4 pl-4 border-l-2 border-(--gm-gold) bg-(--gm-gold)/5 py-3 px-4 rounded-r-sm"
                  >
                    <div className="flex items-center gap-1.5 mb-1 font-display text-[10px] tracking-[0.18em] text-(--gm-gold-deep) uppercase">
                      <CornerDownRight size={11} />
                      {consultantReplyLabel}
                    </div>
                    <p className="m-0 italic text-sm text-(--gm-text-dim) leading-relaxed">
                      {consultantReply}
                    </p>
                  </div>
                )}

                <footer className={compact ? 'mt-2 flex items-center justify-end' : 'mt-5 pt-4 border-t border-(--gm-border-soft) flex items-center justify-end'}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-xs font-medium text-(--gm-text-dim) hover:text-(--gm-gold-deep) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isReacting && reactionReviewId === r.id}
                    onClick={() => handleLike(r)}
                  >
                    <ThumbsUp size={14} />
                    <span>
                      {helpfulLabel} <span className="text-(--gm-muted)">({helpfulCount})</span>
                    </span>
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ReviewList;
