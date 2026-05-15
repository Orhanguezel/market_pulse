# 02 — Çözüm Genel Bakış

## Vizyon

MatPortal, Paspas Üretim ERP'sinin üzerine inşa edilen **kademeli bir dijital dönüşüm ekosistemidir**. Bayi portalı, sipariş tahmin motoru, churn radarı, scraping altyapısı, MLOps katmanı ve konversasyonel AI modüllerinin **birbirini besleyen** modüler bir bütünüdür.

Bu doküman 11 fazın her birinin **ne ürettiğini**, **hangi mevcut modüle bağlandığını**, **kimden veri aldığını** ve **kimi beslediğini** anlatır. Her fazın derinlemesine teknik tasarımı `tartisma/` klasöründeki ayrı dokümanlarda yapılır — burada **bütünlük resmi** vardır.

## 3 Tip Kullanıcı

| # | Kullanıcı | Ne yapar | Hangi modülü kullanır |
|---|-----------|----------|------------------------|
| 1 | **Bayi (B2B müşteri)** | Sipariş, cari sorgu, katalog, mesajlaşma | Faz 6 (Portal), Faz 8 (Sohbet), Faz 9 (Mobil) |
| 2 | **Yönetici / Satış sorumlusu** | Bayileri yönetir, kampanyalar, raporlar, churn izler | Faz 2-7'nin tüm yönetici arayüzleri |
| 3 | **Saha temsilcisi** | Bayi ziyareti, sipariş alma, churn aksiyon | Faz 9 (Mobil), Faz 5 (Churn radar) |

## 7 Katmanlı Mimari Görünüm

```
┌─────────────────────────────────────────────────────────────────┐
│                    G — KONVERSASYONEL KATMAN                    │
│   Yönetici/bayi yazışarak iş yapsın (Faz 8)                     │
│   • risk skoru + güven eşiği bazlı onay                         │
│   • her aksiyon audit'li, geri alınabilir                       │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓ niyet/aksiyon
┌─────────────────────────────────────────────────────────────────┐
│                    F — UYGULAMA KATMANI                         │
│   Bayi Portalı (Faz 6) + Mobil (Faz 9) + Saha CRM (Faz 9+)      │
│   • bayi sipariş kanalı, cari sorgu, katalog                    │
│   • saha ziyaret kaydı, push bildirim                           │
└──────────────────────────┬──────────────────────────────────────┘
                           ↑ data
┌─────────────────────────────────────────────────────────────────┐
│                    E — MLOps KATMANI                            │
│   Eğitilebilir modeller + versiyon + A/B test (Faz 7)           │
│   • Excel yükle → model yenile                                  │
│   • champion/challenger + auto-rollback                         │
│   • SHAP + doğal dil açıklama                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           ↑ predictions
┌─────────────────────────────────────────────────────────────────┐
│                    D — TAHMİN MOTORLARI                         │
│   Sipariş tahmin (Faz 2) + Churn tahmin (Faz 5) + Stok (Faz 4)  │
│   • naive → Prophet → XGBoost → LSTM kademeli                   │
│   • bayi-ürün, segment, genel 3 katman                          │
│   • multivariate (kur, hava, kampanya, tatil)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           ↑ signals
┌─────────────────────────────────────────────────────────────────┐
│                    C — SİNYAL TOPLAMA                           │
│   Web scraping (Faz 5) + Sosyal medya + İç ERP verisi           │
│   • Crawlee + Playwright + Apify (sosyal)                       │
│   • robots.txt + KVKK uyumlu                                    │
│   • LLM destekli sinyal çıkarımı (HTML diff)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           ↑ raw data
┌─────────────────────────────────────────────────────────────────┐
│                    B — TALEP TOPLAMA & KEŞİF                    │
│   Talep havuzu (Faz 1) + Müşteri keşfi (Faz 3)                  │
│   • bayi/müşteri talepleri merkezi                              │
│   • yurt içi (TOBB, sanayim.net) + yurt dışı (Apollo) lead       │
└──────────────────────────┬──────────────────────────────────────┘
                           ↑
┌─────────────────────────────────────────────────────────────────┐
│                    A — PASPAS ERP (mevcut)                      │
│   Faz 0: tamamlanma, polish, stabilite                          │
│   • 14 modül: ürün, reçete, üretim, stok, satış, makine         │
└─────────────────────────────────────────────────────────────────┘
```

