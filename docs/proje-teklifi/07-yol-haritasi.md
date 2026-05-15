# 07 — Yol Haritası ve Milestone'lar

Bu doküman MatPortal'ın 11 fazını **hafta-hafta**, **kabul kriterleri**, **bağımlılıklar** ve **risk noktaları** ile somut bir takvime bağlar. Toplam ana iskelet ~14-15 ay; Faz 10+ sonrası genişleme ihtiyaca göre.

## 1. Üst Düzey Zaman Çizelgesi

```
2026 Q2                    2026 Q4                    2027 Q2                    2027 Q4
  │                          │                          │                          │
  ├─[Faz 0] 4 hf             │                          │                          │
  ├─[Faz 1] 4 hf             │                          │                          │
  ├─────[Faz 2] 8 hf         │                          │                          │
  │           ├─[Faz 3] 6 hf │                          │                          │
  │           ├─[Faz 4] 6 hf │                          │                          │
  │                ├─────[Faz 5] 8 hf                   │                          │
  │                          ├─────[Faz 6] 8 hf         │                          │
  │                          │           ├─────[Faz 7] 8 hf                        │
  │                          │                          ├─────[Faz 8] 6 hf         │
  │                          │                          ├─────[Faz 9] 8 hf         │
  │                          │                          │                          ├──[Faz 10+]
```

**Toplam Faz 0-9:** ~60 hafta (~14 ay)
**Bazı fazlar paralel** koşabilir (Faz 3-4, Faz 8-9). Sıralama esnek.

## 2. Faz Özet Takvimi

| Faz | Hafta | Modül | Süre | Personel | Bağımlılık |
|-----|-------|-------|------|----------|------------|
| 0 | 1-4 | Paspas tamamlanma | 4 hf | 1 dev | — |
| 1 | 5-8 | Talep havuzu | 4 hf | 1 dev | Faz 0 |
| 2 | 9-16 | Sipariş tahmin motoru | 8 hf | 1 dev + 1 ML | Faz 1 |
| 3 | 17-22 | Müşteri keşif | 6 hf | 1 dev | Faz 1 |
| 4 | 17-22 | Stok otomasyonu (paralel) | 6 hf | 1 dev | Faz 2 |
| 5 | 23-30 | Bayi scraping & churn | 8 hf | 1 dev + 0.5 ML | Faz 0 |
| 6 | 31-38 | B2B Bayi Portalı | 8 hf | 2 dev (FE+BE) | Faz 0 (+Faz 2 ideal) |
| 7 | 39-46 | MLOps | 8 hf | 1 ML + 1 dev | Faz 2, 5 |
| 8 | 47-52 | Konversasyonel | 6 hf | 1 dev | Faz 2-7 |
| 9 | 53-60 | Mobil & saha | 8 hf | 1 mobil + 1 dev | Faz 6 |
| 10+ | 61+ | Genişleme (10 sinyal) | sürekli | varies | varies |

## 3. Faz 0 — Paspas Tamamlanma (Hafta 1-4)

### Kapsam
Mevcut 14 modülün polish'i, stabilite, bilinen bug'lar.

### Hafta-hafta

| Hafta | İş | Çıktı |
|-------|-----|-------|
| 1 | Audit + bug listesi + öncelikleme | Kritik/yüksek/orta/düşük listesi |
| 2 | Kritik bug'ları düzelt + test coverage | Test coverage %70+ |
| 3 | Performance baseline + log standartlaştırma | p50/p95/p99 ölçümleri |
| 4 | Backup + monitoring + runbook | DR prosedürü yazılı, çalışıyor |

### Kabul kriterleri
- ✅ Bilinen kritik bug = 0
- ✅ Backend test coverage ≥ %70
- ✅ Sentry hata raporlama aktif
- ✅ Günlük backup çalışıyor, restore test edilmiş
- ✅ Performance baseline raporu yazılı

### Risk noktaları
- Bug listesi 4 haftaya sığmazsa: kritik+yüksek 4 hafta, orta+düşük Faz 0.5 olarak ayrı
- Mevcut kod değişiklikleri yan etki yaratırsa: regresyon testi şart

