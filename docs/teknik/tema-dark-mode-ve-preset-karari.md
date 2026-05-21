# Tema Migrasyonu — Dark Mode + Preset Switcher Kararı

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint T0-T1 karar)
> **Hedef okuyucu:** ⚙️ Codex — token override + preset dosyaları + dark mode tanımları
> **Bağlı çeklist:** [TEMA_MIGRASYON_CEKLISTI.md](TEMA_MIGRASYON_CEKLISTI.md) Sprint T0 + T1
> **Master plan:** [MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md) Bölüm 6

---

## Karar 1 — Dark Mode

**Light mode varsayılan; dark mode altyapısı hazır ama kapalı (Faz 2'ye işaret).**

### Gerekçe

amozon admin panelinin kendisinde **dark mode YOK**. Sadece light theme — pastel off-white background, navy sidebar, teal accent. Bu B2B operasyon paneli için bilinçli bir seçim:
- Tablolarda kontrast yüksek, veri okunabilir
- Yorgun göze yakın değil ama uzun seansta sade
- Yazıcıdan çıkarsa kağıdı bozmaz (Risk raporları yazdırılır)

market_pulse'ın mevcut admin'inde PreferencesBoot.tsx ile dark mode altyapısı zaten kurulu (Shadcn token'ları üzerinden). Yapılacak:

| Karar | Detay |
|---|---|
| Default | Light mode (amozon paleti) |
| Dark mode token tanımları | **Yazılır** — `:root.dark { ... }` bloğu |
| Dark mode UI toggle | **Görünür ama önerilmez** — Header'da küçük ikon, sade çevirir; varsayılan light |
| Müşteri customization | Faz 2 — preset switcher genişletildiğinde 3 mod (light / dark / system) |

### Dark mode token tanımları (Codex'in kullanacağı)

```css
:root.dark,
[data-theme="dark"] {
  --mp-bg:           #0a0d12;        /* very dark navy */
  --mp-panel:        #11151c;        /* slightly lighter panel */
  --mp-panel-soft:   #0d1117;        /* darker than panel — alternate row */
  --mp-text:         #e5e7eb;        /* light gray */
  --mp-muted:        #94a3b8;        /* slate-400 */
  --mp-border:       #1f2937;        /* gray-800 */
  --mp-brand:        #14b8a6;        /* teal-500 — daha parlak, dark bg üzerinde okunur */
  --mp-brand-dark:   #0d9488;
  --mp-danger:       #f87171;        /* red-400 */
  --mp-warning:      #fbbf24;        /* amber-400 */
  --mp-success:      #4ade80;        /* green-400 */
  --mp-shadow:       0 12px 30px rgba(0, 0, 0, 0.4);

  /* Sidebar — light'a göre az değişir */
  --mp-sidebar-bg:    #050810;
  --mp-sidebar-text:  #cbd5e1;
  --mp-sidebar-active: rgba(20, 184, 166, 0.2);
}
```

### Erişilebilirlik notu

Dark mode'da tüm kontrast oranları **WCAG AA** karşılamalı (4.5:1 body, 3:1 large). Sprint T6'da `webaim` kontrast kontrol pas etmelidir.

Risk modülünün karar etiketleri (GÜVENLİ/DİKKATLİ_OL/GİRME) renkleri **light'taki kadar net olmalı**. Sarı (warning) dark mode'da görünürlüğü zor — `#fbbf24` (amber-400) seçildi, test edilecek.

---

## Karar 2 — Preset Switcher

**Faz 1: 2 preset hardcode. Faz 2: kullanıcı tercih edilebilir.**

### Mevcut durum

market_pulse admin panel'inde `admin_panel/src/styles/presets/` klasörü var, `generate-theme-presets.ts` script'i mevcut. Şu an coral palet hardcoded; tema migrasyonu sonrası 2 preset olacak:

```
admin_panel/src/styles/presets/
├── mp-default.css         (yeni amozon paleti — varsayılan)
└── coral.css              (eski coral paleti — mevcut müşteri/preview için korunur)
```

### Faz 1 — Hardcoded

- Yeni kurulumlar: `mp-default.css` varsayılan
- Mevcut müşteriler (kuruluysa): `coral.css` URL parametresi veya env ile seçilir
- Preset switcher UI **görünmez** — env veya admin override ile değişir

### Faz 2 — Kullanıcı tercih

Tetik: Master plan tier'ları aktif olduğunda (Pro+) "tema customization" feature olarak satılabilir.

```
admin_panel/.../settings/appearance
- [ ] Tema seçimi:
       ○ Market Pulse Default (yeni)
       ○ Coral Classic (eski)
       ○ Custom (Business+ tier)
```

`tenant_preferences` tablosunda `theme_preset` alanı tutulur. Multi-tenant geldikten sonra.

### Codex'in yapacağı (Sprint T1)

- [ ] `generate-theme-presets.ts` güncelle — 2 preset üret (mp-default + coral)
- [ ] coral paletini mevcut globals.css'ten çıkar, preset dosyasına taşı
- [ ] mp-default'u Sprint T0 onaylı amozon paletiyle yaz
- [ ] `admin_panel/src/app/layout.tsx` veya PreferencesBoot.tsx içinde env tabanlı preset seçimi (Faz 1)
- [ ] `admin_panel/.env.example`'a `NEXT_PUBLIC_THEME_PRESET=mp-default` ekle

---

## Karar 3 — System (OS-level) Mode Tespiti

`@media (prefers-color-scheme: dark)` — kullanıcı OS dark mode'daysa otomatik geç mi?

**Karar: HAYIR (Faz 1).**

Gerekçe:
- amozon sade B2B'sini OS preference'a göre değiştirmek istenmiyor
- Toplu kullanılan B2B aracı — tutarlı görsellik kullanıcı eğitimi açısından kritik
- Faz 2'de kullanıcı manuel seçim yaparsa OS preference önerilebilir

Codex'in yapacağı: `@media (prefers-color-scheme: dark)` selector **yazma**. Dark mode sadece manuel `data-theme="dark"` veya `.dark` class ile aktif olur.

---

## Karar 4 — Tema Geçiş Animasyonu

Yumuşak geçiş için `transition: background-color 0.2s ease, color 0.2s ease` body üzerinde olur. Ama:

**Karar: Sayfa içi her elementte transition tanımlama.**

Sadece:
```css
html {
  transition: background-color 0.2s ease;
}
```

Tüm bileşenlere transition eklersek **performans düşer** (her hover'da repaint). Şu an mevcut hover transition'ları korunur, ekstra eklenmez.

---

## Final Token Paleti Onayı (Sprint T0 çıkışı)

[TEMA_MIGRASYON_CEKLISTI.md Sprint T0](TEMA_MIGRASYON_CEKLISTI.md) "Final token paletini onayla" maddesi için:

✅ **ONAY:** Aşağıdaki palet `mp-default.css`'in light mode değeri olarak yazılır:

```css
:root {
  /* Backgrounds & surfaces */
  --mp-bg:          #f6f7f9;
  --mp-panel:       #ffffff;
  --mp-panel-soft:  #f9fafb;

  /* Text */
  --mp-text:        #111827;
  --mp-muted:       #64748b;

  /* Borders & shadows */
  --mp-border:      #d9dee7;
  --mp-shadow:      0 12px 30px rgba(15, 23, 42, 0.08);

  /* Brand */
  --mp-brand:       #0f766e;   /* teal-700 — Notion/Linear hissi */
  --mp-brand-dark:  #115e59;   /* teal-800 */

  /* Status */
  --mp-danger:      #dc2626;   /* red-600 */
  --mp-warning:     #b45309;   /* amber-700 */
  --mp-success:     #15803d;   /* green-700 */

  /* Sidebar (navy) */
  --mp-sidebar-bg:     #101827;
  --mp-sidebar-text:   #cbd5e1;
  --mp-sidebar-active: rgba(15, 118, 110, 0.2);

  /* Spacing & radius — kompakt B2B */
  --mp-radius-sm: 4px;
  --mp-radius:    6px;
  --mp-radius-lg: 8px;
}
```

**Codex bu paleti `admin_panel/src/styles/presets/mp-default.css` olarak yazar; Shadcn token map'i bu üzerinden çalışır ([TEMA_MIGRASYON_CEKLISTI.md Sprint T1](TEMA_MIGRASYON_CEKLISTI.md) §"Shadcn token map" bölümü).**

---

## Sprint T1 Aksiyon Çıktıları

Bu dosyadan Codex'in çıkaracağı somut işler:

1. **`mp-default.css`** dosyası oluştur — yukarıdaki light mode token'ları + dark mode override bloğu
2. **`coral.css`** preset olarak mevcut paleti taşı (eski müşteri korunum)
3. **`generate-theme-presets.ts`** her ikisini build pipeline'a ekle
4. **`PreferencesBoot.tsx`** — `data-theme` veya `.dark` class toggle altyapısı (UI henüz görünmez)
5. **Settings sayfası** — Faz 2'de görünür olacak preset selector için yer hazırla (yorum satırı veya `<!-- TODO Faz 2 -->`)

---

## Bağlantılar

- 📋 Tema migrasyon çeklisti: [TEMA_MIGRASYON_CEKLISTI.md](TEMA_MIGRASYON_CEKLISTI.md)
- 🎨 amozon globals.css (light mode kaynak): [../../../amozon/admin_panel/src/app/globals.css](../../../amozon/admin_panel/src/app/globals.css)
- 🏗️ AdminShell IA + density kararı (paralel belge): [tema-adminshell-ia-karari.md](tema-adminshell-ia-karari.md)
- 📐 Tema sistem kuralları (yeni component rehberi): [tema-sistem-kurallari.md](tema-sistem-kurallari.md)
- 🏠 Public frontend hero kopyaları: [landing-hero-sade-b2b.md](landing-hero-sade-b2b.md)