## 11 Faz — Çıktı Haritası

### Faz 0 — Paspas Tamamlanma
**Süre:** 4 hafta. **Ön koşul:** Yok (mevcut çalışan sistem).

**Ne üretilir:**
- Mevcut açık 14 modülün polish'i (yarım kalmış uçlar, edge case'ler)
- Stabilite düzeltmeleri, bug fix
- Test coverage genişlemesi
- Performance baseline ölçümü

**Kabul kriterleri:**
- Tüm modüller "production stable" işareti
- Bilinen kritik bug = 0
- Operatör ekranı, üretim emri, sevk akışı kesintisiz çalışır

**Bağımlılık çıktısı:** sonraki tüm fazların güvendiği temel.

---

### Faz 1 — Talep Toplama Altyapısı
**Süre:** 4 hafta. **Ön koşul:** Faz 0.

**Ne üretilir:**
- `talep_havuzu` tablosu: bayi/müşteri/iç talep merkezi kayıt
- `talep_kaynak` enum: WhatsApp, telefon, email, portal, manuel
- Talep yapılandırma akışı (LLM destekli — serbest metin → JSON)
- Yönetici UI: gelen talepler kanban (yeni → işleniyor → siparişe → kapanış)
- Bağlantı: müşteri kartına tüm talep geçmişi
- Yapılandırılmış JSON: `{ urun, miktar, vade, fiyat_beklentisi, oncelik }`

**Kabul kriterleri:**
- WhatsApp/email talep manuel girişi 2 dakikada tamamlanır
- LLM yapılandırma %85+ doğrulukta
- Yönetici kanban kullanıyor

**Beslediği:** Faz 2 (tahmin motoru için ek sinyal).

> **Detay:** [`tartisma/01-talep-tahmin-motoru.md`](../tartisma/01-talep-tahmin-motoru.md)

---

### Faz 2 — Sipariş Tahmin Motoru
**Süre:** 8 hafta. **Ön koşul:** Faz 0 + Faz 1.

**Ne üretilir:**
- Kademeli algoritma paketi: naive → mevsimsel → lineer regresyon → Prophet → XGBoost
- Bayi-ürün × dönem tahmin tablosu (`tahmin_calistirma`)
- 3 katmanlı model hiyerarşisi: bayi-ürün özel → segment → genel
- Türk tatil takvimi entegrasyonu (Ramazan, Kurban, milli)
- Excel girdi formatı (`siparis_gecmisi_v1.xlsx`) ile tarihsel veri yükleme
- MAPE/RMSE/Bias dashboard
- Champion/challenger otomatik seçimi
- Açıklanabilirlik UI: sinyal listesi + doğal dil
- `/admin/tahmin-motoru` UI

**Kabul kriterleri:**
- En az 10 bayide MAPE < %35
- Yönetici manuel re-train yapabiliyor
- Her tahmin **gerçekleşen değer** ile karşılaştırılıyor (öğrenme döngüsü)

**Beslediği:** Faz 4 (stok), Faz 6 (portal teslim tahmini), Faz 7 (MLOps).

> **Detay:** [`tartisma/12-tahmin-motoru-derinlemesine.md`](../tartisma/12-tahmin-motoru-derinlemesine.md)

---

### Faz 3 — Müşteri Keşif Motoru
**Süre:** 6 hafta. **Ön koşul:** Faz 1 + Faz 2.

