# MatPortal — Paspas ERP Genişleme Proje Teklifi

Bu klasör, **Paspas Üretim ERP**'sinin üzerine inşa edilecek **11 fazlı dijital dönüşüm** projesinin tam teklif dokümanını içerir. Mevcut ERP altyapısını koruyarak; bayi portalı, sipariş tahmin motoru, churn radarı, scraping altyapısı, MLOps katmanı, konversasyonel AI ve mobil/saha CRM modüllerinin **birbirini besleyen** kademeli bir ekosistem olarak inşa edilmesi hedeflenmektedir.

Felsefe: **Veri-önce, AI-yardımcı.** Her tahmin önce istatistiksel yöntemle yapılır; AI yanına gelir, açıklar, öneri verir. Her aksiyon risk skoruyla etiketlenir, audit'lenir, geri alınabilir.

## Doküman Yapısı

| Dosya | İçerik |
|-------|--------|
| `00-yonetici-ozeti.md` | 11 fazlı vizyon stratejik özet — kullanıcı tipleri, kazanç matrisi, yol haritası |
| `01-pazar-ve-musteri-analizi.md` | Mevcut müşteri tabanı analizi, segmentler, fırsat haritası |
| `02-cozum-genel-bakis.md` | 7 katmanlı mimari + 11 fazın çıktı haritası + modül listesi (~17 modül) |
| `03-mimari-ve-teknoloji.md` | Teknik mimari, multi-deployment topolojisi, ML servis köprüsü |
| `04-kullanici-yolculuklari.md` | Bayi/yönetici/saha ekibi uçtan uca akışlar |
| `05-fonksiyonel-kapsam.md` | 260+ özellik MVP/Genişleme/Vizyon kategorize, 11 fazda dağılmış |
| `06-veri-modeli.md` | Yeni tablolar, mevcut ERP ile entegrasyon noktaları |
| `07-yol-haritasi.md` | Faz-faz takvim, milestone'lar |
| `08-butce-kaynak.md` | İnsan kaynağı, altyapı, dış servis ihtiyaçları |
| `09-risk.md` | Teknik + iş + güvenlik riskleri ve önlemleri |
| `10-basari-kpi.md` | Başarı kriterleri, ölçülecek metrikler |
| `11-ek-belgeler.md` | Terim sözlüğü, referanslar, ek görseller |
| `tek-sayfa-ozet.md` | A4 tek sayfa asansör konuşması |

## Bağlantılı Tartışma Klasörü

Her fazın derinlemesine teknik tasarımı [`docs/tartisma/`](../tartisma/) altındadır:
- Faz 2 derinlemesine: [`12-tahmin-motoru-derinlemesine.md`](../tartisma/12-tahmin-motoru-derinlemesine.md)
- Faz 5 derinlemesine: [`13-bayi-scraping-churn.md`](../tartisma/13-bayi-scraping-churn.md)
- Faz 7 derinlemesine: [`14-egitilebilir-modeller-mlops.md`](../tartisma/14-egitilebilir-modeller-mlops.md)
- Faz 8+ vizyonu (10 ek sinyal): [`15-genisletme-sinyalleri.md`](../tartisma/15-genisletme-sinyalleri.md)

## Belge Versiyonu

- **v1.0** — 2026-05-01 — İlk taslak (B2B portal odaklı)
- **v1.1** — 2026-05-01 — 11 fazlı tam vizyona genişletildi (00, 02, 05 dokümanları yeniden yazıldı)

## Sunum

Doküman HTML olarak Paspas admin paneli içinden erişilir; her bölümün altında kalıcı not defteri vardır — yönetici sorularını/yorumlarını yazınca anında kaydedilir.
