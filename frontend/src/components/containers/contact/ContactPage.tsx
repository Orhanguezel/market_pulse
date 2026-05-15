'use client';

import { useMemo } from 'react';

import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import { safeStr, safeJson } from '@/integrations/shared';

import { useLocaleShort, useUiSection } from '@/i18n';

import ContactForm from './ContactForm';
import { getPublicAppName } from '@/lib/site-config';

// ── Types ──

type ContactInfo = Partial<{
  companyName: string;
  phones: string[];
  email: string;
  address: string;
  addressSecondary: string;
  whatsappNumber: string;
  website: string;
  notes: string;
}>;

// ── Helpers ──

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => safeStr(x)).filter(Boolean);
  return [];
}

function buildMailto(email: string, subject?: string) {
  const e = safeStr(email);
  if (!e) return '';
  const s = safeStr(subject);
  return `mailto:${encodeURIComponent(e)}${s ? `?subject=${encodeURIComponent(s)}` : ''}`;
}

// ── Component ──

export default function ContactPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_contact', locale as any);

  const t = useMemo(
    () => ({
      subprefix: safeStr(ui('ui_contact_subprefix', getPublicAppName())),
      sublabel: safeStr(ui('ui_contact_sublabel', 'İletişim')),
      titleLeft: safeStr(ui('ui_contact_title_left', 'Bize Ulaşın')),
      tagline: safeStr(
        ui(
          'ui_contact_tagline',
          'Sorularınız ve seans rezervasyon talepleriniz için mesaj gönderin. Ekibimiz kısa süre içinde size dönüş yapacaktır.',
        ),
      ),

      formTitle: safeStr(ui('ui_contact_form_title', 'Mesaj gönder')),
      firstName: safeStr(ui('ui_contact_first_name', 'Ad*')),
      lastName: safeStr(ui('ui_contact_last_name', 'Soyad')),
      phone: safeStr(ui('ui_contact_phone', 'Telefon*')),
      email: safeStr(ui('ui_contact_email', 'E-posta*')),
      subject: safeStr(ui('ui_contact_subject_label', 'Konu*')),
      message: safeStr(ui('ui_contact_message_label', 'Mesaj*')),
      messagePh: safeStr(ui('ui_contact_message_placeholder', 'Mesajınızı yazın...')),

      topicLabel: safeStr(ui('ui_contact_select_label', 'Konu')),
      topicAppointment: safeStr(ui('ui_contact_service_cooling_towers', 'Randevu talebi')),
      topicQuestion: safeStr(ui('ui_contact_service_maintenance', 'Soru / bilgi')),
      topicCollab: safeStr(ui('ui_contact_service_modernization', 'İşbirliği')),
      topicOther: safeStr(ui('ui_contact_service_other', 'Diğer')),

      termsPrefix: safeStr(ui('ui_contact_terms_prefix', 'Kabul ediyorum:')),
      terms: safeStr(ui('ui_contact_terms', 'Gizlilik Politikası')),
      conditions: safeStr(ui('ui_contact_conditions', 'Kullanım Koşulları')),

      submit: safeStr(ui('ui_contact_submit', 'Gönder')),
      sending: safeStr(ui('ui_contact_sending', 'Gönderiliyor...')),
      success: safeStr(ui('ui_contact_success', 'Teşekkürler! Mesajınız iletildi.')),
      errorGeneric: safeStr(ui('ui_contact_error_generic', 'Gönderilemedi. Lütfen tekrar deneyin.')),

      errRequired: safeStr(ui('ui_contact_error_required', 'Bu alan zorunludur.')),
      errEmail: safeStr(ui('ui_contact_error_email', 'Geçerli bir e-posta adresi girin.')),
      errPhone: safeStr(ui('ui_contact_error_phone', 'Geçerli bir telefon numarası girin.')),
      errMinMessage: safeStr(
        ui('ui_contact_error_message', 'En az 10 karakterlik bir mesaj yazın.'),
      ),

      subjectBase: safeStr(ui('ui_contact_subject_base', 'İletişim Mesajı')),
      addressLabel: safeStr(ui('ui_contact_address_label', 'Adres')),
      mapTitle: safeStr(ui('ui_contact_map_title', 'Konum')),
      infoTitle: safeStr(ui('ui_contact_info_title', 'İletişim bilgileri')),
      infoNoteTitle: safeStr(ui('ui_contact_info_note_title', 'Not')),
    }),
    [ui],
  );

  // ── Contact info (localized) ──
  const { data: contactInfoRaw } = useGetSiteSettingByKeyQuery({
    key: 'contact_info',
    locale,
  } as any);

  const contactInfo = useMemo<ContactInfo>(() => {
    const v = (contactInfoRaw as any)?.value ?? contactInfoRaw;
    return safeJson<ContactInfo>(v, {} as ContactInfo);
  }, [contactInfoRaw]);

  const phones = useMemo(() => asArray(contactInfo?.phones), [contactInfo]);
  const primaryPhone = phones[0] || '';
  const emailTo = safeStr(contactInfo?.email);
  const address = safeStr(contactInfo?.address);
  const address2 = safeStr(contactInfo?.addressSecondary);
  const notes = safeStr(contactInfo?.notes);

  // ── Map config (localized) ──
  const { data: mapRaw } = useGetSiteSettingByKeyQuery({ key: 'contact_map', locale } as any);

  const mapCfg = useMemo(() => {
    const v = (mapRaw as any)?.value ?? mapRaw;
    const parsed = safeJson<any>(v, {});
    return {
      title: safeStr(parsed.title) || t.mapTitle,
      height: Number(parsed.height) || 420,
      embed_url: safeStr(parsed.embed_url),
    };
  }, [mapRaw, t.mapTitle]);

  return (
    <section className="bg-bg-primary py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sol: Bilgi + Harita */}
          <div className="lg:col-span-5">
            <div className="mb-8">
              <div className="text-sm font-normal uppercase tracking-[0.2em] text-brand-primary mb-3">
                <span>{t.subprefix}</span>{' '}
                <span className="text-text-muted">{t.sublabel}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-light text-text-primary mb-4">
                {t.titleLeft}
              </h2>
              <p className="text-text-secondary leading-relaxed">{t.tagline}</p>
            </div>

            {/* İletişim bilgileri */}
            <div className="bg-bg-secondary shadow-soft border border-border-light p-6 mb-8">
              <h3 className="text-lg font-light font-serif text-text-primary mb-4">
                {t.infoTitle}
              </h3>

              <div className="space-y-3 text-sm text-text-secondary">
                {primaryPhone && (
                  <div>
                    <strong className="text-text-primary">{t.phone}:</strong>{' '}
                    <a className="text-brand-primary hover:underline" href={`tel:${primaryPhone}`}>
                      {primaryPhone}
                    </a>
                  </div>
                )}

                {emailTo && (
                  <div>
                    <strong className="text-text-primary">{t.email}:</strong>{' '}
                    <a className="text-brand-primary hover:underline" href={buildMailto(emailTo)}>
                      {emailTo}
                    </a>
                  </div>
                )}

                {address && (
                  <div>
                    <strong className="text-text-primary">{t.addressLabel}:</strong>{' '}
                    <span>{address}</span>
                    {address2 && <span className="block">{address2}</span>}
                  </div>
                )}

                {notes && (
                  <div className="pt-3 border-t border-border-light">
                    <strong className="text-text-primary">{t.infoNoteTitle}:</strong>
                    <div className="mt-1">{notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Harita */}
            {mapCfg.embed_url && (
              <div className="bg-bg-secondary shadow-soft border border-border-light overflow-hidden">
                <div className="px-6 py-4 border-b border-border-light">
                  <h3 className="text-lg font-light font-serif text-text-primary">{mapCfg.title}</h3>
                </div>
                <iframe
                  title={mapCfg.title}
                  src={mapCfg.embed_url}
                  height={mapCfg.height}
                  className="w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>

          {/* Sağ: Form */}
          <div className="lg:col-span-7">
            <ContactForm locale={locale} t={t} />
          </div>
        </div>
      </div>
    </section>
  );
}
