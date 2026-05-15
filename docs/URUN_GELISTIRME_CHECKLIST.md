# Market Pulse — Ürün Geliştirme Master Checklist

**Son güncelleme:** 2026-05-11  
**Kaynaklar:** Müşteri geri bildirimi · Rakip analizi (Helium10/Agellic/SatisAnaliz/ApexScouty) · Genişleme Planı · Lead Machine Raporu · Teknik belgeler

Her bölüm bağımsız tamamlanabilir. Öncelik sırası aşağıda belirtilmiştir.

---

## Tamamlananlar ✅

> Referans için korunur, tekrar yapılmaz.

- [x] 5 boyutlu risk scoring engine (category_risk, sku_chaos, price_war_risk, brand_reliability, operational_risk)
- [x] Composite score + GUVENLI / DIKKATLI_OL / GIRME / MIXED_SIGNAL / INSUFFICIENT_DATA karar etiketleri
- [x] Confidence katmanı (HIGH / MEDIUM / LOW / INSUFFICIENT_DATA)
- [x] Keepa entegrasyonu + günlük token bütçesi + kuyruk sistemi
- [x] Keepa token kullanım widget'ı (Site Settings → API sekmesi)
- [x] `outreach_priority` alanı (1-10 öncelik skoru)
- [x] `persuasion_points` alanı (kural tabanlı satış argümanları)
- [x] `brand_context` + `enrichment` schema genişletmesi
- [x] Price outlier filtresi — Tukey IQR yöntemi
- [x] ASIN bazlı SKU dedup
- [x] Fiyatsız ürünler için price_war confidence düzeltmesi
- [x] `POST /jobs/:jobId/rescore` endpoint'i (ürün/marka/satıcı hariç tutarak yeniden puanlama)
- [x] Standalone scoring engine paketi (`standalone/amazon-scoring-engine/`)
- [x] Admin panel: market risk kart ekranı
- [x] Admin panel: eski dashboard kaldırıldı → /admin/market'e yönlendirme
- [x] Admin panel: Keepa usage widget
- [x] Backend + Standalone dual-module senkronizasyonu

---

## Bölüm 1 — Admin Panel: UX / Sidebar Sadeleştirme ✅

> Müşteri notu: "Menüler kalabalık, sanayi çalışanı için basit olmalı."  
> **Öncelik: Yüksek · Süre: 1 gün**

- [x] Sistem & Ayarlar grubunu sidebar'dan kaldır → sağ üst ⚙️ dropdown'a taşı (`AdminSettingsDropdown`)
- [x] Genel/Yönetim grubunu (users, user-roles, profile) sidebar'dan kaldır → aynı dropdown
- [x] Test Merkezi, Yazılımcı Notları, Dokümantasyon → `developerOnly: true` (sadece developer/super_admin görür)
- [x] Storage, DB, External DB, Audit → `developerOnly: true`
- [x] Sidebar'ı iş akışı sırasına göre yeniden düzenle (bkz. Bölüm 2)
- [x] "Market Pulse" menü etiketi → "Ana Ekran" (`FALLBACK_TITLES.market_pulse`)

---

## Bölüm 2 — Admin Panel: Menü / Navigasyon Yeniden Düzeni ✅

> **Hedef sidebar sırası (iş akışına göre):**

- [x] Ana Ekran
- [x] İdeal Müşteri Profilleri (ICP)
- [x] Lead Tarama ← (Fuar + B2B + Amazon birleşik)
- [x] Potansiyel Müşteriler (Lead Adayları)
- [x] Müşteri Adayı Takibi (Pipeline)
- [x] Hedef Firmalar
- [x] Sinyaller
- [x] Raporlar

---

## Bölüm 3 — Admin Panel: ICP Guided Form Yeniden Tasarımı ✅

> Müşteri notu: "Yazmak yerine seçim yaptıralım. Ne kadar detay o kadar doğru lead."  
> **Öncelik: Yüksek · Süre: 2-3 gün**

