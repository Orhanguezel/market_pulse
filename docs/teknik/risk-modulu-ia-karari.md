# Risk Modülü — IA (Information Architecture) Kararı

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (AMOZON_AKTARIM çeklisti A3)
> **Hedef okuyucu:** ⚙️ Codex — Risk modülü admin sayfalarını taşırken sidebar yapısını bu karara göre koyacak
> **Bağlı:** [AMOZON_AKTARIM_CEKLISTI.md](AMOZON_AKTARIM_CEKLISTI.md) Sprint A3 + [tema-adminshell-ia-karari.md](tema-adminshell-ia-karari.md)

---

## Karar

**Risk = grup başlığı + 5 alt menü.** Tek menü değil.

[tema-adminshell-ia-karari.md](tema-adminshell-ia-karari.md) içinde önerilen sidebar yapısı zaten doğru — burada **Risk modülüne özel netleştirme**:

```
─────────────────
RISK (Amazon Scoring)
  🎯 Yeni Tarama [★]       → /admin/risk/scan           (highlight — primary action)
  🔬 Araştırmalar           → /admin/risk/scans
  📦 Ürünler                → /admin/risk/products
  🔑 Anahtar Kelimeler      → /admin/risk/keywords
  📜 Tezler                 → /admin/risk/theses
─────────────────
```

5 alt menü. amozon'da 9 menü vardı, **4'ü Risk-spesifik değil → global menüye taşınır**:
- `documentation` → Ayarlar/Dokümantasyon (global)
- `developer-notes` → Ayarlar/Dokümantasyon altında veya kaldırılır (eski admin notu)
- `debug-ui` → Geliştirici sayfası, gerekirse Ayarlar altı
- `users` → market_pulse'ın kendi user yönetimi (global)
- `login` → market_pulse auth sayfası (global)

---

## Niye Alt Menü (Tek Menü Değil)

Önceki amozon **tek modüllü** olduğu için 9 menü tek satır gibi göründü. market_pulse **modüler** — birden fazla modül (CRM / Monitor / Discover / Risk / Outreach) yan yana duracak. Eğer Risk de 5 satır tek-seviyeli olursa sidebar çok kalabalıklaşır.

Grup başlığı altında toplama:
- Görsel olarak temiz
- Tier filtresi grup seviyesinde uygulanır (`requiredTier: 'starter'` Risk grubuna)
- Modül kapalı/açık görünürlüğü grup düzeyinde
- Kullanıcı Risk modülünün "kapsamını" bir bakışta anlar

---

## Default Sayfa (Risk grup tıklanınca nereye)

Grup başlığına tıklayınca **`/admin/risk/scan`** açılır — primary action ("Yeni Tarama"). Bu amozon ile aynı default.

Codex notu:
```typescript
const RISK_GROUP = {
  label: 'RISK',
  href: '/admin/risk/scan',  // grup tıklanırsa default
  requiredTier: 'starter',
  items: [
    { label: 'Yeni Tarama', href: '/admin/risk/scan', icon: Play, highlight: true },
    { label: 'Araştırmalar', href: '/admin/risk/scans', icon: Activity },
    { label: 'Ürünler', href: '/admin/risk/products', icon: PackageSearch },
    { label: 'Anahtar Kelimeler', href: '/admin/risk/keywords', icon: KeyRound },
    { label: 'Tezler', href: '/admin/risk/theses', icon: Scale },
  ],
};
```

---

## Highlight Aksiyon — "Yeni Tarama"

amozon AdminShell'de `nav-item-highlight` class'ı vardı — "Yeni Tarama" sidebar'da diğerlerine göre **daha belirgin** görünür. Bu davranış korunur.

Stil önerisi ([tema-sistem-kurallari.md](tema-sistem-kurallari.md)'a uygun):
```css
.nav-item-highlight {
  background: rgba(15, 118, 110, 0.1);  /* var(--mp-brand) %10 */
  font-weight: 500;
  border-left: 2px solid var(--mp-brand);
}
```

---

## Breadcrumb

Master plan modüler IA önerisinde breadcrumb şöyle olur:

```
Pano > Risk > Yeni Tarama
Pano > Risk > Araştırmalar > Scan #1234
Pano > Risk > Tezler > Tez "XYZ keyword"
```

Codex Next.js `(main)/admin/risk/...` segment'lerine göre otomatik breadcrumb üretebilir.

---

## Bionluk Müşteri Davranışı (KORUNMALI)

[risk-modulu-musteri-taahhutleri.md §4](risk-modulu-musteri-taahhutleri.md) Single Journey UX'i unutma:

> "/scan tek-ekran UX, 6 aşama progress bar + özet"

Yeni IA'da bu davranış **birebir** korunur. `/admin/risk/scan` sayfası amozon'daki `/scan` ile aynı UX — 6 aşama progress bar, "auto-enrichment" Promise.all, "enriching" ara status.

Sidebar URL değişti (`/scan` → `/admin/risk/scan`) ama **sayfa içeriği aynı**.

---

## Tier Görünürlüğü

Master plan fiyatlandırma Bölüm 7'ye uygun:

| Tier | Risk grubu görünürlüğü |
|---|---|
| Free | ✅ Görünür (Free Risk tier'ı: 5 tarama/gün limit) |
| Starter | ✅ Görünür (30 tarama/gün) |
| Pro | ✅ Görünür (sınırsız) |
| Business | ✅ Görünür + 100 izleme watchlist |
| Sanayi (Custom) | ✅ Görünür + dedicated support |

Yani Risk grubu **her zaman görünür**, sadece sayfa içindeki **tarama limit'i** tier'a göre değişir. Codex `useTier()` hook'u ile sayfa-içi limit gösterir.

---

## Mobile (Responsive)

≤768px ekran genişliğinde sidebar drawer'a düşer. Risk grup başlığı + 5 alt menü drawer'da **expanded** olarak görünür (collapse yok mobile'da).

Codex'in mevcut "fair-day" mobile paneli zaten responsive — Risk modülü taşırken aynı pattern.

---

## Codex İçin Aksiyonlar

- [ ] **⚙️ Codex** — `admin_panel/src/navigation/sidebar-items.ts` (veya benzer config dosyası) içine `RISK_GROUP` ekle
- [ ] **⚙️ Codex** — amozon admin sayfalarını `admin_panel/src/app/(main)/admin/risk/` altına taşı (sözleşme [AMOZON_AKTARIM_CEKLISTI.md Sprint A3](AMOZON_AKTARIM_CEKLISTI.md))
- [ ] **⚙️ Codex** — Highlight item stil class'ı `tema-sistem-kurallari.md` token'larına bağlı
- [ ] **⚙️ Codex** — Test: `/admin/risk/scan` route 200 dönüyor, sidebar'da grup açık ve "Yeni Tarama" highlight'lı

---

## Bağlantılar

- 📋 Aktarım çeklisti: [AMOZON_AKTARIM_CEKLISTI.md](AMOZON_AKTARIM_CEKLISTI.md)
- 🏗️ AdminShell IA: [tema-adminshell-ia-karari.md](tema-adminshell-ia-karari.md)
- 📦 Bionluk müşteri taahhütleri: [risk-modulu-musteri-taahhutleri.md](risk-modulu-musteri-taahhutleri.md)
- 🎨 Tema sistem kuralları: [tema-sistem-kurallari.md](tema-sistem-kurallari.md)
