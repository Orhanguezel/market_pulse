# Market Pulse Frontend Genişletme — isletmeniyonet Özelliklerinin Taşınması

> Tarih: 2026-06-27 · Karar: isletmeniyonet'in public yüz özelliklerini Market Pulse frontend'ine taşı, kapsamı genişlet.
> İlgili: [ISLETMENIYONET_BIRLESTIRME.md](ISLETMENIYONET_BIRLESTIRME.md)

---

## 1. Bulgu — isletmeniyonet public yüzü Market Pulse'tan ÇOK daha geniş

isletmeniyonet.com canlı sitesi **~70 hizmet sayfası** ile derin bir SEO/pazarlama yüzeyi. Konumlandırma: Türk ihracatçılar için **SaaS + danışmanlık + eğitim + done-for-you ajans**. Bu, Market Pulse'ın mevcut "odaklı B2B SaaS" kapsamını dramatik biçimde genişletiyor.

**Canlı navigasyon:** Anasayfa · Hizmetler · CRM · İhracat · E-Ticaret · Eğitimler · Paketler · Kurumsal
**4 çekirdek modül (hero):** CRM · Mail · WhatsApp AI (9 dil chatbot) · AI Phone (9 dil çağrı asistanı)
**Hero:** "5.0 Teknoloji Akıllı İşletme — Firmanız için tüm çözümler tek platformda"

## 2. Özellik haritası — isletmeniyonet → Market Pulse modülü

| isletmeniyonet özelliği | Market Pulse karşılığı | Durum |
|--------------------------|------------------------|-------|
| **CRM** (yazılım, satış otomasyonu, lead, teklif/sipariş, AI CRM, sektör/rol bazlı) | CRM Çekirdek | Çakışıyor → konsolide |
| **İhracat müşteri bulma** (konşimento/bill-of-lading, 190+ ülke, GTİP/HS kodu, ürün adına ithalatçı, karar verici, mail bulma) | **Discover / `customs` kanalı** | ⭐ Birebir — PoC bunu kuruyor |
| **DYS & Fuar teşvikleri** | Discover / fair kanalı | Var |
| **Mail marketing + e-posta izleme + kampanya** | Outreach | Var |
| **WhatsApp AI asistan + AI Phone (9 dil)** | ❌ Market Pulse'ta YOK | 🆕 **YENİ ÜRÜN PİLARI** |
| **E-Ticaret / Pazaryeri** (Trendyol, Amazon, Etsy, eBay, Alibaba, TradeWheel, Go4World, Europages) | ❌ Market Pulse'ta YOK (Risk modülü sadece Amazon analizi) | 🆕 **YENİ** |
| **Eğitimler** (ChatGPT, Claude Code, Gemini, LinkedIn, Sales Navigator, AI) | ❌ YOK | 🆕 **YENİ — danışmanlık geliri** |
| **Paketler** (done-for-you: ihracata hazırlık, b2b müşteri bulma, dış ticaret departmanı, CRM kurulum, e-ticaret) | ❌ YOK | 🆕 **YENİ — ajans modeli** |
| **Kurumsal / Hakkımızda / İletişim / Blog** | Market Pulse marketing shell | Var |

## 3. Yeni gelen ürün pilarları (Market Pulse roadmap'ine eklenecek)

1. **WhatsApp AI + AI Phone asistanı** — 9 dilli chatbot + otomatik çağrı yanıtlama. Market Pulse'ın Outreach'ini email-ötesine taşır. Güçlü diferansiyatör.
2. **E-Ticaret/Pazaryeri yönetimi** — çok platformlu (TR + global + B2B). Market Pulse'ın Amazon-only Risk modülünü genişletir.
3. **Eğitim & Danışmanlık** — AI/ihracat/LinkedIn eğitimleri. Sales-led gelir kanalı.
4. **Done-for-you paketler** — ajans hizmeti. Self-serve SaaS yanında yüksek-ticket gelir (Market Pulse'ın "Sanayi/Custom" tier'i ile örtüşür).

## 4. Mimari — Market Pulse frontend altyapısı bunu zaten kaldırır