- [x] Sektör dropdown (çoklu seçim, `TagPicker` + 15 standart seçenek)
- [x] Alt sektör — seçilen sektöre bağlı dinamik öneri listesi (`SUB_SECTOR_MAP`)
- [x] Firma tipi seçimi (Distribütör / İthalatçı / Toptancı / Üretici / Perakende / E-ticaret)
- [x] Hedef bölge / ülke seçimi (17 ülke badge picker + özel giriş)
- [x] Firma büyüklüğü aralığı (1-10 / 11-50 / 51-200 / 201-500 / 500+ preset)
- [x] Lead kanalı seçimi: **B2B / Fuar / Amazon** — görsel kart seçimi, çoklu
- [x] Serbest açıklama textarea (opsiyonel, en sona)
- [x] Gelişmiş toggle — satış tipleri, kanallar, fiyat segmenti, hariç alanlar
- [x] ICP listesinde kanal etiketi (B2B=mavi, Fuar=mor, Amazon=turuncu rozet)
- [x] `IcpDefinition` interface'e `lead_channels` ve `description` eklendi

---

## Bölüm 4 — Admin Panel: Lead Tarama Birleşik Ekran ✅

> Müşteri notu: "Fuar, B2B, Amazon'u birleştirsek nasıl olur?"  
> **Öncelik: Orta · Süre: 2 gün**

- [x] Tek "Lead Tarama" giriş ekranı — `/admin/market/lead-machine/scan`
- [x] 1. adım: Kaynak seçimi (Fuar / B2B / Amazon) — büyük kart seçimi UI
- [x] 2. adım: Kaynağa göre dinamik form alanları
- [x] 3. adım: ICP profilleri kart seçimi, ICP seçilince search query otomatik dolar
- [x] ICP seçilince tarama parametreleri otomatik dolsun
- [x] Backend ayrı kaldı — sadece UI birleşti
- [x] Eski ayrı tarama sayfaları sidebar'da `developerOnly: true` ile gizlendi

---

## Bölüm 5 — Admin Panel: B2B Lead Tarama — Tam Senaryo

> Kaynak: Müşteri B2B kullanım senaryosu + Lead Machine Raporu  
> **Öncelik: Yüksek · Süre: 4-5 gün**

### 5a. Veri Toplama
- [ ] Firma web sitesi scraping — ürün kategorileri, hakkımızda, iletişim
- [ ] Google Maps / Europages / Kompass firma listesi scraping
- [x] Pain point tespiti: "Çin'e bağımlı mı?", "MOQ sorunu var mı?", "Private label yapıyor mu?" — `website.analyzer.ts` AI JSON prompt ile yapılandırıldı
- [x] AI match score — ICP eşleşme skoru kartlarda badge olarak gösterildi
- [ ] Çalışan sayısı tahmini (LinkedIn ipuçları veya site üzerinden)

### 5b. Enrichment (2. faz)
- [x] Apollo.io API entegrasyonu — email + karar verici adı çekme (enrichment.service.ts)
- [ ] LinkedIn scraper veya Apollo fallback
- [x] Enrichment toplu istek — `enrichBatch` endpoint + "Toplu Zenginleştir" UI butonu

### 5c. Lead Listesi Gösterimi
- [x] Her firma için kart: ICP match score / match reasons / sells_china / private_label / pain_points görsel rozet
- [x] Kaynak etiketi (Fuar / B2B / Amazon) her adayda görünsün
- [x] "Zenginleştir" butonu — tekli (mevcut) ve toplu (eklendi)

### 5d. Kullanıcı Değerlendirmesi
- [x] Onayla / Reddet / Favorile aksiyonları
- [x] Reddetme sebebi zorunlu tag seçimi: "Kendi üretimi var", "Çok küçük", "Yanlış sektör", "Zaten müşterimiz", "Fiyat uyumsuz"
- [x] Reddetme sebepleri DB'ye `reject_tags` JSON olarak kayıt + `reject_reason` text fallback
- [x] Onaylanan aday → pipeline'a otomatik geçiş

