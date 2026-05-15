# 00 — Yönetici Özeti

## Tek Cümle

> Mevcut Paspas Üretim ERP'nizi piyasayı dinleyen, talebi öngören, kendi kendini düzelten bir **dijital ekosisteme** dönüştürüyoruz: bayi portalı + sipariş tahmin motoru + churn radarı + AI destekli otomasyon — her biri canlı verinizden öğrenen, açıklanabilir, geri alınabilir.

## MatPortal Nedir?

**MatPortal**, Paspas ERP'nizin üzerine inşa edilen 11 fazlı bir genişlemedir. Tek seferlik bir ürün kurulumu değil, **kademeli bir dönüşüm yol haritasıdır**. Her faz kendi başına çalışır, kendi başına değer üretir, sonraki faz öncekini besler.

```
Paspas ERP (var)              MatPortal (eklenecek)
─────────────                 ──────────────────────
Üretim, stok, müşteri    →    Bayi portalı, talep tahmini, otomasyon
satış siparişi, fatura   →    Tahmin motoru, churn radarı, AI sohbet
operatör ekranı          →    MLOps + Excel'den eğitilebilir modeller
```

Paspas dokunulmaz. MatPortal aynı veritabanını okur, üzerine yeni modüller ekler. Yeni proje değil — Paspas'ın doğal uzantısı.

## Mevcut Durum (1. Mayıs 2026)

### Paspas ERP — Çalışan Sistem
- 14 modül aktif: ürünler, reçeteler, üretim emirleri, makine havuzu, Gantt, stoklar, satın alma, operatör ekranı
- Plastik enjeksiyon kalıplama fabrikasının tam üretim akışı
- Fastify + Bun + MySQL + Drizzle ORM
- Admin panel canlıda

### Bayi Operasyonu — WhatsApp/Telefon Kaosu
- Aktif **35 bayi**, 18'i stratejik distribütör
- Sipariş kanalı: WhatsApp + telefon + email — kayıtsız, dağınık
- Satış ekibi günde **3-4 saat** sipariş kabul ediyor
- Yanlış fiyat/miktar siparişleri ayda **8-12 adet**
- Bayinin ne aldığı, ne aramadığı, ne istediği **görünmez** → veri yok → tahmin yok → planlama körlemesine

### Veriden Yoksun Karar
- Üretim planlama: "geçen ay olduğu kadar yapalım"
- Hammadde alımı: "bittiğinde alırız"
- Bayi takibi: "ne sipariş verirse onu işleriz"
- Pazar bilgisi: "WhatsApp'tan duyduğumuz kadar"

Bu yöntem 35 bayiyle yürür. **100 bayide çöker.** Şimdiden altyapı kurulmalı.

## Önerilen Çözüm — 11 Faz