## 4. Faz 1 — Talep Havuzu (Hafta 5-8)

### Kapsam
Bayi/müşteri taleplerini merkezi havuza topla, LLM ile yapılandır.

### Hafta-hafta

| Hafta | İş | Çıktı |
|-------|-----|-------|
| 5 | DB tabloları + Drizzle şeması | `talep_havuzu`, `talep_kalemleri`, `talep_etkilesim` |
| 6 | Backend `/admin/talep/*` endpoint'leri | CRUD + LLM yapılandırma servisi |
| 7 | Admin panel UI — kanban + form | `/admin/talep-havuzu` çalışıyor |
| 8 | Test + kullanıcı eğitimi + canlı | Yönetici 5 talep manuel girip test ediyor |

### Kabul kriterleri
- ✅ Manuel talep girişi 2 dk altında
- ✅ LLM yapılandırma %85+ doğrulukta (10 örnek manual test)
- ✅ Müşteri kartında talep geçmişi görünüyor
- ✅ Kanban'da drag-drop çalışıyor
- ✅ Talep → sipariş dönüşümü 1 tıkla

### Risk noktaları
- LLM yapılandırma kalitesi düşükse: Few-shot prompt iyileştirme + manuel düzeltme UI

## 5. Faz 2 — Sipariş Tahmin Motoru (Hafta 9-16)

### Kapsam
Bayi-ürün × dönem tahmin. 4 algoritma + champion seçimi.

### Hafta-hafta

| Hafta | İş | Çıktı |
|-------|-----|-------|
| 9 | DB şema + ML servis iskeleti | `tahmin_*` tabloları + Python FastAPI ayağa |
| 10 | Naive + Mevsimsel + Lineer Regresyon | 3 baseline algoritma çalışıyor |
| 11 | Prophet entegrasyon + Türk tatil takvimi | 4. algoritma + tatil etkisi |
| 12 | Champion/challenger seçim mantığı | Otomatik en iyi model |
| 13 | Açıklanabilirlik (sinyal listesi + LLM) | "Neden bu tahmin?" UI |
| 14 | `/admin/tahmin-motoru` UI — heatmap, detay | Tüm bayi-ürün × dönem |
| 15 | Excel upload UX (preview + hata) | Tarihsel veri yükleme |
| 16 | Test + canlı + 10 bayide MAPE ölçümü | Kabul: 10 bayide MAPE < %35 |

### Kabul kriterleri
- ✅ 4 algoritma (naive/mevsimsel/lineer/prophet) çalışıyor
- ✅ Champion otomatik seçim her hafta
- ✅ MAPE en az 10 bayide < %35
- ✅ Açıklanabilirlik %95 tahminde aktif
- ✅ Excel upload 1000 satır < 15s
- ✅ Yönetici manuel re-train yapabiliyor

### Risk noktaları
- Tarihsel veri yetersizse (< 6 ay) tahmin kalitesi düşük → manuel onay göstergesi
- Python ↔ Bun köprü performans sorunu: cache (Redis) + batch tahmin
- MAPE %35'in üzerinde kalırsa: feature engineering iyileştirmesi gerek (Faz 7'ye taşınabilir)

> **Detay:** [`tartisma/12-tahmin-motoru-derinlemesine.md`](../tartisma/12-tahmin-motoru-derinlemesine.md)

## 6. Faz 3 — Müşteri Keşif (Hafta 17-22, paralel ile Faz 4)

### Hafta-hafta

| Hafta | İş | Çıktı |
|-------|-----|-------|
| 17 | DB şema + lead skorlama mantığı | `lead_*` tabloları |
| 18 | TOBB + sanayim.net + Google Places parser | İlk 1000 yurt içi lead |
| 19 | Apollo.io free tier entegrasyonu | İlk 100 yurt dışı lead |
| 20 | Kanban UI + manuel lead girişi | `/admin/lead-pipeline` |
| 21 | Outreach taslak üretici (LLM) | Kişiselleştirilmiş email |
| 22 | Hunter.io email bulma + test + canlı | 10 lead'le email çıkarımı |