**Ne üretilir:**
- Yurt içi lead kaynakları: TOBB, sanayim.net, Google Places (TR), sektör portalları
- Yurt dışı lead kaynakları: Apollo.io API (free tier başlangıç)
- `lead_havuzu` tablosu: aday firma, iletişim, sektör, ölçek, skor
- Lead skorlama: mevcut bayi profiline benzerlik (ML)
- Manuel + AI birleşik segmentasyon
- `/admin/lead-pipeline` kanban (yeni → temas → görüşmede → kazanıldı/kayıp)
- Outreach taslak üretici (LLM)

**Kabul kriterleri:**
- Yurt içi haftalık 50+ kalite lead (manuel kontrolden geçen)
- Yurt dışı 20+ lead/hafta
- Lead → bayiye dönüşüm ölçümleniyor

**Beslediği:** Saha CRM (Faz 9+), B2B portal onboarding (Faz 6).

> **Detay:** [`tartisma/02-musteri-kesif.md`](../tartisma/02-musteri-kesif.md), [`tartisma/10-crm-karari.md`](../tartisma/10-crm-karari.md)

---

### Faz 4 — Stok & Tedarik Otomasyonu
**Süre:** 6 hafta. **Ön koşul:** Faz 2 (tahmin motoru gerek).

**Ne üretilir:**
- Tüketim hızı analizi (her ürün/hammadde için aylık/haftalık)
- Reçete bazlı ham madde projeksiyonu (üretim emri × reçete)
- Yeniden sipariş noktası (ROP) otomatik hesabı
- "Bu hafta ne almalıyız" yönetici raporu
- Tedarikçi performans skoru (zamanında teslim, kalite, fiyat)
- Tedarikçi karşılaştırma (alternatif tedarikçi listesi)
- Otomatik PO taslağı (manuel onayla tedarikçiye)

**Kabul kriterleri:**
- Stok-out olayları %50+ azalır
- Aşırı stok %30+ azalır
- PO taslakları yöneticiye haftalık otomatik

**Beslediği:** Üretim planlama, satınalma modülü.

> **Detay:** [`tartisma/03-tedarikci-yonetimi.md`](../tartisma/03-tedarikci-yonetimi.md), [`tartisma/04-stok-tahmin-otomasyonu.md`](../tartisma/04-stok-tahmin-otomasyonu.md)

---

### Faz 5 — Bayi Scraping & Churn Radarı
**Süre:** 8 hafta. **Ön koşul:** Faz 0 (bayi listesi var).

**Ne üretilir:**
- Crawlee + Playwright + Apify (sosyal) kazıma altyapısı
- KVKK + robots.txt + rate limit uyumlu crawler
- 11 sinyal türü: yeni rakip ürün, sosyal medya pasifliği, fiyat değişimi, vb.
- Kural-bazlı + ML (XGBoost) churn skoru
- 30/60/90 gün churn olasılık tahmini
- `/admin/bayi-radari` heatmap dashboard
- Saha aksiyon log (önce/sonra ölçümleme)
- LLM aksiyon önerisi: "ne yapılmalı?"
- Bayi sözleşme klozu + KVKK aydınlatma

**Kabul kriterleri:**
- 100 bayinin haftalık taraması başarılı
- Churn ML modeli precision > 0.7
- En az 3 bayide churn'dan korunma kanıtı (aksiyon → skor düşüşü)

**Beslediği:** Saha CRM (yüksek riskli bayilere ziyaret), Faz 7 (MLOps), kampanya planlama.

> **Detay:** [`tartisma/13-bayi-scraping-churn.md`](../tartisma/13-bayi-scraping-churn.md)

---

### Faz 6 — B2B Bayi Portalı (MatPortal)
**Süre:** 8 hafta. **Ön koşul:** Faz 0 (Paspas stable). Faz 2 paralel.

**Ne üretilir:** Bayinin doğrudan kullandığı portal — 10 alt modül.

#### Bayi tarafı (8 modül)

