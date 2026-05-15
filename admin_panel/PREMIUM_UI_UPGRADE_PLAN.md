# Premium UI Upgrade Plan — MarketPulse Admin Panel

MarketPulse yönetim panelini mevcut tema sistemi üzerinde B2B pazar istihbarat estetiğine yükseltme yol haritası.

---

## 1. Mevcut Tema Durumu

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--primary` | `--logo-coral` (#E8A598) | Ana marka rengi — butonlar, vurgu |
| `--brand-gold` | `#22c55e` (green, dark: #4ade80) | Pozitif aksiyon, onay, "incelendi" |
| `--brand-gold-strong` | `#15803d` | Hover state, strong yeşil |
| `--destructive` | `oklch(0.704 0.191 22.216)` | Silme, kritik hata |
| `--sidebar` | `oklch(0.97 0.02 145)` — yeşil ton | Sidebar arka plan |
| `--muted` | `oklch(0.967 0.001 286.375)` | Badge arka plan, soluk alanlar |
| `--card` | `oklch(1 0 0)` | Kart arka planı |

**Severity renkleri** şu an bileşenlerde hard-coded Tailwind class olarak duruyor:
- `critical` → `bg-destructive text-destructive-foreground`
- `high` → `bg-orange-500 text-white`
- `medium` → `bg-yellow-400 text-yellow-900`
- `low` → `bg-green-500 text-white` (brand-gold ile uyumlu)

---

## 2. Tasarım Vizyonu

- **Tema**: Data-Driven B2B — temiz, bilgi yoğun, hızlı okunabilir
- **Marka**: Coral primary + Green accent — mevcut token sistemini koru
- **Hedef**: Severity renk sistemini merkezileştir, kart ve badge bileşenlerini tutarlı hale getir, churn risk görseli ekle

---

## 3. Faz 1 — Token Temizliği (`globals.css`)

- [ ] Severity sınıflarını `@layer utilities` altında merkezi bir yerde tanımla:
  ```css
  .severity-critical { @apply bg-destructive text-destructive-foreground; }
  .severity-high     { @apply bg-orange-500 text-white; }
  .severity-medium   { @apply bg-yellow-400 text-yellow-900; }
  .severity-low      { @apply bg-green-500 text-white; }
  ```
- [ ] Churn risk renk utility'si ekle:
  ```css
  .churn-low    { @apply text-green-600; }
  .churn-medium { @apply text-yellow-600; }
  .churn-high   { @apply text-red-600 font-bold; }
  ```
- [ ] `--shadow-glow-primary` zaten var (`0 0 20px rgba(22,163,74,0.22)`) — `shadow-glow-primary` Tailwind class'ı olarak expose et
- [ ] `market-card` utility class — mevcut `card` üzerine sol border vurgusu:
  ```css
  .market-card { @apply rounded-lg border bg-card shadow-sm border-l-4 border-l-primary/30; }
  ```

---

## 4. Faz 2 — Yüksek Etkili Modüller

### MarketPulse Dashboard (`/admin/market`)
- [ ] Stats kartları: `market-card` class, ikonu `text-primary` (coral)
- [ ] Hover: `hover:shadow-md hover:border-l-primary/60` transition
- [ ] Link kartları: alt kısımda `text-xs text-muted-foreground` "→ Git" metni

### Sinyaller Paneli (`/admin/market/signals`)
- [ ] Hard-coded severity class'larını `severity-*` utility'sine taşı
- [ ] Kritik sinyallerde satır arka planı: `bg-destructive/5`
- [ ] İncelenmiş sinyallerde: `opacity-50` yerine `line-through text-muted-foreground`
- [ ] "İncelendi" butonu: `text-brand-gold hover:text-brand-gold-strong` (yeşil — mevcut token)

### Hedef Firmalar (`/admin/market/targets`)
- [ ] Churn skor sütunu: `churn-low / churn-medium / churn-high` class'ları (Faz 1'den)
- [ ] Kategori badge'leri: `bg-muted text-muted-foreground text-xs rounded px-2`
- [ ] Status badge'leri: mevcut renk kodlamasını `badge` utility'sine taşı

### Lead Pipeline (`/admin/market/leads`)
- [ ] Priority okları (`↑ ↓ →`) yerine Lucide `TrendingUp / Minus / TrendingDown` ikonları
- [ ] Status badge'leri `bg-*-100 text-*-800` → `dark:` varyantları ekle (şu an dark mode uyumsuz)
- [ ] Skor sütunu: `text-primary font-bold` (coral vurgu)

---

## 5. Faz 3 — Dialog Bileşenleri

- [ ] **AddTargetDialog / AddLeadDialog**: `DialogContent` içinde section ayırıcı (`<div class="border-t my-2" />`)
- [ ] **AddSignalDialog**: Severity `Select` içinde her `SelectItem`'a renk dot önizleme:
  ```tsx
  <div class="flex items-center gap-2">
    <span class="size-2 rounded-full severity-critical" />
    Kritik
  </div>
  ```
- [ ] Tüm dialog'larda submit buton: `bg-primary hover:bg-primary/90` (coral — zaten default)

---

## 6. Faz 4 — Dark Mode Tutarlılığı

Şu an leads-panel ve signals-panel'deki badge'ler dark mode'da renk bozukluğu yaşıyor:

- [ ] `bg-blue-100 text-blue-800` → `bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400` pattern'ı tüm badge'lere uygula
- [ ] Tablo satır hover: `hover:bg-muted/40` — mevcut `hover:bg-muted` yerine daha hafif
- [ ] Kart border dark modda: `border-white/10` yerine `border-border` (mevcut token) kullan

---

## 7. UI/UX Standartları (Mevcut Temaya Göre)

| Öğe | Mevcut | Hedef |
|-----|--------|-------|
| Primary buton | `bg-primary` (coral) | Korunur |
| Başarı/İncelendi butonu | `text-green-600` | `text-brand-gold hover:text-brand-gold-strong` |
| Silme butonu | `text-destructive` | Korunur |
| Kart container | `<Card>` Shadcn | `market-card` utility + `<Card>` |
| Severity badge | Hard-coded class | `severity-*` utility |
| Churn rengi | Inline ternary | `churn-*` utility |
| Status badge (leads) | Sadece light mode | Dark mode varyantı eklenir |

---

## 8. Yapılmayacaklar

- Yeni bir marka renk skalası eklenmeyecek — mevcut coral + green korunur
- Glassmorphism / backdrop-blur — bu proje için overkill, veri yoğunluğu öncelikli
- Custom font değişikliği — mevcut Inter korunur
- Tema preset değişikliği — brutalist/soft-pop/tangerine olduğu gibi kalır

---

*MarketPulse Admin Panel — Premium UI Upgrade Documentation*
*Son güncelleme: 2026-05-07*
