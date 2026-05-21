# Tema Migrasyonu — AdminShell IA + Density + Sidebar Yapısı

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint T2 karar)
> **Hedef okuyucu:** ⚙️ Codex — AdminShell.tsx ve sidebar bileşenlerini bu karara göre yeniden düzenleyecek
> **Bağlı çeklist:** [TEMA_MIGRASYON_CEKLISTI.md](TEMA_MIGRASYON_CEKLISTI.md) Sprint T2
> **Kaynak referans:** [../../../amozon/admin_panel/src/components/layout/AdminShell.tsx](../../../amozon/admin_panel/src/components/layout/AdminShell.tsx) (134 satır)

---

## amozon AdminShell — Anatomi (öğrenilenler)

amozon admin paneli 134 satırlık minimal `AdminShell.tsx` kullanıyor. Yapı:

```
.shell (grid: 244px sidebar + main)
├── aside.sidebar
│   ├── .brand (logo + başlık + alt başlık)
│   ├── nav.nav (9 menü öğesi, lucide ikon + text)
│   ├── form.nav-logout (logout button)
│   └── button.sidebar-toggle (collapse — ChevronLeft/Right)
└── main.main
    ├── .budget-banner (Keepa kotası düşükse uyarı)
    ├── header.topbar (sayfa başlığı + brand icon)
    ├── {children}
    └── footer.footer
```

### Korunması gereken davranışlar

1. **Sidebar collapse** — localStorage'da saklı (`amozonSidebarCollapsed`)
2. **Highlight item** — "Yeni Tarama" gibi öncelikli menülere özel stil (`nav-item-highlight`)
3. **Budget banner** — Keepa kalan <%20 olduğunda otomatik banner; "Gizle" ile kapatılabilir (localStorage)
4. **Sidebar genişlik** — `244px` açık, `~64px` kapalı (sadece icon)
5. **Aktif item** — pathname eşleşince `active` class

---

## Karar 1 — IA (Information Architecture)

amozon tek modüllü → tek seviye 9 menü. market_pulse **modüler** → iki seviye gerek.

### Sidebar yapısı (final)

```
┌──────────────────────────────┐
│  ◯ Market Pulse              │ ← Brand
│  Modüler operasyon paneli    │
├──────────────────────────────┤
│  📊 Pano                     │ ← Root
│  ─────────────────           │
│  CRM ÇEKİRDEK                │ ← Modül başlığı (küçük, muted)
│    👥 Hesaplar               │
│    👤 Kişiler                │
│    📈 Pipeline               │
│    ✅ Görevler               │
│  ─────────────────           │
│  MONITOR                     │
│    🎯 Hedefler               │
│    🔔 Sinyaller              │
│    📋 Şablonlar              │
│  ─────────────────           │
│  DISCOVER (Lead Machine)     │
│    📤 ICP Profilleri         │
│    🔍 B2B Tarama             │
│    🎪 Fuar Tarama            │
│    🛒 Amazon Lead            │
│    ✓ Onay Paneli             │
│    🧬 Enrichment             │
│  ─────────────────           │
│  RISK (Amazon Scoring)       │ ← amozon'dan aktarılan
│    🎯 Yeni Tarama [★]        │ ← highlight
│    🔑 Anahtar Kelimeler      │
│    🔬 Araştırmalar           │
│    📦 Ürünler                │
│    📜 Tezler                 │
│  ─────────────────           │
│  OUTREACH                    │
│    ✉️ Taslaklar              │
│    📨 Gönderilenler          │
│    📊 İstatistikler          │
│  ─────────────────           │
│  AYARLAR                     │ ← Module-agnostic
│    ⚙️ Sistem                 │
│    👨‍💼 Kullanıcılar          │
│    🔌 Entegrasyonlar         │
│    📖 Dokümantasyon          │
└──────────────────────────────┘
│  ⤴️ Çıkış                    │
└──────────────────────────────┘
```

### Modül görünürlüğü (önemli)

- **Tüm modüller her zaman görünür değil.** Aktif tier'a göre filtre uygulanır.
- Free tier: CRM + Risk (free) + 1 izleme hedefi
- Pro tier: + Monitor + Discover (B2B+Fuar)
- Business tier: + Outreach
- Sanayi (Custom): hepsi + özel şablonlar

Kapalı olan modül **gri görünür ama tıklanabilir → upgrade modal'i** açar. master plan fiyatlandırma Bölüm 7 buna direkt uyar.

### Risk modülü konumu

