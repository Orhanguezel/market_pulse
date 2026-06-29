// İşletmeniyönet pazarlama yüzeyi — statik içerik verisi (birebir tasarım).
// Kaynak: isletmeniyonet.com PHP sitesi. Renkler/metinler spec ile birebir.
// NOT: Hizmet detay sayfaları aşamalı eklenecek; menü slug'ları /{locale}/hizmetler/{slug}'a işaret eder.

export const IY_BRAND = {
  name: 'İşletmeniYönet',
  tagline: 'İş Geliştirme Platformu',
  description:
    'İhracat, CRM, B2B müşteri bulma, e-ticaret, pazaryeri yönetimi, eğitim ve dijital dönüşüm süreçleri için tek platform.',
  email: 'sultan@isletmeniyonet.com',
  email2: 'destek@isletmeniyonet.com',
  phone: '+90 538 616 48 80',
  phoneRaw: '905386164880',
  whatsapp:
    'https://wa.me/905386164880?text=Merhaba,%20bilgi%20almak%20istiyorum.',
} as const;

import type { CSSProperties } from 'react';

// İşletmeniyönet pazarlama yüzeyi kök stili.
// Poppins + koyu metin token'larını tema modundan (light/dark) BAĞIMSIZ zorlar:
// global `h1-h6{color:var(--color-text-primary)}` ve `p{...font-serif}` kuralları
// dark mode'da metni açığa çevirip beyaz zeminde görünmez yapıyordu — bunu ezer.
export const IY_SURFACE_STYLE = {
  fontFamily: 'var(--font-poppins), system-ui, sans-serif',
  '--font-display': 'var(--font-poppins), system-ui, sans-serif',
  '--font-serif': 'var(--font-poppins), system-ui, sans-serif',
  '--font-sans': 'var(--font-poppins), system-ui, sans-serif',
  '--color-text-primary': '#0f172a',
  '--color-text-secondary': '#334155',
  '--color-text-muted': '#64748b',
} as CSSProperties;

// Koyu zeminli IY yüzeyi (footer) — global h/p/a kurallarını AÇIK metne zorlar
// (aksi halde light mode'da koyu metin koyu zemine basılıp görünmez olur).
export const IY_DARK_SURFACE_STYLE = {
  fontFamily: 'var(--font-poppins), system-ui, sans-serif',
  '--font-display': 'var(--font-poppins), system-ui, sans-serif',
  '--font-serif': 'var(--font-poppins), system-ui, sans-serif',
  '--font-sans': 'var(--font-poppins), system-ui, sans-serif',
  '--color-text-primary': '#f8fafc',
  '--color-text-secondary': '#cbd5e1',
  '--color-text-muted': '#94a3b8',
  '--color-brand-primary': '#cbd5e1',
  '--color-brand-hover': '#ffffff',
} as CSSProperties;

// slug → /{locale}/hizmetler/{slug} · href → /{locale}{href} (doğrudan app route)
export type IyMenuLink = { label: string; slug: string; href?: string };
export type IyMenuColumn = { title: string; links: IyMenuLink[] };
export type IyMenuGroup = { label: string; columns: IyMenuColumn[] };