---

## Bölüm 6 — Admin Panel: Lead Adayları İyileştirme ✅

- [x] Kaynak filtresi (channel select) zaten mevcut; kanal etiketleri renk kodlandı (Amazon=gold, B2B=blue, Fuar=purple, ICP=green)
- [x] ICP profili etiketi — `icp_id` → ICP adı badge olarak her kartta gösteriliyor (`useListIcpProfilesQuery`)
- [x] "Bu profil tipini bir daha getirme" kural arayüzü — reject dialog'da checkbox + `lead_scan_rules` DB tablosu + backend endpoint (`POST /rules`, `DELETE /rules/:id`) + panel alt kısmında kural listesi
- [x] Toplu aksiyon: seçili adayları toplu onayla (mevcut) + toplu reddet — "Toplu Reddet" butonu + inline tag picker eklendi

---

## Bölüm 7 — Admin Panel: Feedback Öğrenme Sistemi ✅

> "Sistem gün geçtikçe öğrenecek."  
> **Öncelik: Orta · Süre: 3-4 gün**

- [x] Red sebepleri DB şeması — `lead_candidates.reject_tags` JSON + `lead_rejection_patterns` tablosu + `getRejectionStats()` (JSON_TABLE aggregation)
- [x] Aynı ICP + aynı red sebebi → sonraki taramalarda düşük skor — `b2b.job.ts`'de `getRulesForJob()` kontrolü; her kural lead_score'u -1 penaltı, skor <3 ise aday filtreleniyor
- [x] "Bu profil tipini bir daha getirme" kuralı UI'dan tanımlanabilsin — Bölüm 6'da yapıldı ✅
- [x] Red pattern raporu: en çok tekrar eden sebepler — `FeedbackLearningPanel` bar chart, kanal bazlı dağılım
- [x] Onaylanan / dönüşen adayların ortak özellikleri — `getApprovedStats()` ile kanal/ülke/pain_point istatistikleri
- [ ] ICP öğrenme döngüsü — Atlandı (aylarca veri gerekiyor, Faz 2'ye ertelendi)

---

## Bölüm 8 — Admin Panel: Outreach Kişiselleştirme ✅

> "Standart mail işe yaramıyor. Firmaya özel olmalı."

- [x] Firma detay sayfasında özelleştirilmiş outreach taslağı — her draft kartında `CandidateContext` bileşeni
- [x] Prompt bağlamı genişletildi: pain_points + sells_china + private_label + enrichment karar verici + match reasons
- [x] Taslak oluşturulurken "firma hakkında öğrenilenler" görünür — firma bağlamı editörün üstünde
- [x] Konu başlığı ve gövde ayrı düzenlenebilsin — ayrı Input + Textarea (mevcut + korundu)
- [x] Mail gönderimi sonrası takip — "Yanıt Aldı" / "Yanıt Yok" butonları + `reply_status` DB kolonu + filtre sekmeleri

---

## Bölüm 9 — Admin Panel: Lead Pipeline

- [x] Kanban veya liste görünümü: İletişim Kurulmadı → Yazıştık → Görüşme → Teklif → Müşteri / Kayıp
- [x] Müşteri olarak işaretlenince "dönüşüm" kaydı
- [x] Dönüşen müşterilerin ICP eşleşme oranı istatistiği (öğrenme girdisi)

---

## Bölüm 10 — Admin Panel: Amazon Scoring Geliştirmeleri

> Rakip analizden (SatisAnaliz, ApexScouty, Helium 10, Agellic) çıkarılan eksikler

### 10a. Kar Simülasyonu ✅
> **Öncelik: Yüksek — rakiplerden temel ayrışma noktası**

- [x] Alış fiyatı girişi
- [x] Amazon referral fee (kategori bazlı % — 10 kategori preset)
- [x] FBA fee (paket boyutuna göre — 4 boyut preset)
- [x] Kargo maliyeti
- [x] Gümrük / vergi
- [x] Diğer maliyet
- [x] Çıktı: Net kar · ROI · Margin · Break-even fiyat
- [x] Risk kartının altında "Ticari Uygunluk" kartı olarak gösterildi (`ProfitCalculator` — `amazon-lead-search-panel.tsx`)

### 10b. Ürün Kanıt Tablosu (Evidence Table) ✅
- [x] Tarama sonucu tüm ürünler: ASIN · başlık · fiyat · rating · review · seller · product URL
- [x] Filtreler: fiyat aralığı · review aralığı · rating · seller varlığı
- [x] Sıralama: her kolona göre (tüm kolonlar tıklanabilir)
- [x] Satır seçimi ile rescore ("bu ürünleri hariç tut, yeniden puanla") — `rescoreAmazonJob` mutation ile
- [x] Keepa durumu kolonü (snapshot var / yok) — LEFT JOIN ile `has_keepa` flag
- [x] `EvidenceTable` bileşeni oluşturuldu + `amazon-lead-search-panel.tsx`'e `latestDoneJobId` ile gömüldü

### 10c. Export ✅
- [x] CSV export — ürün kanıt tablosu (UTF-8 BOM dahil, Excel uyumlu)
- [x] PDF rapor — `window.print()` ile yazdır / PDF kaydet
- [x] JSON export — programatik kullanım için

### 10d. Saved Searches / Watchlist
- [x] Aramayı kaydet (keyword + marketplace + filtreler)
- [x] Kayıtlı aramaları listele
- [x] "Yenile" — aynı parametrelerle tekrar tara
- [x] Watchlist: takip edilecek keyword'leri periyodik tara (haftalık) — watchlist_enabled flag, UI toggle mevcut

### 10e. Çoklu Keyword Analizi
- [x] 5-10 keyword aynı anda gir
- [x] Hepsini composite score'a göre sırala
- [x] "Hangi kategoriye girmeli?" karşılaştırma tablosu

### 10f. Hedef Firmalar Modülü Açıklaması
- [x] Modül açıklaması: "Rakip ve potansiyel müşterilerin periyodik izleme tahtası"
- [x] Boş durum ekranına "nasıl kullanılır" metni + örnek senaryo

---

## Bölüm 11 — Frontend: Public SaaS Uygulaması

> Kaynak: Genişleme Planı (GENISLEME_PLANI.md)  
> **`frontend/` klasörü kopyalandı (TarMinGO tabanlı). Önce Faz 0 temizlik, sonra Market Pulse uyarlaması.**  
> **Stack: Next.js 16, React 19, Tailwind v4, Shadcn/UI, RTK Query**

---

### Faz 0 — Frontend Temizlik (Öncelik: KRİTİK · ~1 gün)

> Marka bağımsızlığı + hard-kod sıfırlama. Kod çalıştırılmadan önce yapılmalı.

#### 11-0a. Dosya / Modül Yeniden Adlandırma ✅
- [x] `src/lib/fonts/tarmingo-fonts.ts` → `src/lib/fonts/app-fonts.ts`
- [x] `tarmingoFontVariableClassName` → `appFontVariableClassName`
- [x] `src/app/layout.tsx` import güncellemesi

#### 11-0b. Hard-Kod Temizleme ✅
- [x] `src/app/globals.css` — TarMinGO yorum satırları kaldırıldı, CSS class'lar yeniden adlandırıldı
- [x] `src/config/site-defaults.json` — MarketPulse içeriğiyle sıfırlandı
- [x] `.env.example` — MarketPulse'a göre güncellendi
- [x] `ecosystem.config.cjs` — `mp-frontend` olarak güncellendi

#### 11-0c. TarMinGO-Özel Sayfaları Sil ✅
- [x] `karne/`, `explore/`, `editorial-policy/`, `me/consultant/`, `me/readings/`, `me/credits/`, `checkout/` silindi

#### 11-0d. TarMinGO-Özel Bileşenleri Sil ✅
- [x] containers: `numerology/`, `tarot/`, `coffee/`, `dreams/`, `consultant/`, `become-consultant/`, `booking-payment/`, `chat/`, `consultant-dashboard/` silindi
- [x] `lib/zodiac/` silindi
- [x] `common/BookingMessageButton.tsx`, `ConsultantFunnelCTA.tsx`, `ChatWarningBanner.tsx`, `funnel.config.ts`, `ShareCard.tsx` silindi
- [x] RTK endpoint'leri temizlendi (horoscopes, tarot, coffee, dreams, consultant, booking, credits vb.)
- [x] `types/common.ts` — ZodiacSign, horoscope tipleri kaldırıldı
- [x] `integrations/rtk/tags.ts` — TarMinGO cache tag'leri kaldırıldı
- [x] `MegaMenuPanel.tsx` → consultant bağımlılığı kaldırıldı, sadece link listesi
- [x] `HeaderClient.tsx` → consultant_self endpoint bağımlılığı kaldırıldı

#### 11-0e. Config JSON Dosyaları Sıfırla ✅
- [x] `numeroloji-*.json`, `explore-page.json`, `editorial-policy.json`, `home-expertise-*.json` silindi
- [x] `home-hero.json`, `home-features.json`, `home-intro-process.json` → MarketPulse içeriğiyle sıfırlandı
- [x] `home-layout-components.ts` → TarMinGO'ya özel kayıtlar kaldırıldı
- [x] `sitemap.ts` → MarketPulse route'larına güncellendi
- [x] `i18n/routing.ts` → TarMinGO path'leri kaldırıldı
- [x] `pricing/PricingPageClient.tsx` → MarketPulse planlarıyla sıfırlandı (Free/Starter/Pro/Ajans)
- [x] `blog/[slug]/page.tsx` → TarMinGO içerik referansları kaldırıldı
- [x] `dashboard/page.tsx` → MarketPulse stub'ına dönüştürüldü
- [x] `HomeCTABanner.tsx` → MarketPulse CTA içeriğiyle güncellendi

#### 11-0f. Saklananlar (dokunulmaz)
> Bu yapılar yeniden kullanılacak, temizleme kapsamı dışında.
- `src/lib/tokens/` — CSS token sistemi (--gm-* altyapısı) → korunur
- `src/lib/site-config.ts` — env-first marka çözümleme → korunur
- `src/app/[locale]/login/`, `register/`, `forgot-password/`, `verify-email/` → korunur
- `src/app/[locale]/kvkk/`, `gizlilik/`, `kullanim-sartlari/`, `cerez-politikasi/` → korunur
- `src/app/[locale]/blog/` → korunur (SEO değeri var)
- `src/app/[locale]/faqs/` → korunur
- `src/app/[locale]/contact/` → korunur
- `src/app/[locale]/pricing/` → korunur (MarketPulse planlarıyla güncellendi)
- `src/app/[locale]/dashboard/` → stub (Faz 1'de geliştirilecek)

---

### Faz 1 — MVP (Öncelik: Yüksek · ~2 hafta)

#### 11a. Proje Kurulumu
- [x] `frontend/` Next.js projesi kopyalandı (TarMinGO tabanlı)
- [x] Tailwind v4, Shadcn/UI, Redux Toolkit, RTK Query mevcut
- [x] **Faz 0 temizlik tamamlandı** — TypeScript hata yok
- [x] `bun run dev` ile çalışır duruma getir (backend bağlantısı) — `bun run build` başarılı; `--webpack` bayrağı kaldırıldı, `@site/shared-ui` bağımlılığı giderildi
- [x] Admin panel risk-score-card bileşeni port edilsin → `src/components/amazon/public-risk-card.tsx` (SVG radar, accordion dimensions, compact mod)

#### 11b. Backend — Public Route Grubu
- [x] Auth route'ları `mevcut /api/v1/auth/` altında kullanıcıyla paylaşımlı (signup, token, refresh, me)
- [x] `POST /api/v1/amazon/scan` (kullanıcı bazlı sorgu limiti kontrolü)
- [x] `GET  /api/v1/amazon/scan/:jobId`
- [x] `GET  /api/v1/amazon/risk-scores/:keyword` (public, auth gerekmez)
- [x] `GET  /api/v1/amazon/quota`
- [x] `GET  /api/v1/amazon/history`
- [x] `user_plans` + `user_scan_usage` tabloları — `022_public_saas_schema.sql`
- [x] `quota.repository.ts` — plan limitleri (free=5/gün, starter=30/gün, pro/agency=sınırsız)

#### 11c. Landing Page
- [x] Tek mesaj: "Amazon kategorisine girmeden önce riski gör" (`HeroNew` — heroTitleLine1/Gradient)
- [x] 3 adım: Keyword yaz → Analiz et → Karar al (`HomeIntroSection` + `home-intro-process.json`)
- [x] Rakip karşılaştırması (`CompetitorComparisonSection` — MarketPulse vs Helium10 vs SatisAnaliz tablo)
- [x] Free plan CTA butonu (`HomeCTABanner` — /register linki)
- [x] Güven unsurları (`PromisesSection` — Keepa verisi, sadelik, KVKK gizlilik)

#### 11d. Kayıt / Giriş
- [x] Email + şifre kayıt formu (`Register.tsx` — `useSignupMutation`)
- [x] Giriş formu (`Login.tsx` — `useLoginMutation`, dashboard yönlendirmesi)
- [x] JWT token yönetimi (`tokenStore`, `auth.store.ts`)
- [ ] Google OAuth (Faz 2'ye bırak)

#### 11e. Dashboard — Ana Ekran
- [x] Keyword input + marketplace seçimi (8 pazar: US, DE, UK, FR, IT, ES, NL, PL)
- [ ] Filtreler: review min/max, rating, fiyat aralığı (Faz 2)
- [x] "Analiz Et" butonu — background job başlat
- [x] Job polling / status göstergesi (`JobPoller` — 3s RTK polling)
- [x] Son aramalar listesi (`HistoryItem` — karar renk etiketi)

#### 11f. Sonuç Ekranı — Risk Kartı
- [x] Büyük karar etiketi: GÜVENLİ / DİKKATLİ OL / GİRME
- [x] Composite skor + confidence badge
- [x] 5 boyut (SVG radar grafik + accordion row + reason listesi)
- [x] Data points göstergesi
- [ ] Keepa trend mini grafik (Faz 2 — public API veri taşımıyor)

#### 11g. Geçmiş Aramalar
- [x] Kullanıcının önceki analizleri listesi (son 50, karar rengi)
- [ ] Sonucu kaydet / sil (Faz 2)
- [ ] "Yenile" — aynı keyword yeniden tara (Faz 2)

---

### Faz 2 — Ticari Araçlar (~1.5 hafta)

- [x] Kar simülatörü (frontend arayüzü — bkz. Bölüm 10a)
- [x] Risk kartı + kar kartı yan yana gösterim
- [x] CSV export (sonuç tablosu)
- [x] PDF rapor indirme (keyword başına)

---

### Faz 3 — Tablo ve Toplu Analiz (~2 hafta)

- [x] Ürün kanıt tablosu (frontend — filtreli, sıralı)
- [x] Çoklu keyword analizi (5-10 aynı anda)
- [x] Saved searches / watchlist (frontend — localStorage tabanlı)
- [x] Keepa token budget UI — kullanıcının kendi BYOK key varsa göster
- [x] BYOK: kullanıcı kendi Keepa API key'ini girebilsin (AES-256-GCM ile şifreli sakla)

---

### Faz 4 — Gelişmiş Özellikler (~3 hafta)

- [ ] Rakip satıcı analizi — top satıcılar, mağaza profili
- [ ] Fiyat trendi kartı — Keepa 30/90/365 gün grafik
- [ ] Buy Box volatility göstergesi
- [ ] Doğal dil arama — "30 dolar altı, düşük rekabetli" → filtrelere çevir (Agellic benzeri)
- [ ] Multi-marketplace karşılaştırma — aynı keyword US vs DE yan yana
- [ ] Product card UI — ASIN · BSR · price range · seller count · decision (Agellic benzeri)

---

### Faz 5 — SaaS Platformlaşma (~2 hafta)

- [ ] Plan sistemi: Free / Starter (299 TL) / Pro (599 TL) / Ajans (1.499 TL)
- [ ] Sorgu limiti enforcement (Free: 5/gün, Starter: 30/gün, Pro: sınırsız)
- [ ] Billing entegrasyonu — Iyzipay (TL) + Stripe (USD)
- [ ] Kullanıcı yönetimi — admin panelden kullanıcı görme / plan değiştirme
- [ ] Email bildirimleri — analiz tamamlandı, limit doldu, plan sona eriyor
- [ ] KVKK sayfası + güvenli ödeme rozetleri
- [ ] WhatsApp / destek butonu
- [ ] Plan yükseltme CTA'ları (limit dolunca)

---

## Bölüm 12 — Backend: Genel İyileştirmeler

- [ ] Amazon SP-API araştırması (Oxylabs TOS-safe alternatifi veya tamamlayıcı)
- [ ] İthalat kaydı entegrasyonu — ImportYeti / Panjiva (B2B için)
- [ ] 10times API entegrasyonu — fuar intent sinyali (Fuar Lead için)
- [ ] Standalone repo müşteri teslimi — private GitHub repo + README

---

## Öncelik Sırası (Özet)

| Öncelik | Bölüm | Tahmini Süre |
|---------|-------|-------------|
| 1 | ~~Bölüm 11 Faz 0: Frontend temizlik~~ ✅ | 1 gün |
| 2 | ~~Bölüm 1-2: Sidebar/menü sadeleştirme~~ ✅ | 1 gün |
| 3 | ~~Bölüm 3: ICP guided form~~ ✅ | 2-3 gün |
| 4 | Bölüm 11 Faz 1: Frontend MVP | ~2 hafta |
| 5 | ~~Bölüm 5: B2B tam senaryo~~ ✅ (5a pain points, 5b batch enrich, 5c sinyaller, 5d tag reject) | — |
| 6 | ~~Bölüm 10a: Kar simülasyonu~~ ✅ | — |
| 7 | ~~Bölüm 4: Lead Tarama birleşik ekran~~ ✅ | — |
| 8 | Bölüm 10b-10c: Evidence table + export | 2-3 gün |
| 9 | Bölüm 7: Feedback öğrenme | 3-4 gün |
| 10 | Bölüm 11 Faz 2-3: Ticari araçlar + tablo | ~3.5 hafta |
| 11 | Bölüm 11 Faz 5: Billing + SaaS | ~2 hafta |

---

## Notlar

- Frontend `admin_panel/`'dan tamamen bağımsız `frontend/` klasöründe başlar.
- Backend'e yeni `/api/v1/public/` route grubu eklenir, mevcut admin route'ları dokunulmaz.
- Kar simülatörü hem admin panelde hem frontend'de kullanılır — ortak component olarak yazılır.
- Feedback öğrenme sistemi şimdilik kural tabanlı (basit); ML ikinci faz.
- Yeni talepler bu dosyanın alt bölümlerine eklenir, tamamlananlar ✅ olarak işaretlenir.