| Faz | Modül | Çıktı | Süre |
|-----|-------|-------|------|
| **0** | Paspas tamamlanma | Mevcut açık modüllerin polish'i, stabilite | 4 hafta |
| **1** | Talep toplama altyapısı | Bayi/müşteri talepleri merkezi havuz | 4 hafta |
| **2** | **Sipariş tahmin motoru** | Bayi-ürün bazında 30-90 gün tahmin (Prophet→XGBoost) | 8 hafta |
| **3** | Müşteri keşif motoru | Yurt içi+dışı yeni bayi/müşteri leadleri | 6 hafta |
| **4** | Stok & tedarik otomasyonu | "Ne zaman, hangi malzeme, ne kadar al" otomatik | 6 hafta |
| **5** | **Bayi scraping & churn radarı** | Bayi web/sosyal taraması, churn sinyalleri | 8 hafta |
| **6** | **B2B Bayi Portalı (MatPortal)** | Bayinin sipariş/cari/katalog gördüğü kurumsal portal | 8 hafta |
| **7** | **Eğitilebilir modeller (MLOps)** | Excel yükleyerek modeli yeniden eğitme | 8 hafta |
| **8** | Konversasyonel katman | Yönetici/bayi yazışarak iş yapsın (onaylı, audit'li) | 6 hafta |
| **9** | Mobil + saha CRM | Saha satış elemanı + bayi mobil uygulamaları | 8 hafta |
| **10+** | Genişleme | Rakip istihbaratı, fiyat optimizasyonu, AI belge işleme, lojistik | sürekli |

**Toplam ana iskelet süresi:** ~14-15 ay (Faz 0-7 + 8-9 paralel başlayabilir)

## 4 Felsefe

### 1. Veri-önce, AI-yardımcı
Her tahmin önce **istatistiksel** yöntemle yapılır (lineer regresyon, Prophet, XGBoost). AI yanına gelir, açıklar, öneri verir — yerine geçmez. "Claude öneriyor" diye karar vermek itibar zedeler. Sayılar konuşur, AI tercüme eder.

### 2. Kademeli karmaşıklık
Veri 3 ay → naive model. 6 ay → mevsimsel ortalama. 12 ay → Prophet. 24 ay → XGBoost. **Verinin yetmediği yerde gelişmiş model kullanılmaz**, hataya yol açar.

### 3. Açıklanabilirlik
Her AI tahmin "neden böyle?" sorusuna cevap verir. SHAP değerleri + sinyal listesi + doğal dil açıklama. Yönetici "240 dedin, neden?" diye sorduğunda anlamlı 3 cümle alır.

### 4. Geri alınabilirlik
Her AI aksiyon **risk skoruyla** etiketlenir. Yüksek risk → manuel onay. Düşük risk → otomatik ama audit log + rollback hazır. **Tedarikçiye email, müşteri sipariş onayı, fiyat değişikliği** asla otomatik değildir.

## 5 Stratejik Kazanç

| # | Kazanç | Hangi faz | Ölçülebilir etki |
|---|--------|-----------|------------------|
| 1 | **Sipariş veriyi yakala** | Faz 6 (Portal) | Bayi 3 dk'da sipariş verir; aylık sipariş sayısında **%30-40 artış** |
| 2 | **Sepet büyür** | Faz 6 (Portal) | Katalog görünürlüğü → cross-sell; ortalama sepet **%15-25 büyür** |
| 3 | **Tahmin doğruluğu** | Faz 2 + 7 (Tahmin + MLOps) | Üretim planlamada MAPE **<%20** olgunlukta; planlama hatası → kayıp eskimesi azalır |
| 4 | **Erken churn yakalama** | Faz 5 (Churn radarı) | Bayi rakibe gitmeden 2-3 ay önce sinyal; churn oranı **%30+ azaltma** hedefi |
| 5 | **Operasyonel zaman** | Faz 6 + 8 (Portal + Sohbet) | Satış ekibi günlük **2-3 saat açılır** → büyük müşteri & yeni pazar odağı |

## Teknik Yaklaşım — Stack ve İlkeler

### Stack (Paspas ile uyumlu)
| Katman | Araç | Neden |
|--------|------|-------|
| Backend | Fastify 5 + Bun + Drizzle + MySQL | Paspas zaten kullanıyor — ek ML/scraping modülleri |
| Frontend (admin) | Next.js 16 + React 19 + Shadcn/UI | Paspas admin paneli devam |
| Frontend (bayi portal) | Ayrı Next.js app, aynı backend | İzolasyon + farklı UX |
| ML servis | Python FastAPI (Bun → spawn) | scikit-learn, Prophet, XGBoost ekosistemi |
| Scraping | Crawlee + Playwright + Apify (sosyal) | TypeScript native, robots.txt uyumlu |
| LLM | Anthropic Claude + OpenAI + Groq (multi-provider) | Provider değişebilir, vendor lock-in yok |
| Model storage | MLflow + S3 | Versiyonlama + rollback |
| Mobil | Flutter (mevcut Promats projeleriyle uyumlu) | Tek ekosistem |

### Mimari ilkeler
- **Paspas dokunulmaz**: yeni modüller `_shared/` üzerinden import eder, Paspas tablolarına yazmaz (ya da explicit kontrolle yazar)
- **Multi-deployment ready**: aynı kod, ayrı VPS/DB ile başka müşteriye konuşlanabilir
- **DRY**: ortak feature engineering, ortak LLM client, ortak scraping queue tek yerde
- **Audit log**: risk 7+ her aksiyon için before/after state DB'de
- **Kill-switch**: AI otomasyonu global / aksiyon türü / provider bazlı tek tıkla kapatılabilir

## Risk Yönetimi

### Teknik riskler

| Risk | Kontrol |
|------|---------|
| Tahmin modeli yanlış öneri verir | Naive baseline ile karşılaştır; %10 iyilik yoksa kullanma. Champion/challenger + auto-rollback |
| Bayi scraping yasal sorun | KVKK uyumu (sadece firma verisi), robots.txt, rate limit, açık User-Agent, bayi sözleşme klozu |
| LLM maliyeti kontrolden çıkar | Aylık token üst sınırı, ucuz provider (Groq) çoğunluk, pahalı (Claude) sadece kritik |
| Excel yükleme bozuk veri | Validation + preview + hata satırı düzeltme + outlier auto-flag |
| ML modeli "siyah kutu" hissi | SHAP + sinyal listesi + LLM doğal dil açıklama her tahminde |

### İş riskleri

| Risk | Kontrol |
|------|---------|
| Bayi portal'ı kullanmaz | Pilot 5 bayi ile başla, feedback loop, eski WhatsApp kanalı paralel açık |
| Yönetici AI önerisine güvenmez | İlk 3 ay tüm öneriler **manuel onay**; veri biriktikçe eşik açılır |
| Tedarikçi/müşteri "robot mu yazıyor" tepkisi | Konversasyonel katman opsiyonel, default kapalı, açıkken her mesajda "AI hazırladı" işareti |
| Kapsam genişliği yönetilemez | 11 fazlı plan, her faz **tek başına çalışır**, durulabilir, sıralama esnek |

## Maliyet — Operasyonel SaaS Bütçesi

Geliştirme ücreti hariç, **aylık dış servis bütçesi**:

| Senaryo | Aylık | Kapsam |
|---------|-------|--------|
| **A — Free tier başlangıç** | $20-50 | Hunter/Apollo free, Google Places $200 credit, AI orta yoğunluk |
| **B — Operasyonel olgunluk** | $255-325 | Snov.io + Apollo Basic + LLM + Brevo email + scraping (Apify+proxy) |
| **C — Hızlı büyüme** | $667-867 | Hunter Growth + Apollo Pro + Lusha + Mailgun + yoğun LLM |

**Önerim:** Aşamalı. Faz 0-3'te A; Faz 4-6'da B; Faz 8+ büyümeye göre C.

## Geliştirme Yol Haritası — Tek Bakış

```
2026 Q2 ───────────────── 2026 Q4 ───────────────── 2027 Q2 ───────────────── 2027 Q4
  │                          │                          │                          │
  ├─ Faz 0 (4 hf)            │                          │                          │
  ├─ Faz 1 (4 hf)            │                          │                          │
  ├─ Faz 2 (8 hf) ───────────┤                          │                          │
  │  └ tahmin motoru canlı   │                          │                          │
  │                          ├─ Faz 3 (6 hf)            │                          │
  │                          ├─ Faz 4 (6 hf)            │                          │
  │                          ├─ Faz 5 (8 hf) ───────────┤                          │
  │                          │  └ churn radarı canlı    │                          │
  │                          │                          ├─ Faz 6 (8 hf)            │
  │                          │                          │  └ Bayi portalı pilot    │
  │                          │                          ├─ Faz 7 (8 hf) ───────────┤
  │                          │                          │  └ Excel-eğitim canlı    │
  │                          │                          │                          ├─ Faz 8-9 (paralel)
  │                          │                          │                          │  konversasyonel + mobil
  │                          │                          │                          │
  │                          │                          │                          ├─ Faz 10+ genişleme
```

Faz 0-7 ana iskelet ~14-15 ay. Faz 8-10 ihtiyaca göre paralel veya sıralı.

## Onay İçin 4 Soru

Bu doküman **karar vermek için** değil, **karar zemini hazırlamak için** yazıldı. Promats yönetiminin onaylaması gereken 4 başlık:

1. **Faz sıralaması doğru mu?** Faz 6 (Bayi Portalı) öncelendirilmesin mi? (Paspas tamamlanmadan portal değer üretmez ama bayiler bekliyor olabilir.)
2. **Bütçe senaryosu A mı, B mi?** İlk 6 ay free tier mi, doğrudan B mi? (Önerim: A → ihtiyaç doğunca B'ye geçiş)
3. **AI otomasyon eşiği:** ilk 3 ay her şey manuel onay mı (önerim: evet)? Yoksa düşük risk (skor 4-6) otomatik açılsın mı?
4. **MatPortal bayi-side branding:** "Paspas Bayi Portalı" mı, "MatPortal" mi, başka isim mi?

## Doküman Yapısı

Bu yönetici özeti + 11 alt başlıkta detay:

| Doküman | İçerik |
|---------|--------|
| `01-pazar-ve-musteri-analizi.md` | Bayi profili, pazar fırsatı, rakip durumu |
| `02-cozum-genel-bakis.md` | 11 fazın her birinin çıktısı, modül haritası |
| `03-mimari-ve-teknoloji.md` | Stack detay, deployment topolojisi, multi-tenant |
| `04-kullanici-yolculuklari.md` | Bayi/yönetici/saha ekibi senaryolar (wireframe) |
| `05-fonksiyonel-kapsam.md` | Özellik listesi MVP / v2 / v3 — 200+ özellik |
| `06-veri-modeli.md` | Yeni DB tabloları, mevcut tablolarla ilişki |
| `07-yol-haritasi.md` | Hafta-hafta milestone, kabul kriterleri |
| `08-butce-kaynak.md` | Operasyonel SaaS bütçesi, donanım/cloud, alternatifler |
| `09-risk.md` | Teknik + iş riskleri, mitigation tablosu |
| `10-basari-kpi.md` | Başarı metrikleri (MAPE, churn rate, sepet, sipariş frekansı) |
| `11-ek-belgeler.md` | KVKK aydınlatma, bayi sözleşme klozu örneği, teknik referanslar |
| `tek-sayfa-ozet.md` | A4 tek sayfa görsel özet (yönetim sunumu) |

Her bölümün altında **yorum sistemi** vardır — yönetici/teknik müdür/yatırımcı soruları kalıcı kaydedilir, anlık görülür, geri yanıtlanır.