### Kabul kriterleri
- ✅ Yurt içi haftalık 50+ kalite lead
- ✅ Yurt dışı 20+ lead/hafta
- ✅ Lead → bayiye dönüşüm metriği görünüyor
- ✅ Outreach taslakları yöneticiye haftalık otomatik

## 7. Faz 4 — Stok Otomasyonu (Hafta 17-22, paralel ile Faz 3)

### Hafta-hafta

| Hafta | İş | Çıktı |
|-------|-----|-------|
| 17 | Tüketim hızı analiz pipeline | `tuketim_hizi` günlük cron |
| 18 | ROP hesaplama + test | `rop_ayarlari` doldu |
| 19 | "Bu hafta ne almalıyız" raporu | Pazartesi sabah email |
| 20 | Tedarikçi performans skoru | `tedarikci_skor` aylık |
| 21 | PO taslağı oluşturma + manuel onay | `po_taslaklari` çalışıyor |
| 22 | Stok-out anomali uyarısı + canlı | İlk 1 ay test |

### Kabul kriterleri
- ✅ Stok-out olayları %50+ azalır (3 ay sonra ölçüm)
- ✅ PO taslakları haftalık otomatik üretiliyor
- ✅ Tedarikçi skor dashboard'u aktif

## 8. Faz 5 — Bayi Scraping & Churn (Hafta 23-30)

### Hafta-hafta

| Hafta | İş | Çıktı |
|-------|-----|-------|
| 23 | Crawlee + Playwright + queue altyapı | Crawler worker container |
| 24 | DB şema + robots.txt + rate limit | KVKK uyumlu kazıma altyapı |
| 25 | İlk 5 bayi sitesi + HTML diff | 5 bayide haftalık tarama çalışıyor |
| 26 | Sinyal çıkarımı (LLM destekli) | 11 sinyal türü tespit |
| 27 | Apify Instagram + Facebook | Sosyal medya pasiflik |
| 28 | Kural-bazlı churn skoru | Skor 0-100 hesaplanıyor |
| 29 | XGBoost ML churn modeli | 30/60/90 olasılık |
| 30 | `/admin/bayi-radari` UI + canlı | Heatmap + top liste + aksiyon önerisi |

### Kabul kriterleri
- ✅ 100 bayinin haftalık taraması başarılı (>%90 başarı oranı)
- ✅ Churn ML modeli precision > 0.7
- ✅ KVKK aydınlatma metni + bayi sözleşme klozu yazılı
- ✅ İlk 3 ay sonunda en az 3 bayide churn'dan korunma kanıtı (skor düşüşü)

### Risk noktaları
- Bayi siteleri scraping'e dirençli (Cloudflare, captcha): manuel kayıt fallback
- Apify maliyeti tahminden yüksek: ölçeklendirme planı, free tier'a düşüş
- KVKK yasal sorun: avukat görüşü Faz 5 başı

> **Detay:** [`tartisma/13-bayi-scraping-churn.md`](../tartisma/13-bayi-scraping-churn.md)

## 9. Faz 6 — B2B Bayi Portalı (Hafta 31-38)

### Hafta-hafta

| Hafta | İş | Çıktı |
|-------|-----|-------|
| 31 | DB şema + auth altyapı | `portal_*` tabloları, JWT cookie auth |
| 32 | Bayi web app iskelet (Next.js) | Login + dashboard skeleton |
| 33 | Katalog modülü + araç eşleşme | Marka→Model→Yıl filtre çalışıyor |
| 34 | Sepet + checkout + sipariş onayı | E2E sipariş akışı (`repoCreate`) |
| 35 | Cari hesap + sipariş takibi | Bakiye, ekstre, statü zinciri |
| 36 | Yönetici tarafı: bayi yönetimi UI | `/admin/bayi-portali/yonetim` |
| 37 | Portal raporları + bildirimler | Top 10, sepet terk, email/push |
| 38 | Pilot 5 bayi onboarding + feedback | İlk gerçek kullanıcılar |