amozon'da AdminShell **tek modül için** tasarlanmıştı:
```typescript
const items = [
  { label: 'Panel',        href: '/' },
  { label: 'Yeni Tarama',  href: '/scan',         highlight: true },
  { label: 'Anahtar Kelimeler', href: '/keywords' },
  { label: 'Araştırmalar', href: '/scans' },
  { label: 'Ürünler',      href: '/products' },
  { label: 'Tezler',       href: '/theses' },
  { label: 'Ayarlar',      href: '/settings' },
  { label: 'Dokümantasyon',href: '/documentation' },
  { label: 'Yazılımcı Notu',href: '/developer-notes' },
];
```

market_pulse'ta bunlar `/admin/risk/...` altına grup olarak girer:
```
RISK
  🎯 Yeni Tarama         → /admin/risk/scan      [highlight]
  🔑 Anahtar Kelimeler   → /admin/risk/keywords
  🔬 Araştırmalar        → /admin/risk/scans
  📦 Ürünler             → /admin/risk/products
  📜 Tezler              → /admin/risk/theses
```

"Yazılımcı Notu", "Dokümantasyon" Risk-spesifik değil — global menüye taşınır (Ayarlar altı).

---

## Karar 2 — Density

amozon'un sade B2B hissi **bir tık daraltılmış padding'ler**den geliyor. market_pulse'ın mevcut Shadcn varsayılan padding'leri biraz cömert.

### Tablo density

| Bileşen | Mevcut (Shadcn) | Yeni (amozon stili) |
|---|---|---|
| Table row | `py-3` (12px) | `py-2` (8px) |
| Table cell padding | `px-4` | `px-3` |
| Table header | `py-3 text-sm` | `py-2 text-xs uppercase tracking-wide` |

### Kart density

| Bileşen | Mevcut | Yeni |
|---|---|---|
| Card padding | `p-6` (24px) | `p-4` (16px) |
| Card header padding | `pb-4` | `pb-3` |
| Card title size | `text-xl` | `text-lg font-semibold` |

### Form density

| Bileşen | Mevcut | Yeni |
|---|---|---|
| Input height | `h-10` | `h-9` |
| Input padding-x | `px-3` | `px-3` (aynı) |
| Label margin-bottom | `mb-2` | `mb-1.5` |
| Form field gap | `space-y-4` | `space-y-3` |

### Button density

| Bileşen | Mevcut | Yeni |
|---|---|---|
| Default button | `h-10 px-4 py-2` | `h-9 px-3 py-1.5` |
| sm button | `h-9 px-3` | `h-8 px-2.5` |
| icon button | `h-10 w-10` | `h-9 w-9` |

### Sidebar item

| Bileşen | Mevcut | Yeni |
|---|---|---|
| nav-item padding | `py-2.5 px-3` | `py-2 px-3` |
| nav-item font | `text-sm` | `text-sm` (korunur) |
| nav-item icon size | 20 | 17 |

**Codex notu:** Bu değerler **Tailwind class değişikliği**dir, JSX yapısı değişmez. Component refactor değil, class refactor.

---

## Karar 3 — Sidebar Bileşeni — Implementation Strateji

market_pulse Shadcn ekosistemini kullanıyor. amozon'un manuel CSS sidebar'ını **Shadcn `<Sidebar>` component'i ile** yeniden yazmak yerine **var olan sidebar bileşenini stil olarak amozon'a yaklaştırmak** önerilir.

### Hedef davranış

