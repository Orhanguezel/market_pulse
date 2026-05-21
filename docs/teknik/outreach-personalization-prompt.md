# Outreach Kişiselleştirme Prompt'u — GPT-4o-mini

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint 3 — fuar outreach Faz 1)
> **Hedef okuyucu:** ⚙️ Codex — `outreach/draft.service.ts` içinde GPT-4o-mini çağrısı yaparken bu prompt'u system message olarak kullanacak
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 3
> **Bağlı template'ler:** [../musteri/automechanika-2026-outreach-templates.md](../musteri/automechanika-2026-outreach-templates.md)

---

## Bu prompt nedir

Her aday firma için **kişiselleştirme paragrafı** üretir. Bu paragraf mail şablonunun ilk paragrafına `{kisisellestirme_paragrafi}` olarak yerleşir.

Hedef: **2 cümle** — biri aday firmanın spesifik bir gerçeğine değinir, biri Avrasya'nın çözümüyle köprü kurar.

Maliyet hedefi: GPT-4o-mini, ~250 input + ~80 output token = ~$0.0001/aday. 500 aday = $0.05 — sıfır maliyet.

---

## System Prompt

```
You are an experienced B2B export sales writer helping a Turkish floor mat
manufacturer (Avrasya / ProMats) draft pre-trade-show outreach emails to
European distributors and e-commerce sellers.

Your job: write ONE personalization paragraph (2 sentences MAX, 50 words MAX)
that opens an email cold to a specific company. The paragraph must:

1. Reference ONE concrete, specific fact about the prospect company - taken
   directly from the website_analysis or ai_summary field provided below.
   Examples of good hooks:
   - "Your catalog covering both winter and all-season mat ranges suggests..."
   - "Listing on Amazon DE with 4.6 average rating across {N} reviews shows..."
   - "Your focus on Volkswagen-specific accessories aligned with..."
   Do NOT invent facts. If the input lacks specifics, default to the
   safer industry-standard hook (see fallbacks below).

2. Bridge to Avrasya's relevance with ONE sentence.
   - For distributors: emphasize range, MOQ flexibility, 14-day delivery.
   - For e-com sellers: emphasize private label, ASIN-ready imagery, no
     Chinese-MOQ-lock.

3. Match the email language exactly:
   - "DE" → German, formal "Sie".
   - "EN" → English, neutral business tone.
   - "TR" → Türkçe, "siz" formal.

4. Tone: respectful, factual, NOT salesy. No exclamation marks. No emojis.
   No "I'd love to" / "I'm excited" / "Game changer" phrases.

5. Output ONLY the paragraph. No greeting, no signature, no quotation marks,
   no explanations. Plain text.

If the input data is insufficient for a specific hook, use one of these safe
fallbacks (in the matching language):

DE fallback:
"Wir haben Ihr Programm für den europäischen Automotive-Aftermarket gesehen
und sehen einen klaren Berührungspunkt zu unserem Floor-Mat-Sortiment.
Insbesondere im {hedef_ulke}-Markt suchen Distributoren wie Sie nach
verlässlichen europäischen Lieferzeiten - das können wir bieten."

EN fallback:
"We've reviewed your aftermarket programme covering the {hedef_ulke} market
and see a clear overlap with our floor mat range. Distributors at your scale
typically value short EU lead times - that's where we differentiate from
Far-East suppliers."

TR fallback:
"{hedef_ulke} pazarındaki aftermarket programınızı inceledik; paspas
serimizle net bir örtüşme görüyoruz. Sizin gibi distribütörler genellikle
kısa AB teslimat süresine değer veriyor - asıl farkımız orada başlıyor."
```

---

## User Prompt (Codex template engine doldurur)

```
Language: {dil_kodu}                 # "DE" | "EN" | "TR"
Segment:  {segment}                   # "distributor" | "ecom_seller"
Target country: {hedef_ulke}          # "Germany" / "Deutschland" / "Almanya"

Prospect company:
  Name: {firma_adi}
  Website: {website}
  Country: {country}
  Product groups (from fair page): {product_groups_csv}
  Brands carried: {brands_csv}
  Sales channels detected: {sales_channels_csv}

Website analysis (auto-extracted):
  - Has B2B signals: {has_b2b_signals}
  - Has China import signals: {has_china_signals}
  - Has private label hints: {has_private_label}
  - Firm type hints: {firm_type_hints_csv}
  - Product keywords (top 20): {product_keywords_csv}

AI summary of fair exhibitor record:
  {ai_summary}

Write the personalization paragraph now. Output only the paragraph.
```

---

## Örnek Input → Beklenen Output

### Örnek 1 — DE Distribütör

**Input:**
```
Language: DE
Segment: distributor
Target country: Deutschland

Prospect company:
  Name: AutoParts Distribution GmbH
  Website: https://www.autoparts-distribution.de
  Country: DE
  Product groups: Floor mats, Interior accessories, Boot liners
  Brands carried: Brand A, Brand B
  Sales channels detected: own website, wholesale catalog

Website analysis:
  - Has B2B signals: true
  - Has China import signals: true
  - Has private label hints: false
  - Firm type hints: distributor, wholesaler
  - Product keywords: Fußmatten, Kofferraumwanne, Auto-Zubehör, Importer, Großhandel

AI summary:
  Kuzey Ren-Vestfalya bölgesinde 18 yıllık oto aksesuar distribütörü.
  Web sitesinde paspas, bagaj örtüsü ve gösterge paneli aksesuarı satıyor.
  Şu an Çinli üreticilerden import ediyor — private label ortağı arıyor olabilir.
```

