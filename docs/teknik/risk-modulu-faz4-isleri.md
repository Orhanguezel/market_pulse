# Risk Modülü — Faz 4 İşleri (Özet + Phase 5 Roadmap)

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint A5 — aktarım sonrası referans)
> **Hedef okuyucu:** ⚙️ Codex (Phase 5'e geçerken) + 🧠 Claude (gelecek dönem planlama)
> **Bağlı çeklist:** [AMOZON_AKTARIM_CEKLISTI.md](AMOZON_AKTARIM_CEKLISTI.md) Sprint A5
> **Kaynak (büyük orijinal):** [../../../amozon/YARINKI_ISLER_PHASE4.md](../../../amozon/YARINKI_ISLER_PHASE4.md) — 633 satır

---

## Bu belge nedir

amozon'daki Phase 4 stabilizasyon işlerinin **özet snapshot'ı** (2026-05-18 itibariyle). market_pulse'a aktarım sırasında bu belge **referans olarak** taşındı — Phase 4'ün tüm detayı amozon repo'sunda kalır.

**Önemli:** Bu özet **tarihsel bilgi**, aktif iş listesi değil. Risk modülünün aktif iş listesi [AMOZON_AKTARIM_CEKLISTI.md](AMOZON_AKTARIM_CEKLISTI.md)'dir.

---

## Phase 4 — V1 Stabilizasyon (2026-05-18 itibariyle TAMAMLANDI)

amozon Bionluk teslimini güçlendirmek için 5 ana eksen ve 2 destek katman çalışıldı:

### Tamamlanan eksenler

| Eksen | Kısaca ne yapıldı | Risk modülüne etkisi |
|---|---|---|
| **J1 — Single Journey** | `/scan` tek-ekran UX, 6 aşama progress bar | [risk-modulu-musteri-taahhutleri.md §4](risk-modulu-musteri-taahhutleri.md) — KORUNMALI |
| **CH — Confidence Honesty** | LLM "tahmini/sınırlı veri" prompt zorunluluğu + coverage gate downgrade | KORUNMALI |
| **TM — Thesis Memory** | AL kararları "tez" izleme; `/theses` sayfası; "zayıfladı/bozuldu" uyarısı | KORUNMALI |
| **UX2 — Auto Enrichment** | Scan "done" deyince Keepa + seller paralel hazırlanır (Promise.all) | KORUNMALI |
| **UX4 — Reliability** | Cron scheduler iyileştirmesi, scan retry, hata loglama | KORUNMALI |

### Test paketi
- 165 test, 27 dosya, 0 hata
- Backend 94/94 + admin 5/5 yeşil
- VPS thesis schema doğrulandı

### Phase 4.6 + 4.7 (Son güncellemeler — 2026-05-18)

Hardening eklemeleri:
- **OH.7 Scan Cache TTL** — Aynı keyword+marketplace için `SCAN_CACHE_TTL_MIN` (env, default 360 dk) içinde tekrar tarama yapmaz. `force:true` ile bypass. UI'da "Mevcut sonucu aç / Yine de yeniden tara" modalı.
- **OH.8 Kota/Maliyet Görünürlüğü** — `GET /api/quota` Keepa+Oxylabs kalan/kullanılan + scan başı ortalama istek. UI'da scan formu üstünde kota kartı.

Bunlar Risk modülünde **mevcut olmalı** — aktarımda yaşıyor olmalı.

---

## Phase 5 — Threat Intelligence (Ertelendi, Risk modülünün gelecek fazı)

Bionluk teslimi tamamlandıktan sonra **kullanıcı talimatıyla** başlanacak. amozon'da başlanmadı; market_pulse'ta da Risk modülü Phase 5 olarak ileride açılır.

### Ana hedefler

| # | İş | Tahmini efor | Sahip |
|---|---|---|---|
| P5.1 | Seller coverage %70+ hedef — daha fazla satıcı verisi toplama | 1 hafta | ⚙️ Codex backend + 🧠 Claude scoring entegrasyonu |
| P5.2 | Category segmentation — price tier + brand cluster ayrımı | 1 hafta | 🧠 Claude (mimari) + ⚙️ Codex (implement) |
| P5.3 | BuyBox dominance analizi — hangi seller market'ı domine ediyor | 3-5 gün | ⚙️ Codex |
| P5.4 | Stratejik ticari reasoning — LLM `strategy_recommendations` üretsin | 1 hafta | 🧠 Claude (prompt) + ⚙️ Codex (kod) |
| P5.5 | Threat alerts — yeni rakip girince, fiyat düşüşünde, BuyBox kaybında bildirim | 1 hafta | ⚙️ Codex (notif sistemi market_pulse'ta zaten var) |

### Tetikleyici
Risk modülü ikinci ödeyen müşteri geldiğinde veya Bionluk müşterisi ek faz isterse. Tahmini: 2026 Q4 veya 2027 Q1.

### Bağımlılıklar
- Multi-tenant DB şeması (master plan Ay 1 hedef) — Phase 5 ödeyen-başına ayar gerektirir
- BYOK Keepa Faz 2 ([byok-keepa-politikasi.md](byok-keepa-politikasi.md)) — coverage %70+ daha fazla token harcayacak

---

## Açık Notlar (amozon'dan taşınan teknik borç)

amozon'da kapatılmamış ama Bionluk teslimi engelleyici olmayan küçük işler:

- [ ] **Risk Pro tier'ı UI taraması** — Free/Starter/Pro fark gösterimi (master plan fiyatlandırma Bölüm 7 ile birlikte)
- [ ] **Confidence renk kodlaması iyileştirme** — INSUFFICIENT_DATA için ayırt edici sembol (sadece gri/sarı yetersiz)
- [ ] **Thesis breach notification** — tez "bozuldu" deyince mail/WhatsApp bildirim (Outreach modülü ile birlikte)
- [ ] **MIXED_SIGNAL açıklama tooltip** — kullanıcı flag'in nedenini anlasın
- [ ] **Multi-marketplace karşılaştırma** — aynı keyword DE+UK+US karşılaştırma view

Bu listeyi Phase 5 işine eklemek mantıklı.

---

## Risk Modülü Mevcut Faz Haritası (master plan'a entegre)

[MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md) "Risk modülü Suite içinde kategori karar modülü" olarak konumlandı.

| Master plan Ay | Risk modülü işi |
|---|---|
| Ay 1 (Mayıs 2026) | Sprint A0-A2: amozon → market_pulse aktarım |
| Ay 2 (Haziran) | Sprint A3-A5: admin sayfaları + amozon dondurma |
| Ay 3 (Temmuz) | Risk modülü public SaaS'a entegre; Free/Starter/Pro tier enforcement |
| Ay 4 (Ağustos) | BYOK Keepa Faz 2 ile multi-tenant |
| Ay 5-6 (Eyl-Eki) | **Phase 5** Threat Intelligence başlangıç (eğer ikinci Risk müşterisi gelirse) |

---

## Bağlantılar

- 📋 Aktarım çeklisti: [AMOZON_AKTARIM_CEKLISTI.md](AMOZON_AKTARIM_CEKLISTI.md)
- 📜 Bionluk taahhüt manifestosu: [risk-modulu-musteri-taahhutleri.md](risk-modulu-musteri-taahhutleri.md)
- 🔑 BYOK Keepa kararı: [byok-keepa-politikasi.md](byok-keepa-politikasi.md)
- 📊 Skorlama mantığı: [SCORING_LOGIC.md](SCORING_LOGIC.md)
- 📝 amozon orijinal Phase 4 dokümanı (633 satır): [../../../amozon/YARINKI_ISLER_PHASE4.md](../../../amozon/YARINKI_ISLER_PHASE4.md)
- 🏗️ Master plan Risk modülü konumu: [../strateji/MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md) Bölüm 3 (Risk modülü)
