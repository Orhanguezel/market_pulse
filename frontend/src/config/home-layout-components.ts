export const HOME_LAYOUT_COMPONENT_OPTIONS = [
  { key: 'HeroNew', label: 'Hero (üst vitrin)' },
  { key: 'BannerSlot', label: 'Banner alanı' },
  { key: 'PromisesSection', label: 'Özet / vaatler' },
  { key: 'FeaturesNew', label: 'Özellikler (3 sütun)' },
  { key: 'TransparencySection', label: 'Fiyatlandırma' },
  { key: 'WaitlistSection', label: 'Bekle / CTA banner' },
  { key: 'HomeIntroSection', label: 'Nasıl çalışır (adımlar)' },
  { key: 'WelcomeBannerSection', label: 'Karşılama bandı' },
  { key: 'HomeTestimonialsSection', label: 'Yorumlar' },
] as const;

export const HOME_LAYOUT_COMPONENT_KEYS = HOME_LAYOUT_COMPONENT_OPTIONS.map((o) => o.key);