// Üst menü mega yapısı (birebir).
export const IY_MENU: IyMenuGroup[] = [
  {
    label: 'Hizmetler',
    columns: [
      {
        title: 'İhracat ve Büyüme',
        links: [
          { label: 'Uçtan Uca İhracat Yönetimi', slug: 'uctan-uca-ihracat-yonetimi' },
          { label: 'Şirketi İhracata Hazırlama', slug: 'sirketi-ihracata-hazirlama' },
          { label: 'Mail Marketing ve Telefon Aramaları', slug: 'mail-marketing-ve-telefon-aramalari' },
          { label: 'İhracat Operasyon Yönetimi', slug: 'ihracat-operasyon-yonetimi' },
        ],
      },
      {
        title: 'Dijital Dönüşüm ve Teşvikler',
        links: [
          { label: 'İhracata Yönelik Web Sitesi Hazırlığı', slug: 'ihracata-yonelik-web-sitesi-hazirligi' },
          { label: 'DYS ve Fuar Teşvikleri Danışmanlığı', slug: 'dys-ve-fuar-tesvikleri-danismanligi' },
          { label: 'B2B Platformlarda Ürün Yayınlama', slug: 'b2b-platformlarda-urun-yayinlama' },
          { label: 'Kurumsal Dijital Dönüşüm Danışmanlığı', slug: 'kurumsal-dijital-donusum-danismanligi' },
        ],
      },
    ],
  },
  {
    label: 'CRM',
    columns: [
      {
        title: 'Satış CRM',
        links: [
          { label: 'CRM Yazılımı', slug: 'crm-yazilimi' },
          { label: 'Satış Ekibi Otomasyonu', slug: 'satis-ekibi-otomasyonu' },
          { label: 'Müşteri Adayı Yönetimi', slug: 'musteri-adayi-yonetimi' },
          { label: 'Teklif ve Sipariş Yönetimi', slug: 'teklif-ve-siparis-yonetimi' },
        ],
      },
      {
        title: 'Pazarlama ve Otomasyon',
        links: [
          { label: 'Satış Süreci Analizi', slug: 'satis-sureci-analizi' },
          { label: 'E-posta Pazarlama ve E-posta İzleme', slug: 'e-posta-pazarlama-ve-e-posta-izleme' },
          { label: 'CRM Kampanya Yönetimi', slug: 'crm-kampanya-yonetimi' },
          { label: 'CRM İş Akışları', slug: 'crm-is-akislari' },
        ],
      },
      {
        title: 'Akıllı CRM Kullanımı',
        links: [
          { label: 'Yapay Zekâlı CRM', slug: 'yapay-zekali-crm' },
          { label: 'Ekipler İçin CRM', slug: 'ekipler-icin-crm' },
          { label: 'Sektörlere Göre CRM', slug: 'sektorlere-gore-crm' },
          { label: 'Rollere Göre CRM', slug: 'rollere-gore-crm' },
        ],
      },
    ],
  },
  {
    label: 'İhracat',
    columns: [
      {
        title: 'İhracat Müşteri Bulma',
        links: [
          { label: 'Konşimento Verileri ile Alıcı Firma Bulma', slug: 'konsimento-verileri-ile-alici-firma-bulma' },
          { label: '190+ Ülke Alıcı Firma Verileri', slug: '190-ulke-alici-firma-verileri' },
          { label: 'GTİP / HS Koduna Göre Müşteri Bulma', slug: 'gtip-hs-koduna-gore-musteri-bulma' },
          { label: 'Ürün Adına Göre İthalatçı Firma Bulma', slug: 'urun-adina-gore-ithalatci-firma-bulma' },
        ],
      },
      {
        title: 'Karar Verici ve Takip',
        links: [
          { label: 'Satın Alma Müdürü ve Karar Verici Kişi Bulma', slug: 'satin-alma-muduru-ve-karar-verici-kisi-bulma' },
          { label: 'Mail Adresi Bulma', slug: 'mail-adresi-bulma' },
          { label: 'LinkedIn ile B2B Müşteri Bulma', slug: 'linkedin-ile-b2b-musteri-bulma' },
          { label: 'Mail Marketing Kampanyası Hazırlama', slug: 'mail-marketing-kampanyasi-hazirlama' },
          { label: 'Telefon Aramaları ile Müşteri Takibi', slug: 'telefon-aramalari-ile-musteri-takibi' },
        ],
      },
    ],
  },
  {
    label: 'E-Ticaret',
    columns: [
      {
        title: 'Türkiye Pazaryerleri',
        links: [
          { label: 'Trendyol Eğitimi', slug: 'trendyol-egitimi' },
          { label: 'Trendyol Hesap Yönetimi', slug: 'trendyol-hesap-yonetimi' },
          { label: 'Trendyol Ürün Yükleme ve Mağaza Yönetimi', slug: 'trendyol-urun-yukleme-ve-magaza-yonetimi' },
        ],
      },
      {
        title: 'Global Pazaryerleri',
        links: [
          { label: 'Amazon Eğitimi ve Hesap Yönetimi', slug: 'amazon-egitimi-ve-hesap-yonetimi' },
          { label: 'Etsy Eğitimi ve Hesap Yönetimi', slug: 'etsy-egitimi-ve-hesap-yonetimi' },
          { label: 'eBay Eğitimi ve Hesap Yönetimi', slug: 'ebay-egitimi-ve-hesap-yonetimi' },
        ],
      },
      {
        title: 'B2B Platformlar',
        links: [
          { label: 'Alibaba Hesap Yönetimi', slug: 'alibaba-hesap-yonetimi' },
          { label: 'TradeWheel Platform Yönetimi', slug: 'tradewheel-platform-yonetimi' },
          { label: 'Go4WorldBusiness Platform Yönetimi', slug: 'go4worldbusiness-platform-yonetimi' },
          { label: 'Europages Firma Profili Yönetimi', slug: 'europages-firma-profili-yonetimi' },
          { label: 'B2B Platformlarda Ürün Yükleme', slug: 'b2b-platformlarda-urun-yukleme' },
        ],
      },
    ],
  },
  {
    label: 'Eğitimler',
    columns: [
      {
        title: 'Yapay Zekâ Eğitimleri',
        links: [
          { label: 'Şirketlere Özel Yapay Zeka Eğitimi', slug: 'sirketlere-ozel-yapay-zeka-egitimi' },
          { label: 'ChatGPT Eğitimi', slug: 'chatgpt-egitimi' },
          { label: 'Claude Code Eğitimi', slug: 'claude-code-egitimi' },
          { label: 'Gemini Eğitimi', slug: 'gemini-egitimi' },
          { label: 'Antigravity Eğitimi', slug: 'antigravity-egitimi' },
        ],
      },
      {
        title: 'LinkedIn ve Müşteri Bulma',
        links: [
          { label: 'LinkedIn Eğitimi', slug: 'linkedin-egitimi' },
          { label: 'LinkedIn Sales Navigator Eğitimi', slug: 'linkedin-sales-navigator-egitimi' },
          { label: 'LinkedIn ile Müşteri Bulma Eğitimi', slug: 'linkedin-ile-musteri-bulma-egitimi' },
        ],
      },
      {
        title: 'İşletme ve Ticaret',
        links: [
          { label: 'Şirket Yönetim Eğitimi', slug: 'sirket-yonetim-egitimi' },
          { label: 'İhracat Eğitimi', slug: 'ihracat-egitimi' },
          { label: 'E-Ticaret ve Pazaryeri Eğitimi', slug: 'e-ticaret-ve-pazaryeri-egitimi' },
          { label: 'Mail Marketing Eğitimi', slug: 'mail-marketing-egitimi' },
        ],
      },
    ],
  },
  {
    label: 'Paketler',
    columns: [
      {
        title: 'İhracat ve Müşteri Bulma Paketleri',
        links: [
          { label: 'İhracata Hazırlık Paketi', slug: 'ihracata-hazirlik-paketi' },
          { label: 'B2B Müşteri Bulma Paketi', slug: 'b2b-musteri-bulma-paketi' },
          { label: 'Dış Ticaret Departmanı Paketi', slug: 'dis-ticaret-departmani-paketi' },
          { label: 'DYS ve Fuar Teşvikleri Paketi', slug: 'dys-ve-fuar-tesvikleri-paketi' },
        ],
      },
      {
        title: 'Dijital Dönüşüm Paketleri',
        links: [
          { label: 'CRM Kurulum Paketi', slug: 'crm-kurulum-paketi' },
          { label: 'E-Ticaret ve Pazaryeri Paketi', slug: 'e-ticaret-ve-pazaryeri-paketi' },
          { label: 'Kurumsal Eğitim Paketi', slug: 'kurumsal-egitim-paketi' },
        ],
      },
    ],
  },
  {
    label: 'Kurumsal',
    columns: [
      {
        title: 'Şirket',
        links: [
          { label: 'Hakkımızda', slug: 'kurumsal-hakkimizda' },
          { label: 'Blog', slug: '', href: '/blog' },
          { label: 'Kullanım Kılavuzu', slug: '', href: '/faqs' },
          { label: 'İletişim', slug: '', href: '/contact' },
        ],
      },
      {
        title: 'Yasal Bilgiler',
        links: [
          { label: 'Gizlilik Sözleşmesi', slug: '', href: '/gizlilik' },
          { label: 'Mesafeli Satış Sözleşmesi', slug: '', href: '/kullanim-sartlari' },
          { label: 'Teslimat ve İade Şartları', slug: '', href: '/legal-notice' },
        ],
      },
    ],
  },
];

