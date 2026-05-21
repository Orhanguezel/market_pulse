# Automechanika Frankfurt 2026 — Müşteri Sinyali Planı

> **Üst belge:** [MARKET_PULSE_SAAS_PLANI.md](./MARKET_PULSE_SAAS_PLANI.md)
> **Müşteri:** Avrasya Paspas Otomotiv San. ve Tic. Ltd. Şti. (marka: ProMats)
> **Fuar:** Automechanika Frankfurt 2026 — **8-12 Eylül 2026**
> **Avrasya standı:** Hall 3.1, Booth D11
> **Bu belge:** Fuar öncesi/sırası/sonrası müşteri sinyali toplama stratejisi
> **Durum:** Taslak — 2026-05-21
> **Karar veren:** Strateji oturumu (Orhan + Claude)

---

## 1. Amaç

Avrasya Paspas fuar standını **boş insan akışı yerine, önceden filtrelenmiş alıcı randevuları** ile doldurmak. Paspas iş modeli için sıcak müşteri = Avrupa'da **paspas / oto aksesuar dağıtan distribütör / ithalatçı / toptancı / büyük e-ticaret satıcısı**. Kendi üreticisi olan rakip firmalar müşteri değil, intel kaynağı.

Hedef metrik tahmini (4 ay kala başlanırsa):
- Fuara giderken elinde 200-400 onaylanmış aday firma (ICP eşleşmiş)
- 60-100 firmaya fuar öncesi outreach (mail/LinkedIn)
- 20-40 doğrulanmış stand randevusu
- Fuar 4 gün × 8 saat = ~32 saatlik çalışma penceresi içinde randevuların %70'i tutarsa **stand ROI'sini katlar**

---

## 2. Hedef Müşteri Profili (ICP)

