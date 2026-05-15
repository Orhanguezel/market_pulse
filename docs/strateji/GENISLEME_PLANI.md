# Market Pulse — Genişleme Planı

**Tarih:** 8 Mayıs 2026  
**Durum:** Aktif geliştirme  
**Temel:** Rakip analizi (Helium 10, Agellic, SatisAnaliz, ApexScouty)

---

## Mevcut Durum

| Katman | Ne var | Durum |
|--------|--------|-------|
| `backend/` | Fastify API, scoring engine, Keepa, Oxylabs, DB | ✅ Canlı |
| `admin_panel/` | İç yönetim paneli, tarama ekranı, risk kart | ✅ Canlı |
| `frontend/` | Yok | ❌ Yapılacak |

Mevcut müşteriye (Bionluk) `backend/` + `admin_panel/` teslim edilecek — bu değişmiyor.

---

## Hedef Mimari

```
market_pulse/
├── backend/          ← Ortak API (admin + public)
├── admin_panel/      ← İç yönetim (müşteriye verilir)
└── frontend/         ← Halka açık SaaS (müşteriye verilmez)
```

`backend/` ikisine de hizmet eder:
- `/api/v1/admin/...` → admin panel
- `/api/v1/public/...` → frontend (yeni route grubu)

---

## Rakip Konumlandırma

| Rakip | Fiyat | Bizden farkı |
|-------|-------|-------------|
| Helium 10 | $99-279/ay | Çok geniş platform, pahalı, İngilizce |
| Agellic | $29/ay | Sadece Keepa, UI odaklı, karar motoru zayıf |
| SatisAnaliz | 299-399 TL/ay | Trendyol odaklı, Amazon ikincil |
| ApexScouty | $11-55/ay | Toplu analiz iyi, Türkçe yok, karar dili zayıf |
| **Biz** | TBD | Türkçe, Amazon-odaklı, 5 boyutlu karar motoru |

**Boşluk:** Türkçe dil, Amazon-özel, açıklanabilir risk kararı, erişilebilir fiyat.

---

## Frontend — Kapsam ve Özellikler

### Kimler kullanacak
Amazon'da satış yapmak isteyen veya zaten satan Türk girişimciler ve satıcılar. Teknik bilgisi olmayan, "bu kategoriye gireyim mi?" sorusuna hızlı cevap arayan kullanıcı.

### Sayfa Yapısı

#### 1. Landing Page
- Tek mesaj: "Amazon kategorisine girmeden önce riski gör"
- 3 adım: Keyword yaz → Analiz et → Karar al
- Rakip karşılaştırması (Helium 10 kadar karmaşık değil, daha ucuz)
- Free plan CTA

#### 2. Kayıt / Giriş
- Email + şifre
- Google OAuth (opsiyonel, Faz 2)
- Plan seçimi (Free başlar)

#### 3. Dashboard — Ana Ekran
- Keyword input + marketplace seçimi (US, DE, UK, TR...)
- Filtreler: review min/max, rating, fiyat aralığı
- "Analiz Et" butonu
- Son aramalar listesi

#### 4. Sonuç Ekranı — Risk Kart
Mevcut admin paneldekinin aynısı, sadece public kullanıcıya göre sadeleştirilmiş:
- Büyük karar etiketi: **GÜVENLİ / DİKKATLİ OL / GİRME**
- Composite skor
- 5 boyut (progress bar + reason)
- Data points badge
- Confidence seviyesi
- Keepa trend mini grafik (varsa)

#### 5. Geçmiş Aramalar
- Kullanıcının önceki analizleri
- Sonucu kaydet / sil
- Kararı yenile (aynı keyword tekrar tara)

#### 6. Plan / Fiyatlandırma Sayfası
- Free / Starter / Pro karşılaştırma tablosu

---

## Faz Planı

### Faz 1 — Public Frontend MVP
**Hedef:** Kullanıcı kaydolsun, keyword girsin, risk kartı görsün.

