# 08 — Bütçe ve Kaynak

Bu doküman MatPortal'ın **operasyonel maliyetlerini** (SaaS, altyapı, dış servis), **donanım/cloud gereksinimlerini** ve **ölçek bazında bütçe senaryolarını** detaylandırır. Geliştirme ücreti (insan saati) **bu dokümanda yer almaz** — Promats yönetimiyle ayrı görüşme konusu.

## 1. Bütçe Kategorileri

| Kategori | Kalemler | Ölçek |
|----------|----------|-------|
| **A — Altyapı** | VPS, container, kuyruk | Sabit, ölçekle artar |
| **B — Veritabanı & Storage** | MySQL, Redis, S3 | Veri büyüklüğüyle artar |
| **C — AI & LLM** | Claude, OpenAI, Groq | Kullanıma göre |
| **D — Lead & Email** | Hunter, Apollo, Brevo, Mailgun | Aylık abonelik |
| **E — Scraping & Veri** | Apify, Bright Data proxy, Google Places | Hacme göre |
| **F — Mobil & Bildirim** | Firebase FCM, push, SMS | Düşük |
| **G — Geliştirme araçları** | GitHub, Sentry, monitoring | Sabit |
| **H — Yasal & Sigorta** | Avukat, KVKK uyum | Bir kerelik + yıllık |

## 2. Ana Senaryolar — 3 Aşama

### Senaryo A — "Free Tier Başlangıç" (Faz 0-3, ilk 6 ay)

| Kalem | Aylık | Notlar |
|-------|-------|--------|
| VPS (8GB+4vCPU+200GB) | $30-50 | Hetzner / Contabo |
| MySQL + Redis | $0 | VPS'te self-host |
| MinIO (object storage) | $0 | VPS'te self-host |
| Hunter.io | $0 | Free 25 search/ay |
| Apollo.io | $0 | Free 50 email/ay |
| Google Places API | $0 | $200 free credit/ay |
| Snov.io | $0 | Free 50 lead/ay |
| Brevo (email) | $0 | Free 300/gün |
| AI provider (orta yoğunluk) | $20-50 | Anthropic + OpenAI + Groq karışık |
| Sentry / monitoring | $0 | Free tier |
| GitHub | $0 | Mevcut hesap |
| **Toplam** | **$50-100/ay** | |

**Yapılabilenler:**
- Lokal lead crawler, TOBB/Google Places ile yurt içi 3-4K lead/ay
- AI ile yapılandırma + skorlama
- Manuel takip + 5 pilot bayi
- Faz 0-3 tüm modüller

### Senaryo B — "Operasyonel Olgunluk" (Faz 4-7, ay 7-14)

| Kalem | Aylık | Notlar |
|-------|-------|--------|
| VPS ana (8GB+4vCPU) | $50 | Yine Hetzner |
| VPS ML servis (4GB+2vCPU) | $30 | Ayrı container |
| VPS crawler (2GB+2vCPU) | $20 | Ayrı container |
| AWS S3 (50GB) | $5 | Snapshot + artifact |
| Snov.io Starter | $39 | 500 search + 1K verify |
| Apollo.io Basic | $59 | 900 email credit + sequence |
| Hunter.io Free | $0 | Yedek olarak |
| Google Places (büyük tarama) | $50 | $200 free üstüne |
| Apify (sosyal medya) | $20 | Instagram + Facebook scraper |
| Bright Data proxy | $15 | Bayi siteleri |
| Brevo paid | $25 | 20K email/ay |
| AI provider (yoğun) | $80-150 | Tahmin açıklama + sohbet |
| Sentry Team | $26 | Hata takibi |
| Firebase FCM | $0 | Ücretsiz tier |
| Twilio SMS (acil) | $10 | Düşük volüm |
| **Toplam** | **$430-500/ay** | |

**Yapılabilenler:**
- Yurt dışı outreach + sequence + mobile contact
- 5K+ doğrulanmış email/ay
- 100 bayi haftalık scraping
- Multi-deployment hazır altyapı
- Faz 4-7 modülleri canlı

