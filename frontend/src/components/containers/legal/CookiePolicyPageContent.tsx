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

const CookiePolicyPageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_cookie_policy', locale as any);
  const isTr = locale === 'tr';

  const { data, isLoading, isError } = useListCustomPagesPublicQuery({
    module_key: 'cookies',
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
      String(ui('ui_cookie_policy_fallback_title', 'Çerez Politikası') || '').trim() ||
      'Çerez Politikası'
    );
  }, [page, ui]);

  const html = useMemo(() => {
    const raw = extractHtmlFromAny(page);
    const safe = raw ? downgradeH1ToH2(raw) : '';
    return safe;
  }, [page]);

  const turkishFallback = (
    <article className="max-w-4xl mx-auto rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-6 text-(--gm-text-dim) shadow-card md:p-10">
      <p className="leading-7">
        İhracat Radarı, internet sitesinin güvenli ve düzgün çalışmasını sağlamak, tercihlerinizi
        hatırlamak ve onay vermeniz halinde site kullanımını analiz etmek için çerezlerden yararlanır.
      </p>

      <h2 className="mt-8 text-2xl font-semibold text-(--gm-text)">Çerez nedir?</h2>
      <p className="mt-3 leading-7">
        Çerezler, bir internet sitesini ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza
        kaydedilen küçük metin dosyalarıdır. Çerezler cihazınıza zarar vermez ve tek başına kimliğinizi
        doğrudan belirlemez.
      </p>

      <h2 className="mt-8 text-2xl font-semibold text-(--gm-text)">Kullandığımız çerezler</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-(--gm-border)">
              <th className="p-3 font-semibold">Kategori</th>
              <th className="p-3 font-semibold">Amaç</th>
              <th className="p-3 font-semibold">Durum</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-(--gm-border-soft)">
              <td className="p-3 font-medium">Zorunlu çerezler</td>
              <td className="p-3">Güvenlik, oturum, dil ve çerez tercihlerinin saklanması.</td>
              <td className="p-3">Her zaman etkin</td>
            </tr>
            <tr>
              <td className="p-3 font-medium">Analitik çerezler</td>
              <td className="p-3">Ziyaret ve performans verilerini toplu olarak değerlendirmek.</td>
              <td className="p-3">Yalnızca onayınızla</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-2xl font-semibold text-(--gm-text)">Tercihlerinizi yönetme</h2>
      <p className="mt-3 leading-7">
        İlk ziyaretinizde görünen çerez bandından analitik çerezleri kabul edebilir, reddedebilir veya
        ayrıntılı tercihlerinizi belirleyebilirsiniz. Tarayıcı ayarlarınız üzerinden çerezleri silebilir
        ya da engelleyebilirsiniz. Zorunlu çerezlerin engellenmesi sitenin bazı işlevlerini etkileyebilir.
      </p>

      <h2 className="mt-8 text-2xl font-semibold text-(--gm-text)">Saklama süresi ve iletişim</h2>
      <p className="mt-3 leading-7">
        Çerez tercihiniz en fazla 180 gün saklanır. Politika veya kişisel verilerinizle ilgili
        sorularınız için <a className="font-semibold text-brand-primary hover:underline" href="mailto:destek@isletmeniyonet.com">destek@isletmeniyonet.com</a> adresinden bize ulaşabilirsiniz.
      </p>

      <p className="mt-8 text-sm text-(--gm-muted)">Son güncelleme: 29 Temmuz 2026</p>
    </article>
  );

  return (
    <section className="relative min-h-[60vh] py-16 lg:py-24 overflow-hidden">
      {/* Background Decor - Spiritual/Celestial Theme */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-(--gm-gold)/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-32 w-[400px] h-[400px] bg-(--gm-primary)/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {isLoading && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-12 bg-(--gm-surface) rounded-2xl w-1/3 animate-pulse" />
            <div className="space-y-3">
              <div className="h-4 bg-(--gm-surface) rounded w-full animate-pulse" />
              <div className="h-4 bg-(--gm-surface) rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-(--gm-surface) rounded w-4/6 animate-pulse" />
            </div>
          </div>
        )}

        {!isLoading && (isError || !page) && (isTr ? turkishFallback : (
          <div className="max-w-4xl mx-auto text-center py-20">
            <div className="inline-block bg-(--gm-surface) border border-(--gm-border-soft) text-(--gm-text-dim) px-8 py-4 rounded-2xl" role="alert">
              {ui('ui_cookie_policy_empty', 'Content is being prepared.')}
            </div>
          </div>
        ))}

        {!!page && !isLoading && (
          <div className="max-w-4xl mx-auto">
            <style>{CMS_FALLBACK_CSS}</style>

            <header className="mb-16 text-center">
              <span className="font-display text-[10px] tracking-[0.4em] text-(--gm-gold-deep) uppercase mb-4 block">
                {isTr ? 'YASAL BİLGİLENDİRME' : 'LEGAL INFORMATION'}
              </span>
              <h1 className="text-4xl md:text-6xl font-serif font-light text-(--gm-text) mb-8 leading-tight">
                {title}
              </h1>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-(--gm-gold) to-transparent mx-auto" />
            </header>

            {html ? (
              <article
                className="prose prose-stone prose-lg max-w-none bg-(--gm-surface) p-8 md:p-16 rounded-[2rem] shadow-card border border-(--gm-border-soft) cms-html text-(--gm-text-dim) leading-relaxed"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div
                className="bg-(--gm-surface) border border-(--gm-border-soft) text-(--gm-text-dim) px-8 py-6 rounded-2xl text-center italic font-serif"
                role="alert"
              >
                {ui('ui_cookie_policy_empty_text', 'Bu bölümün içeriği yakında eklenecektir.')}
              </div>
            )}

            <footer className="mt-16 text-center">
              <p className="text-(--gm-muted) text-sm font-light">
                {isTr ? 'Son güncelleme:' : 'Last updated:'} {new Date().toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
              </p>
            </footer>
          </div>
        )}
      </div>
    </section>
  );
};

export default CookiePolicyPageContent;