### Kabul kriterleri
- ✅ Pilot 5 bayide 4 hafta kullanım, %80+ memnuniyet
- ✅ Sipariş hatası %80+ azalır
- ✅ Telefon/WhatsApp sipariş süresi yarıdan az
- ✅ Bayi 3 dk altında sipariş veriyor (alıştıktan sonra)
- ✅ İlk 30-40 araç modeli + uyumluluk tablosu dolu

### Risk noktaları
- Araç-paspas uyumluluk verisi gecikmesi: Faz 0'da paralel başlat
- Bayi adapt sıkıntısı: onboarding video + canlı eğitim + saha desteği
- WhatsApp/telefon kanalı kapatılmamalı: paralel açık kalır

> **Detay:** [`tartisma/11-b2b-bayi-portali.md`](../tartisma/11-b2b-bayi-portali.md)

## 10. Faz 7 — MLOps (Hafta 39-46)

### Hafta-hafta

| Hafta | İş | Çıktı |
|-------|-----|-------|
| 39 | MLflow + S3 model storage | Model versiyon tracking |
| 40 | Champion/challenger A/B test | %5 trafik split |
| 41 | İstatistiksel anlamlılık testi | t-test + p-value |
| 42 | Multivariate feature pipeline | Kur+tatil+hava+kampanya |
| 43 | XGBoost multivariate model | Faz 2 model upgrade |
| 44 | SHAP + LLM açıklama | Görsel + doğal dil |
| 45 | Auto-rollback + active learning | Calibration layer |
| 46 | Excel upload UX + test + canlı | `/admin/ml-laboratuvari` tam |

### Kabul kriterleri
- ✅ Yönetici Excel yükleyip modeli yeniden eğitebiliyor
- ✅ A/B test 7 gün otomatik koşuyor
- ✅ Auto-rollback testleri başarılı
- ✅ Multi-deployment hazırlık (env config) tamamlandı

> **Detay:** [`tartisma/14-egitilebilir-modeller-mlops.md`](../tartisma/14-egitilebilir-modeller-mlops.md)

## 11. Faz 8 — Konversasyonel Katman (Hafta 47-52)

### Hafta-hafta

| Hafta | İş | Çıktı |
|-------|-----|-------|
| 47 | LLM provider abstraction + audit | Multi-provider client |
| 48 | Niyet çıkarımı + slot-filling | "5000 paspas siyah" → action |
| 49 | Risk skoru + onay matrisi | 4 boyutlu risk hesabı |
| 50 | Sohbet UI (yönetici tarafı) | Sağ alt köşe panel |
| 51 | Audit + rollback + kill-switch | Geri alınabilir aksiyonlar |
| 52 | Test + canlı + 10 senaryo doğrulama | İlk yönetici kullanımı |