**Beklenen output (~40 kelime DE):**
```
Ihr Programm aus Fußmatten, Kofferraumwannen und Innenausstattung deutet auf
einen breit aufgestellten Aftermarket-Distributor hin, der derzeit zum großen
Teil aus Fernost beliefert wird. Genau hier können wir mit europäischer
Lieferzeit und Private-Label-Optionen einen klaren Mehrwert bieten.
```

---

### Örnek 2 — EN E-com Seller

**Input:**
```
Language: EN
Segment: ecom_seller
Target country: Netherlands

Prospect company:
  Name: CarMatsExpress B.V.
  Website: https://www.carmatsexpress.nl
  Country: NL
  Product groups: Floor mats, Boot liners
  Brands carried: (none clearly visible)
  Sales channels detected: amazon, own website, kaufland

Website analysis:
  - Has B2B signals: false
  - Has China import signals: true
  - Has private label hints: false
  - Firm type hints: e-commerce seller
  - Product keywords: car mats, all-weather, tailored, Volkswagen, BMW

AI summary:
  Hollanda'da kayıtlı, Amazon DE/NL ve Kaufland'da satıcı. Web sitesi
  doğrudan tüketiciye satış yapıyor. Sayfada Çin'den import sinyali var.
  Tailored mat'lere odaklı — VW ve BMW model spesifik kalıplar.
```

**Beklenen output (~40 kelime EN):**
```
Your tailored-mat range for VW and BMW with simultaneous listings on Amazon DE
and Kaufland shows a sharp focus on the DACH e-com side. We can supply
vehicle-specific moulds with white-label packaging and ASIN-ready imagery -
without the typical 1,000-unit Chinese MOQ lock.
```

---

### Örnek 3 — TR Distribütör (fallback ile)

**Input:**
```
Language: TR
Segment: distributor
Target country: Polonya

Prospect company:
  Name: Polski Auto Sp. z o.o.
  Website: https://www.polski-auto.pl
  Country: PL
  Product groups: (boş — fair sayfasında detay gelmemiş)
  Brands carried: (boş)
  Sales channels detected: wholesale catalog

Website analysis:
  - Has B2B signals: true
  - Has China import signals: false
  - Has private label hints: false
  - Firm type hints: distributor
  - Product keywords: hurt, akcesoria samochodowe

AI summary:
  Polonya'da auto aksesuar toptan satışı. Web sitesi sade, ürün listesi
  detaylı gelmedi. B2B sinyali güçlü.
```

**Beklenen output (TR fallback civarı, ~30 kelime):**
```
Polonya pazarında toptan oto aksesuar programınızı inceledik; paspas
serimizle net bir örtüşme görüyoruz. Sizin gibi distribütörler genellikle
kısa AB teslimat süresine değer veriyor — asıl farkımız orada başlıyor.
```

---

## Kalite Kapısı — Claude QA

İlk 10 üretim sonrası **Claude manuel review eder** ([AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 3 "İlk 10 maili manuel review et"):

Kontrol listesi:
- [ ] Hook gerçek mi yoksa AI halüsinasyonu mu (web siteyi açıp doğrula)
- [ ] Cümle sayısı ≤2
- [ ] Kelime sayısı ≤50
- [ ] Tone: salesy mi factual mi
- [ ] Dil eşleşmesi doğru mu (DE vs EN vs TR)
- [ ] Bridge cümlesi Avrasya değer teklifini doğru ifade ediyor mu
- [ ] "Click here" / "Free" / "%100" / spam tetikleyici var mı

Reject oranı %30+ ise prompt'u kalibre et (temperature düşür, fallback'leri zorla, örnek sayısını artır).

---

## API Çağrısı (Codex için referans)

```typescript
// backend/src/modules/lead-machine/outreach/draft.service.ts

import OpenAI from 'openai';

const SYSTEM_PROMPT = `...`; // bu dosyadaki system prompt

interface PersonalizationInput {
  language: 'DE' | 'EN' | 'TR';
  segment: 'distributor' | 'ecom_seller';
  target_country: string;
  prospect: {
    name: string;
    website: string | null;
    country: string;
    product_groups: string[];
    brands: string[];
    sales_channels: string[];
  };
  website_analysis: {
    has_b2b_signals: boolean;
    has_china_signals: boolean;
    has_private_label: boolean;
    firm_type_hints: string[];
    product_keywords: string[];
  };
  ai_summary: string;
}

async function generatePersonalization(
  client: OpenAI,
  input: PersonalizationInput,
): Promise<string> {
  const userPrompt = buildUserPrompt(input);
  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    max_tokens: 120,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });
  return resp.choices[0].message.content?.trim() ?? '';
}
```

`temperature: 0.5` — fact-grounded kalsın diye düşük, monoton olmasın diye sıfırın üstünde.
`max_tokens: 120` — 50 kelimeyi 1.5x güvenle kapsar.

---

## Token Maliyeti Tahmini

500 aday × (~280 input + ~80 output token) × GPT-4o-mini fiyatı:
- Input: 500 × 280 × $0.00015/1K = **$0.021**
- Output: 500 × 80 × $0.0006/1K = **$0.024**
- **Toplam: ~$0.05** (5 sent)

Maliyet sıfır. Avrasya bütçesi K-4'te zaten $300 toplam, bu kategorinin %0.02'si.

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- ✉️ Mail template'leri (kişiselleştirme buraya yerleşir): [../musteri/automechanika-2026-outreach-templates.md](../musteri/automechanika-2026-outreach-templates.md)
- 📊 Apollo fallback SOP: [apollo-fallback-sop.md](apollo-fallback-sop.md)
- 🎯 ICP referansı: [icp-automechanika-final.md](icp-automechanika-final.md)
