# Lead Onay Paneli — Avrasya Export Ekibi Kullanım Rehberi

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint 1 — Avrasya onboarding)
> **Hedef okuyucu:** Avrasya export sorumlusu (günde 30 dk panel kullanacak — K-3)
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 1
> **Ön gereksinim:** Codex `admin_panel/.../lead-machine/fair/review` sayfasını kurmuş olmalı

---

## Bu rehber kimin için

Avrasya Paspas (ProMats) export ekibinden günde 30 dk aday firma review eden kişi için. Toplam 4 hafta × 5 iş günü = 20 oturum = ~600 aday onay/red kararı.

**Hedef:** Aday başına ortalama **3 dakika**. Otomatik üretilen 300-500 aday içinden 200+ onaylı çıkarmak.

---

## Bir günde ne yapacaksın — 30 dakikalık akış

```
09:00 — Panel'i aç: market-pulse.app/admin/lead-machine/fair/review
        (giriş bilgileri: K-3 ile netleşecek)

09:01 — Filtre seç:
        - Job: "Automechanika 2026 — Hall 3.1+3.0+4.0 tarama"
        - Status: "pending" (yeni adaylar)
        - Sırala: skor azalan

09:03 — İlk aday kartını aç. 3 dk içinde karar ver.

[Bu döngü 8-10 kez tekrarlanır]

09:30 — "Bugün onayladığım" sayacı: 6-8 onay, 2-4 red.
        Panel'i kapat. Onaylananlar otomatik enrichment'a gidiyor.
```

---

## Aday kartı — ne göreceksin

