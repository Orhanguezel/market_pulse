# Market Pulse — Proje Durum Panosu

> **Son güncelleme:** 2026-05-21
> **Bu pano:** 3 paralel çeklisten **tek bakışta** ne kadar tamamlandığını gösterir.
> **Yenileme:** Önemli durum değişikliklerinde elle güncellenir.

---

## Genel İlerleme

| Çeklist | Tamam | Toplam | % | Sonraki kritik adım |
|---|---|---|---|---|
| 🎯 **Automechanika 2026** | 52 | 62 | **%84** | Codex Sprint 3 mail kuyruğu + Avrasya görüşmesi |
| 🔄 **Amozon → Risk Aktarım** | 3 | 49 | **%6** | Aktarım kapsamı onayı bekliyor (kullanıcı kararı) |
| 🎨 **Tema Migrasyonu** | 9 | 55 | **%16** | Risk aktarımı sonrası başlar |

**Doküman sayısı:** 112 markdown (docs/) + 3 kök çeklist + 1 README

---

## 🎯 Automechanika 2026 — %84 (yakında tamamlanır)

### Tamam ✅ (Sprint bazlı)

| Sprint | Durum | Açıklama |
|---|---|---|
| Sprint 0 — Keşif & Kalibrasyon | ✅ Tam | Engelleyiciler çözüldü, PoC çalıştı, ICP v1/v2 seed edildi |
| Sprint 1 — Tam Tarama | ✅ Codex bitirdi | 429 exhibitor + ICP filtre + onay paneli + 22 test |
| Sprint 2 — Komşu Stand | ✅ Tam | Top 25 raporu + neighbor.ts (10times **drop**) |
| Sprint 3 — Enrichment + Outreach | 🟡 Plan bitti | Codex Hunter adapter + draft.service kaldı |
| Sprint 4 — Randevu Hazırlık | ✅ Tam | Hatırlatma template + Calendly rehber + PDF spec; Codex tarafı bitti |
| Sprint 5 — Fuar Operasyon | 🟡 Çoğu hazır | SOP + eğitim gündemi + walk-in form hazır; fuar haftası manuel iş |
| Sprint 6 — Post-show | 🟡 Şablonlar hazır | KPI rapor şablonu + sonraki fuarlar belgesi; post-show'da doldurulur |

### Kalan iş (sırayla)

**Bağımsız ilerletilebilir (Claude — şu an blokeli değil):**
- *(Hiçbiri kalmadı — tüm bağımsız işler tamam)*

**Codex'in çıktısını bekleyenler:**
- 🧠 Claude — İlk 10 mail taslağı QA (Codex draft.service.ts ürettiğinde)

**Avrasya görüşmesini bekleyenler:**
- 🧠 Claude — Export sorumlusu kimliği netleştirme (K-3 cevabı)
- 🧠 Claude — ICP v3 (görüşme + ilk 100 aday review sonrası)
- 🧠 Claude + Avrasya — Calendly hesabı kurulumu
- 🧠 Claude + Avrasya — Günde 50-100 aday review
- 🧠 Claude — Apollo hesabı (DROP — gerek yok artık)
- Orhan — 10times API key (DROP)

**Fuar haftası (8-12 Eylül 2026):**
- 🧠 Claude + Avrasya — Stand çalışan eğitimi (T-3 günü)
- 🧠 Claude + Avrasya — Günlük 18:00 review
- 🧠 Claude + Avrasya — Walk-in form basımı + zımba operasyonu

**Post-show (13-30 Eylül 2026):**
- 🧠 Claude — KPI raporu (şablon hazır, doldurulacak)
- 🧠 Claude — ICP v3 (red pattern güncellemesi)
- 🧠 Claude — Sonraki fuar kararı (şablon hazır)

---

## 🔄 Amozon → Risk Aktarım — %6 (kullanıcı onayı bekliyor)

### Tamam ✅

| Sprint | Durum |
|---|---|
| A0 — Hazırlık | 🟡 Claude tarafı tamam: BYOK Keepa politikası + Bionluk müşteri taahhüt manifestosu + Phase 4 referans + Risk IA kararı |
| A1-A4 — Aktarım | ❌ Codex henüz başlamadı |
| A5 — amozon dondurma | 🟡 Kısmen: amozon-pilot-konusmalari.md taşındı |

### Kalan iş

**Önce kullanıcı kararı gerekli:**
- Aktarım kapsamı onayı: Manifest 26+5 backend + 11+12 admin component net, kullanıcının "evet aktarımı başlat" demesi gerek