| # | Modül | Çıktı |
|---|-------|-------|
| 1 | Kimlik & hesap | Email+şifre login, JWT cookie, çoklu kullanıcı per bayi, rol bazlı yetki |
| 2 | Katalog & araç eşleşme | Marka→Model→Yıl filtre, uyumlu paspas listesi, bayi-iskonto fiyat, stok durumu |
| 3 | Sipariş & sepet | Sepet yönetimi, kredi limit kontrolü, doğrudan ERP'ye akış (`repoCreate`) |
| 4 | Cari hesap & ödeme | Bakiye, ekstre, vade, fatura PDF, yaklaşan ödemeler |
| 5 | Sipariş takibi | Üretim → kargo → teslim canlı takip, geçmiş, "yeniden sipariş" |
| 6 | Numune & iade | Numune talep akışı, iade bildirim + onay |
| 7 | Bildirim & not defteri | Sistem bildirimleri, yönetici-bayi mesajlaşma, dosya ek |
| 8 | Eğitim/yardım | SSS, video, kullanım rehberi |

#### Yönetici tarafı (2 modül + mevcut modül genişlemeleri)

| # | Modül | Çıktı |
|---|-------|-------|
| 9 | Bayi yönetimi | Bayi listesi, yetki, iskonto, kredi limiti, davranış raporu, pasifleştirme |
| 10 | Portal raporları | Sipariş hacmi, top ürünler, terk edilmiş sepet, "aranan ama olmayan araç", pazar haritası |

**Mevcut modül genişlemeleri:**
- Kampanya: portal'da bant, segment-spesifik, kupon
- Üretim planlama: portal siparişi tahmin verisi olarak besler
- Stok: bayi siparişinde otomatik rezervasyon
- Cari/muhasebe: ödeme anında portal'da

