# Market Pulse — SaaS Master Planı

**Tarih:** 2026-05-14
**Durum:** Aktif yön kararı — bu belge tüm sonraki kararların kaynağıdır
**Karar veren:** Strateji oturumu (Orhan + Claude)
**Geçersiz kıldıkları:** Bu belge `docs/strateji/GENISLEME_PLANI.md` ve `docs/URUN_GELISTIRME_CHECKLIST.md`'nin Amazon-odaklı tek-ürün varsayımını **üst-set eder**. O dosyalar arşivlik veya Suite içinde modül-spesifik plan olarak yeniden konumlanır.

---

## 1. Yönetici Özeti

Market Pulse, **Türk KOBİ ve sanayi firmaları için modüler bir operasyon işletim sistemidir.** Ürün vaadi:

> "Şirketinizin pazarındaki nabzı tutun. Müşteri, rakip, bayi, lead, fiyat — hepsi tek panelden. Türkçe. Yerli destek. Aylık tek fatura."

Tek dikey değil, **horizontal** bir vaat: çünkü sıcak müşteriler karışık sektördedir (plastik enjeksiyon, ek sanayi firmaları, sağlık turizmi tarzı potansiyel) ve net "ne isteriz" yanıtı yoktur. Vertical sıkıştırma yapmak yerine **modüler ortak motor** yaklaşımı seçildi: müşteri ihtiyaca göre modül açar, tek hesap üstünden çalışır.