**Codex aktarım yapınca:**
- A1: 26 backend dosya + 5 scorer + 9 test taşıma
- A2: DB schema 021/022 seed
- A3: Admin sayfaları + onay paneli
- A4: Test + smoke regression (5 keyword baseline)
- A5: amozon repo dondurma (README üst notu, portfolio.json frozen)

**Ek Claude işleri (Codex sonrası):**
- amozon vs market_pulse Risk regresyon kontrol (5 keyword)
- Antigravity görsel QA

---

## 🎨 Tema Migrasyonu — %16 (Risk aktarımı sonrası başlar)

### Tamam ✅

| Sprint | Durum |
|---|---|
| T0 — Keşif | 🟡 Claude kararları tamam (palet onay, preset switcher, dark mode kararı) |
| T1 — Token transferi | ❌ Codex henüz |
| T2 — AdminShell IA | 🟡 Claude IA kararı + density tablosu tamam |
| T3 — Tipografi | ❌ Codex henüz |
| T4 — Tablo/kart stilleri | ❌ Codex henüz |
| T5 — Frontend hero | 🟡 Claude hero kopyaları tamam (TR/EN/DE) |
| T6 — Visual QA | ❌ Antigravity bekliyor |
| T7 — Cleanup + doc | 🟡 Tema sistem kuralları (PR review checklist) tamam |

### Kalan iş

Tema migrasyonu **Risk aktarımı sonrası** başlar — Codex bağımlılığı yüksek. Risk modülünün sayfaları taşınmadan tema değişikliği yapmak verimsiz.

---

## Önemli Bağımsız Belgeler (referans)

### Stratejik

- 🏗️ [docs/strateji/MARKET_PULSE_SAAS_PLANI.md](docs/strateji/MARKET_PULSE_SAAS_PLANI.md) — master plan
- 🎪 [docs/strateji/AUTOMECHANIKA_2026_PLANI.md](docs/strateji/AUTOMECHANIKA_2026_PLANI.md) — fuar stratejisi
- 🔮 [docs/strateji/sonraki-fuarlar-karar-belgesi.md](docs/strateji/sonraki-fuarlar-karar-belgesi.md) — tekrarlanabilir paket

### Avrasya Müşteri Dosyaları

- 👤 [docs/musteri/avrasya-paspas-automechanika.md](docs/musteri/avrasya-paspas-automechanika.md) — müşteri ana dosyası
- 📞 [docs/musteri/AVRASYA_SORULAR.md](docs/musteri/AVRASYA_SORULAR.md) — 5 soru onay dosyası (PDF mevcut)
- 📊 [docs/musteri/avrasya-statikleri-konsolide.md](docs/musteri/avrasya-statikleri-konsolide.md) — promats.com.tr + ERP verisi

### Teknik Kararlar

- 🎯 [docs/teknik/icp-automechanika-final.md](docs/teknik/icp-automechanika-final.md) — ICP v1+v2 SQL
- 🌐 [docs/teknik/messefrankfurt-network-analizi.md](docs/teknik/messefrankfurt-network-analizi.md) — site keşif
- 🚫 [docs/teknik/10times-drop-karari.md](docs/teknik/10times-drop-karari.md) — 10times drop
- 🔑 [docs/teknik/byok-keepa-politikasi.md](docs/teknik/byok-keepa-politikasi.md) — multi-tenant key

### Sprint Çıktıları

- 📊 [docs/teknik/sprint-1-precision-raporu.md](docs/teknik/sprint-1-precision-raporu.md) — 429 firma analiz
- 🗺️ [docs/teknik/sprint-2-komsu-stand-top25.md](docs/teknik/sprint-2-komsu-stand-top25.md) — D11 komşu top 25
- ⚙️ [docs/teknik/SPRINT_3_SADE_PLAN.md](docs/teknik/SPRINT_3_SADE_PLAN.md) — enrichment sade plan
- 📝 [docs/teknik/sprint-3-personalization-ornek.md](docs/teknik/sprint-3-personalization-ornek.md) — 5 golden aday

### Mail/Operasyon Şablonları

