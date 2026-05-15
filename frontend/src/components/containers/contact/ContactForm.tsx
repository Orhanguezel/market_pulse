'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useCreateContactPublicMutation } from '@/integrations/rtk/hooks';
import type { ContactCreatePayload } from '@/integrations/shared';
import { safeStr, isValidEmail} from '@/integrations/shared';

import { localizePath } from '@/integrations/shared';

type ContactFormTranslations = {
  formTitle: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  messagePh: string;
  topicLabel: string;
  topicAppointment: string;
  topicQuestion: string;
  topicCollab: string;
  topicOther: string;
  termsPrefix: string;
  terms: string;
  conditions: string;
  submit: string;
  sending: string;
  success: string;
  errorGeneric: string;
  errRequired: string;
  errEmail: string;
  errPhone: string;
  errMinMessage: string;
  subjectBase: string;
};

export type { ContactFormTranslations };

type Props = {
  locale: string;
  t: ContactFormTranslations;
};

type TopicKey = 'appointment' | 'question' | 'collab' | 'other';

const TOPIC_MAP: Record<TopicKey, keyof ContactFormTranslations> = {
  appointment: 'topicAppointment',
  question: 'topicQuestion',
  collab: 'topicCollab',
  other: 'topicOther',
};

const INPUT_CLS =
  'w-full px-4 py-3 rounded-lg border bg-bg-primary text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20';
const INPUT_ERR = 'border-error/60';
const INPUT_OK = 'border-border-light';

