// =============================================================
// FILE: src/components/public/ContactCtaCard.tsx
// – Reusable Contact CTA Card (I18N + settings-driven)
// - Matches InfoContactCard visual frame/spacing (sidebar__contact pattern)
// - Reads phone/whatsapp from site_settings
// - Provides tel / wa links + /contact navigation
// - NO tailwind / NO styled-jsx / NO inline styles
// =============================================================

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import { useLocaleShort } from '@/i18n';


type Props = {
  className?: string;

  title: string;
  description?: string;

  phoneLabel?: string; // e.g. "Telefon"
  whatsappLabel?: string; // e.g. "WhatsApp"
  formLabel?: string; // e.g. "İletişim Formu"

  contactHref?: string; // default: /contact
};

const sanitizePhoneDigits = (s: string) =>
  String(s || '')
    .replace(/[^\d+]/g, '')
    .replace(/\s+/g, '');

const buildTelHref = (raw: string): string => {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('tel:')) return trimmed;

  const cleaned = sanitizePhoneDigits(trimmed);
  if (!cleaned) return '';
  // tel: can include +
  return cleaned.startsWith('+') ? `tel:${cleaned}` : `tel:+${cleaned}`;
};

const buildWhatsappHref = (raw: string): string => {
  const cleaned = sanitizePhoneDigits(raw).replace(/^\+/, '');
  if (!cleaned) return '';
  return `https://wa.me/${cleaned}`;
};

function asText(v: any): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  try {
    return String(v);
  } catch {
    return '';
  }
}

function safeSettingString(v: any): string {
  if (v == null) return '';
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';
    try {
      const parsed = JSON.parse(s);
      if (typeof parsed === 'string') return parsed.trim();
      return asText(parsed).trim();
    } catch {
      return s;
    }
  }
  return asText(v).trim();
}

const ContactCtaCard: React.FC<Props> = ({
  className,
  title,
  description,

  phoneLabel = 'Telefon',
  whatsappLabel = 'WhatsApp',
  formLabel = 'İletişim Formu',

  contactHref = '/contact',
}) => {
  const locale = useLocaleShort();
  const { data: contactRow } = useGetSiteSettingByKeyQuery({ key: 'contact_info', locale: locale as any });

  const contactData = useMemo(() => {
    const val = (contactRow as any)?.value;
    if (!val) return null;
    try {
      if (typeof val === 'string') return JSON.parse(val);
      return val;
    } catch {
      return null;
    }
  }, [contactRow]);

  const phoneDisplay = useMemo(() => {
    return safeSettingString(contactData?.phones?.[0] || contactData?.phone || '');
  }, [contactData]);

  const phoneRaw = useMemo(() => {
    return safeSettingString(contactData?.phones?.[0] || contactData?.phone || '');
  }, [contactData]);

  const telHref = useMemo(() => buildTelHref(phoneRaw), [phoneRaw]);

  const waHref = useMemo(() => {
    const wa = contactData?.whatsappNumber || contactData?.whatsapp;
    if (wa) return buildWhatsappHref(safeSettingString(wa));
    return buildWhatsappHref(phoneRaw);
  }, [contactData, phoneRaw]);

  const hasAny = !!phoneDisplay || !!telHref || !!waHref || !!contactHref || !!description;

  if (!hasAny) return null;

  return (
    <div className={className ? className : ''}>
      <div className="sidebar__contact">
        <div className="sidebar__contact-title mb-35">
          <h3>{title}</h3>
        </div>

        <div className="sidebar__contact-inner">
          {description ? <p className="mb-20">{description}</p> : null}

          {/* Phone (same row style) */}
          {phoneDisplay ? (
            <div className="sidebar__contact-item">
    
              <div className="sideber__contact-text">
                <span>
                  {phoneLabel ? <strong>{phoneLabel}:</strong> : null}{' '}
                  {telHref ? <a href={telHref}>{phoneDisplay}</a> : phoneDisplay}
                </span>
              </div>
            </div>
          ) : null}

          {/* WhatsApp row */}
          {waHref ? (
            <div className="sidebar__contact-item">

              <div className="sideber__contact-text">
                <span>
                  <a href={waHref} target="_blank" rel="noreferrer">
                    {whatsappLabel}
                  </a>
                </span>
              </div>
            </div>
          ) : null}

          {/* CTA Buttons (match InfoContactCard buttons) */}
          <div className="mt-20">
            {waHref ? (
              <a className="tp-btn w-100 mb-10" href={waHref} target="_blank" rel="noreferrer">
                {whatsappLabel}
              </a>
            ) : null}

            {telHref ? (
              <a className="tp-btn tp-btn-2 w-100 mb-10" href={telHref}>
                {phoneLabel}
              </a>
            ) : null}

            {contactHref ? (
              <Link className="tp-btn tp-btn-2 w-100" href={contactHref}>
                <span className="d-inline-flex align-items-center">
                  {formLabel}
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactCtaCard;