Karar üçü kaynaktan beslendi:
- **Paspas pilot** (somut, gelir üreten) — bayi izleme talebi → Monitor modülü
- **BAZ Export** (rakip referans) — bundling yaklaşımı, "operasyon OS" konumlanması
- **Zoho** (rakip referans) — modüler SaaS modeli, "tek fatura"
- **Wase Clinic teklifi** (Orhan'ın geçmişi) — CRM ihtiyacı her sektörde ortak; vertical CRM kurulumları Zoho'ya gidiyor → biz alabilirdik

Sonuç: BAZ + Zoho + Wase çakışmasında **modüler bir Türk operasyon SaaS'ı boşluk var**, biz oraya konumlanırız.

---

## 2. Konumlandırma

### Tek cümle
**Market Pulse**, Türk KOBİ ve sanayi firmalarının müşteri-rakip-bayi-pazar ilişkilerini tek panelden yürüttüğü modüler operasyon SaaS'ıdır.

### Hedef kitle
- **Birincil:** 20-200 kişilik üretici/sanayi firmaları (Paspas tipi, plastik/kompozit/kalıp/gıda/tekstil sanayi)
- **İkincil:** İhracatçı KOBİ (BAZ Export hedef kitlesi)
- **Üçüncül (sonra):** Hizmet sektörü (Wase tipi sağlık turizmi, danışmanlık, ajans)

### Pozisyon haritası

| Rakip | Konumlandığı yer | Bizim farkımız |
|---|---|---|
| **Zoho One** | Global SMB, 50+ uygulama, $37+/user | Türkçe değil ürün-derinliği; "boş CRM" — Türk operasyon bilmiyor |
| **BAZ Export** | Türk ihracatçı, 7-adım operasyon OS | Sadece ihracat, sanayi/iç pazar yok; CRM gevşek |
| **HubSpot** | Global mid-market, pazarlama odaklı | TL'ye uygunsuz, sanayiye uzak, ağır |
| **Helium 10 / SatisAnaliz / Agellic** | Amazon satıcı | Tek kanal, CRM yok, monitoring yok |
| **Excel + Gmail + WhatsApp** | Türk KOBİ'nin %80'i bunu kullanıyor | Asıl rakibimiz bu, yazılım değil |

**Konum boşluğu:** Türk KOBİ için **modüler, monitoring + CRM + lead bulma** birleşik ürün, Türkçe destek, TL fatura. Excel'i yenilemeye odaklanır.

---

## 3. Suite Mimarisi

```
┌──────────────────────────────────────────────────────────────┐
│  MARKET PULSE                                                │
│  ─────────────                                               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  CRM ÇEKİRDEK                                          │  │
│  │  Hesap, kişi, pipeline, görev, takvim, not, etkinlik   │  │
│  │  (Her plan dahil, Suite'in omurgası)                   │  │
│  └─────┬────────────┬────────────┬─────────────────┬──────┘  │
│        │            │            │                 │         │
│   ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐    ┌─────▼─────┐   │
│   │ MONITOR  │ │ DISCOVER │ │   RISK   │    │ OUTREACH  │   │
│   │ Pazar    │ │ Lead     │ │ Amazon   │    │ E-mail    │   │
│   │ izleme   │ │ bulma    │ │ skor     │    │ kampanya  │   │
│   │ sinyaller│ │ ICP/B2B  │ │ Keepa    │    │ takip     │   │
│   └──────────┘ └──────────┘ └──────────┘    └───────────┘   │
│        ↓            ↓            ↓                ↓          │
│  Tüm modüller CRM çekirdeğine besler:                       │
│  • Monitor sinyali → CRM'de "ilgi" notu olarak düşer        │
│  • Discover adayı → CRM'de "lead" kaydı olur                │
│  • Risk skoru → CRM'deki ürün/kategori kaydına işlenir      │
│  • Outreach yazışması → CRM iletişim geçmişine yazılır      │
└──────────────────────────────────────────────────────────────┘
```

### Modül detayları

#### CRM Çekirdek (her plana dahil, ücretsiz tier'da bile)
- Hesaplar (firma), kişiler, pipeline (özelleştirilebilir aşama), görev, takvim, not, dosya
- Çok-kullanıcı + rol yetkileri
- E-mail, WhatsApp, telefon log
- Özel alanlar (her müşteri kendi sektörüne göre alan ekler)
- Form/webhook ile dış lead alımı (web sitesi, FB ads, vs.)

**Neden çekirdek**: BAZ + Wase'de gördük — CRM her sektörde ortak ihtiyaç. Eğer ücretsiz tier'da basit CRM verirsek **Excel'i ikame ederiz**. Sonra modül satışı kolay.

#### Monitor (Paspas tipi)
- "Hedef" tanımla: bir firma sitesi, bir Trendyol mağazası, bir Amazon ASIN, bir fuar listesi, bir RSS feed, bir LinkedIn şirket sayfası
- Periyodik tarama (1 saat / 1 gün / 1 hafta)
- Sapma sinyalleri: yeni ürün, fiyat değişimi, yeni iletişim, stok durumu, yeni içerik
- Slack / e-mail / WhatsApp / Telegram bildirimi
- **Şablon galerisi** (sektör agnostik):
  - "Bayi web sitesi izleme" (Paspas)
  - "Rakip Trendyol fiyat izleme"
  - "Tedarikçi stok takibi"
  - "Sektör haber / RSS izleme"
  - "Amazon ürün/satıcı izleme" (Risk modülü ile çift)
  - "LinkedIn şirket sayfa izleme"
  - "Fuar katılımcı listesi izleme"

**Altyapı**: `scraper-service` (LIVE) ortak motor.

#### Discover (mevcut Lead Machine)
- ICP profilleri (sektör, alt sektör, firma tipi, bölge, büyüklük)
- Lead tarama: B2B (Google Maps, Europages, Kompass, web scrape) + Fuar (10times tarzı) + Amazon (kanal olarak)
- AI uyum skoru, pain point tespiti, karar verici çıkarımı
- Apollo/Hunter/LinkedIn enrichment
- Feedback öğrenme (red kuralları, onay paternleri)

#### Risk (amozon entegrasyonu)
- 5 boyutlu Amazon risk skorlama (mevcut)
- Keepa, evidence table, kar simülasyonu
- Saved searches, watchlist, çoklu keyword
- BYOK Keepa anahtarı
- **Suite içinde "kategori karar modülü"** olarak konumlanır

#### Outreach (Faz 2)
- E-mail sequence engine (Lemlist hafif sürümü)
- Şablon kişiselleştirme (mevcut altyapı, kişi bağlamı)
- Açma/tıklama tracking
- A/B test
- SPF/DKIM yardımcısı
- **Faz 1'de** sadece "tek tıkla taslak + manuel gönder" var, sequence Faz 2'de

---

## 4. Müşteri Senaryoları

Bu beş senaryo aynı Suite'ten beslenir. Müşteri ihtiyacına göre farklı modülleri açar:

| # | Müşteri tipi | Aktif modüller | Aylık fatura |
|---|---|---|---|
| 1 | Paspas (plastik sanayi, bayi izleme) | CRM + Monitor | 199-499 EUR |
| 2 | Sanayi firma X (rakip+fiyat izleme) | CRM + Monitor | 199-499 EUR |
| 3 | İhracatçı KOBİ (B2B lead bulma) | CRM + Discover + Outreach | 299-799 EUR |
| 4 | Amazon satıcı | CRM + Risk + Monitor (rakip) | 49-149 EUR (free→pro) |
| 5 | Hizmet sektörü (Wase tipi) | CRM + Outreach | 99-249 EUR |

**Önemli**: Müşteri 1-2-3 birincil hedef. Müşteri 4 (Amazon) önceden inşa edilmiş kodun değerlendirilmesi (sunk cost değil, B2C girişi). Müşteri 5 ileride.

---

## 5. Amazon Entegrasyon Stratejisi (amozon → market_pulse)

**Karar: Senaryo A — One-time sync, amozon dondurulur (veya müşteri-A için özel sürüm olarak yaşar).**

### Aktarılacaklar

| Kaynak (`amozon/`) | Hedef (`market_pulse/`) | Yöntem |
|---|---|---|
| `admin_panel/src/` (tema + sayfalar) | Tema tokenları + Risk modülü sayfaları | Aşağıdaki Bölüm 6 |
| `backend/src/` (scoring engine, Keepa, scan pipeline) | `backend/src/modules/risk/` altına | Modül izolasyonu, mevcut Lead Machine'den ayrı klasör |
| `admin_panel/src/app/globals.css` (~2600 satır) | Tema kaynak referansı | Tokenize edilip Tailwind v4 token'larına çevrilir |
| `amozon-scoring-engine-teknik-rapor.pdf` | `docs/teknik/` | Risk modülünün referans dokümantasyonu |
| `müsterimesajlari.md` | `docs/musteri/amazon-pilot-konusmalari.md` | Tarihsel referans olarak korunur |
| `YARINKI_ISLER_PHASE4.md` | `docs/teknik/risk-faz4-isleri.md` | Risk modülünün açık görev listesi |

### Aktarılmayacaklar
- amozon'un kendi `node_modules`, `bun.lock`, build artifacts — yeniden kurulur
- amozon'un kendine has `package.json` — market_pulse'ın `package.json`'ı içine merge edilir
- amozon'un `.env` — yeniden tanımlanır

### Amazon kullanıcı arayüzü iki yerde olacak
- `admin_panel/` içinde: iç ekipler için (mevcut Amazon admin panel)
- `frontend/` içinde: Public SaaS olarak (mevcut Faz 1 frontend, Risk modülü olarak yeniden konumlanır)

### amozon repo'sunun sonu
- Aktarım tamamlandığında amozon repo'su **dondurulur** (yeni geliştirme yapılmaz)
- Mevcut Amazon müşterisi (Bionluk teslimi) o repo'dan teslim alır
- Yeni müşteriler doğrudan Market Pulse Suite'in Risk modülü üzerinden gelir
- 6 ay sonra amozon repo arşivlenir (Senaryo A'nın doğal sonu)

---

## 6. Tema Migrasyonu (Yol 1)

amozon'un sade/resmi B2B teması market_pulse'ın yeni görsel temeli olur.

### Renk paleti (kaynak: amozon `globals.css`)

```css
--mp-bg:          #f6f7f9;   /* off-white background */
--mp-panel:       #ffffff;
--mp-panel-soft:  #f9fafb;
--mp-text:        #111827;
--mp-muted:       #64748b;
--mp-border:      #d9dee7;
--mp-brand:       #0f766e;   /* teal — Notion/Linear hissi */
--mp-brand-dark:  #115e59;
--mp-danger:      #dc2626;
--mp-warning:     #b45309;
--mp-success:     #15803d;
--mp-shadow:      0 12px 30px rgba(15, 23, 42, 0.08);

/* Sidebar (navy) */
--mp-sidebar-bg:    #101827;
--mp-sidebar-text:  #cbd5e1;
--mp-sidebar-active: rgba(15, 118, 110, 0.2);
```

### Font
- Birincil: **Inter** (system fallback ile)
- Mevcut TarMinGO fontu (`appFontVariableClassName`) kaldırılır

### Migration adımları
1. `admin_panel/src/app/globals.css` — `:root` token'larını yukarıdaki palet ile değiştir
2. `admin_panel/tailwind.config` (varsa) veya Tailwind v4 token tanımlarını `--mp-*` ile bağla
3. Shadcn'in default token'ları (`--background`, `--foreground`, `--primary`, vs.) `--mp-*` token'larına map edilir → Shadcn dokunulmadan Market Pulse temasına bürünür
4. `AdminShell` / `Sidebar` bileşenleri amozon'un navy sidebar yapısıyla yeniden düzenlenir (mevcut yapı korunur, sadece renkler ve density değişir)
5. `frontend/src/app/globals.css` — aynı palette ile sıfırlanır
6. Frontend landing — TarMinGO hero parçaları (eğlence tonlu) sade B2B hero'ya çevrilir
7. `frontend/src/lib/fonts/app-fonts.ts` — Inter'a indir

**Süre tahmini**: 3-5 gün. Önce admin_panel, sonra frontend. Riski düşük çünkü Shadcn altyapısı kalıyor, sadece görsel iskelet değişiyor.

---

## 7. Fiyatlandırma

Modüler tier mantığı. Müşteri ihtiyacına göre modül ekler, faturası buna göre büyür.

| Tier | Aylık (TL) | Aylık (EUR) | Dahil | Sınırlar |
|---|---|---|---|---|
| **Free** | 0 | 0 | CRM çekirdek + Risk (free) | 100 kişi, 5 Amazon tarama/gün, 1 izleme hedefi |
| **Starter** | 599 | 19 | CRM + Monitor (5 hedef) veya CRM + Risk | 500 kişi, 30 Amazon tarama/gün, 5 izleme hedefi |
| **Pro** | 1.499 | 49 | CRM + 2 modül | 5K kişi, sınırsız tarama, 25 izleme hedefi |
| **Business** | 4.999 | 159 | CRM + tüm modüller | 25K kişi, 100 izleme hedefi, 3 kullanıcı |
| **Sanayi (Custom)** | 7K-15K | 199-499 | Tümü + özel şablon + saha desteği | Sınırsız, çoklu kullanıcı, dedicated support |

**Sanayi tier'ı** Paspas + sıcak müşterilerin oturduğu yer. Bu özel kurulum/saha desteği içerir, normal SaaS değil — **danışmanlık-destekli SaaS**. 199-499 EUR/ay Paspas'taki mevcut anlaşma; sanayi sıcak müşteriler için aynı aralık tutulur.

**Aksiyon önemi**: Self-serve (Free→Pro) yavaş büyür, **sanayi tier'ı hızlı para getirir**. İkisini paralel sat:
- Self-serve: SEO + landing + sosyal medya → free→starter dönüşümü
- Sanayi: Doğrudan satış + saha ziyareti → ay başı 1-2 müşteri hedefi

---

## 8. 6 Aylık Roadmap

### Ay 1 — Mayıs 2026 (şu an)
- ✅ Strateji belgesi (bu) yazıldı
- 🔔 **Bu hafta (05-09):** Paspas sunum revize + müşteri görüşmesi + ilk teklif (199 EUR)
- amozon → market_pulse aktarım (Senaryo A): repo birleştirme, klasör organizasyonu
- Tema migrasyonu adım 1: admin_panel token'ları + sidebar yeniden düzeni
- Multi-tenant DB şeması: `tenants`, `tenant_users`, `tenant_modules`, `tenant_subscriptions`

### Ay 2 — Haziran 2026
- Monitor modülü MVP'si: 3 şablon (bayi sitesi izleme, Trendyol fiyat, RSS)
- Müşteri-facing Monitor dashboard
- Sinyal sistemi: e-mail + WhatsApp bildirimleri
- CRM çekirdek backend: hesap, kişi, pipeline, görev tabloları + API
- Tema migrasyonu adım 2: frontend (landing + auth + dashboard sade B2B'ye dön)
- **Hedef**: Paspas + 1 yeni sanayi müşterisi canlıda

### Ay 3 — Temmuz 2026
- Risk modülü Suite'e entegre (mevcut public Amazon SaaS Risk modülü olarak yeniden konumlanır)
- Discover modülü admin paneli mevcut Lead Machine'den public SaaS'a port
- Billing (Iyzipay TL + Stripe EUR) — Free/Starter/Pro tier enforcement
- Onboarding wizard: yeni müşteri → ICP/şablon seç → ilk izleme/lead kur
- **Hedef**: 4 sanayi müşterisi + 20 self-serve free kullanıcı

### Ay 4 — Ağustos 2026
- Outreach modülü Faz 1 (manuel taslak gönder, açma takibi)
- Sektör şablon paketleri (plastik sanayi, tekstil, gıda — 3 dikey set)
- API erişimi (Business+ tier'a açık)
- Ajans/reseller programı
- **Hedef**: 6 sanayi müşterisi + 50 self-serve, MRR ~2-3K EUR

### Ay 5-6 — Eylül-Ekim 2026
- Outreach Faz 2: sequence engine + warmup
- AI asistanı (her ekranda "şimdi ne yapmalıyım?" sorusuna cevap, Zoho Zia gibi)
- Mobil web responsive
- KOSGEB / e-Fatura / Kolay İhracat entegrasyon bağlamaları (Türk-özel moat)
- **Hedef**: 10+ sanayi müşterisi, 100+ self-serve, MRR 5K EUR

---

## 9. Sanayi Müşteri Görüşme Şablonu

Sıcak 2-3 sanayi müşterisi ile yapılacak ilk görüşmenin script'i. "Ne istediklerini" bu sorular netleştirir, **biz tahmin etmeyiz**.

### Açılış (5 dk)
1. "Ana iş ne, kim olarak konumlanıyorsunuz?"
2. "Kaç kişilik bir ekipsiniz? Satış / pazarlama / dış ticaret kim yapıyor?"
3. "Şu anda müşteri / bayi / rakip bilgisini nerede tutuyorsunuz?" (Beklenen: Excel / WhatsApp / kağıt)

### İhtiyaç keşfi (15 dk)
4. "Bir gününüzde *fazla zaman yiyen* en sıkıcı 3 iş hangisi?"
5. "Şu an *bilmek istediğiniz ama bilemediğiniz* 3 şey?" (Bu, izleme şablonu kararı için kritik.)
6. "Bir rakip / bayi / tedarikçi *sizinle ilgili* bir şey yaparsa öğrenmek ister misiniz? Örneğin?"
7. "Yeni müşteri / bayi bulma sürecinizi anlatır mısınız?"
8. "Yurt dışı satış / ihracat var mı? Hangi pazarlara?"

### Çözüm validasyonu (10 dk)
9. "Eğer şunu yapsak: [şablon önerin] — bu işinize yarar mı, ayda kaç saat kazandırır?"
10. "199 EUR / 499 EUR / 999 EUR ay olsa hangisine evet dersiniz, hangisinde 'çok pahalı' dersiniz?"
11. "Kim karar verecek bu satın almaya?"
12. "İlk 30 günde *değer gördüğünüzü hissetmek için* ne olmalı?"

### Kapanış (5 dk)
- Bir sonraki adım: 2 hafta içinde pilot (ücretsiz) → 3. haftada 199 EUR teklifi
- Görüşme notları `docs/musteri/<firma-adi>-<tarih>.md` olarak kaydedilir
- Görüşme sonrası: her firma için Monitor şablonu ön-taslağı yazılır

**Not**: Bu görüşmeler **bu ayın iş listesinin başında**. Sanayi müşterileri ne istediklerini söylemeden Monitor şablon paketi tasarlamak boşa kürek çekmektir.

---

## 10. Mevcut Çeklistlerin Yeniden Organizasyonu

### `docs/URUN_GELISTIRME_CHECKLIST.md` (mevcut, Amazon-odaklı)
**Karar**: Bu dosya **Risk modülünün** alt-çeklisti olarak kalır. Adı değişir:
```
docs/URUN_GELISTIRME_CHECKLIST.md  →  docs/teknik/RISK_MODULU_CEKLISTI.md
```
- Bölüm 1-9 (Lead Machine, ICP, B2B, Feedback) → `docs/teknik/DISCOVER_MODULU_CEKLISTI.md` olarak kopyalanır
- Bölüm 10 (Amazon scoring) → `RISK_MODULU_CEKLISTI.md` çekirdeği
- Bölüm 11 (Public SaaS Frontend) → `docs/teknik/FRONTEND_FAZ1_CEKLISTI.md`
- Bölüm 12 (Backend genel) → `docs/teknik/BACKEND_GENEL_CEKLISTI.md`

### `docs/strateji/GENISLEME_PLANI.md` (eski Amazon-only plan)
**Karar**: Arşivlenir.
```
docs/strateji/GENISLEME_PLANI.md  →  docs/arsiv/2026-05-08-amazon-onlyplan.md
```
Tarihsel referans olarak kalır, aktif planlamada kullanılmaz.

### Yeni çeklist'ler (oluşturulacak)
- `docs/teknik/CRM_CEKIRDEK_CEKLISTI.md` (yeni)
- `docs/teknik/MONITOR_MODULU_CEKLISTI.md` (yeni)
- `docs/teknik/AMOZON_AKTARIM_CEKLISTI.md` (yeni, tek-seferlik)
- `docs/teknik/TEMA_MIGRASYON_CEKLISTI.md` (yeni, tek-seferlik)
- `docs/teknik/MULTI_TENANT_CEKLISTI.md` (yeni)
- `docs/teknik/BILLING_CEKLISTI.md` (yeni)

Her çeklist'in başı bu master plana referans verir: `> Bu çeklist [MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md) kararlarına bağlıdır.`

---

## 11. Açık Riskler ve Karar Bekleyenler

### Açık riskler
1. **Multi-tenant DB**: Mevcut backend tek-tenant. Multi-tenant'a göç, en az 2 hafta iş + veri göçü. Yanlış yapılırsa müşteri verisi karışır.
2. **BAZ Export 1-2 yıl önde**: Discover + Outreach modüllerinde rekabet zorluğu. Pazara girerken **Monitor + CRM**'in ön plana çıkması, Outreach'in **Faz 2'ye atılması** bu nedenle.
3. **Sanayi tier custom işi**: 199-499 EUR/ay danışmanlık-destekli — ölçeklenmez. 10+ müşteri olunca kişisel emek tükenir. Faz 5'te "kendi-kendine onboarding" sistemini sağlamlaştırmak şart.
4. **amozon repo'su yarı yolda kalır**: Mevcut Amazon müşterisi (Bionluk teslimi) varsa onun sözleşmesi bitene kadar amozon yaşamaya devam eder. Aktarım, amozon'un kapanmasına bağlı değil; market_pulse paralel ilerler.
5. **Tema migrasyonu admin panel'i bozabilir**: Shadcn token override'ları tüm bileşenleri etkiler. Mevcut admin paneli kullanıcıya teslim edilmiş — kırılma olursa müşteri etkilenir. **Aksiyon**: tema migrasyonu yeni branch'te yapılır, görsel QA tamamlanmadan main'e merge edilmez.

### Karar bekleyen sorular (önümüzdeki 7 gün içinde)
- **A**: Multi-tenant ayrı veritabanı mı yoksa `tenant_id` kolonu mu? (Önerim: tenant_id, row-level isolation. Maliyet düşük, müşteri sayısı az.)
- **B**: Billing partner Iyzipay mı Paddle mı Stripe-only mi? (Önerim: Iyzipay TL + Stripe EUR/USD, çoklu.)
- **C**: Auth/SSO ihtiyacı şimdi mi sonra mı? (Önerim: Faz 1'de e-mail+şifre, Faz 3'te Google OAuth, Faz 5'te SAML for enterprise.)
- **D**: Domain → marketpulse.com.tr mu, marketpulse.app mı, başka mı? (Cevap yok.)
- **E**: KVKK + GDPR + Müşteri verisi tutma süresi — yasal çerçeve. (En geç Ay 3, public SaaS açılmadan önce çözülür.)

---

## 12. Bu Belgenin Sahipliği

- **Bu dosyayı kim okuyacak**: Tüm yeni iş kararları bu belgeyi referans alır. Codex, Antigravity, Copilot ve Claude burada yazılanlara uyar.
- **Bu dosyayı kim güncelleyecek**: Strateji değişikliği sadece kullanıcı ile Claude'un oturumu sonucu olur. Codex/Antigravity bu dosyayı değiştirmez, sadece çeklist dosyalarını günceller.
- **Sonraki güncelleme**: Sanayi müşteri görüşmeleri tamamlandığında (Mayıs sonu) Bölüm 4 (senaryolar) + Bölüm 7 (fiyat) yeniden gözden geçirilir.

---

## Aksiyon Listesi (Şu Anda Yapılacaklar)

Sıra önemli; üstten alta:

1. **Bu hafta (05-14 → 05-21)**:
   - [ ] Paspas sunum revize + 199 EUR teklif (paralel, gelir akışı)
   - [ ] Sanayi 2-3 sıcak müşteriyle randevu al, Bölüm 9 şablonu ile görüş
   - [ ] amozon → market_pulse aktarım çeklisti yaz (`docs/teknik/AMOZON_AKTARIM_CEKLISTI.md`)
   - [ ] URUN_GELISTIRME_CHECKLIST.md'yi 4 yeni çeklist'e böl + GENISLEME_PLANI.md'yi arşivle

2. **Önümüzdeki 2 hafta (05-21 → 06-04)**:
   - [ ] amozon → market_pulse fiziksel aktarım (kod taşıma)
   - [ ] Tema migrasyonu Adım 1: admin_panel token'ları (`docs/teknik/TEMA_MIGRASYON_CEKLISTI.md`)
   - [ ] Multi-tenant DB şeması taslağı (`docs/teknik/MULTI_TENANT_CEKLISTI.md`)
   - [ ] Sanayi görüşme sonuçlarına göre Monitor şablonları yazısı (`docs/teknik/MONITOR_MODULU_CEKLISTI.md`)

3. **Haziran 2026**:
   - [ ] Monitor MVP backend + frontend
   - [ ] Tema migrasyonu Adım 2: frontend
   - [ ] CRM çekirdek backend
   - [ ] İlk yeni sanayi müşterisi canlıya alınır

Bu liste TodoWrite'a değil, projeye **çeklist olarak** yazılır. Her madde tamamlandıkça bu master plan günceller, çeklist'ler işaretlenir.