export default function ContactForm({ locale, t }: Props) {
  const [createContact, { isLoading }] = useCreateContactPublicMutation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<TopicKey>('appointment');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (k: string) => setTouched((p) => ({ ...p, [k]: true }));

  const fullName = useMemo(() => {
    return [safeStr(firstName), safeStr(lastName)].filter(Boolean).join(' ');
  }, [firstName, lastName]);

  const topicLabel = useMemo(() => safeStr(t[TOPIC_MAP[topic]]), [topic, t]);

  const computedSubject = useMemo(() => {
    const s = safeStr(subject);
    if (s) return s;
    const base = safeStr(t.subjectBase) || 'Contact Message';
    return topicLabel ? `${base} — ${topicLabel}` : base;
  }, [subject, t.subjectBase, topicLabel]);

  const hasError = useCallback(
    (field: 'firstName' | 'phone' | 'email' | 'message' | 'agree') => {
      if (!touched[field]) return false;
      if (field === 'firstName') return fullName.length < 2;
      if (field === 'phone') return safeStr(phone).length < 5;
      if (field === 'email') return !isValidEmail(email);
      if (field === 'message') return safeStr(message).length < 10;
      if (field === 'agree') return !agree;
      return false;
    },
    [touched, fullName, phone, email, message, agree],
  );

  const formId = useId();
  const ids = {
    first: `${formId}-first`,
    last: `${formId}-last`,
    phone: `${formId}-phone`,
    email: `${formId}-email`,
    topic: `${formId}-topic`,
    subject: `${formId}-subject`,
    msg: `${formId}-msg`,
    agree: `${formId}-agree`,
  };

  const privacyHref = useMemo(() => localizePath(locale, '/privacy-policy'), [locale]);
  const termsHref = useMemo(() => localizePath(locale, '/terms'), [locale]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ firstName: true, phone: true, email: true, message: true, agree: true });

    if (
      fullName.length < 2 ||
      safeStr(phone).length < 5 ||
      !isValidEmail(email) ||
      safeStr(message).length < 10 ||
      !agree
    ) {
      return;
    }

    const payload: ContactCreatePayload = {
      name: fullName,
      email: safeStr(email),
      phone: safeStr(phone),
      subject: computedSubject,
      message: safeStr(message),
      website: '',
    };

    try {
      await createContact(payload).unwrap();
      toast.success(t.success || 'Sent');
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setTopic('appointment');
      setSubject('');
      setMessage('');
      setAgree(false);
      setTouched({});
    } catch (err) {
      console.error('createContact error', err);
      toast.error(t.errorGeneric || 'Failed');
    }
  };

  const inputCls = (field?: 'firstName' | 'phone' | 'email' | 'message') =>
    `${INPUT_CLS} ${field && hasError(field) ? INPUT_ERR : INPUT_OK}`;

  return (
    <div className="bg-bg-secondary shadow-soft border border-border-light p-6 md:p-8">
      <h3 className="text-xl font-light font-serif text-text-primary mb-6">{t.formTitle}</h3>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {/* Honeypot */}
        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" name="website" />
          </label>
        </div>

        {/* Ad / Soyad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor={ids.first}>
              {t.firstName}
            </label>
            <input
              id={ids.first}
              className={inputCls('firstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={() => touch('firstName')}
              autoComplete="given-name"
            />
            {hasError('firstName') && (
              <p className="text-sm mt-2 text-error">{t.errRequired}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor={ids.last}>
              {t.lastName}
            </label>
            <input
              id={ids.last}
              className={`${INPUT_CLS} ${INPUT_OK}`}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>

        {/* Email / Tel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor={ids.email}>
              {t.email}
            </label>
            <input
              id={ids.email}
              type="email"
              className={inputCls('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              autoComplete="email"
            />
            {hasError('email') && (
              <p className="text-sm mt-2 text-error">{t.errEmail}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor={ids.phone}>
              {t.phone}
            </label>
            <input
              id={ids.phone}
              className={inputCls('phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => touch('phone')}
              autoComplete="tel"
            />
            {hasError('phone') && (
              <p className="text-sm mt-2 text-error">{t.errPhone}</p>
            )}
          </div>
        </div>

        {/* Konu / Başlık */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor={ids.topic}>
              {t.topicLabel}
            </label>
            <select
              id={ids.topic}
              className={`${INPUT_CLS} ${INPUT_OK}`}
              value={topic}
              onChange={(e) => setTopic(e.target.value as TopicKey)}
            >
              <option value="appointment">{t.topicAppointment}</option>
              <option value="question">{t.topicQuestion}</option>
              <option value="collab">{t.topicCollab}</option>
              <option value="other">{t.topicOther}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor={ids.subject}>
              {t.subject}
            </label>
            <input
              id={ids.subject}
              className={`${INPUT_CLS} ${INPUT_OK}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={computedSubject}
            />
          </div>
        </div>

        {/* Mesaj */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor={ids.msg}>
            {t.message}
          </label>
          <textarea
            id={ids.msg}
            className={`${inputCls('message')} min-h-[140px]`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => touch('message')}
            placeholder={t.messagePh}
          />
          {hasError('message') && (
            <p className="text-sm mt-2 text-error">{t.errMinMessage}</p>
          )}
        </div>

        {/* Onay */}
        <div>
          <label className="inline-flex items-start gap-3 text-sm text-text-secondary" htmlFor={ids.agree}>
            <input
              id={ids.agree}
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-border-medium text-brand-primary focus:ring-brand-primary accent-brand-primary cursor-pointer"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              onBlur={() => touch('agree')}
            />
            <span>
              {t.termsPrefix}{' '}
              <a className="text-brand-primary hover:underline" href={privacyHref}>
                {t.terms}
              </a>
              {t.conditions && (
                <>
                  {' / '}
                  <a className="text-brand-primary hover:underline" href={termsHref}>
                    {t.conditions}
                  </a>
                </>
              )}
            </span>
          </label>
          {hasError('agree') && (
            <p className="text-sm mt-2 text-error">{t.errRequired}</p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center w-full md:w-auto px-8 py-4 bg-brand-primary text-text-on-dark font-normal uppercase tracking-[0.2em] hover:bg-brand-hover transition-all duration-300 shadow-soft rounded-sm disabled:opacity-60"
          >
            {isLoading ? t.sending : t.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
