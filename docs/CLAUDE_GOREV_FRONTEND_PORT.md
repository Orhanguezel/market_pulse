# CLAUDE GÖREVİ — Frontend İşletmeniyönet Portu (çeklist)

> **Rol:** Bu görev Claude içindir (frontend implementasyon). Codex backend+admin'de
> (entitlement + CRM, bitti). **Sınır:** Claude sadece `frontend/`; backend/admin'e dokunmaz.
> **Hedef:** isletmeniyonet.com PHP pazarlama sitesini Next.js'e birebir taşımak.
> Önce statik (mavi #1e40af + Poppins, DB-bağımsız), sonra DB'ye bağlama.
> **Kaynak:** /home/orhan/Documents/Projeler/isletmeniyonet.com/public_html/

## Durum özeti
- ✅ Ana sayfa birebir (`src/components/iy/`: IyHeader/IyFooter/IyHero/IyHome + iy-data).
- ✅ 60 servis hizmet JSON'u zaten mevcut (`src/config/hizmetler/`) — menü linkleri içerik gösteriyor (ESKİ teal tema ile).
- ⚠️ 7 kurumsal/yasal link yanlış route'a gidiyor (404).
- ⚠️ Hizmet detay + diğer iç sayfalar hâlâ teal tema → IY mavi ile tutarsız.

---

## FAZ 1 — Tutarlılık & navigasyon (yüksek değer) ✅ BİTTİ (build yeşil)
- [x] **1.1** Kurumsal/yasal menü+footer linkleri gerçek route'lara bağlandı (iy-data `href` desteği + `iyLinkHref`).
- [x] **1.2** Hizmet detay → yeni `IyHizmetDetail.tsx` (5 section tipi + hero + closing CTA, FAQ native details), `[slug]` sayfası bağlandı. 60 sayfa IY mavi+Poppins.
- [x] **1.3** `/hizmetler` hub IY tema + kategori grupları ile yeniden yazıldı.

## FAZ 2 — Kurumsal sayfalar birebir
- [ ] **2.1** Hakkımızda (`hakkimizda.php` → IY tema)
- [ ] **2.2** İletişim (`iletisim-sayfasi.php` → IY tema; form + WhatsApp/telefon)
- [ ] **2.3** Teklif Al sayfasını IY temasına uydur (CTA hedefi)
- [ ] **2.4** Blog liste/detay IY temasına uydur

## FAZ 3 — İçerik paritesi & i18n
- [ ] **3.1** Hizmet JSON içeriklerini PHP sayfalarıyla karşılaştır, eksik/zayıf olanları zenginleştir
- [ ] **3.2** WhatsApp AI + AI Telefon landing sayfaları (whatsapp-ai.php, whatsapp-ai-phone.php)
- [ ] **3.3** EN/DE çeviri (şu an çoğu TR)

## FAZ 4 — DB'ye bağlama (Codex koordinasyonu gerekir)
- [x] **4.1** design_tokens'ı mavi paletle güncelle (DB) → statik hex'ler yerine token (`033_iy_theme_blue.sql`)
- [x] **4.2** IY menü → menu_items seed · IY home → home_layout seed
- [ ] **4.3** Eski Header/Footer/HomeContent dosyalarını temizle (artık kullanılmıyor)

**Codex durum (2026-06-29):** `034_iy_menu_items_seed.sql` ile IY header/footer başlangıç menüsü eklendi. Ayrı `home_layout` tablosu yok; mevcut backend kontratı `/site_settings/homepage` olduğu için `homepage_hero`, `homepage_sections`, `homepage_banners` seedlendi.

---

## Notlar
- Renkler: primary #1e40af, hover #15317f, dark #0f172a, secondary #2563eb, bg #eaeaea, accent #eff6ff.
- Font: Poppins (`var(--font-poppins)`), wrapper style ile uygulanıyor.
- Her faz sonunda: `bun run typecheck` + `bun run build` YEŞİL olmalı.
- Commit kullanıcı onayıyla.
