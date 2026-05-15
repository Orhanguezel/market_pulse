// =============================================================
// FILE: src/components/layout/banner/CookieSettingsModal.tsx
// – Cookie Settings Modal (DB/UI localized) + final consent state
// - Necessary always on
// - Analytics switch toggles analytics consent
// =============================================================
'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';

// i18n + UI (STANDARD)
import { useLocaleShort, useUiSection } from '@/i18n';

export type ConsentState = {
  necessary: true;
  analytics: boolean;
};

type Props = {
  open: boolean;
  locale?: string;

  consent: ConsentState;

  title?: string;
  description?: string;

  labelNecessary?: string;
  descNecessary?: string;

  labelAnalytics?: string;
  descAnalytics?: string;

  btnSave?: string;
  btnCancel?: string;

  ariaClose?: string;

  onClose: () => void;
  onSave: (next: ConsentState) => void;
};

function pickText(primary?: string, secondary?: string, fallback?: string) {
  const p = (primary ?? '').trim();
  if (p) return p;
  const s = (secondary ?? '').trim();
  if (s) return s;
  return (fallback ?? '').trim();
}

export default function CookieSettingsModal({
  open,
  consent,
  onClose,
  onSave,

  title,
  description,

  labelNecessary,
  descNecessary,

  labelAnalytics,
  descAnalytics,

  btnSave,
  btnCancel,

  ariaClose,
}: Props) {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_cookie', locale as any);

  const titleId = useId();
  const descId = useId();

  const [analytics, setAnalytics] = useState<boolean>(!!consent.analytics);

  useEffect(() => {
    if (!open) return;
    setAnalytics(!!consent.analytics);
  }, [open, consent.analytics]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const nextState: ConsentState = useMemo(() => ({ necessary: true, analytics }), [analytics]);

  const uiTitle = ui('cc_title', 'Cookie Settings');
  const uiDesc = ui(
    'cc_description',
    'You can choose which cookie categories you allow. Necessary cookies are always enabled.',
  );

  const uiLabelNecessary = ui('cc_label_necessary', 'Necessary');
  const uiDescNecessary = ui(
    'cc_desc_necessary',
    'Required for core functions (session, security, language preference, etc.).',
  );

  const uiLabelAnalytics = ui('cc_label_analytics', 'Analytics');
  const uiDescAnalytics = ui(
    'cc_desc_analytics',
    'Helps us understand traffic and performance (e.g., page views).',
  );

  const uiBtnSave = ui('cc_btn_save', 'Save');
  const uiBtnCancel = ui('cc_btn_cancel', 'Cancel');
  const uiAriaClose = ui('cc_aria_close', 'Close');

  const finalTitle = pickText(title, uiTitle, 'Cookie Settings');
  const finalDesc = pickText(description, uiDesc, '');

  const finalLabelNecessary = pickText(labelNecessary, uiLabelNecessary, 'Necessary');
  const finalDescNecessary = pickText(descNecessary, uiDescNecessary, '');

  const finalLabelAnalytics = pickText(labelAnalytics, uiLabelAnalytics, 'Analytics');
  const finalDescAnalytics = pickText(descAnalytics, uiDescAnalytics, '');

  const finalBtnSave = pickText(btnSave, uiBtnSave, 'Save');
  const finalBtnCancel = pickText(btnCancel, uiBtnCancel, 'Cancel');
  const finalAriaClose = pickText(ariaClose, uiAriaClose, 'Close');

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10050] bg-black/60 p-4 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-bg-card border border-border-light shadow-medium overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-border-light">
          <div className="min-w-0">
            <p id={titleId} className="text-lg font-serif font-light text-text-primary leading-snug">
              {finalTitle}
            </p>
            <p id={descId} className="mt-2 text-sm text-text-secondary leading-relaxed">
              {finalDesc}
            </p>
          </div>

          <button
            type="button"
            className="shrink-0 w-9 h-9 rounded-full border border-border-light text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors"
            onClick={onClose}
            aria-label={finalAriaClose}
            title={finalAriaClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-bold text-text-primary">{finalLabelNecessary}</p>
              <p className="mt-1 text-sm text-text-secondary leading-relaxed">{finalDescNecessary}</p>
            </div>
            <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-primary/10 text-text-primary border border-brand-primary/15">
              {ui('cc_pill_on', 'On')}
            </span>
          </div>

          <div className="h-px bg-bg-card-hover" />

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-bold text-text-primary">{finalLabelAnalytics}</p>
              <p className="mt-1 text-sm text-text-secondary leading-relaxed">{finalDescAnalytics}</p>
            </div>

            <label className="shrink-0 inline-flex items-center gap-3 select-none">
              <span className="sr-only">{finalLabelAnalytics}</span>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="sr-only peer"
              />
              <span className="relative w-12 h-7 rounded-full bg-sand-300 peer-checked:bg-brand-primary transition-colors border border-border-medium peer-checked:border-brand-primary">
                <span className="absolute top-0.5 left-0.5 w-6 h-6 bg-bg-card shadow-sm transition-transform peer-checked:translate-x-5" />
              </span>
            </label>
          </div>
        </div>

        <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            className="inline-flex justify-center items-center px-4 py-2.5 rounded-lg border border-border-light text-sm font-bold text-text-primary hover:bg-bg-card transition-colors"
            onClick={onClose}
          >
            {finalBtnCancel}
          </button>

          <button
            type="button"
            className="inline-flex justify-center items-center px-4 py-2.5 rounded-lg bg-brand-primary text-bg-primary text-sm font-bold hover:bg-brand-hover transition-colors shadow-sm"
            onClick={() => onSave(nextState)}
          >
            {finalBtnSave}
          </button>
        </div>
      </div>
    </div>
  );
}
