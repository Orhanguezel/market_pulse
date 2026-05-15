export const HOME_LAYOUT_COMPONENT_OPTIONS = [
  { key: 'HeroNew', label: 'Hero (üst vitrin)' },
  { key: 'BannerSlot', label: 'Banner alanı' },
  { key: 'PromisesSection', label: 'Özet / vaatler (HomeIntro benzeri)' },
  { key: 'FeaturesNew', label: 'Özellikler (3 sütun)' },
  { key: 'HybridModelSection', label: 'Hibrit model' },
  { key: 'TransparencySection', label: 'Şeffaflık' },
  { key: 'WaitlistSection', label: 'Bekleyen / CTA banner' },
  { key: 'ZodiacGridSection', label: 'Konu ızgarası (kategoriler)' },
  { key: 'ConsultantsSection', label: 'Danışman listesi' },
  { key: 'HomeIntroSection', label: 'Nasıl çalışır (adımlar)' },
  { key: 'WelcomeBannerSection', label: 'Karşılama bandı' },
  { key: 'HomeTestimonialsSection', label: 'Yorumlar' },
  { key: 'HomeBecomeConsultantBanner', label: 'Danışman ol CTA' },
  { key: 'PremiumMembershipBanner', label: 'Premium üyelik' },
  { key: 'FirstSessionDiscountBanner', label: 'İlk seans indirim' },
  { key: 'WelcomePremiumBanner', label: 'Premium hoş geldin' },
  { key: 'AppDownloadSection', label: 'Mobil uygulama indir' },
] as const;

export const HOME_LAYOUT_COMPONENT_KEYS = HOME_LAYOUT_COMPONENT_OPTIONS.map((o) => o.key);
