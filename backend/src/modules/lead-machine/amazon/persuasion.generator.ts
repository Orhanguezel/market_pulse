import type { AmazonRiskReport } from './amazon.types';

type PersuasionRule = {
  check: (scores: AmazonRiskReport['scores']) => boolean;
  point: string;
};

const RULES: PersuasionRule[] = [
  {
    check: (s) => s.category_risk.score >= 6,
    point: 'Yüksek satıcı yoğunluğu fiyat disiplinini bozuyor — yetkili bayi modeli olmadan sürdürülebilir konumlanmak güçleşiyor.',
  },
  {
    check: (s) => s.price_war_risk.score >= 6,
    point: 'Aktif fiyat savaşı mevcut — konumlanmak için pencere kapanmadan harekete geçmek kritik.',
  },
  {
    check: (s) => s.sku_chaos.score >= 6,
    point: 'Standart dışı fiyatlandırma ve yüksek varyant baskısı marka algısını zedeliyor.',
  },
  {
    check: (s) => s.brand_reliability.score <= 4,
    point: 'Yetkili kanal açılırsa listing kalitesi ve marka görünürlüğü direkt iyileşir.',
  },
  {
    check: (s) => s.operational_risk.score >= 6,
    point: 'Yüksek iade/şikayet oranı operasyonel risk oluşturuyor — çözüm fırsatı sizi kategoride öne çıkarır.',
  },
];

const FALLBACK = 'Kategori şu an istikrarlı görünüyor — erken giriş için uygun pencere.';

export function generatePersuasionPoints(scores: AmazonRiskReport['scores']): string[] {
  const points = RULES.filter((rule) => rule.check(scores)).map((rule) => rule.point);
  return points.length > 0 ? points.slice(0, 4) : [FALLBACK];
}