Market Pulse frontend'inin güçlü yanı tam burada işe yarıyor:
- **DB-driven section sistemi** (`/api/home/layout` + section registry) → 70 hizmet sayfası **70 dosya değil, DB kayıtları** olur. Tek dinamik route: `/[locale]/hizmetler/[slug]`.
- **Per-page SEO + sitemap + IndexNow + robots** → her hizmet sayfası SEO-hazır (isletmeniyonet'in asıl değeri bu SEO yüzeyi).
- **Custom i18n TR/EN/DE** → isletmeniyonet'in `eng/` versiyonu doğal olarak EN locale'e map'lenir.
- **Token-driven tema** → teal+navy B2B paletine geçiş (zaten planlı).

### Önerilen yeni IA (navigasyon)
```
/                      Anasayfa (hero: 4 modül — CRM/Mail/WhatsApp AI/AI Phone)
/hizmetler             Hizmet hub'ı (kategori grid)
/hizmetler/[slug]      ~70 hizmet detay (DB-driven, SEO)
/crm                   CRM ürün sayfası
/ihracat               İhracat müşteri bulma (GTİP/konşimento/190 ülke) — customs Discover
/e-ticaret             Pazaryeri yönetimi
/egitimler             Eğitim programları
/egitimler/[slug]      Eğitim detay
/paketler              Done-for-you paketler
/paketler/[slug]       Paket detay + teklif al
/kurumsal              Hakkımızda/vizyon
/blog, /blog/[slug]    İçerik (var)
/iletisim, /fiyatlar   (var)
+ auth, /dashboard     (var)
```

## 5. Stratejik gerilim (karar gerekiyor)

Market Pulse şu an **odaklı self-serve B2B SaaS** olarak tasarlanmış. isletmeniyonet ise **SaaS + ajans + eğitim** (sales-led, "paket fiyatı sabit değil"). İkisini birleştirmek konumlandırmayı genişletir:
- **Dar (SaaS-first):** Sadece ürün özelliklerini taşı (CRM/Discover/Outreach/WhatsApp AI). Eğitim/paket/ajans sayfalarını alma. Net, ölçeklenir.
- **Geniş (Platform + ajans):** Hepsini taşı. Daha çok gelir kanalı + dev SEO yüzeyi, ama konumlandırma bulanıklaşır, operasyon ağırlaşır.
- **Hibrit (önerilen):** Ürün = self-serve SaaS (CRM/Discover/Outreach/WhatsApp AI/E-ticaret); Eğitim+Paketler = ayrı "Hizmetler" sekmesi altında sales-led katman (Market Pulse'ın Sanayi/Custom tier'i ile aynı mantık). Tek site, iki gelir motoru.

## 6. Sonraki adımlar
1. ✅ IA + 4-modül hero kararı (bu doküman). Kapsam: **Geniş (Platform+ajans)**.
2. ✅ **Hizmet içeriği taşıma TAMAMLANDI (2026-06-27):** 59 hizmet sayfası → `frontend/src/config/hizmetler/*.json` (TR, SEO birebir, ~680 section + 582 SSS). Şema: [../teknik/HIZMET_ICERIK_SEMASI.md](../teknik/HIZMET_ICERIK_SEMASI.md). Kategoriler: ihracat-musteri-bulma 16, e-ticaret-pazaryeri 16, egitim 11, crm-satis 11, mail-outreach 5. EN/DE = needs_translation.
3. ✅ **Render katmanı TAMAMLANDI (2026-06-27):** `src/lib/hizmet-content.ts` loader + `src/components/containers/hizmet/` (9 component: Hero/RichText/Cards/Steps/Bullets/Faq/ClosingCTA/Sections/Icon) + `/[locale]/hizmetler` hub (kategori grid, 59 link) + `/[locale]/hizmetler/[slug]` dinamik route (generateStaticParams+generateMetadata) + header nav "Hizmetler". Dev server'da HTTP 200, hub + detay canlı render doğrulandı. EN/DE → TR fallback. typecheck temiz.
4. ⏳ Özel sayfalar: blog, hakkimizda, iletisim, teklif-al + 3 legal (gizlilik/mesafeli/teslimat → mevcut MP legal'e map) + kök ürün sayfaları (satismusteriyonetimi, envanteryonetimi, calisanyonetimi, teknikservis, hatirlatici).
5. ⏳ WhatsApp AI + AI Phone landing (frontend tanıtım, backend sonra).
6. ⏳ EN/DE çeviri (7 eng/ sayfası hazır, kalan çeviri).
7. ✅ **teal+navy tema migration TAMAMLANDI (2026-06-27):** `globals.css` token fallback'leri + `lib/tokens/defaults.ts` (runtime `--gm-*` palet — asıl kaynak) + `site-config.ts`/`layout.tsx` theme_color + HeroNew gradient → yeşil(tarım) skalası teal+navy'ye remap. Canlı doğrulandı: `--gm-primary:#0d9488`, `--gm-text:#1e293b`. success semantic yeşil korundu. NOT: admin_panel ayrı (coral→teal sonra).
