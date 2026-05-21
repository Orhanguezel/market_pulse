# Tema Sistem Kuralları — Yeni Component Token Rehberi

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint T7 — kalıcı rehber)
> **Hedef okuyucu:** ⚙️ Codex + 🤖 Antigravity + 🖊️ Copilot — bundan sonra eklenen tüm component'ler bu kurallara uyar
> **Bağlı çeklist:** [TEMA_MIGRASYON_CEKLISTI.md](TEMA_MIGRASYON_CEKLISTI.md) Sprint T7
> **Bağlı kararlar:** [tema-dark-mode-ve-preset-karari.md](tema-dark-mode-ve-preset-karari.md), [tema-adminshell-ia-karari.md](tema-adminshell-ia-karari.md)

---

## Bu belge nedir

Market Pulse'un görsel sistemi için **kalıcı kural seti**. Tema migrasyonu (Sprint T0-T7) sonrası yeni component eklenirken bu kurallara uyulur. Aksi takdirde:
- Dark mode geçişinde kırılır
- Preset switcher (coral ⇄ mp-default) tutarsız davranır
- Müşteri customization Faz 2'sinde tüm component'leri tek tek düzenleme gerekir

---

## Altın Kural

> **Hex değer kullanma. Tailwind named color kullanma. Sadece `var(--mp-*)` token'larını kullan.**

Yanlış:
```tsx
<div className="bg-white text-gray-900 border-gray-200">
<div style={{ color: '#0f766e' }}>
<div className="bg-teal-700">
```

Doğru:
```tsx
<div className="bg-[var(--mp-panel)] text-[var(--mp-text)] border-[var(--mp-border)]">
<div className="text-[var(--mp-brand)]">
```

İstisna: Shadcn'in semantic class'ları (`bg-background`, `text-foreground`, `border-border`, `text-primary`, vs.) **kullanılabilir** çünkü onlar zaten `var(--mp-*)` token'larına bağlı (mp-default.css'te map edildi). Yani:

✅ Tercih sırası:
1. Shadcn semantic: `bg-card`, `text-muted-foreground`, `border-border`
2. Doğrudan token: `bg-[var(--mp-panel)]`, `text-[var(--mp-muted)]`
3. ❌ Hex / Tailwind hardcoded: **kullanma**

---

## Token Sözlüğü — Ne Hangi Token

### Background & Surface

| Use case | Token | Shadcn karşılığı |
|---|---|---|
| Sayfa background | `--mp-bg` | `bg-background` |
| Card / panel | `--mp-panel` | `bg-card` |
| Hover state / alt row | `--mp-panel-soft` | `bg-muted` |
| Modal overlay | `rgba(0,0,0,0.4)` | (sabit) |

### Text

| Use case | Token | Shadcn karşılığı |
|---|---|---|
| Primary text | `--mp-text` | `text-foreground` |
| Muted / placeholder | `--mp-muted` | `text-muted-foreground` |
| On brand bg | `#ffffff` sabit | `text-primary-foreground` |

### Border

| Use case | Token | Shadcn karşılığı |
|---|---|---|
| Default | `--mp-border` | `border-border` |
| Input | `--mp-border` | `border-input` |
| Focus ring | `--mp-brand` | `ring-ring` |

### Brand

| Use case | Token | Shadcn karşılığı |
|---|---|---|
| Primary action button | `--mp-brand` | `bg-primary` |
| Hover state | `--mp-brand-dark` | `bg-primary/90` |
| Active link | `--mp-brand` | `text-primary` |
| Brand badge bg | `rgba(15,118,110,0.1)` | (custom) |

### Status

| Use case | Token | Shadcn karşılığı |
|---|---|---|
| Error / danger | `--mp-danger` | `text-destructive`, `bg-destructive` |
| Warning | `--mp-warning` | (custom — `bg-[var(--mp-warning)]`) |
| Success | `--mp-success` | (custom — `bg-[var(--mp-success)]`) |
| Info | `--mp-brand` | `bg-primary` |

### Sidebar

| Use case | Token |
|---|---|
| Sidebar bg | `--mp-sidebar-bg` |
| Sidebar text | `--mp-sidebar-text` |
| Sidebar active item bg | `--mp-sidebar-active` |
| Sidebar active item border | `--mp-brand` |

### Shadow