// Footer kolonları (birebir, 4 kolon)
export const IY_FOOTER_COLUMNS: IyMenuColumn[] = [
  {
    title: 'Hizmetler',
    links: [
      { label: 'Uçtan Uca İhracat Yönetimi', slug: 'uctan-uca-ihracat-yonetimi' },
      { label: 'Şirketi İhracata Hazırlama', slug: 'sirketi-ihracata-hazirlama' },
      { label: 'İhracat Operasyon Yönetimi', slug: 'ihracat-operasyon-yonetimi' },
      { label: 'Web Sitesi Hazırlığı', slug: 'ihracata-yonelik-web-sitesi-hazirligi' },
      { label: 'DYS ve Fuar Teşvikleri', slug: 'dys-ve-fuar-tesvikleri-danismanligi' },
      { label: 'B2B Ürün Yayınlama', slug: 'b2b-platformlarda-urun-yayinlama' },
      { label: 'Dijital Dönüşüm Danışmanlığı', slug: 'kurumsal-dijital-donusum-danismanligi' },
      { label: 'Mail Marketing', slug: 'mail-marketing-ve-telefon-aramalari' },
    ],
  },
  {
    title: 'CRM ve B2B',
    links: [
      { label: 'CRM Yazılımı', slug: 'crm-yazilimi' },
      { label: 'Satış Ekibi Otomasyonu', slug: 'satis-ekibi-otomasyonu' },
      { label: 'Müşteri Adayı Yönetimi', slug: 'musteri-adayi-yonetimi' },
      { label: 'Konşimento ile Alıcı Bulma', slug: 'konsimento-verileri-ile-alici-firma-bulma' },
      { label: 'GTİP / HS Müşteri Bulma', slug: 'gtip-hs-koduna-gore-musteri-bulma' },
      { label: 'Karar Verici Kişi Bulma', slug: 'satin-alma-muduru-ve-karar-verici-kisi-bulma' },
      { label: 'Mail Adresi Bulma', slug: 'mail-adresi-bulma' },
      { label: 'LinkedIn ile B2B Müşteri', slug: 'linkedin-ile-b2b-musteri-bulma' },
    ],
  },
  {
    title: 'E-Ticaret ve Eğitim',
    links: [
      { label: 'Trendyol Hesap Yönetimi', slug: 'trendyol-hesap-yonetimi' },
      { label: 'Amazon Hesap Yönetimi', slug: 'amazon-egitimi-ve-hesap-yonetimi' },
      { label: 'Etsy & eBay Yönetimi', slug: 'etsy-egitimi-ve-hesap-yonetimi' },
      { label: 'Alibaba Hesap Yönetimi', slug: 'alibaba-hesap-yonetimi' },
      { label: 'Yapay Zeka Eğitimi', slug: 'sirketlere-ozel-yapay-zeka-egitimi' },
      { label: 'ChatGPT Eğitimi', slug: 'chatgpt-egitimi' },
      { label: 'LinkedIn Eğitimi', slug: 'linkedin-egitimi' },
      { label: 'İhracat Eğitimi', slug: 'ihracat-egitimi' },
    ],
  },
  {
    title: 'Paketler ve Kurumsal',
    links: [
      { label: 'İhracata Hazırlık Paketi', slug: 'ihracata-hazirlik-paketi' },
      { label: 'B2B Müşteri Bulma Paketi', slug: 'b2b-musteri-bulma-paketi' },
      { label: 'CRM Kurulum Paketi', slug: 'crm-kurulum-paketi' },
      { label: 'Kurumsal Eğitim Paketi', slug: 'kurumsal-egitim-paketi' },
      { label: 'Hakkımızda', slug: 'kurumsal-hakkimizda' },
      { label: 'Blog', slug: '', href: '/blog' },
      { label: 'İletişim', slug: '', href: '/contact' },
      { label: 'Gizlilik Sözleşmesi', slug: '', href: '/gizlilik' },
    ],
  },
];

