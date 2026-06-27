# Hizmet Sayfası İçerik Şeması (Service Page Content Schema)

> isletmeniyonet'in ~70 hizmet sayfasını Market Pulse frontend'ine taşımak için kanonik içerik formatı.
> İlgili: [../strateji/FRONTEND_GENISLETME.md](../strateji/FRONTEND_GENISLETME.md)

## Amaç
isletmeniyonet'in hizmet sayfaları uzun-form, SEO-zengin içerikler (1000+ satır, 30+ başlık, süreç/SSS). Bunları **70 ayrı dosya/route değil**, tek dinamik route `/[locale]/hizmetler/[slug]` + **veri** olarak taşıyoruz. İçerik formatı hem dosya (`frontend/src/config/hizmetler/[slug].json`) hem DB satırı (content JSON kolonu) olarak taşınabilir — aynı JSON.

## Section type'ları (generic, yeniden kullanılabilir)
| type | alanlar | kaynak (isletmeniyonet) |
|------|---------|--------------------------|
| `richText` | `heading`, `body[]` (paragraf dizisi) | "X Nedir?", açıklama blokları |
| `cards` | `heading`, `items[]{title, body}` | "Kimler için?", "Hangi alanlar incelenir?" |
| `steps` | `heading`, `intro?`, `steps[]{n, title, body}` | "Süreç nasıl ilerler?" (numaralı) |
| `bullets` | `heading`, `intro?`, `items[]` (string) | "Avantajlar", "Sık yapılan hatalar" |
| `faq` | `heading`, `items[]{q, a}` | "Merak edilenler" / SSS |
| `richList` | `heading`, `intro?`, `items[]` + `body[]?` | karışık (paragraf + madde) |

## Üst-seviye şema (locale-keyed)
```jsonc
{
  "slug": "gtip-hs-koduna-gore-musteri-bulma",
  "category": "ihracat-musteri-bulma",   // hizmet hub gruplaması
  "module": "discover-customs",            // hangi ürün modülüne bağlı (varsa)
  "order": 10,
  "icon": "ScanSearch",                    // lucide ikon adı
  "image": "/pictures/...",                // og/hero görseli
  "locales": {
    "tr": {
      "seo": { "title": "...", "description": "...", "ogTitle": "...", "ogDescription": "..." },
      "hero": { "eyebrow": "İhracat Müşteri Bulma", "title": "...", "lead": "...",
                "primaryCTA": { "label": "Teklif Al", "href": "/teklif-al" },
                "secondaryCTA": { "label": "Nasıl çalışır?", "href": "#surec" } },
      "sections": [ { "type": "richText", "heading": "...", "body": ["...","..."] }, ... ],
      "closingCTA": { "heading": "...", "body": "...", "button": { "label": "...", "href": "..." } }
    },
    "en": { /* eng/ klasöründen veya çeviri */ },
    "de": { /* çeviri */ }
  }
}
```

## Kurallar
- **TR birincil.** EN mümkünse isletmeniyonet `eng/` sayfalarından; yoksa çeviri kuyruğuna. DE çeviri.
- `{{appName}}` placeholder kullan (marka değişebilir) — "İşletmeni Yönet" → `{{appName}}`.
- SEO başlık/description birebir korunur (asıl değer bu — arama sıralaması).
- HTML değil düz metin + minimal inline vurgu (`<strong>`, `<em>`) sadece hero headline'da.
- CTA'lar Market Pulse route'larına map'lenir (`/teklif-al`, `/iletisim`, `/register`).

## Pilot
`frontend/src/config/hizmetler/gtip-hs-koduna-gore-musteri-bulma.json` — referans dönüşüm (bu şemanın canlı örneği).

## Toplu taşıma (batch) yaklaşımı
1. 70 PHP sayfasını kategoriye ayır (ihracat / crm / e-ticaret / eğitim / paket).
2. Her sayfa: PHP→yapısal extract (python parser, `scripts/extract-hizmet.py`) → bu şemaya map.
3. EN: `eng/` eşleşmesi varsa al; yoksa `needs_translation: true` işaretle.
4. Section component'leri (richText/cards/steps/bullets/faq) + `/[locale]/hizmetler/[slug]` route (Codex).
5. Hizmet hub `/hizmetler` (kategori grid) + navigasyon güncelle.