### Senaryo C — "Hızlı Büyüme" (Faz 8+, yıl 2+)

| Kalem | Aylık | Notlar |
|-------|-------|--------|
| Cloud VPS (3 instance) | $200 | AWS/DigitalOcean |
| MySQL (managed) | $80 | Read replica dahil |
| Redis (managed) | $30 | Sentinel/cluster |
| AWS S3 (200GB+) | $20 | Cross-region |
| Hunter.io Growth | $149 | 5K search/ay |
| Apollo.io Pro | $99 | 12K email + sequence |
| Lusha (telefon) | $79 | Mobile contact |
| Cognism (AB GDPR) | $250 | Avrupa lead |
| Google Places + alternatifler | $100 | Geniş tarama |
| Apify (premium) | $50 | Çoklu sosyal |
| Mailgun + Brevo | $40 | Bulk email + transactional |
| AI yoğun (Claude+OpenAI+Groq) | $200-400 | Tüm modüller aktif |
| Sentry Business | $80 | Detaylı insights |
| Datadog (gözlem) | $60 | Metric + APM |
| Twilio (SMS + WhatsApp) | $50 | Volüm |
| **Toplam** | **$1.487-1.787/ay** | |

**Yapılabilenler:**
- 50K+ email/ay
- Telefon dahil iletişim
- Çoklu sequence
- 500+ bayi scraping
- AB pazarı GDPR uyumlu

## 3. AI / LLM Bütçe Detayı

### 3.1 Provider başına tahmini maliyet

| Provider | Aylık (orta yoğunluk) | Aylık (yoğun) | Notlar |
|----------|------------------------|---------------|--------|
| Anthropic Claude | $20-60 | $80-200 | Test analizi, kritik sohbet, açıklama |
| OpenAI gpt-4o-mini | $10-30 | $30-80 | Yapılandırma, JSON çıktı |
| Groq llama-3.1-70b | $5-15 | $15-50 | Hızlı sohbet, bulk sinyal |
| Whisper (ses → metin) | $1-5 | $5-15 | Saha ses kayıtları |
| **Toplam** | **$36-110** | **$130-345** | Ölçeğe göre |

### 3.2 Token-bazlı tahmin

100 bayi × ortalama günlük AI kullanımı:
- Sinyal çıkarımı (HTML diff): 5 sayfa × 5K token = 25K input × 1K output (her bayi)
- Tahmin açıklama: 100 tahmin × 1K token = 100K
- Sohbet: 20 mesaj × 2K token = 40K
- Toplam günlük: ~100-200K token / bayi (peak)

Aylık × 100 bayi: ~600M-1.2B token. Karışık provider:
- %20 Claude (kalite) = 200M × $3/M = $600
- %40 OpenAI gpt-4o-mini = 400M × $0.15/M = $60
- %40 Groq = 400M × $0.05/M = $20
- **Toplam:** ~$680/ay (yoğun ölçek)

İlk 6 ay düşük (10 bayi pilot): tahmini $30-80/ay.

### 3.3 Token üst sınır mekanizması

```ts
// LLM gateway her çağrıda kontrol eder
const aylikLimit = env.LLM_BUDGET_USD;  // ör. 200
const harcanan = await redisGet('llm:harcanan:bu-ay');
if (harcanan > aylikLimit * 0.9) {
  // %90'a yaklaşıldı, sadece kritik aksiyonlar
  await uyariGonder('LLM bütçesi %90 doldu');
}
if (harcanan > aylikLimit) {
  // Kapatılır, kill-switch
  throw new Error('Aylık LLM bütçesi aşıldı');
}
```

## 4. Tek Seferlik Maliyetler

### 4.1 Kuruluş