Repodaki varsayılan ICP ([018_lead_machine_schema.sql:157-170](../../backend/src/db/seed/sql/018_lead_machine_schema.sql#L157-L170))
<!-- not: ../../backend göreceli yolu kök → backend olduğu için docs/strateji'den iki yukarı doğru hâlâ doğru -->
 bu fuar için neredeyse bire bir uyuyor; sadece coğrafya genişletme + kategori daraltma gerekiyor.

### Avrasya için kalibre edilmiş ICP

```json
{
  "name": "Automechanika 2026 — Paspas/Oto Aksesuar Alıcısı",
  "sectors":     ["automotive accessories", "car care", "floor mats", "interior accessories", "car carpet", "car mat", "auto trim"],
  "firm_types":  ["distributor", "importer", "wholesaler", "e-commerce seller", "buying group", "aftermarket retailer", "tuning shop chain"],
  "geographies": ["DE","AT","NL","BE","PL","CZ","FR","IT","ES","UK","RO","HU","SK","SE","DK","NO","FI","CH","GR","BG","PT","IE"],
  "sales_types": ["B2B","B2B2C","B2C"],
  "sales_channels": ["own website","amazon","ebay","kaufland","otto","cdiscount","wholesale catalog","retail chain"],
  "price_segment": "mid",
  "exclude_firm_types": ["manufacturer (kendi üretimi var)", "OEM tier-1 supplier", "single car brand official partner"],
  "exclude_patterns": ["chinese factory", "made in china reseller only"]
}
```

### Negatif sinyaller (red sebepleri — feedback loop'a girer)
1. Kendi üretimi olan paspas firması → rakip, hedef değil
2. Sadece tek araç markası bayisi (örn. yetkili VW yedek parça) → kategorisi dar
3. Sadece elektronik / mekanik parça satıyor → kategori uyumsuz
4. Çok küçük (yıllık ciro <500K EUR) → ölçek yetersiz
5. Çin'den re-export yapıyor → fiyat baskısı, Paspas'a uygunsuz

---

## 3. Sinyal Katmanları

Fuar müşteri sinyali tek bir kaynaktan gelmez. 6 katman var, **ücretsiz katmanlardan başla, ücretliyi sonra ekle**.

### Katman 1 — Exhibitor zıt-tarama *(ücretsiz, en güçlü)*

**Mantık:** Aynı fuarda Hall 3.1 ve komşu hall'larda (3.0, 4.0 — aksesuar/customising tipik hall'lar) sergileyen **distribütör/ithalatçı/toptancı** firmaları topla. Üretici olanları rakip listesine, distribütör olanları müşteri adayı listesine ayır.

**Veri kaynağı:** Automechanika resmi exhibitor-search sayfası.

**Teknik:**
- Liste sayfası client-side render — scraper-service `stealthy` mod (Playwright) zorunlu.
- Mevcut [fair.scraper.ts](../../backend/src/modules/lead-machine/fair/fair.scraper.ts) altyapısı var ama scraper-service'in generic `fair-exhibitor` extractor'ı ([extractors.py:333](../../../scraper-service/src/engine/extractors.py#L333)) Messe Frankfurt DOM'una kalibre değil — özel iyileştirme gerekiyor (Bölüm 5).

**Beklenen çıktı:** ~5.000 exhibitor → ICP filtresi sonrası ~200-400 distribütör/ithalatçı adayı.

### ~~Katman 2 — 10times intent verisi~~ **❌ DROP (2026-05-21)**

> **Karar:** Bu katman tamamen drop edildi. 10times'ın public/self-serve API'ı **yok**, ihtiyacımız da değil. Messe Frankfurt public API zaten 429 exhibitor + mail/website veriyor. Detay: **[../teknik/10times-drop-karari.md](../teknik/10times-drop-karari.md)**

Aşağıdaki orijinal mantık tarihsel referans olarak korunur (silinmez), ama **uygulanmaz**.

~~**Mantık:** 10times.com Automechanika sayfasında "Interested" / "Attending" işaretleyen firmalar = satın alma niyeti olan ziyaretçiler. Çoğu B2B alıcı.~~

~~**Veri kaynağı:** 10times API.~~

**Teknik:**
- Mevcut [tentimes.client.ts](../../backend/src/modules/lead-machine/fair/tentimes.client.ts) hazır.
- `TENTIMES_API_KEY` env'ine API key gerekli — şu an boş.
- Automechanika Frankfurt 2026'nın 10times event_id'sinin manuel tespiti gerekiyor.

**Beklenen çıktı:** 500-2000 niyet sinyali firma → ICP + exhibitor zıt-tarama ile birleştirilince ~100-200 yeni aday.

### Katman 3 — Komşu stand haritası *(stratejik)*

**Mantık:** Avrasya standı Hall 3.1 D11. Yan-yana ±5 metredeki distribütör adayları **randevu kararı en kolay olan**lar — fuar sırasında "5 dk yan stanttan gelin" daveti yüksek dönüşümlü.

**Veri kaynağı:** Exhibitor listesinden hall + booth koordinatı çekildikten sonra mesafe hesabı (Hall 3.1 floor plan bilgisi).

**Teknik:** Booth no formatından grid pozisyonu çıkarımı. `D11` formatı = sıra D, sütun 11. Aynı sırada veya bitişik sırada olanları "neighbor" etiketle.

**Beklenen çıktı:** Avrasya'nın ±5 stand mesafesindeki 15-25 firma → manuel inceleme + öncelikli outreach.

### Katman 4 — Rakip izleme *(Monitor modülü)*

**Mantık:** Aynı kategorideki Türk + AB paspas üreticileri **rakip**, fakat onların Automechanika sayfasında **yeni ürün / fiyat / iletişim değişikliği** = pazar sinyali. Avrasya'nın stratejik kararına yarar.

**Veri kaynağı:** Rakip exhibitor detail sayfaları, periyodik scraping.

**Teknik:** Monitor modülü (henüz tam inşa edilmedi — [MARKET_PULSE_SAAS_PLANI.md:91-105](../../MARKET_PULSE_SAAS_PLANI.md#L91-L105) Ay 2 işi). Geçici çözüm: rakip exhibitor URL'lerini cron job ile haftalık scraper-service'e bas, content_hash değişimi tespit et.

**Beklenen çıktı:** 8-15 rakip izleme, fuar haftası sosyal medya postlarıyla destekli.

### Katman 5 — Pre-show outreach *(Outreach modülü, taslak hazır)*

**Mantık:** Onaylanan adaylara fuar öncesi mail/LinkedIn DM. Şablon:
> "Avrasya/ProMats olarak Hall 3.1 D11'de oluyoruz. Floor mat / car mat üretiminde X.000 SKU + private label + ODM yapıyoruz. 5-10 dk'lık randevu için 9 veya 10 Eylül uygun mu?"

**Veri kaynağı:** Onaylı adayların enrichment'ı (karar verici email — Apollo veya manuel).

**Teknik:**
- `lead_outreach_drafts` tablosu hazır.
- Şu an taslak üretim için AI prompt template yok — Outreach modülü Faz 2'ye atılmıştı ama **fuar için Faz 1 versiyonu** (manuel onay + tek tıkla mail) yapılmalı.
- Domain warmup gerekmez çünkü volume düşük (60-100 mail).

**Beklenen çıktı:** %15-25 yanıt oranı, %5-10 randevu dönüşümü = 5-12 doğrulanmış stand randevusu.

### Katman 6 — Post-show enrichment + CRM aktarımı *(Faz 2)*

**Mantık:** Fuar sırasında stand'ta kartvizit/QR taranan kişiler → CRM'e otomatik düşer, post-show takip dizisi başlar.

**Teknik:** Faz 2'de — fuar sırasında manuel Excel + sonradan import yeterli. Otomasyon ileri.

---

## 4. Zaman Çizelgesi

| Tarih | Faz | İş |
|---|---|---|
| **2026-05-21 → 06-15** *(Hafta 0-4)* | Hazırlık | scraper-service `fair-exhibitor` extractor'ını Messe Frankfurt'a kalibre et + Katman 1 PoC + ICP onaylama |
| **2026-06-15 → 07-15** | Toplama 1 | Full exhibitor scraping → 200-400 onaylanmış aday üret + Katman 2 (10times key alımı) |
| **2026-07-15 → 08-15** | Enrichment + Outreach | Karar verici email enrichment (Apollo veya manuel) + outreach taslakları + mail kampanyası başlangıcı |
| **2026-08-15 → 09-07** *(Son 3 hafta)* | Randevu | Stand randevu sözleşmeleri (Calendly veya manuel) + Katman 3 komşu stand listesi + son hatırlatmalar |
| **2026-09-08 → 09-12** | Fuar | Stand operasyonu — sabah/akşam günlük randevu listesi, fuar sırasında not + kartvizit toplama |
| **2026-09-13 → 09-30** | Post-show | CRM'e aktarım, follow-up dizisi, KPI raporu, öğrenme (red pattern'ları) |

**Riskli nokta:** scraper-service kalibrasyonu Hafta 4'te tamamlanmazsa Katman 1 gecikir → Toplama 1 fazı sıkışır. Bu yüzden **scraper-service işi en kritik path**.

---

## 5. Teknik Boşluklar (yapılacak iş)

Repoda hazır olanları yukarıda gösterdik. Bu fuar için **eksik** olanlar:

### 5.1 scraper-service tarafı — `fair-exhibitor` extractor kalibrasyonu
**Sorun:** [extractors.py:225-256](../../../scraper-service/src/engine/extractors.py#L225-L256) generic CSS selector seti (`.exhibitor-card`, `.company-card`, `article`, `li`) Messe Frankfurt DOM'unda tutmaz.

**Çözüm seçenekleri:**
- **Seçenek A — Messe Frankfurt için domain-spesifik branch:** `extract_fair_exhibitor` içinde `if "messefrankfurt.com" in url` koşulu ile özel selector seti.
- **Seçenek B — XHR endpoint tespiti:** Network panel ile internal JSON API bulup direkt onu çağırmak (en sağlam yol, ama tespit zaman alır).
- **Seçenek C — Detail URL listesini Bing/Google site search ile toplamak:** `site:automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.detail.html` ile URL listesi çek, sonra her detail sayfasını ayrı scrape et.

**Önerilen yol:** B → A → C sırasıyla. Önce 30 dk DevTools ile XHR ara; bulunursa altın madeni. Yoksa A. C son çare.

### 5.2 Detail sayfa scraper'ı
**Şu an yok.** `fair-exhibitor` extractor sadece liste sayfası için yazılmış. Detail sayfasının veri zenginliği (hall, booth, ürün grupları, marka, tedarikçi/distribütör etiketi) hayati. Yeni profil: `fair-exhibitor-detail`.

Çıkarılacak alanlar: `name, hall, booth, country, city, address, website, phone, email, product_groups[], brands[], target_markets[], description, trade_audience[]`.

### 5.3 Booth grid parser
Komşu stand katmanı için "Hall 3.1, Booth D11" formatından grid pozisyonu çıkaracak küçük yardımcı (regex + lookup).

### 5.4 Outreach Faz 1 (fuar versiyonu)
[MARKET_PULSE_SAAS_PLANI.md](./MARKET_PULSE_SAAS_PLANI.md) Outreach'i Faz 2'ye atmıştı; bu fuar için **Faz 1 minimum**'u öne çekilmeli:
- AI mail taslağı (GPT-4o-mini, aday başına 1 prompt)
- Manuel onay UI'ı (`lead_outreach_drafts.status='draft'→'sent'`)
- Tek tıkla "Gönder" (SMTP veya Postmark)
- Açma takibi (pixel — opsiyonel)

### 5.5 10times event_id tespiti + API key
- 10times'ta Automechanika Frankfurt 2026 sayfasını manuel bul, event_id'yi DevTools'tan al.
- API key başvurusu (free tier).

### 5.6 Stand randevu paneli (opsiyonel)
Onaylanan adaya mail içinde Calendly bağlantısı yeterli. Custom UI gereksiz — overengineering.

---

## 6. Maliyet Tahmini

| Kalem | Aylık | 4 Aylık Toplam |
|---|---|---|
| scraper-service (self-hosted) | $0 | $0 |
| GPT-4o-mini (ICP + outreach taslakları) | $10-20 | $40-80 |
| 10times API | $0 (free tier) | $0 |
| Apollo.io (karar verici email enrichment) | $49 | $196 |
| Postmark / SMTP (mail) | $15 | $60 |
| Calendly (randevu) | $0 (free tier) | $0 |
| **TOPLAM** | **~$75/ay** | **~$300-340** |

Avrasya fuar standı maliyetinin yanında yok denecek kadar küçük — stand maliyeti tipik 25-50K EUR, bu sistem 300 USD.

---

## 7. KPI'lar

Fuar sonrası başarı kriterleri:

| Metrik | Hedef | Nasıl ölçülür |
|---|---|---|
| Toplam onaylı aday | 200+ | `lead_candidates.status='approved' AND channel='trade_fair'` |
| Outreach gönderilen | 60-100 | `lead_outreach_drafts.status='sent'` |
| Yanıt oranı | %15+ | `replied_at IS NOT NULL` |
| Stand randevusu | 20+ | Manuel takvim sayımı |
| Fuar sonrası dönüşüm | 3-6 ciddi görüşme | `market_leads.pipeline_stage='Görüşmede'` |
| Sistem güvenilirliği | %95+ scrape başarı | scraper-service job success rate |

---

## 8. Risk Listesi

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| Messe Frankfurt scraping bloku | Düşük | Yüksek | stealthy mode + 2sn delay + rotating UA; gerekirse residential proxy |
| Exhibitor liste değişimi son ay (yeni katılımcılar) | Yüksek | Düşük | Haftalık re-scrape cron |
| Apollo karar verici bulamadı (%30-40 miss) | Yüksek | Orta | Manuel fallback + LinkedIn arama |
| Outreach mail spam'e düştü | Orta | Yüksek | Domain warmup 2 hafta önce, SPF/DKIM/DMARC kontrol |
| Avrasya tarafında onay paneli kullanılmadı | Orta | Yüksek | Haftalık 30 dk birlikte review oturumu — kullanıcı eğitimi şart |
| ICP yanlış kalibre, çok yanlış aday | Orta | Orta | İlk 50 aday manuel review + ICP feedback loop'a girer |

---

## 9. Avrasya ile Birlikte Karar Verilecek Şeyler

Sistemi açmadan önce Avrasya ile netleştirilmeli:

1. **Hedef pazar listesi:** Tüm AB mi yoksa öncelikli 4-5 ülke mi? (Önerim: DE + AT + NL + PL + FR pilot)
2. **Ürün önceliği:** Sadece floor mat mı yoksa tüm interior accessories mi? Avrasya'nın elinde private label / ODM kapasitesi var mı?
3. **Mail gönderici kim:** Avrasya'nın kendi domain'i (info@promats.com.tr veya export@avrasya.com.tr) mi yoksa biz mi gönderiyoruz? **Cevap kritik — kendi domain'i olmalı.**
4. **Karar verici onay süreci:** Onay paneli'ni Avrasya ekibinden kim kullanacak? Günde 30 dk ayırabilir mi?
5. **Stand kapasitesi:** Aynı anda kaç randevu alabilirler? (Tipik: 1 stand × 4 gün × 8 saat / 30 dk = ~64 slot maks, gerçekçi %50 = 30-35 randevu)

---

## 10. Bu Belgenin Sahipliği

- **Çocuk belgeler:**
  - [docs/teknik/FAIR_MODULU_CEKLISTI.md](../teknik/FAIR_MODULU_CEKLISTI.md) — somut iş listesi
  - [docs/musteri/avrasya-paspas-automechanika.md](../musteri/avrasya-paspas-automechanika.md) — müşteri görüşme notları + örnek aday yapısı
- **Üst belge:** [MARKET_PULSE_SAAS_PLANI.md](./MARKET_PULSE_SAAS_PLANI.md) — Bu fuar, master plandaki "Sanayi tier müşterisi (Paspas)" senaryosunun ilk büyük canlı uygulaması.
- **Güncelleme tetikleri:**
  - Avrasya ile karar verilen 9. bölüm sorularına yanıt geldiğinde
  - scraper-service kalibrasyonu sonrası gerçek aday sayısı netleştiğinde
  - 10times event_id + API key alındığında