- ✉️ [docs/musteri/automechanika-2026-outreach-templates.md](docs/musteri/automechanika-2026-outreach-templates.md) — outreach (3 dil)
- 🔔 [docs/musteri/automechanika-2026-randevu-hatirlatma-templates.md](docs/musteri/automechanika-2026-randevu-hatirlatma-templates.md) — T-14/T-7/T-1
- 🔄 [docs/musteri/automechanika-2026-followup-templates.md](docs/musteri/automechanika-2026-followup-templates.md) — T+3/T+10/T+30
- 📅 [docs/musteri/calendly-kurulum-rehberi.md](docs/musteri/calendly-kurulum-rehberi.md) — Calendly setup
- 🃏 [docs/teknik/stand-brifing-kart-sablon.md](docs/teknik/stand-brifing-kart-sablon.md) — brifing kart
- 🛠️ [docs/musteri/fuar-stand-operasyon-sop.md](docs/musteri/fuar-stand-operasyon-sop.md) — stand SOP
- 🎓 [docs/musteri/stand-ekibi-egitim-gundemi.md](docs/musteri/stand-ekibi-egitim-gundemi.md) — eğitim oturumu
- 📝 [docs/musteri/fuar-kartvizit-toplama-formu.md](docs/musteri/fuar-kartvizit-toplama-formu.md) — walk-in form
- 📊 [docs/musteri/automechanika-2026-kpi-rapor-sablonu.md](docs/musteri/automechanika-2026-kpi-rapor-sablonu.md) — KPI şablon

### Rakip / Intel

- ⚔️ [docs/teknik/rakip-intel-automechanika-2026.md](docs/teknik/rakip-intel-automechanika-2026.md) — Frogum, Apesan, ClimAir

---

## Onaylanmış Stratejik Kararlar (K-tablosu)

| # | Karar | Değer | Durum |
|---|---|---|---|
| K-1 | Pilot pazar | DE/POL/AT/NL/FR | ✅ Onaylı |
| K-2 | Mail gönderici | info@promats.com.tr | ✅ Onaylı, DMARC eksik (Avrasya BT) |
| K-3 | Onay paneli kullanıcısı | Avrasya export ekibi günlük 30 dk | ⏳ Görüşme bekliyor |
| K-4 | 4 aylık bütçe | **~$10 (revize)** | ✅ Onaylı (Hunter+Postmark free) |
| K-5 | Ürün kapsamı | Floor mat öncelik | ✅ Onaylı |
| K-6 | Stand kapasitesi | 30-35 randevu hedef | ✅ Onaylı |
| K-7 | Outreach Faz 1 öne çek | Manuel onay + tek tık gönder | ✅ Onaylı |
| K-8 | scraper strateji | DOM scraping (Messe API çalıştı) | ✅ Onaylı |

---

## Kritik Risk İzleme

| Risk | Sahibi | Son durum |
|---|---|---|
| Messe Frankfurt scraping bloku | Codex | ✅ Çözüldü (public API) |
| Apollo hit oranı düşük | Claude | ✅ Drop (Hunter free yeter) |
| Outreach spam'e düştü | Claude+Codex | ⏳ DMARC/DKIM Avrasya BT bekliyor |
| Avrasya onay paneli kullanılmıyor | Claude | ⏳ Görüşme sonrası ölçülür |
| ICP yanlış kalibre | Claude | ✅ v2'ye çıktı, gerçek datayla v3 post-show |
| 10times halüsinasyon | Claude | ✅ Çözüldü (drop kararı + ders çıkarımı) |

---

## Sonraki Yapılacak (öncelik sırası)

1. **Kullanıcı:** Aktarım kapsamı onayı (AMOZON_AKTARIM) — Codex'in başlama izni
2. **Kullanıcı:** Avrasya görüşmesi (AVRASYA_SORULAR.pdf gönderildi mi?)
3. **Codex:** Sprint 3 Hunter adapter + draft.service.ts
4. **Claude:** Codex draft kuyruğu ürettikten sonra ilk 10 mail QA
5. **Avrasya BT:** DMARC + DKIM DNS kayıtları

---

## Bağlantılar

- 📋 Kök çeklist (Automechanika): [AUTOMECHANIKA_2026_CEKLIST.md](AUTOMECHANIKA_2026_CEKLIST.md)
- 🔄 Amozon aktarım: [docs/teknik/AMOZON_AKTARIM_CEKLISTI.md](docs/teknik/AMOZON_AKTARIM_CEKLISTI.md)
- 🎨 Tema migrasyonu: [docs/teknik/TEMA_MIGRASYON_CEKLISTI.md](docs/teknik/TEMA_MIGRASYON_CEKLISTI.md)
- 📚 Fair detay çeklist: [docs/teknik/FAIR_MODULU_CEKLISTI.md](docs/teknik/FAIR_MODULU_CEKLISTI.md)
- 🏗️ README: [README.md](README.md)