| Kalem | Maliyet | Açıklama |
|-------|---------|----------|
| Domain (matportal.promats.com.tr) | $15/yıl | Cloudflare |
| TLS sertifika | $0 | Let's Encrypt otomatik |
| VPS ilk kurulum | 0 | DevOps zamanı (geliştirme) |
| Avukat — KVKK aydınlatma + bayi sözleşme klozu | ~$500-1500 | Bir kerelik |
| Logo / brand kılavuzu | ~$200-500 | Promats marka kullan, minor adapt |
| Onboarding video (Loom) | $0 | Self-recorded |

### 4.2 Sürekli yıllık

| Kalem | Yıllık |
|-------|--------|
| Domain yenileme | $15 |
| KVKK denetim danışmanlığı | $200-500 |
| Sigorta (siber + sorumluluk) | $500-2000 |
| **Toplam yıllık ek** | **$715-2515** |

## 5. Donanım / Cloud Gereksinimleri

### 5.1 Self-host (önerilen Faz 0-3)

| Bileşen | Spec | Sağlayıcı | Aylık |
|---------|------|-----------|-------|
| Ana VPS | 8GB RAM, 4 vCPU, 200GB SSD | Hetzner CX31 | €15 (~$17) |
| Backup VPS (snapshot) | — | Hetzner add-on | €3 |
| Bandwidth | 20TB/ay dahil | — | $0 |
| **Toplam** | | | **~$20** |

### 5.2 Multi-container (Faz 4-7)

| Bileşen | Spec | Sağlayıcı | Aylık |
|---------|------|-----------|-------|
| Ana VPS | 16GB RAM, 8 vCPU, 400GB SSD | Hetzner CX41 | €30 (~$32) |
| ML servis (ayrı VPS) | 8GB RAM, 4 vCPU, 100GB | Hetzner CX31 | €15 (~$17) |
| Crawler worker (ayrı VPS) | 4GB RAM, 2 vCPU, 50GB | Hetzner CX21 | €5 (~$6) |
| AWS S3 (50GB+egress) | — | AWS | $5-10 |
| **Toplam** | | | **~$60-65** |

### 5.3 Cloud-managed (Faz 8+, yıl 2)

| Bileşen | Spec | Sağlayıcı | Aylık |
|---------|------|-----------|-------|
| Application servers (3x) | 4 vCPU+8GB | DigitalOcean | $120 |
| Managed MySQL | 2 vCPU+4GB+100GB | DigitalOcean | $80 |
| Managed Redis | 2GB | DigitalOcean | $30 |
| S3 (200GB) | — | AWS | $20 |
| Load balancer | — | DigitalOcean | $12 |
| **Toplam** | | | **~$262** |

## 6. Geliştirme Maliyeti — Çerçeve

> Geliştirme ücreti bu dokümanda netleştirilmemiştir. Promats yönetimi ile ayrı görüşülecek. Aşağıda **çerçeve perspektif** verilmiştir.

### 6.1 Adam-saat tahmini

| Faz | Süre (hafta) | FTE | Toplam adam-hafta |
|-----|--------------|-----|---------------------|
| Faz 0 | 4 | 1.0 | 4 |
| Faz 1 | 4 | 1.0 | 4 |
| Faz 2 | 8 | 1.5 | 12 |
| Faz 3 | 6 | 1.0 | 6 |
| Faz 4 | 6 | 1.0 | 6 |
| Faz 5 | 8 | 1.5 | 12 |
| Faz 6 | 8 | 2.0 | 16 |
| Faz 7 | 8 | 2.0 | 16 |
| Faz 8 | 6 | 1.0 | 6 |
| Faz 9 | 8 | 1.5 | 12 |
| **Toplam (Faz 0-9)** | **66 hf** | **~3.5 FTE ortalama** | **~94 adam-hafta** |

Adam-hafta × 40 saat = ~3.760 adam-saat (~14 ay).

### 6.2 Maliyet hesabı

Geliştirici ücretine göre değişir; iki referans modeli:

**Model 1: Project-based fixed price**
- Faz 0-9 toplam fiyat
- Milestone'lara bağlı ödeme (her faz tamamlandığında %X)
- Risk: kapsam değişikliği yönetimi