// ── Uygulama (dashboard) sol menü modülleri ──
// icon: lucide adı (AppSidebar'da map'lenir). path: /{locale}{path}. soon: sayfası yok (yakında).
// module: entitlement anahtarı (faz 2'de tenant_modules ile filtre).
export type IyAppNavItem = {
  key: string; label: string; icon: string; path?: string; soon?: boolean; module?: string;
};
export type IyAppNavGroup = { title: string; items: IyAppNavItem[] };

export const IY_APP_NAV: IyAppNavGroup[] = [
  {
    title: 'Menü',
    items: [
      { key: 'dashboard', label: 'Haber Akışı', icon: 'LayoutDashboard', path: '/dashboard' },
      { key: 'leads', label: 'Potansiyel Müşteriler', icon: 'Target', soon: true, module: 'crm' },
      { key: 'accounts', label: 'Müşteriler', icon: 'Building2', path: '/musteriler', module: 'crm' },
      { key: 'deals', label: 'Satış Fırsatları', icon: 'TrendingUp', path: '/satis-firsatlari', module: 'crm' },
      { key: 'quotes', label: 'Teklifler', icon: 'FileText', soon: true, module: 'crm' },
      { key: 'orders', label: 'Siparişler', icon: 'ShoppingCart', soon: true, module: 'crm' },
      { key: 'products', label: 'Ürünler', icon: 'Package', soon: true, module: 'crm' },
      { key: 'documents', label: 'Belgeler', icon: 'Folder', soon: true, module: 'crm' },
      { key: 'activities', label: 'Aktiviteler', icon: 'CalendarCheck', path: '/aktiviteler', module: 'crm' },
      { key: 'tasks', label: 'Görevler', icon: 'ListChecks', soon: true, module: 'crm' },
      { key: 'reminders', label: 'Hatırlatma Yönetimi', icon: 'BellRing', soon: true, module: 'crm' },
      { key: 'mail', label: 'Mail Yönetimi', icon: 'Mail', soon: true, module: 'email-marketing' },
      { key: 'lead-machine', label: 'Leads', icon: 'Radar', soon: true, module: 'leads' },
      { key: 'amazon', label: 'Amazon Analizi', icon: 'BarChart3', path: '/amazon', module: 'leads' },
    ],
  },
  {
    title: 'Hesap',
    items: [
      { key: 'business', label: 'İşletme Yönetimi', icon: 'Briefcase', soon: true },
      { key: 'users', label: 'Kullanıcılar', icon: 'Users', soon: true },
      { key: 'reports', label: 'Raporlar', icon: 'PieChart', soon: true },
      { key: 'profile', label: 'Profilim', icon: 'User', path: '/profile' },
    ],
  },
];

// Locale-aware hizmet linki
export function iyHref(locale: string | undefined, slug: string): string {
  const l = locale || 'tr';
  return `/${l}/hizmetler/${slug}`;
}
// Menü/footer linki: doğrudan href varsa onu, yoksa hizmet slug'ını çöz
export function iyLinkHref(locale: string | undefined, link: IyMenuLink): string {
  const l = locale || 'tr';
  if (link.href) return `/${l}${link.href}`;
  return iyHref(l, link.slug);
}
export function iyTeklifHref(locale: string | undefined): string {
  return `/${locale || 'tr'}/teklif-al`;
}
// Giriş/kayıt: site adresinden bağımsız — uygulamanın kendi auth route'u (Google girişli)
export function iyLoginHref(locale: string | undefined): string {
  return `/${locale || 'tr'}/login`;
}
export function iyRegisterHref(locale: string | undefined): string {
  return `/${locale || 'tr'}/register`;
}