```typescript
// admin_panel/src/components/layout/AdminSidebar.tsx (zaten varsa)

const MODULE_GROUPS: SidebarGroup[] = [
  {
    label: null,  // header'sız: Pano root link
    items: [{ label: 'Pano', icon: Gauge, href: '/admin' }],
  },
  {
    label: 'CRM ÇEKİRDEK',
    requiredTier: 'free',  // herkes
    items: [...],
  },
  {
    label: 'MONITOR',
    requiredTier: 'starter',
    items: [...],
  },
  {
    label: 'DISCOVER',
    requiredTier: 'starter',
    items: [
      { label: 'B2B Tarama', icon: Search, href: '/admin/lead-machine/b2b' },
      { label: 'Fuar Tarama', icon: Calendar, href: '/admin/lead-machine/fair' },
      // ...
    ],
  },
  {
    label: 'RISK',
    requiredTier: 'starter',  // Amazon scoring
    items: [
      { label: 'Yeni Tarama', icon: Play, href: '/admin/risk/scan', highlight: true },
      { label: 'Araştırmalar', icon: Activity, href: '/admin/risk/scans' },
      // ...
    ],
  },
  {
    label: 'OUTREACH',
    requiredTier: 'business',
    items: [...],
  },
  {
    label: 'AYARLAR',
    items: [
      { label: 'Sistem', icon: Settings, href: '/admin/settings' },
      { label: 'Kullanıcılar', icon: Users, href: '/admin/users' },
      { label: 'Entegrasyonlar', icon: Plug, href: '/admin/integrations' },
      { label: 'Dokümantasyon', icon: BookOpenText, href: '/admin/documentation' },
    ],
  },
];

function AdminSidebar({ tenantTier }: { tenantTier: Tier }) {
  return (
    <aside className="sidebar bg-[var(--mp-sidebar-bg)] text-[var(--mp-sidebar-text)] w-[244px]">
      <Brand />
      {MODULE_GROUPS.map((group) => {
        const isVisible = !group.requiredTier || tierGte(tenantTier, group.requiredTier);
        if (!isVisible) {
          // upgrade prompt modu — gri, tıklanabilir, upgrade modal açar
          return <DisabledGroup key={group.label} group={group} />;
        }
        return <Group key={group.label} group={group} />;
      })}
      <LogoutButton />
      <CollapseToggle />
    </aside>
  );
}
```

### Korunan amozon davranışları (Codex'in implementasyonda hatırlaması)

- [ ] localStorage collapse tercihi (`mpSidebarCollapsed`)
- [ ] Aktif route'a göre `active` class
- [ ] Highlight item için özel stil
- [ ] Mobile drawer (≤768px) — amozon'da yok ama market_pulse'a eklenir
- [ ] Brand area: "Market Pulse" + alt başlık "Modüler operasyon paneli"

### Banner sistemi

amozon'un budget-banner mantığı genelleştirilir:

```
<AdminShell>
  <BannerStack>
    {keepaUsageLow && <BudgetBanner module="risk" ... />}
    {appolloUsageLow && <BudgetBanner module="discover" ... />}
    {dmarcMissing && <ComplianceBanner ... />}
    {trialEnding && <TrialEndingBanner ... />}
  </BannerStack>
  <Topbar />
  {children}
  <Footer />
</AdminShell>
```

Banner'lar dismiss edilebilir, localStorage'da gizleme tercihi saklanır.

---

## Karar 4 — Topbar

amozon topbar tek başlık + bir icon (Database). market_pulse'ta:

```
┌──────────────────────────────────────────────────┐
│ {Sayfa başlığı}        🌐 [Workspace] | 🔔 | 👤 │
│ {Sayfa alt başlığı}                              │
└──────────────────────────────────────────────────┘
```

- Sayfa başlığı + alt başlık (amozon ile aynı)
- Workspace selector (multi-tenant'a hazırlık — Faz 2'ye işaret)
- Bildirim icon + badge (yeni sinyal var işareti)
- Profil avatar + dropdown

Bu kısım sade tutulur — amozon ruhu korunur, sadece minimal eklemeler.

---

## Sprint T2 Aksiyon Çıktıları (Codex için)

- [ ] `MODULE_GROUPS` config array'i `admin_panel/src/navigation/sidebar-items.ts` (varsa) içine
- [ ] AdminShell + AdminSidebar bileşenleri yukarıdaki density değerleriyle
- [ ] Banner stack sistemi
- [ ] Topbar minimal — workspace selector Faz 2 işareti
- [ ] localStorage collapse + banner gizleme
- [ ] Tier tabanlı modül görünürlüğü (DisabledGroup ile upgrade modal)
- [ ] Mobile drawer (≤768px)

---

## Bağlantılar

- 📋 Tema migrasyon çeklisti: [TEMA_MIGRASYON_CEKLISTI.md](TEMA_MIGRASYON_CEKLISTI.md)
- 🎨 amozon AdminShell kaynak: [../../../amozon/admin_panel/src/components/layout/AdminShell.tsx](../../../amozon/admin_panel/src/components/layout/AdminShell.tsx)
- 🌗 Dark mode + preset kararı: [tema-dark-mode-ve-preset-karari.md](tema-dark-mode-ve-preset-karari.md)
- 📐 Token kullanım rehberi: [tema-sistem-kurallari.md](tema-sistem-kurallari.md)
- 🏗️ Master plan modül mimarisi: [../strateji/MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md) Bölüm 3