**Model 2: Time & materials**
- Adam-saat × birim ücret
- Aylık fatura
- Fayda: kapsam esnek, dezavantaj: bütçe öngörülemez

**Model 3: Retainer**
- Aylık sabit ücret + milestone bonus
- Fayda: sürekli destek, ek istek dahil

**Önerilen:** Model 1 ile başla (Faz 0-2 arası), sonra Model 3'e geç (sürekli destek).

## 7. Toplam Yıllık Bütçe — 3 Senaryo

### Yıl 1 (Faz 0-7 yaklaşık)

| Kategori | Aylık | Yıllık |
|----------|-------|--------|
| Altyapı + DB | $80 | $960 |
| AI / LLM | $50-150 | $600-1.800 |
| Lead & email | $0-100 | $0-1.200 |
| Scraping | $0-50 | $0-600 |
| Diğer (monitoring, vs) | $30 | $360 |
| **Operasyonel toplam** | **$160-410** | **$1.920-4.920** |
| Bir kerelik (avukat, sigorta, vs) | — | $1.000-3.000 |
| **Yıl 1 toplam (operasyonel)** | | **$2.920-7.920** |

### Yıl 2 (Faz 8+, ölçek artışı)

| Kategori | Aylık | Yıllık |
|----------|-------|--------|
| Altyapı + DB | $200 | $2.400 |
| AI / LLM | $150-400 | $1.800-4.800 |
| Lead & email | $200-400 | $2.400-4.800 |
| Scraping | $50-100 | $600-1.200 |
| Diğer | $80 | $960 |
| **Operasyonel toplam** | **$680-1.180** | **$8.160-14.160** |

### Yıl 3+ (büyüme aşaması)

100+ bayi, multi-deployment varsa: $1.500-2.500/ay = $18.000-30.000/yıl.

## 8. ROI — Geri Dönüş Analizi

> Hesaplamalar **doğrulanmamış varsayımlardır**. Faz 0 sonunda baseline ile revize edilir.

### 8.1 Mevcut kayıplar (aylık)

| Kalem | Tahmini kayıp |
|-------|---------------|
| Satış ekibi sipariş alma zamanı | ~150K TL/ay (workforce maliyeti) |
| Yanlış sipariş (8-12 hata × 5K TL) | ~50K TL/ay |
| Cari soru cevap zamanı | ~25K TL/ay |
| Stok-out kayıp satış | ~50-100K TL/ay |
| Aşırı stok bağlanmış sermaye | ~30-50K TL/ay (faiz fırsat maliyeti) |
| **Toplam aylık** | **~305-375K TL** |

### 8.2 MatPortal ile potansiyel iyileşme (yıl 1 sonu)

| Kalem | İyileşme |
|-------|----------|
| Sipariş alma zamanı | -%65 → ~50K TL/ay tasarruf |
| Sipariş hatası | -%80 → ~40K TL/ay |
| Stok-out kayıp | -%50 → ~25-50K TL/ay |
| Stok birikim | -%30 → ~10-15K TL/ay |
| **Aylık tasarruf** | **~125-155K TL** |
| Sipariş frekans artışı (+%30-40) | ~150-300K TL/ay ek ciro (kar marjı %15 → +25-45K TL) |
| **Toplam aylık fayda** | **~150-200K TL/ay** |

### 8.3 Operasyonel ROI

- Aylık operasyonel maliyet (yıl 1): ~$200-400 = ~7-13K TL
- Aylık fayda: ~150-200K TL
- **ROI:** ~12-20x aylık operasyonel maliyet

Yıllık fayda: ~1.8-2.4M TL
Yıllık operasyonel: ~$3-5K = ~100-170K TL
**Net yıllık değer:** ~1.6-2.3M TL (operasyonel dışında, geliştirme maliyeti hariç)

## 9. Maliyet Optimizasyonu Stratejileri

### 9.1 Provider switching