### Kabul kriterleri
- ✅ Risk 4-6 düşük aksiyonlar otomatik (audit'li)
- ✅ Risk 10+ aksiyonlar her zaman insan onayı
- ✅ Kill-switch tek tıkla çalışıyor
- ✅ İlk 3 ay tüm aksiyonlar manuel onay (öğrenme dönemi)

## 12. Faz 9 — Mobil & Saha CRM (Hafta 53-60)

### Hafta-hafta

| Hafta | İş | Çıktı |
|-------|-----|-------|
| 53 | Flutter saha satış app iskelet | iOS+Android build |
| 54 | Bayi ziyaret + ses (Whisper) + foto | Form + offline |
| 55 | Push bildirim altyapısı (FCM) | Saha ekibine push |
| 56 | LLM ziyaret özeti + churn feed-in | Otomatik sinyal |
| 57 | Bayi PWA (web mobil) | Responsive portal |
| 58 | Operatör mobil polish | Mevcut tamamlanma |
| 59 | E2E test + saha ekibi eğitim | 3 saha temsilcisi pilot |
| 60 | Canlı + ilk 1 ay metrik | Push %95 teslim, ziyaret kayıt %100 |

### Kabul kriterleri
- ✅ Saha ekibi günlük kullanım, kayıt yükü <2dk/ziyaret
- ✅ Offline çalışma 3 saat sonra senkron
- ✅ Push bildirim teslim oranı >%95
- ✅ Ziyaret notları → churn radarına otomatik akıyor

## 13. Faz 10+ — Genişleme (Hafta 61+)

Promats yönetimi ile birlikte sıralı, ihtiyaca göre. Önerilen sıra:

| Sıra | Modül | Süre | Önerilme nedeni |
|------|-------|------|-----------------|
| 1 | AI belge işleme (OCR+LLM) | 3-4 hf | En hızlı değer üretir (manuel evrak yükü büyük) |
| 2 | API entegrasyonları (e-Fatura → kargo → WhatsApp) | her biri 1-3 hf | Yasal + operasyonel zorunluluk |
| 3 | Rakip & pazar istihbaratı | 3-4 hf | Stratejik karar destek |
| 4 | Müşteri (B2C) churn | 2-3 hf | Online satış varsa öncelikli |
| 5 | Fiyat optimizasyonu | 4-6 hf | Tahmin motoru olgunlaştıktan sonra |
| 6 | Lojistik & rota | 4-6 hf | Sevkiyat hacmi büyürse |
| 7 | Dış veri / sektör trendleri | 2-3 hf | Yatırım kararı destek |
| 8 | Saha CRM detay genişlemesi | 2-3 hf | Saha ekibi büyürse |
| 9 | Sürdürülebilirlik & karbon | 6-8 hf | İhracat artarsa CBAM zorunlu |

> **Detay:** [`tartisma/15-genisletme-sinyalleri.md`](../tartisma/15-genisletme-sinyalleri.md)

## 14. Milestone Listesi

Her faz sonunda bir **demo + kabul** milestone'u:

| MS | Tarih (relatif) | Demo |
|----|-----------------|------|
| MS-0 | Hafta 4 | Paspas stable + bug 0 + monitoring |
| MS-1 | Hafta 8 | Talep havuzu kanban + LLM yapılandırma demo |
| MS-2 | Hafta 16 | 10 bayi tahmin doğruluğu + heatmap demo |
| MS-3 | Hafta 22 | Lead pipeline + ilk 50 lead + outreach |
| MS-4 | Hafta 22 | Stok otomasyonu + ilk PO taslağı onayı |
| MS-5 | Hafta 30 | 100 bayi churn radarı + ilk korunma kanıtı |
| MS-6 | Hafta 38 | Pilot 5 bayi portal kullanım + memnuniyet anketi |
| MS-7 | Hafta 46 | MLOps Excel upload + A/B test + auto-rollback |
| MS-8 | Hafta 52 | Konversasyonel sohbet + 10 senaryo demo |
| MS-9 | Hafta 60 | Mobil saha 3 temsilci 1 ay kullanım |

## 15. Paralel İş Akışı Şeması

Bazı fazlar **paralel koşar** — kaynak verimliliği ve hızlanma için:

```
HAFTA          1-4   5-8   9-16   17-22   23-30   31-38   39-46   47-52   53-60
─────────────────────────────────────────────────────────────────────────────
Faz 0          ████
Faz 1                ████
Faz 2                      ████████
Faz 3                                ██████
Faz 4                                ██████ (paralel Faz 3 ile)
Faz 5                                        ████████
Faz 6                                                  ████████
Faz 7                                                            ████████
Faz 8                                                                      ██████
Faz 9                                                                      ████████ (paralel Faz 8)
```

**Paralel grup 1:** Faz 3 + Faz 4 (Hafta 17-22)
- Farklı dev'ler, farklı modüller, çakışma yok

**Paralel grup 2:** Faz 8 + Faz 9 (Hafta 47-60)
- Faz 8 backend ağırlıklı, Faz 9 mobil ağırlıklı
- Farklı kişiler

## 16. İnsan Kaynağı Planı

### 16.1 Çekirdek ekip (sürekli)

| Rol | FTE | Faz dağılımı |
|-----|-----|--------------|
| Tech Lead / Mimar | 1.0 | Tüm fazlar |
| Senior Backend Dev | 1.0 | Tüm fazlar |
| Senior Frontend Dev | 0.5 → 1.0 (Faz 6 itibariyle) | Faz 6+ |
| ML Engineer | 0.5 → 1.0 (Faz 2 + 5 + 7) | Faz 2-7 |
| Mobile Dev (Flutter) | 0.5 (Faz 9 only) | Faz 9 |
| QA / Test | 0.3 | Tüm fazlar |
| DevOps | 0.3 | Tüm fazlar |
| **Ortalama:** | **3.5-4.5 FTE** | |

### 16.2 Geçici / outsource

| Rol | Ne zaman | Süre |
|-----|----------|------|
| Avukat (KVKK + bayi sözleşme) | Faz 5 başı | 1-2 hf danışmanlık |
| UI/UX tasarımcı | Faz 6 + Faz 9 | 4 hf |
| QA otomasyon | Faz 6 sonrası | sürekli 0.2 FTE |
| Saha eğitimcisi | Faz 6 + Faz 9 son hafta | 2 gün |

## 17. Risk-Bazlı Esneklik

Yol haritası **kesin değil**. Aşağıdaki noktalarda ayarlama olabilir:

### 17.1 Hızlandırma fırsatları
- Faz 6 (Portal) öne çekilebilir: Faz 0 + Faz 6 + Faz 2 (paralel) → 3 ay sonra portal canlı
- Faz 4 atlanabilir (basit cron + manuel) → Faz 5'e zaman kazandırır
- Faz 8 + Faz 9 birlikte (3 dev paralel) → 6 hf yerine 4 hf

### 17.2 Yavaşlama riskleri
- Bayi adapt sorunu Faz 6: pilot süresi 4 → 8 hafta uzatılabilir
- ML doğruluk hedefini tutturamıyorsa Faz 2 + 1 hf
- Scraping yasal sorun Faz 5: avukat süreci 2-3 hafta gecikme
- Promats üretim hattında kriz: Faz 0 dışında çalışan ekibin bir kısmı acil destek

### 17.3 Kapsam daralması (eğer gerek olursa)
**Minimum viable contract (MVC):** 6 ay süre
- Faz 0 + Faz 6 + Faz 2 (basit Prophet)
- Diğer fazlar ek kontrat olarak ileri sürülür

**Standart contract (önerilen):** 14 ay
- Faz 0-9 tam ana iskelet

**Premium contract:** 24 ay
- Faz 0-9 + Faz 10+ ilk 5 modül

## 18. Açık karar noktaları (Yol Haritası)

1. **Başlangıç tarihi:** Hafta 1 ne zaman? (Önerim: 2026-06-01 — Faz 0 yaza denk gelsin, Faz 6 portal Aralık-Ocak'ta canlı pilot)
2. **Pilot bayi sayısı (Faz 6):** 5 mi, 10 mu? (Önerim: 5 — yönetilebilir feedback)
3. **Faz 6 öne çekilsin mi:** Bayi portalı ilk 8 hafta, sonra arka plan? (Önerim: hayır, Faz 0 olmadan stabilite riski)
4. **Faz 2 öncelik:** MAPE %35 yetmezse Faz 7'ye taşısak mı? (Önerim: önce basit Prophet ile başla, ileri özellikleri Faz 7)
5. **Mobil (Faz 9):** native başlangıç mı, PWA mı? (Önerim: PWA → 6 ay → native gerekirse)
6. **Genişleme sırası:** AI belge işleme öncelikli mi, e-Fatura mı? (Önerim: e-Fatura yasal zorunluluk öncelikli)
7. **Personel ramp-up:** Tek dev başlasın, Faz 6'da 2'ye mi çıksın? (Önerim: evet, başlangıç tek dev maliyeti yarı)
8. **Müşteri ödeme planı:** Faz bazlı milestone ödemesi mi, aylık mı? (Önerim: faz tamamlanınca milestone ödeme)
9. **Test ortamı:** Promats canlı DB'den mi seed, ayrı test verisi mi? (Önerim: ayrı sentetik test verisi, Faz 0'da hazırlanır)
10. **Demo sıklığı:** Faz sonunda mı, her 2 haftada bir mi? (Önerim: 2 haftada bir, fazın yarısında ek ara demo)
