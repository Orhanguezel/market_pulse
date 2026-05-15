// =============================================================
// FILE: src/components/common/ReviewForm.tsx
// Ortak yorum formu (public) – target_type / target_id bağlı
// i18n: site_settings.ui_feedback (form_* key'leri)
// - ✅ Bootstrap/inline style yok
// - ✅ review.scss class'ları kullanılır
// =============================================================

'use client';

import React, { useId, useMemo, useState, FormEvent } from 'react';
import { toast } from 'sonner';

import { useCreateReviewPublicMutation } from '@/integrations/rtk/hooks';
import type { ReviewDto } from '@/integrations/shared';

import { useResolvedLocale, useUiSection } from '@/i18n';

type ReviewFormProps = {
  targetType: string;
  targetId: string;
  locale?: string;
  className?: string;
  onSubmitted?: (review: ReviewDto) => void;

  /** ✅ yeni: form ilk açılış durumu */
  initialOpen?: boolean;

  /** ✅ yeni: toggle butonu göster/gizle */
  showToggle?: boolean;

  /** ✅ yeni: toggle buton label override */
  toggleLabel?: string;

  /** Optional overrides (e.g. when used as blog comments) */
  titleOverride?: string;
  commentLabelOverride?: string;
  submitTextOverride?: string;

  /** Blog/comments mode: keep rating fixed but still submit valid payload */
  hideRating?: boolean;
  defaultRating?: number;
};

const ReviewForm: React.FC<ReviewFormProps> = ({
  targetType,
  targetId,
  locale: localeProp,
  className,
  onSubmitted,
  initialOpen = false,
  showToggle = true,
  toggleLabel,
  titleOverride,
  commentLabelOverride,
  submitTextOverride,
  hideRating = false,
  defaultRating = 5,
}) => {
  const resolvedLocale = useResolvedLocale();
  const locale = (localeProp || resolvedLocale || 'de').split('-')[0];

  const { ui } = useUiSection('ui_feedback', locale as any);

  const title = useMemo(() => {
    const t = String(titleOverride || '').trim();
    return t || ui('ui_feedback_form_title', 'Leave a review');
  }, [titleOverride, ui]);

  const openButtonText = useMemo(() => {
    if (toggleLabel && toggleLabel.trim()) return toggleLabel.trim();
    return ui('ui_feedback_form_open', 'Write a review');
  }, [toggleLabel, ui]);

  const closeButtonText = ui('ui_feedback_form_close', 'Close');

  const nameLabel = ui('ui_feedback_form_name_label', 'Your name');
  const emailLabel = ui('ui_feedback_form_email_label', 'Email address');
  const ratingLabel = ui('ui_feedback_form_rating_label', 'Your rating');
  const commentLabel = useMemo(() => {
    const t = String(commentLabelOverride || '').trim();
    return t || ui('ui_feedback_form_comment_label', 'Your review');
  }, [commentLabelOverride, ui]);

  const submitText = useMemo(() => {
    const t = String(submitTextOverride || '').trim();
    return t || ui('ui_feedback_form_submit', 'Submit review');
  }, [submitTextOverride, ui]);
  const submittingText = ui('ui_feedback_form_submitting', 'Submitting...');

  const successText = ui('ui_feedback_form_success', 'Your review has been received. Thank you!');
  const errorText = ui('ui_feedback_form_error', 'An error occurred while submitting your review.');

  const requiredText = ui('ui_feedback_form_required', 'This field is required.');

  const [createReview, { isLoading }] = useCreateReviewPublicMutation();

  const [isOpen, setIsOpen] = useState<boolean>(!!initialOpen);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<number>(defaultRating);
  const [comment, setComment] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formId = useId();
  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const ratingId = `${formId}-rating`;
  const commentId = `${formId}-comment`;

  const onBlurField = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const hasError = (field: 'name' | 'email' | 'comment') => {
    if (!touched[field]) return false;
    if (field === 'name') return name.trim().length < 2;
    if (field === 'email') return !email.includes('@');
    if (field === 'comment') return comment.trim().length < 5;
    return false;
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setRating(defaultRating);
    setComment('');
    setTouched({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setTouched({ name: true, email: true, comment: true });
    if (hasError('name') || hasError('email') || hasError('comment') || rating < 1 || rating > 5) {
      return;
    }

    try {
      const payload = {
        target_type: targetType,
        target_id: targetId,
        locale,
        name: name.trim(),
        email: email.trim(),
        rating: hideRating ? defaultRating : rating,
        comment: comment.trim(),
      };

      const result = await createReview(payload).unwrap();
      toast.success(successText);

      resetForm();
      setIsOpen(false);

      onSubmitted?.(result);
    } catch (err) {
      console.error('createReview error', err);
      toast.error(errorText);
    }
  };

  return (
    <section className={['review', className].filter(Boolean).join(' ')}>
      {showToggle ? (
        <header className="review__head">
          <h3 className="review__title">{title}</h3>

          <button
            type="button"
            className="review__toggle"
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
          >
            {isOpen ? closeButtonText : openButtonText}
          </button>
        </header>
      ) : (
        <h3 className="review__title review__title--solo">{title}</h3>
      )}

      {isOpen && (
        <form className="review__form" onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="review__field">
            <label className="review__label" htmlFor={nameId}>
              {nameLabel} <span className="review__req">*</span>
            </label>
            <input
              id={nameId}
              type="text"
              className={['review__input', hasError('name') ? 'is-invalid' : '']
                .filter(Boolean)
                .join(' ')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => onBlurField('name')}
              autoComplete="name"
            />
            {hasError('name') && <div className="review__error">{requiredText}</div>}
          </div>

          {/* Email */}
          <div className="review__field">
            <label className="review__label" htmlFor={emailId}>
              {emailLabel} <span className="review__req">*</span>
            </label>
            <input
              id={emailId}
              type="email"
              className={['review__input', hasError('email') ? 'is-invalid' : '']
                .filter(Boolean)
                .join(' ')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => onBlurField('email')}
              autoComplete="email"
            />
            {hasError('email') && <div className="review__error">{requiredText}</div>}
          </div>

          {/* Rating */}
          {!hideRating && (
            <div className="review__field">
              <label className="review__label" htmlFor={ratingId}>
                {ratingLabel} (1–5)
              </label>
              <select
                id={ratingId}
                className="review__select"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Comment */}
          <div className="review__field">
            <label className="review__label" htmlFor={commentId}>
              {commentLabel} <span className="review__req">*</span>
            </label>
            <textarea
              id={commentId}
              className={['review__textarea', hasError('comment') ? 'is-invalid' : '']
                .filter(Boolean)
                .join(' ')}
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={() => onBlurField('comment')}
            />
            {hasError('comment') && <div className="review__error">{requiredText}</div>}
          </div>

          <div className="review__actions">
            <button type="submit" className="review__btn review__btn--primary" disabled={isLoading}>
              {isLoading ? submittingText : submitText}
            </button>

            <button
              type="button"
              className="review__btn review__btn--ghost"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
              disabled={isLoading}
            >
              {closeButtonText}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default ReviewForm;
