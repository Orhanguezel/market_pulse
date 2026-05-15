'use client';

import { useEffect, useMemo, useState } from 'react';

import { useCreateReviewPublicMutation } from '@/integrations/rtk/hooks';
import { safeStr, isValidEmail, clampRating} from '@/integrations/shared';

import { IconCheck, IconX } from '@/components/ui/icons';
import StarRating from './StarRating';

type Translations = {
  modalTitle: string;
  close: string;
  submit: string;
  sending: string;
  fName: string;
  fEmail: string;
  fRating: string;
  fComment: string;
  errName: string;
  errEmail: string;
  errComment: string;
  errGeneric: string;
  okMsg: string;
};

type Props = {
  locale: string;
  t: Translations;
  onClose: () => void;
};

const TARGET_TYPE = 'testimonial';
const TARGET_ID = process.env.NEXT_PUBLIC_FEEDBACK_TARGET_ID?.trim() || 'site';

const MODAL_TITLE_ID = 'feedback-modal-title';
const MODAL_DESC_ID = 'feedback-modal-desc';

export default function FeedbackFormModal({ locale, t, onClose }: Props) {
  const [createReview, { isLoading: isCreating }] = useCreateReviewPublicMutation();

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [submitState, setSubmitState] = useState<
    { type: 'idle' } | { type: 'success' } | { type: 'error'; message: string }
  >({ type: 'idle' });

  // Escape tuşu ile kapat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Body scroll kilitle
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const canSubmit = useMemo(() => {
    return (
      safeStr(formName).length > 0 &&
      isValidEmail(formEmail) &&
      safeStr(formComment).length > 0 &&
      !isCreating
    );
  }, [formName, formEmail, formComment, isCreating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState({ type: 'idle' });

    const name = safeStr(formName);
    const email = safeStr(formEmail).toLowerCase();
    const rating = clampRating(formRating);
    const comment = safeStr(formComment);

    if (!name) return setSubmitState({ type: 'error', message: t.errName });
    if (!isValidEmail(email)) return setSubmitState({ type: 'error', message: t.errEmail });
    if (!comment) return setSubmitState({ type: 'error', message: t.errComment });

    try {
      await createReview({
        target_type: TARGET_TYPE,
        target_id: TARGET_ID,
        locale,
        name,
        email,
        rating,
        comment,
      }).unwrap();

      setSubmitState({ type: 'success' });
      setFormName('');
      setFormEmail('');
      setFormComment('');
      setFormRating(5);
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.data?.message || err?.error || t.errGeneric;
      setSubmitState({ type: 'error', message: safeStr(msg) || t.errGeneric });
    }
  };

  const inputCls =
    'w-full px-4 py-3 rounded-lg border border-border-medium bg-bg-card text-text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all';

  return (
    <div
      className="fixed inset-0 z-10060 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={MODAL_TITLE_ID}
      aria-describedby={MODAL_DESC_ID}
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t.close}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative bg-bg-card w-full max-w-lg shadow-medium overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-light flex items-center justify-between bg-bg-card">
          <p id={MODAL_TITLE_ID} className="text-xl font-serif font-light text-text-primary">
            {t.modalTitle}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <p id={MODAL_DESC_ID} className="sr-only">
            {t.modalTitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-1">
                <label htmlFor="feedback-name" className="text-sm font-semibold text-text-primary">
                  {t.fName}
                </label>
                <input
                  id="feedback-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="feedback-email" className="text-sm font-semibold text-text-primary">
                  {t.fEmail}
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-text-primary">{t.fRating}</label>
                <div className="py-1">
                  <StarRating rating={formRating} interactive size={22} onRate={setFormRating} />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="feedback-comment"
                  className="text-sm font-semibold text-text-primary"
                >
                  {t.fComment}
                </label>
                <textarea
                  id="feedback-comment"
                  rows={4}
                  required
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>

            {/* Status */}
            {submitState.type === 'success' && (
              <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-start gap-3">
                <IconCheck className="mt-0.5" size={18} />
                <p className="text-sm font-medium">{t.okMsg}</p>
              </div>
            )}
            {submitState.type === 'error' && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-start gap-3">
                <IconX className="mt-0.5" size={18} />
                <p className="text-sm font-medium">{submitState.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-light">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card-hover rounded-lg transition-colors"
              >
                {t.close}
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isCreating}
                className="px-6 py-2.5 text-sm font-medium bg-brand-primary text-white rounded-lg shadow hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isCreating ? t.sending : t.submit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