| Use case | Token |
|---|---|
| Card / dropdown drop shadow | `--mp-shadow` |
| Modal / dialog shadow | `0 25px 50px rgba(0,0,0,0.25)` (sabit, ileride token'lanır) |

### Radius

| Use case | Token |
|---|---|
| Small (badge, chip) | `--mp-radius-sm` (4px) |
| Default (button, input) | `--mp-radius` (6px) |
| Large (card) | `--mp-radius-lg` (8px) |
| Pill (avatar, status dot) | `9999px` |

---

## Risk Modülü — Özel Renk Eşleşmeleri

Risk modülü karar etiketleri ([risk-modulu-musteri-taahhutleri.md](risk-modulu-musteri-taahhutleri.md)) **müşteri tarafından net renk beklenen**:

```tsx
// admin_panel/src/components/risk/decision-badge.tsx

const DECISION_COLORS = {
  'GÜVENLİ':      'bg-[var(--mp-success)] text-white',
  'DİKKATLİ_OL':  'bg-[var(--mp-warning)] text-white',
  'GİRME':        'bg-[var(--mp-danger)] text-white',
} as const;
```

Confidence:
```tsx
const CONFIDENCE_COLORS = {
  HIGH:               'bg-[var(--mp-success)] text-white',
  MEDIUM:             'bg-[var(--mp-brand)] text-white',
  LOW:                'bg-[var(--mp-warning)] text-white',
  INSUFFICIENT_DATA:  'bg-[var(--mp-muted)] text-white',
} as const;
```

Bu renkler **dark mode'da otomatik dönüşür** çünkü `--mp-success/danger/warning` dark token bloğunda override edilir.

---

## Density Kuralları

Master plan'da "ciddi B2B operasyon" hissi için kompakt density seçildi. [tema-adminshell-ia-karari.md](tema-adminshell-ia-karari.md) §2'de tablo var.

Yeni component'te:

| Bileşen tipi | Padding | Font size |
|---|---|---|
| Button (default) | `h-9 px-3 py-1.5` | `text-sm` |
| Button (sm) | `h-8 px-2.5` | `text-xs` |
| Input | `h-9 px-3` | `text-sm` |
| Card | `p-4` | — |
| Card title | — | `text-lg font-semibold` |
| Table row | `py-2` | `text-sm` |
| Table header | `py-2 px-3` | `text-xs uppercase tracking-wide font-medium` |
| Form field gap | `space-y-3` | — |
| Section gap | `space-y-6` | — |

**Card padding'i `p-6` yapan PR review'de reddedilir.** Density tutarsızlığı tema migrasyonunun bütünlüğünü bozar.

---

## Font Kuralları

Inter ana font. `app-fonts.ts` üzerinden next/font ile yerel yüklenir.

```typescript
// admin_panel/src/lib/fonts/app-fonts.ts
import { Inter } from 'next/font/google';

export const appFont = Inter({
  subsets: ['latin', 'latin-ext'],  // Türkçe karakter
  variable: '--font-inter',
  display: 'swap',
});
```

CSS:
```css
:root {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, -apple-system,
               BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  font-family: var(--font-sans);
}
```

Heading boyutları:
| Element | Class |
|---|---|
| H1 | `text-2xl font-semibold` (28px) |
| H2 | `text-xl font-semibold` (22px) |
| H3 | `text-lg font-semibold` (18px) |
| H4 | `text-base font-semibold` (16px) |
| Body | `text-sm` (14px) — admin panel default |
| Body large | `text-base` (16px) — landing |
| Small / caption | `text-xs` (12px) |

**Mono için:** `font-mono` Inter'in monospace düşmanına değil, Tailwind default'a (Menlo, Consolas) düşer. ASIN, SKU, ID gösteren UI'da `font-mono text-xs` kullan.

---

## Icon Kuralları

Lucide React zaten dependency. Kural:

- **Default size:** 16-18px sidebar/button, 20px topbar/card, 24px modal/empty state
- **Color:** `text-current` veya `text-[var(--mp-muted)]` veya `text-[var(--mp-brand)]` — hardcoded hex yok
- **Stroke width:** Default 2 (Lucide default), tek-tek değiştirme

Yanlış:
```tsx
<Database size={22} color="#0f766e" />
```

Doğru:
```tsx
<Database size={22} className="text-[var(--mp-brand)]" />
```

---

## Hover / Focus / Active State Kuralları

### Button hover

```tsx
className="bg-[var(--mp-brand)] hover:bg-[var(--mp-brand-dark)]"
```

### Link hover

```tsx
className="text-[var(--mp-brand)] hover:underline"
```

### Table row hover

```tsx
className="hover:bg-[var(--mp-panel-soft)]"
```

### Focus ring (Shadcn default + token map)

Otomatik — `:focus-visible` Shadcn ile zaten brand renginde. Manuel override gereksiz.

### Active (pressed) state

```tsx
className="active:scale-[0.98] transition-transform"
```

Sadece button'larda kullan. Çok agresif animasyon yok.

---

## Animasyon Kuralları

| Kullanım | Süre | Easing |
|---|---|---|
| Hover transition | `150ms` | `ease-out` |
| Modal/drawer açılış | `200ms` | `ease-out` |
| Page transition | `250ms` | `ease-in-out` |
| Toast slide in | `200ms` | `cubic-bezier(0.4,0,0.2,1)` |
| Sidebar collapse | `200ms` | `ease` |

Daha uzun süreli animasyon kullanma — "ciddi B2B" hissi için hızlı responsiv olmalı.

Tailwind class kısayolları:
```tsx
className="transition-colors duration-150 ease-out"
className="transition-all duration-200 ease-out"
```

---

## Component Pattern'ları

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
    <CardDescription>{desc}</CardDescription>
  </CardHeader>
  <CardContent>{children}</CardContent>
  <CardFooter>{actions}</CardFooter>
</Card>
```

Shadcn default Card'i kullan; padding density (p-4) varsayılan olarak `card.tsx`'te ayarlı olmalı (Codex Sprint T1 işi).

### Form

```tsx
<form className="space-y-3">
  <div className="space-y-1.5">
    <Label>İsim</Label>
    <Input />
    <FormDescription>...</FormDescription>
    <FormMessage />
  </div>
  <Button type="submit">Kaydet</Button>
</form>
```

`space-y-3` form field gap, `space-y-1.5` label/input/desc bloğu içi gap.

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <FileQuestion className="h-12 w-12 text-[var(--mp-muted)] mb-4" />
  <h3 className="text-lg font-semibold text-[var(--mp-text)]">Henüz hiç X yok</h3>
  <p className="text-sm text-[var(--mp-muted)] mt-1">İlk X'inizi eklemek için...</p>
  <Button className="mt-4">İlk X'i Ekle</Button>
</div>
```

### Status Indicator (badge)

```tsx
<span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[var(--mp-success)] text-white">
  Onaylı
</span>
```

---

## PR Review Checklist (her component için)

Yeni veya değişen component PR review'undeki kontrol:

- [ ] Hex kullanılmamış (`grep -E '#[0-9a-fA-F]{3,6}'` boş döner)
- [ ] Tailwind named color hardcoded yok (`grep -E 'bg-(red|green|blue|gray|teal|...|amber|stone|slate)-[0-9]'` — Shadcn semantic veya `[var(--mp-*)]` dışında)
- [ ] Density kurallarına uyar (p-6 card yok, p-4 standart)
- [ ] Heading hierarchy doğru (H1 sadece sayfa başlığı)
- [ ] Hover state tanımlı
- [ ] Icon'lar `text-current` veya token color (hardcoded hex yok)
- [ ] Dark mode'da görsel test edilmiş (en azından sayfayı `.dark` class ile aç, kontrast kabul edilebilir mi)
- [ ] Türkçe karakter render kontrolü (ş, ı, ğ, ç, ö, ü)

---

## Storybook (Faz 2 önerisi)

Şu an Storybook yok. Tema migrasyonu olgunlaştıktan sonra (Sprint T7 sonrası), tüm temel component'leri Storybook'a koymak:
- Light + dark karşılaştırma
- Token değişikliklerinin etkisini izole görsel olarak gör
- Yeni preset eklerken (Faz 2 müşteri customization) regression test

Hedef: Sprint T7 + 1 ay. Bu rehber dosyası Storybook story'leri için kaynak olur.

---

## Bağlantılar

- 📋 Tema migrasyon çeklisti: [TEMA_MIGRASYON_CEKLISTI.md](TEMA_MIGRASYON_CEKLISTI.md)
- 🌗 Dark mode + preset kararı: [tema-dark-mode-ve-preset-karari.md](tema-dark-mode-ve-preset-karari.md)
- 🏗️ AdminShell IA kararı: [tema-adminshell-ia-karari.md](tema-adminshell-ia-karari.md)
- 🏠 Landing hero kopyaları: [landing-hero-sade-b2b.md](landing-hero-sade-b2b.md)
- 📦 Risk modülü renk eşleşmeleri (özel kural): [risk-modulu-musteri-taahhutleri.md](risk-modulu-musteri-taahhutleri.md)
