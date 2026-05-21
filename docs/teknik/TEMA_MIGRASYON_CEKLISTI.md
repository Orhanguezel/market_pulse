# Tema Migrasyon Çeklisti — Amozon Görsel Dilini Market Pulse'a Taşıma

> Bu çeklist [docs/strateji/MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md) Bölüm 6 (Tema Migrasyonu — Yol 1) kararlarına bağlıdır.
> **Sahipler:** 🧠 Claude (mimar/karar/QA) + ⚙️ Codex (kod/build)
> **Durum:** Taslak — 2026-05-21

---

## Bu çeklist nedir

amozon admin panelinin **ciddi, sade B2B görsel dilini** market_pulse'ın admin panelinin ve frontend'inin **yeni standardı** yapmak. Mevcut market_pulse coral pastel paleti (#E8A598 ailesi) sanayi B2B'ye yakışmıyor — kullanıcı amozon admin'in mimari/stil/tema yaklaşımını referans alıyor.

### Sürüş ilkesi

> **Component'ler dokunulmaz, sadece token'lar değişir.**

market_pulse Shadcn v4 + Tailwind v4 ekosistemini kullanıyor. Tema değişimi `--background`, `--primary` gibi Shadcn token'larını yeni paletin değerlerine bağlamak şeklinde olur. Bileşen kodları değişmez.

### Aktarım stratejisi (özet)

1. amozon `globals.css`'inden palet token'larını çıkar
2. market_pulse `globals.css` içine `--mp-*` ailesinde yaz
3. Shadcn'in `--background`, `--primary` vs. token'larını `--mp-*` token'larına map et
4. AdminShell + Sidebar yapısını amozon'un navy sidebar + sade grid'ine yaklaştır
5. Font'u Inter'a indirgele
6. Frontend (public) tarafında aynı paleti uygula
7. Visual QA — eski/yeni karşılaştır

---

## Önemli Notlar

1. **Mevcut müşteri etkilenmemeli.** market_pulse admin paneli teslim edilmiş bir müşteride çalışıyorsa kırılma riski var → tema migrasyonu **yeni branch'te** yapılır (`feat/theme-amozon-migration`).
2. **Dark mode varsa korunur.** Hem light hem dark için token tanımlanır.
3. **Coral paleti (mevcut market_pulse) silinmez, arşivlenir.** `admin_panel/src/styles/presets/coral.css` olarak korunup `mp-default.css` (yeni amozon-temelli) varsayılan olur. Theme preset sistemi var — ondan yararlanılır.
4. **CSS değişkeni isimlendirme:** Master plan `--mp-*` öneriyor. Karışıklık olmasın diye `--mp-` prefix'i zorunlu (amozon'da prefix yok — `--bg`, `--text`).
5. **Tipografi inceltme:** amozon Inter system fallback'lerle kullanıyor; market_pulse'taki `TarMinGO` (eğlence tonlu) font kaldırılacak ([master plan Bölüm 6](../strateji/MARKET_PULSE_SAAS_PLANI.md#L216)).

---

## Sprint T0 — Keşif & Karar (yarım gün)

- [ ] **🧠 Claude** — amozon admin paneli localhost'ta aç, 5 ekran screenshot al (dashboard, products, scans, theses, settings). market_pulse admin'in aynı ekranlarıyla yan-yana karşılaştır. — **Antigravity ile yapılacak (Codex deploy sonrası)**
- [x] **🧠 Claude** — Mevcut market_pulse müşterisi (varsa) için **donmuş tema** seçeneği — ✅ **[tema-dark-mode-ve-preset-karari.md](tema-dark-mode-ve-preset-karari.md)** Karar 2: 2 preset (mp-default + coral), coral preset olarak korunur
- [x] **🧠 Claude** — Final token paletini onayla — ✅ **[tema-dark-mode-ve-preset-karari.md](tema-dark-mode-ve-preset-karari.md)** §"Final Token Paleti Onayı" — light + dark mode token blokları + Shadcn token map:

  ```css
  /* docs/teknik/tema-karsilastirma-2026-05.md → onaylı palet */
  --mp-bg:          #f6f7f9;   /* off-white background */
  --mp-panel:       #ffffff;
  --mp-panel-soft:  #f9fafb;
  --mp-text:        #111827;
  --mp-muted:       #64748b;
  --mp-border:      #d9dee7;
  --mp-brand:       #0f766e;   /* teal — Notion/Linear hissi */
  --mp-brand-dark:  #115e59;
  --mp-danger:      #dc2626;
  --mp-warning:     #b45309;
  --mp-success:     #15803d;
  --mp-shadow:      0 12px 30px rgba(15, 23, 42, 0.08);

  /* Sidebar (navy) */
  --mp-sidebar-bg:    #101827;
  --mp-sidebar-text:  #cbd5e1;
  --mp-sidebar-active: rgba(15, 118, 110, 0.2);
  ```

- [ ] **⚙️ Codex** — Branch: `feat/theme-amozon-migration`
- [ ] **⚙️ Codex** — amozon globals.css'in tam kopyasını referans olarak `admin_panel/src/styles/_reference/amozon-globals.css` altına koy (commit, sonra silinir)

---

## Sprint T1 — Admin Panel Token Transferi (1 gün)

### globals.css yeniden yazımı

- [ ] **⚙️ Codex** — `admin_panel/src/app/globals.css` içinde `:root` bloğuna `--mp-*` token'larını ekle (Sprint T0 paleti)
- [ ] **⚙️ Codex** — Mevcut `--logo-coral-*` token ailesini `admin_panel/src/styles/presets/coral.css`'e taşı (preset olarak korunur, varsayılan değil)
- [ ] **⚙️ Codex** — Dark mode varyantı: `:root.dark` veya `[data-theme="dark"]` selector'u altına dark token tanımları:
  ```css
  --mp-bg: #0a0d12;
  --mp-panel: #11151c;
  --mp-text: #e5e7eb;
  /* ... */
  ```
- [x] **🧠 Claude** — Dark mode kararı: amozon'da dark var mı yok mu kontrol et — ✅ **amozon'da dark mode YOK** (sadece light, 7 yerde `--brand-dark` rengi var); market_pulse için karar: dark mode altyapısı yazılır ama default light, toggle Faz 2 — detay [tema-dark-mode-ve-preset-karari.md](tema-dark-mode-ve-preset-karari.md) Karar 1

### Shadcn token map

- [ ] **⚙️ Codex** — `admin_panel/src/app/globals.css` içinde Shadcn token'larını `--mp-*`'a bağla:
  ```css
  :root {
    --background: var(--mp-bg);
    --foreground: var(--mp-text);
    --card: var(--mp-panel);
    --card-foreground: var(--mp-text);
    --popover: var(--mp-panel);
    --popover-foreground: var(--mp-text);
    --primary: var(--mp-brand);
    --primary-foreground: #ffffff;
    --secondary: var(--mp-panel-soft);
    --secondary-foreground: var(--mp-text);
    --muted: var(--mp-panel-soft);
    --muted-foreground: var(--mp-muted);
    --accent: var(--mp-brand);
    --accent-foreground: #ffffff;
    --destructive: var(--mp-danger);
    --border: var(--mp-border);
    --input: var(--mp-border);
    --ring: var(--mp-brand);
    --radius: 0.5rem;
  }
  ```
- [ ] **⚙️ Codex** — Aynı blok dark mode için tekrar (override)
- [ ] **⚙️ Codex** — `--color-*` aile token'ları (Tailwind v4 mapping) Shadcn token'larına bağlı kalır; manuel müdahale gerek yok ama doğrula

### Preset sistemi entegrasyonu

- [ ] **⚙️ Codex** — `admin_panel/src/scripts/generate-theme-presets.ts` mevcut — yeni preset'i ekle: `mp-amozon.css` (varsayılan), `coral.css` (eski)
- [ ] **⚙️ Codex** — `bun run generate:presets` ile yeniden üret
- [x] **🧠 Claude** — Preset switcher UI gerekli mi karar — ✅ Faz 1'de UI yok (env tabanlı seçim); Faz 2'de Settings/Appearance sayfası — detay [tema-dark-mode-ve-preset-karari.md](tema-dark-mode-ve-preset-karari.md) Karar 2

### Build & smoke

- [ ] **⚙️ Codex** — `cd admin_panel && bun run build` — derleme hatasız
- [ ] **⚙️ Codex** — Dev server: dashboard + products + settings sayfalarını manuel aç — renk paletinin değiştiğini gör

---

## Sprint T2 — AdminShell + Sidebar Düzeni (1 gün)

amozon'un AdminShell'i 134 satır — minimal ve net. Sade navy sidebar + content grid. market_pulse'ın AdminShell'i şu an Shadcn tabanlı; **yapı korunur, density + renkler amozon stiline yaklaştırılır**.

### Yapı
- [x] **🧠 Claude** — amozon AdminShell'i oku — sidebar genişliği (244px), nav item style, breadcrumb pattern'ini özetle — ✅ **[tema-adminshell-ia-karari.md](tema-adminshell-ia-karari.md)** §"amozon AdminShell — Anatomi" + korunması gereken davranışlar (collapse, highlight, banner, active state)
- [ ] **⚙️ Codex** — market_pulse `admin_panel/src/components/layout/AdminShell.tsx` (varsa) ya da sidebar component'ini güncelle:
  - Sidebar genişlik: `244px` (amozon ile aynı)
  - Sidebar arkaplan: `var(--mp-sidebar-bg)` (#101827 navy)
  - Sidebar text: `var(--mp-sidebar-text)` (#cbd5e1)
  - Aktif item: `var(--mp-sidebar-active)` arkaplan + brand-color sol border 3px
  - Mobile collapse: 768px altı drawer
- [x] **🧠 Claude** — Sidebar IA: master plan modüller üst-seviye gruplar olarak — ✅ **[tema-adminshell-ia-karari.md](tema-adminshell-ia-karari.md)** Karar 1: full IA tree + tier-based modül görünürlüğü + Risk modülü grup içinde 5 alt menü + Codex için `MODULE_GROUPS` config örneği

### Density
- [ ] **⚙️ Codex** — Tablo/kart yoğunluğu: padding'ler amozon'a göre **bir tık daraltılır** (B2B operasyon hissi için). Tailwind class düzeyinde: `p-6` → `p-4` cards, `py-3` → `py-2` table rows — **Detay tablo:** [tema-adminshell-ia-karari.md](tema-adminshell-ia-karari.md) Karar 2 (5 ayrı density tablosu: table/card/form/button/sidebar)
- [ ] **🧠 Claude** — Visual QA: density değişimi ekranlarda nasıl duruyor (ekran başına 3 ekran karşılaştırma)

---

## Sprint T3 — Tipografi (yarım gün)

- [ ] **⚙️ Codex** — `admin_panel/src/lib/fonts/` veya `app/layout.tsx` font config:
  - Inter primary (next/font ile yerel)
  - System fallback: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- [ ] **⚙️ Codex** — Önceki TarMinGO veya benzeri eğlence font import'larını kaldır
- [ ] **⚙️ Codex** — `globals.css` body font-family token'ı Inter'a bağlı olsun
- [ ] **⚙️ Codex** — Heading hierarchy: h1 28px / h2 22px / h3 18px / body 14px (B2B kompakt). Tailwind `text-*` class'larıyla
- [ ] **🧠 Claude** — Türkçe karakter render kontrol (özellikle ş/ı/ğ) — Inter zaten destekliyor ama doğrula

---

## Sprint T4 — Tablo & Kart & Form Stilleri (1 gün)

amozon'un asıl gücü tablo görünümüydü — yoğun veri, az gürültü. market_pulse şu an `@tanstack/react-table` kullanıyor.

- [ ] **⚙️ Codex** — `admin_panel/src/components/data-table/` içindeki ortak DataTable bileşeninin stil class'larını gözden geçir:
  - Header: `bg-[var(--mp-panel-soft)] text-[var(--mp-muted)] uppercase tracking-wide text-xs`
  - Row hover: `hover:bg-[var(--mp-panel-soft)]`
  - Border: `border-[var(--mp-border)]`
  - Pagination: minimal numerik + prev/next
- [ ] **⚙️ Codex** — Kart (Card) component padding/shadow:
  - `bg-[var(--mp-panel)] border border-[var(--mp-border)] rounded-md`
  - shadow olarak `var(--mp-shadow)` (amozon'un soft drop'u)
- [ ] **⚙️ Codex** — Form input/select/textarea: border + focus ring brand teal'e
- [ ] **⚙️ Codex** — Badge component: status renkleri (danger/warning/success) `--mp-*` token'larına
- [ ] **🧠 Claude** — Risk modülünün "5 boyut + composite skor" tablosu — amozon'daki orijinal render'la birebir uyumlu mu? (kritik visual regression)

---

## Sprint T5 — Frontend (Public) Tema Senkronu (1 gün)

market_pulse'ın public frontend'i (`frontend/`) de aynı sade B2B paleti uygulamalı — landing + auth + dashboard.

- [ ] **🧠 Claude** — Public frontend'in mevcut görsel diline bak (TarMinGO tonu mu, yoksa zaten sade mi?) — `frontend/src/app/globals.css` oku — **Antigravity sonrası bağlamlı bakış**
- [ ] **⚙️ Codex** — `frontend/src/app/globals.css` aynı `--mp-*` token setine geç (admin_panel ile aynı palet)
- [ ] **⚙️ Codex** — Shadcn token map admin_panel ile aynı
- [x] **🧠 Claude** — Landing hero — TarMinGO tonlu görsel parça varsa **sade B2B hero'ya çevrilir** — ✅ **[landing-hero-sade-b2b.md](landing-hero-sade-b2b.md)** (3 hero varyant TR/EN/DE + 3 sütun module overview + 4 sayfa yapısı + görsel stratejisi + SEO meta + A/B test planı)
- [ ] **⚙️ Codex** — Frontend font Inter'a indir
- [x] **🧠 Claude** — Auth (login/register) ekranları için yön — ✅ [landing-hero-sade-b2b.md](landing-hero-sade-b2b.md) Sprint T5 aksiyon çıktıları sonu: amozon login referans, sol kart sağ panel feature listesi
- [ ] **⚙️ Codex** — Auth ekran implementasyonu (Claude yön + amozon referans)

---

## Sprint T6 — Visual QA & Regresyon (1 gün)

- [ ] **🧠 Claude + Antigravity** — Screenshot regresyon seti:
  - admin dashboard (önce / sonra)
  - admin products listesi
  - admin scans listesi
  - admin theses sayfası
  - admin settings sayfası
  - public landing
  - public login
  - dark mode varyantları (yukarıdakilerin tümü)
- [ ] **🧠 Claude** — Erişilebilirlik kontrol: kontrast oranı (text vs bg) WCAG AA geçer mi (özellikle muted text — #64748b on #f6f7f9)
  - https://webaim.org/resources/contrastchecker/ → 4.5:1 minimum body, 3:1 large text
- [ ] **🧠 Claude** — Mevcut müşterinin (varsa) ekranları kırıldı mı kontrol — özellikle özel branding olan tenant varsa preset switcher ile coral.css'e döndürülebilmeli
- [ ] **⚙️ Codex** — Lighthouse score karşılaştırma — performance/accessibility/seo migration sonrası ≥ önceki skor

---

## Sprint T7 — Cleanup & Doc (yarım gün)

- [ ] **⚙️ Codex** — Referans olarak korunan `admin_panel/src/styles/_reference/amozon-globals.css`'ı sil
- [ ] **⚙️ Codex** — Eski coral preset'i kullanılmıyorsa silme kararı (master plan'da silinmesi gerekiyor mu kontrol)
- [ ] **🧠 Claude** — `docs/teknik/tema-karsilastirma-2026-05.md`'yi finalize et — öncesi/sonrası screenshot setini sun
- [ ] **🧠 Claude** — Master plana ([MARKET_PULSE_SAAS_PLANI.md Bölüm 6](../strateji/MARKET_PULSE_SAAS_PLANI.md#L181)) tamamlandı notu ekle, tarih + commit hash
- [x] **🧠 Claude** — `docs/teknik/tema-sistem-kurallari.md` yaz — yeni component eklerken `--mp-*` token'ları nasıl kullanılmalı (rehber doküman) — ✅ **[tema-sistem-kurallari.md](tema-sistem-kurallari.md)** (Altın kural + token sözlüğü + Risk modülü renk eşleşmesi + density/font/icon/hover/animasyon kuralları + PR review checklist)

---

## Bekleyen Riskler (master plan Bölüm 11 ile uyumlu)

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| Shadcn token override'ı tüm bileşenleri etkiler, beklenmedik kırılma | Orta | Yüksek | Branch'te yapılır, görsel QA tamamlanmadan main'e merge olmaz |
| Mevcut müşterinin coral teması ile çelişki | Orta | Orta | Preset switcher — coral.css preset olarak korunur |
| Dark mode tutarsızlığı (bazı bileşen override eksik) | Orta | Düşük | Sprint T6 dark mode regression seti |
| Frontend ile admin_panel arasında token sapması | Düşük | Orta | Aynı `--mp-*` set, tek kaynak (önce admin'e yaz, sonra frontend'e kopyala) |

---

## Kalite Kapısı (PR-merge öncesi)

- [ ] `bun typecheck` hatasız (admin_panel + frontend)
- [ ] `bun run build` her ikisinde başarılı
- [ ] Sprint T6 screenshot regresyon seti onaylı
- [ ] Erişilebilirlik kontrastı WCAG AA geçer
- [ ] Lighthouse perf ≥ önceki skor
- [ ] coral preset hâlâ seçilebilir (mevcut müşteri için)
- [ ] CLAUDE.md "aynı dosyaya iki araç dokunmaz" kuralı ihlal edilmedi (Codex ile Claude aynı CSS dosyasına aynı anda yazmaz)

---

## Bağlantılı Belgeler

- 📋 Master strateji (Bölüm 6): [docs/strateji/MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md)
- 🔗 Kod aktarımı (eş paralel iş): [AMOZON_AKTARIM_CEKLISTI.md](AMOZON_AKTARIM_CEKLISTI.md)
- 🎨 amozon globals.css (kaynak): [../../../amozon/admin_panel/src/app/globals.css](../../../amozon/admin_panel/src/app/globals.css) (3133 satır)
- 🏗️ amozon AdminShell (kaynak): [../../../amozon/admin_panel/src/components/layout/AdminShell.tsx](../../../amozon/admin_panel/src/components/layout/AdminShell.tsx)
- 📐 Tema sistem kuralları (yazılacak): tema-sistem-kurallari.md