LLM provider'lar arası geçiş + fallback otomatik:
- Anthropic pahalanırsa → Groq'a düş (10x ucuz)
- OpenAI rate limit → Anthropic'e düş
- **Tasarruf:** %30-50

### 9.2 Cache stratejisi

- Tahmin sonucu Redis'te 1 saat TTL → tekrarlı sorgular bedava
- LLM yanıtları (deterministik prompt) Redis'te 24 saat
- **Tasarruf:** LLM çağrı %40-60 azalır

### 9.3 Batch processing

- Sinyal çıkarımı tek tek değil, 10 sayfa toplu LLM çağrısı
- Email gönderim batch'li (Brevo bulk API)
- **Tasarruf:** API çağrı maliyeti %50

### 9.4 Free tier maksimizasyonu

- Hunter Free 25/ay + Apollo Free 50 + Google Places $200 = aylık ~$300 değerinde free tier
- Promats için ayda ~$0 başlama mümkün

### 9.5 Self-host vs Managed trade-off

| | Self-host | Managed |
|---|-----------|---------|
| MySQL | $0 (VPS'te) | $80/ay |
| Redis | $0 | $30/ay |
| MinIO/S3 | $0 (5GB) | $5-20/ay |
| **Aylık** | $0 | $115-130 |
| **Operasyonel yük** | Yüksek (sen yönetirsin) | Düşük |

Faz 0-3 self-host, Faz 7+ managed (ölçek + operasyonel yük arttığında).

## 10. Bütçe Onay Süreci

### 10.1 Önerilen yaklaşım

1. **Senaryo A onay** — Faz 0-3 başlangıç ($50-100/ay) → Promats yönetimi onayı kolay
2. **Faz 3 sonu değerlendirme** — Senaryo B'ye geçiş için ROI raporu
3. **Yıl 2 başı** — Senaryo C ihtiyaç doğunca

### 10.2 Bütçe takip

Aylık otomatik rapor:
- LLM token harcaması (provider başına)
- VPS + cloud maliyetleri
- SaaS abonelik durumu
- Beklenmedik artışlar (uyarı eşik üstü)

Yöneticinin admin panelinden gerçek zamanlı izleme:

```
[Ekran: /admin/butce-dashboard]
  Bu ay (kümülatif)
  ├─ AI / LLM:       $87 / $200 (44%)
  ├─ Lead & email:   $45 / $100 (45%)
  ├─ Scraping:       $18 / $50  (36%)
  ├─ Altyapı:        $80 / $80  (100% — sabit)
  └─ Toplam:        $230 / $430 (53%)

  Tahmini ay sonu: $410 / $430 (95%)
  Status: ✅ Bütçe içinde
```

## 11. Açık Karar Noktaları (Bütçe)

1. **Senaryo A mı, B mi başlangıç?** (Önerim: A — ihtiyaç doğunca B'ye geç)
2. **Self-host vs managed:** ne zaman geçiş? (Önerim: 100K+ aylık sipariş veya Faz 7+)
3. **AI bütçe üst sınırı:** aylık ne kadar? (Önerim: ilk 6 ay $100, sonra $300)
4. **Avukat:** Faz 5 başı mı, daha önce mi? (Önerim: Faz 5 başı, KVKK metni o zaman gerek)
5. **Sigorta:** lazım mı? (Önerim: yıl 2'de değerlendir)
6. **Cloud sağlayıcı tercih:** Hetzner mi DigitalOcean mı AWS mı? (Önerim: Hetzner başla, AWS Faz 7+)
7. **Geliştirme ödeme modeli:** fixed mi T&M mi retainer mı? (Önerim: Faz 0-2 fixed, sonra retainer)
8. **Bütçe onay yetkisi:** Promats yöneticisi tek mi, kurul mu? (Promats karar)
9. **Aylık raporlama:** PDF mi dashboard mı? (Önerim: dashboard + ayda 1 PDF özet)
10. **Beklenmedik harcama eşiği:** %20 üstü ön uyarı mı, %50 üstü stop mu? (Önerim: %80 uyarı, %100 kill-switch)