**Araç-paspas uyumluluk tablosu** (yeni):
- `arac_modelleri` (Marka + Model + Yıl + Gövde)
- `urun_arac_uyumlulugu` (SKU ↔ araç)
- MVP: ilk 30-40 popüler model (pazarın %80'i)
- Long-tail sonradan AI destekli genişler

**Kabul kriterleri:**
- Pilot 5 bayide 4 hafta kullanım, %80+ memnuniyet
- Sipariş hatası %80+ azalır
- Telefon/WhatsApp sipariş süresi yarıdan az

**Beslediği:** Faz 2 tahmin motoru (yeni veri akışı), Faz 5 churn radarı (portal kullanım sinyali).

> **Detay:** [`tartisma/11-b2b-bayi-portali.md`](../tartisma/11-b2b-bayi-portali.md)

---

### Faz 7 — Eğitilebilir Modeller (MLOps)
**Süre:** 8 hafta. **Ön koşul:** Faz 2 + Faz 5.

**Ne üretilir:**
- Python FastAPI ML servis (Bun → spawn / HTTP)
- MLflow + S3 model storage
- Champion/challenger A/B test mekanizması
- Excel upload UX: kolon eşleştirme, validation, preview, hata düzeltme
- Multivariate feature pipeline: kur (TCMB), tatil, hava (OpenWeather), kampanya
- Active learning: yönetici düzeltmesi → calibration layer
- SHAP + LLM doğal dil açıklama
- Auto-rollback: MAPE > %50 → eski sürüm
- Multi-deployment hazırlık (env-based config)

**Kabul kriterleri:**
- Yönetici Excel yüklerken modeli yeniden eğitebiliyor
- A/B test 7 gün otomatik koşuyor, istatistiksel anlamlı sonucu UI'da gösteriyor
- Açıklanabilirlik %95 tahminde aktif

**Beslediği:** Tüm tahmin motorları (Faz 2, 4, 5) bu altyapıya geçer.

> **Detay:** [`tartisma/14-egitilebilir-modeller-mlops.md`](../tartisma/14-egitilebilir-modeller-mlops.md)

---

### Faz 8 — Konversasyonel Katman
**Süre:** 6 hafta. **Ön koşul:** Faz 2-7 olgunlaştığında.

**Ne üretilir:**
- Yönetici sohbet arayüzü: doğal dil ile sipariş, rapor, sorgu
- Bayi sohbet arayüzü (opsiyonel, varsayılan kapalı): "5000 paspas star siyah lazım"
- Niyet (intent) çıkarımı, parametre toplama (slot-filling)
- Risk skoru × güven eşiği × tutar limiti üçlü onay matrisi
- Audit log + rollback her aksiyon için
- Kill-switch: global / aksiyon türü / provider bazında kapatılabilir
- LLM provider abstraction (Claude / OpenAI / Groq seçilebilir)

**Kabul kriterleri:**
- Risk 4-6 düşük aksiyonlar otomatik (audit'li)
- Risk 10+ aksiyonlar **her zaman** insan onayı
- Onay penceresi (12-24 saat) konfigüre edilebilir

**Beslediği:** Tüm sistem — alternatif giriş kanalı.

> **Detay:** [`tartisma/07-konversasyonel-katman.md`](../tartisma/07-konversasyonel-katman.md), [`tartisma/09-otomasyon-esikleri.md`](../tartisma/09-otomasyon-esikleri.md)

---

### Faz 9 — Mobil & Saha CRM
**Süre:** 8 hafta. **Ön koşul:** Faz 6 (web stable).

**Ne üretilir:**
- **Saha satış mobil** (Flutter): bayi ziyaret kaydı, sesli not (Whisper), foto, offline-first sipariş
- **Bayi mobil**: portal'ın mobil versiyonu (ya native, ya PWA — kararı Faz 9 başında)
- **Operatör mobil** (zaten varsa polish): iş emri durumu, hata raporu, vardiya teslim
- Push bildirim altyapısı (Firebase Cloud Messaging)
- Saha ziyaret notları → Faz 5 churn sinyaline feed-in
- LLM özet: "ziyaret notunda kritik bilgi var mı?"

**Kabul kriterleri:**
- Saha ekibi günlük kullanım, kayıt yükü <2dk/ziyaret
- Offline çalışma 3 saat sonra senkronize
- Push bildirim teslim oranı >%95

**Beslediği:** Faz 5 (saha sinyalleri), Faz 8 (mobil sohbet).

---

### Faz 10+ — Genişleme Fazları
**Süre:** her biri 2-8 hafta. **Ön koşul:** Faz 0-9.

10 ek sinyal/modül — Promats yönetimi ile birlikte sıralanır:

| Modül | Tahmini süre | Detay |
|-------|--------------|-------|
| Rakip & pazar istihbaratı | 3-4 hf | Doc 15 — Sinyal #1 |
| Müşteri (B2C) churn | 2-3 hf | Doc 15 — Sinyal #2 |
| Fiyat optimizasyonu | 4-6 hf | Doc 15 — Sinyal #3 |
| AI belge işleme (OCR+LLM) | 3-4 hf | Doc 15 — Sinyal #4 |
| Lojistik & rota optimizasyonu | 4-6 hf | Doc 15 — Sinyal #5 |
| Dış veri / sektör trendleri | 2-3 hf | Doc 15 — Sinyal #7 |
| API entegrasyonları (e-Fatura, kargo, WhatsApp) | her biri 1-3 hf | Doc 15 — Sinyal #8 |
| Sürdürülebilirlik / karbon ayakizi | 6-8 hf | Doc 15 — Sinyal #10 (CBAM) |

> **Detay:** [`tartisma/15-genisletme-sinyalleri.md`](../tartisma/15-genisletme-sinyalleri.md)

---

## Modül Haritası — Toplam Bakış

| Katman | Faz | Modül adı | Yeni mi/var mı |
|--------|-----|-----------|----------------|
| A | 0 | Paspas — 14 mevcut modül | Var, polish |
| B | 1 | Talep havuzu | Yeni |
| B | 3 | Müşteri keşif (lead pipeline) | Yeni |
| C | 5 | Web kazıma altyapısı | Yeni |
| C | 5 | Sosyal medya tarayıcı | Yeni |
| D | 2 | Sipariş tahmin motoru | Yeni |
| D | 4 | Stok tahmin & ROP | Yeni |
| D | 4 | Tedarikçi otomasyonu | Yeni |
| D | 5 | Churn tahmin modeli | Yeni |
| E | 7 | MLOps platform (Python+MLflow) | Yeni |
| F | 6 | Bayi portal — 10 alt modül | Yeni |
| F | 6 | Yönetici sidebar genişlemesi | Var, genişler |
| F | 9 | Saha satış mobil | Yeni |
| F | 9 | Bayi mobil (PWA/native) | Yeni |
| F | 9 | Operatör mobil polish | Var |
| G | 8 | Konversasyonel katman (sohbet) | Yeni |
| 10+ | Çeşitli | 10 genişleme modülü | Yeni, ihtiyaca göre |

**Toplam yeni modül:** ~17. **Toplam genişletilen mevcut modül:** 4 (kampanya, üretim, stok, cari).

---

## Veri Akışı — Tek Yöne Doğru Bakış

```
┌──────────────────────────────────────────────────────────────────┐
│  GİRİŞ KANALLARI                                                 │
├──────────────────────────────────────────────────────────────────┤
│  Bayi (web/mobil)  │  Yönetici (admin)  │  Saha (mobil)         │
│  Sohbet (LLM)      │  Excel upload      │  Manuel form          │
│  Web kazıma        │  Sosyal medya API  │  Apollo/Hunter API    │
└────────────────────┬─────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────────┐
│  PASPAS BACKEND (Fastify + Bun + Drizzle)                        │
│  + ML Service (Python FastAPI)                                   │
│  + Crawl Service (Crawlee worker)                                │
│  + LLM Gateway (multi-provider abstraction)                      │
└────────────────────┬─────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────────┐
│  MySQL (promats_erp) — mevcut + yeni tablolar                    │
│                                                                  │
│  Mevcut (Paspas):  musteriler, urunler, satis_siparisleri,       │
│                    siparis_kalemleri, uretim_emirleri, recete,   │
│                    makine_havuzu, hareketler, vardiya, ...       │
│                                                                  │
│  Yeni (MatPortal):                                               │
│   Faz 1: talep_havuzu, talep_kalemleri                           │
│   Faz 2: tahmin_calistirma, tahmin_modelleri, tahmin_dogruluk    │
│   Faz 3: lead_havuzu, lead_etkilesim, outreach_kampanya          │
│   Faz 5: web_kazima_*, bayi_sinyalleri, churn_skor_gecmisi       │
│   Faz 6: portal_kullanicilari, portal_sepet, arac_modelleri,     │
│          urun_arac_uyumlulugu, portal_audit, portal_not_defteri  │
│   Faz 7: model_versiyonlari, ab_test_calistirma, excel_yukleme   │
│   Faz 8: ai_aksiyon_audit, ai_otomasyon_ayarlari                 │
│   Faz 9: ziyaret_kayitlari, push_bildirim_log                    │
│                                                                  │
│  + S3 (HTML snapshot, model artifacts)                           │
│  + Redis (cache, queue, rate limit)                              │
└────────────────────┬─────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────────┐
│  TÜKETİCİLER                                                     │
├──────────────────────────────────────────────────────────────────┤
│  Bayi UI  │  Yönetici dashboard  │  Saha mobil  │  Sohbet UI    │
│  Tedarikçi (otomatik PO email)  │  Müşteri (e-fatura, bildirim) │
└──────────────────────────────────────────────────────────────────┘
```

## Teknoloji Konumlanması

### Mevcut Paspas Stack (dokunulmaz, genişletilir)
- Fastify 5 + Bun (backend)
- Drizzle ORM + MySQL 2 + char(36) UUID
- Next.js 16 + React 19 + Shadcn/UI (admin panel)
- Fastify JWT + httpOnly cookie

### MatPortal Yeni Eklenenler
- **Bayi portal:** ayrı Next.js app, aynı backend
- **ML servis:** Python FastAPI (ayrı container, REST'le konuşur)
- **Scraping:** Crawlee + Playwright + Apify (TS — Bun ile uyumlu)
- **Mobil:** Flutter (mevcut Promats projeleri ile uyumlu)
- **MLOps:** MLflow (model versiyon) + S3 (artifact)
- **Kuyruk:** BullMQ + Redis (asenkron iş)
- **LLM gateway:** Anthropic + OpenAI + Groq abstraction
- **Email:** Brevo (free tier başlangıç)
- **Email finder:** Snov.io / Apollo (faz 3 itibariyle)
- **Maps:** Google Places + OpenStreetMap fallback

## Çıktıları (Deliverables)

Faz 0-9 tamamlandığında Promats'a teslim edilecekler:

1. **Bayi portal** — yeni Next.js uygulaması, mobil uyumlu, Paspas marka kimliği
2. **Paspas backend genişlemesi** — `/portal/*`, `/tahmin/*`, `/churn/*`, `/lead/*`, `/sohbet/*` route'ları
3. **Python ML servisi** — Docker container, FastAPI, MLflow entegrasyonu
4. **Scraping worker** — Crawlee tabanlı, schedule + queue
5. **DB migration script'leri** — yeni 30+ tablo, geri alınabilir
6. **Yönetici sidebar genişlemesi** — Bayi Portalı, Tahmin Motoru, Bayi Radarı, Lead Pipeline, ML Lab
7. **Araç-paspas uyumluluk veritabanı** — ilk 30-40 model dolu
8. **Saha satış mobil app** — Flutter, iOS/Android
9. **Bayi mobil** — PWA veya native (Faz 9 başında karar)
10. **Bayi onboarding paketi** — kullanım rehberi, video, KVKK metni
11. **Yönetici eğitim** — canlı 2 oturum + kayıt
12. **Operasyonel runbook** — model re-train, churn aksiyon, scraping monitoring
13. **6 ay garanti** — bug fix + minor enhancement
14. **Multi-deployment ready** — başka müşteriye konuşlandırılabilir kod tabanı (Promats'a görünmez)

## Değer Sıralaması — Kapsam Daralması

Eğer kapsam daraltılmak zorunda kalırsa, faz önceliği:

1. **Faz 0** — temel, alternatifsiz
2. **Faz 6** (Bayi Portalı) — bayinin en hızlı hissedeceği değer
3. **Faz 2** (Tahmin Motoru) — operasyonel kazanç
4. **Faz 5** (Churn) — savunma; bayi kaybetmemek
5. **Faz 4** (Stok otomasyonu) — maliyet azaltma
6. **Faz 7** (MLOps) — sürdürülebilirlik
7. **Faz 1, 3** — uzun vadeli sinyal toplama
8. **Faz 8, 9** — opsiyonel, ihtiyaç doğunca
9. **Faz 10+** — genişleme

Eğer sadece 6 ay süre + bütçe varsa: **Faz 0 + Faz 6 + Faz 2 yeterli**. Diğerleri sonraki kontratlarla.

## Açık Karar Noktaları (Çözüm Bakışı)

1. **Faz 6 (Portal) öncelendirme:** Faz 0 tamamlanmadan portal başlasın mı? (Önerim: hayır, ama paralel hazırlık olabilir)
2. **Faz 2 → Faz 7 sırası:** MLOps daha mı önce? (Önerim: hayır, Faz 2'de basit Prophet yeter; MLOps Faz 7'ye)
3. **Bayi mobil:** PWA mı, native Flutter mı? (Önerim: PWA başla, ihtiyaç doğunca native)
4. **Konversasyonel katman (Faz 8) bayi tarafı:** açılsın mı, sadece yönetici mi? (Önerim: ilk yıl sadece yönetici)
5. **Genişleme modülleri (Faz 10+):** hangisi ilk? (Önerim: AI belge işleme — hemen değer üretir)