```
┌─────────────────────────────────────────────────────────────┐
│ AutoParts Distribution GmbH                  Skor: 7.8 / 10 │
│ Almanya • Düsseldorf                  Hall 3.1 • Stand F08  │
│ ──────────────────────────────────────────────────────────  │
│ 🏷️ Tipi:        Distribütör                                  │
│ 🌐 Website:     autoparts-distribution.de  [Aç ↗]           │
│ 📞 Tel:          +49 211 1234567                             │
│ ✉️ Email:        info@autoparts-distribution.de              │
│                                                              │
│ 📦 ÜRÜN GRUPLARI (fuar sayfasından):                         │
│   • Floor mats                                               │
│   • Interior accessories                                     │
│   • Boot liners                                              │
│                                                              │
│ 🤖 AI ÖZETİ:                                                 │
│   Kuzey Ren-Vestfalya bölgesinde 18 yıllık oto aksesuar     │
│   distribütörü. Web sitesinde paspas, bagaj örtüsü ve       │
│   gösterge paneli aksesuarı satıyor. Şu an Çinli            │
│   üreticilerden import ediyor — private label ortağı        │
│   arıyor olabilir.                                          │
│                                                              │
│ 🟢 POZİTİF SİNYALLER:                                        │
│   ✓ B2B sinyali güçlü (toptan/wholesale dil var)            │
│   ✓ Çin'den import sinyali (değişiklik fırsatı)             │
│   ✓ Multi-brand katalog (özel marka değil)                  │
│                                                              │
│ 🔴 NEGATİF SİNYALLER: (yok)                                  │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│  [ ❌ REDDET ]    [ ⭐ FAVORI ]    [ ✅ ONAYLA ]              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3 dakikalık karar akışı

### Dakika 1 — Hızlı bakış (60 sn)
1. **Skor**: 7+ ise muhtemelen iyi aday, 5-7 sınırda, 5'in altı kuşkulu (sistem 5 altını zaten filtrelemiş ama gözden geçirmek değerli)
2. **Tipi**: Distribütör/ithalatçı/toptancı **EVET**. Üretici **HAYIR** (rakip).
3. **Ülke**: K-1 listesinde mi (DE/AT/NL/PL/FR)? Pilot pazardaysa öncelikli.
4. **AI özeti**: 2-3 cümleyi oku — özet zaten neden uygun olduğunu söylüyor.

### Dakika 2 — Web sitesi kontrol (90 sn)
**"Aç ↗" butonuna bas → web siteyi yeni sekmede aç.**

Bak:
- Ana sayfa: nasıl konumlanıyor (toptancı mı, üretici mi)
- Ürün kategorileri: paspas + interior accessories var mı
- "About" sayfası: kaç yıllık şirket, kaç çalışan
- Tedarikçi sayfası varsa: kimden alıyor (Çin'den mi)

**Hızlı kırmızı bayrak kontrolü:**
- ❌ "Our manufacturing facility" / "Made in our factory" → kendi üreticisi, geç
- ❌ "Authorized VW dealer" / tek marka bayilik → kategori dar, geç
- ❌ Sayfa Çince/Korece → yanlış ülke flag'i, geç
- ❌ Sadece B2C, hiç B2B sinyali yok → çok küçük olabilir

### Dakika 3 — Karar (30 sn)

3 buton:

#### ✅ ONAYLA — bu aday outreach'e gidecek
Tıkla → kart kapanır → bir sonraki aday gelir. Sistem otomatik:
1. `lead_candidates.status='approved'` yapar
2. Apollo enrichment job tetiklenir
3. 1-2 saat içinde karar verici email gelir
4. GPT-4o-mini personalization paragrafı üretir
5. `lead_outreach_drafts.status='draft'` ile sana onay için döner (Sprint 3 ayrı akış)

#### ⭐ FAVORI — yüksek öncelikli, özel mail al
Tıkla → ek bir dialog: "Bu adayın özelliği nedir?" (opsiyonel not). Onaylı + ek olarak:
- Outreach taslakta uzun varyant kullanılır (3 paragraf yerine 6)
- T+10 hatırlatma daha agresif gönderilir
- Stand brifing kartında "öncelikli" işareti

#### ❌ REDDET — bu aday outreach'e gitmeyecek

Tıkla → red sebebi seç (öğrenme için kritik):

```
Red Sebebi (zorunlu):
○ Kendi üretimi var (rakip)
○ Tek marka bayilik (kategori dar)
○ Yanlış kategori (örn. sadece motor parçası)
○ Çok küçük (yıllık ciro <500K EUR tahmini)
○ Çinli re-export (private label fırsatı yok)
○ Yanlış ülke
○ Web sitesi yok / kapalı / Çince
○ Diğer: _______________ (kısa not)
```

Bu etiketler **3. hafta ICP v2'ye** girdi olur — sistem benzer firmaları otomatik düşük skorlamayı öğrenir.

---

## Klavye kısayolları

| Tuş | Aksiyon |
|---|---|
| `J` veya `↓` | Sonraki aday |
| `K` veya `↑` | Önceki aday |
| `A` | Onayla |
| `R` | Reddet (dialog açılır) |
| `F` | Favori |
| `W` | Web sitesini yeni sekmede aç |
| `O` | Detail fuar sayfasını aç (yan referans) |
| `?` | Bu kısayol listesi |

---

## Sık karşılaşılan durumlar

### "Hangi tip distribütör arıyoruz?" — Net cevap

Avrasya'nın ürünü **floor mat (oto paspası)**. Aday firma:

✅ **EVET demek için en az ikisi:**
- Web sitesinde paspas/Fußmatten/auto mats/car mats kategorisi var
- "Wholesale", "distributor", "importer", "B2B", "Großhandel", "Vertrieb" kelimesi geçiyor
- Türkçe karakter yok, kendi diline lokalize
- Birden fazla marka satıyor (multi-brand)

❌ **HAYIR demek için en az biri:**
- "Eigene Produktion", "Our own manufacturing", "Production facility" yazıyor
- Sadece tek bir araç markası
- Sadece tek bir ürün kategorisi (yağ, akü, lastik)
- E-com ama hiç yorumu olmayan / 1-2 ay önce açılmış

### "Skoru düşük (5-6) ama görsel olarak iyi görünüyor"

Skor sistem-üretimi, %15-20 hata payı var. **Sen kararı verirsin.** Görsel olarak iyiyse onayla — sistem öğrenir, skoru tekrar kalibre eder.

### "Skoru yüksek (8+) ama emin değilim"

Risk küçük. Onayla, yanlışsa T+10 follow-up'ta yanıt vermez ve kapanır. Skor 8+ aday tipik **%30 yanıt** veriyor — fırsatı kaçırma.

### "Aday firma ile zaten konuşmuştuk geçmişte"

Önemli! "Geçmişte konuştuk" notu eklemeden onaylama. Avrasya CRM'de o firma varsa şunu ekle:
```
Reddet → Diğer → "CRM'de mevcut: <önceki temas tarihi>"
```
Bu durumda sistem **bu firma adını dedupe** eder.

### "Aday firma'nın websitesi açılmıyor"

3 dakika içinde:
- Sayfa hata veriyor (500/503) → 1 saat sonra tekrar dene, hala kapalıysa reddet
- Domain expired / parking page → reddet
- Çince/Korece/Rusça → reddet (yanlış ülke flag'i)
- Sadece 1 ana sayfa, başka sayfa yok → reddet (çok küçük)

### "AI özeti yanlış / abartılı / yanlış kelimesi var"

Düzeltme butonu yok ama önemli değil — sen kararı veriyorsun, AI özeti sadece **hızlandırıcı**. Yine de yanlışsa AI prompt'unu Claude kalibre etmeli — Slack/WhatsApp'tan "AI özeti yanlış" notu bırak.

---

## Haftalık review oturumu

Her Çarşamba **30 dk** Claude/Orhan ile birlikte:
- Geçen haftanın red pattern'larını incele
- ICP'nin doğru kalibre edip etmediğini kontrol
- Garip aday tipleri varsa örnek bul
- Sonraki haftanın hedef sayısını netleştir

İlk oturum: **2026-05-28**.

---

## Önemli — Onaylanmış olan ne demek (uyarı)

Onaylanan aday Sprint 3 sonunda outreach mail alıyor. **Mail Avrasya domain'inden gidiyor** (`info@promats.com.tr`).

Yani:
- Yanlış aday onaylanırsa Avrasya'nın itibarını riske atar
- Spam'e düşme oranı yüksek olursa Avrasya'nın domain'i karalama listesine girer
- **Dikkat:** Şüpheli adayı **Favori veya Onay yerine Reddet** yap.

**Onay = "Bu firmaya benim adıma mail gitsin"** demektir.

---

## Sorun çözme

| Belirti | Olası sebep | Çözüm |
|---|---|---|
| Panel açılmıyor | Backend/admin panel down | Codex'e haber ver (Slack) |
| Yeni aday gelmiyor | Tarama bitmiş / job çalışmıyor | Refresh; sorun varsa Codex |
| Web siteleri yavaş açılıyor | Internet/proxy | Sabırla bekle veya başka aday |
| AI özeti boş | LLM hata vermiş | Yine de manuel kararını ver — özet olmadan da olur |
| Skor "—" gösteriyor | Hesaplama hatası | Codex'e raporla, manuel karar ver |

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🎯 ICP referansı (red sebepleri buradan türetilir): [../teknik/icp-automechanika-final.md](../teknik/icp-automechanika-final.md)
- 👤 Avrasya müşteri dosyası: [avrasya-paspas-automechanika.md](avrasya-paspas-automechanika.md)
- ✉️ Onay sonrası gönderilecek mail template'leri: [automechanika-2026-outreach-templates.md](automechanika-2026-outreach-templates.md)