Yapılacaklar:
- [ ] `frontend/` Next.js projesi oluştur (Tailwind, Shadcn/UI)
- [ ] `backend/` public route grubu: `/api/v1/public/`
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /amazon/scan` (kullanıcı bazlı sorgu limiti kontrolü)
  - `GET /amazon/scan/:jobId`
  - `GET /amazon/risk-scores/:keyword`
- [ ] Kullanıcı tablosu + plan/limit takibi DB'ye ekle
- [ ] Landing page
- [ ] Kayıt / giriş sayfası
- [ ] Dashboard (keyword arama)
- [ ] Sonuç ekranı (risk kart — admin paneldeki component'ı port et)
- [ ] Geçmiş aramalar

**Süre:** ~2 hafta  
**Çıktı:** Çalışan, deploy edilebilir public uygulama

---

### Faz 2 — Ticari Karar Araçları
**Hedef:** "Bu ürün karlı mı?" sorusuna da cevap ver. ApexScouty ve SatisAnaliz'deki kar simülatörü boşluğunu doldur.

Yapılacaklar:
- [ ] Kar simülatörü
  - Alış fiyatı, Amazon referral fee, FBA fee, kargo, vergi
  - Net kar, ROI, break-even fiyat
- [ ] Risk kart + kar kartı yan yana gösterim
- [ ] CSV export (sonuç tablosu)
- [ ] PDF rapor (keyword başına)

**Süre:** ~1.5 hafta

---

### Faz 3 — Tablo ve Toplu Analiz
**Hedef:** Profesyonel satıcı segmenti. ApexScouty'nin toplu analiz güçlü yanına cevap.

Yapılacaklar:
- [ ] Ürün kanıt tablosu (tarama sonucu ürünlerin listesi — fiyat, rating, review, seller)
- [ ] Gelişmiş filtre/sıralama
- [ ] Çoklu keyword analizi (5-10 keyword birden gir, hepsini sırala)
- [ ] Saved searches / watchlist
- [ ] Keepa token budget UI (kullanıcının kendi key'i varsa BYOK)

**Süre:** ~2 hafta

---

### Faz 4 — Gelişmiş Özellikler
**Hedef:** Agellic'in eksik olduğu özellikleri ekle. Helium 10'dan ilham al ama sade tut.

Yapılacaklar:
- [ ] Rakip satıcı analizi (bir keyword'ün top satıcıları, mağaza profili)
- [ ] Fiyat trendi kartı (Keepa 30/90/365 gün grafik)
- [ ] Buy Box volatility göstergesi
- [ ] Doğal dil arama ("30 dolar altı, düşük rekabetli ürün bul" → filtrelere çevir)
- [ ] Multi-marketplace karşılaştırma (aynı keyword US vs DE)

**Süre:** ~3 hafta

---

### Faz 5 — SaaS Platformlaşma
**Hedef:** Para kazanmak.

Yapılacaklar:
- [ ] Plan sistemi ve billing (Iyzipay TL, Stripe USD)
- [ ] Sorgu limiti enforcement (Free: 5/gün, Starter: 30/gün, Pro: sınırsız)
- [ ] Kullanıcı yönetimi (admin panelden)
- [ ] KVKK sayfası, güvenli ödeme rozetleri
- [ ] WhatsApp / destek sistemi
- [ ] Email bildirimleri (analiz tamamlandı, limit doldu)

**Süre:** ~2 hafta

---

## Fiyatlandırma Modeli (Öneri)

| Plan | Fiyat | Limit | Özellikler |
|------|-------|-------|------------|
| **Free** | 0 TL | 5 analiz/gün | Risk kart, karar etiketi |
| **Starter** | 299 TL/ay | 30 analiz/gün | + Geçmiş, CSV export |
| **Pro** | 599 TL/ay | Sınırsız | + Toplu analiz, kar simülatörü, PDF rapor |
| **Ajans** | 1.499 TL/ay | Sınırsız + 5 kullanıcı | + White-label rapor, öncelikli destek |

---

## Mevcut Müşteriye (Bionluk) Teklif Stratejisi

Bionluk şu an `backend/` + `admin_panel/` alıyor — bu değişmiyor.

Proje genişleyince:
- Faz 1-2 tamamlanınca **"Genişletilmiş paket"** teklifi yapılabilir
- Admin panel + backend + frontend (kısıtlı: kendi kullanıcı yönetimi olmadan, white-label)
- Fiyat: 15.000-25.000 TL arası yeni sözleşme
- Onlar kendi müşterilerine servis olarak sunarlar

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 16, React 19, Tailwind v4, Shadcn/UI, Redux Toolkit, RTK Query |
| Backend (mevcut) | Fastify, Bun, MySQL, Drizzle ORM |
| Auth | JWT (mevcut admin auth genişletilir) |
| Ödeme | Iyzipay (TL), Stripe (USD) |
| Deploy | Nginx, PM2, VPS (mevcut altyapı) |

---

## Öncelik Sırası

1. **Faz 1 — Frontend MVP** → En kısa sürede kullanıcı kazanmaya başla
2. **Faz 2 — Kar simülatörü** → Rakiplerden ayrışma, ticari değer artışı
3. **Faz 5 — Billing** → Para akışı
4. **Faz 3 — Tablo/toplu** → Profesyonel segment
5. **Faz 4 — Gelişmiş** → Rekabet avantajı

---

## Notlar

- Frontend `admin_panel/`'dan bağımsız proje olarak başlar (`frontend/` klasörü)
- `admin_panel/` risk-score-card.tsx ve ilgili component'lar frontend'e port edilir, duplikasyon olmaz — ortak component kütüphanesi veya kopyalama
- Backend'e yeni route grubu eklenir, mevcut admin route'ları dokunulmaz
- Standalone klasörü silinebilir — müşteri teslimi için gerek yok
