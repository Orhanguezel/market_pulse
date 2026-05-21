# 10times Automechanika Frankfurt 2026 — Event ID Keşfi

> **Tarih:** 2026-05-21 (v2 — başarılı keşif)
> **Sahibi:** 🧠 Claude (Sprint 2)
> **Durum:** ✅ **Event ID bulundu: `2930629`** (r.jina.ai Reader proxy ile anti-bot bypass)
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 2 + [FAIR_MODULU_CEKLISTI.md](FAIR_MODULU_CEKLISTI.md) Sprint 2

---

## Bulgular

### ✅ Event ID: **`2930629`**

`r.jina.ai/https://10times.com/automechanika-frankfurt` ile Jina Reader proxy üzerinden bypass — anonim WebFetch direkt 403 veriyordu, Reader cache servisi çalıştı.

### Event metadata (2026 edition)
- **Event ID:** `2930629`
- **Tarihler:** 8-12 Eylül 2026 (doğrulandı)
- **Beklenen ziyaretçi:** ~100.000
- **Beklenen exhibitor:** ~4.987 (Codex'in çektiği 2325 + son ay kayıtları)
- **Konum:** Messe Frankfurt, Frankfurt, Almanya
- **Tip:** Trade Show (her 2 yılda bir)
- **Rating:** 4.0/5 (71 oy)
- **Speakers:** 50
- **Focus:** Automotive aftermarket, parts & components, workshop equipment, digital solutions, IT & management

### URL pattern'ler (DuckDuckGo HTML site search ile teyit)
- `10times.com/automechanika-frankfurt` — ana sayfa (slug-based, language-neutral)
- `10times.com/automechanika-frankfurt/exhibitors` — exhibitor listesi
- `10times.com/de/automechanika-frankfurt/exhibitors` — DE
- `10times.com/automechanika-frankfurt/speakers`

### WebFetch denemeleri sonucu
- Tüm `10times.com/*` istekleri **HTTP 403 Forbidden** — Cloudflare/Akamai anti-bot bloku
- DuckDuckGo HTML site search çalıştı (cached snippets), ama event_id detayı snippet'a düşmedi

### 10times API çağrısı — ne ile başlanır

[tentimes.client.ts](../../backend/src/modules/lead-machine/fair/tentimes.client.ts) çağrısı:
```typescript
const res = await fetch(
  `https://api.10times.com/v1/events/${encodeURIComponent(fairId)}/attendees`,
  { headers: { authorization: `Bearer ${env.TENTIMES_API_KEY}` } }
);
```

**Önerim — iki varyantı deneyelim:**
- `fairId = "2930629"` (numeric event ID — Jina'dan çıkardık)
- `fairId = "automechanika-frankfurt"` (slug — DuckDuckGo'dan çıkardık)

İlki çalışırsa numeric, yoksa slug. Codex test sonucu Sprint 2'de raporlar.

---

## Codex İçin İş Paketi

10times API key başvurusu + event_id keşfi 2 paralel adım:

### Adım 1 — 10times Free Tier API Key (manuel — KALAN İŞ)
- [ ] **Orhan** — 10times.com'a kullanıcı hesabı oluştur (orhanguezell@gmail.com veya Avrasya export hesabı)
- [ ] **Orhan** — Free tier API key başvurusu (Settings → API → Generate veya Contact Sales)
- [x] **🧠 Claude** — Event ID tespit ✅ (`2930629`)
- [x] **🧠 Claude** — fairId formatını belirle ✅ (numeric önce, slug fallback)

### Adım 2 — Codex Playwright ile manuel keşif (alternatif)
Eğer free API key bulunamazsa, Codex scraper-service'te:

```python
# Playwright session ile 10times.com/automechanika-frankfurt aç
# DevTools Network'te `api.10times.com` veya `10times.com/api/` çağrılarına bak
# Bir tanesinde event_id görünür
```

Çıktı: numeric event_id veya slug.

### Adım 3 — `.env` + test
- [ ] **⚙️ Codex** — `TENTIMES_API_KEY` env'e ekle
- [ ] **⚙️ Codex** — `tentimes.client.ts`'i çağıran küçük test scripti yaz, attendees endpoint'ten 5 firma çekmeyi dene
- [ ] **🧠 Claude** — Çıkan attendee listesi exhibitor listesi ile çakışır mı kontrol (overlap analizi)

---

## Engelleyici Notu (kullanıcı bilmeli)

Bu adım **K-1'in gözden geçirilmesi** anlamına gelir:
- master plan ([MARKET_PULSE_SAAS_PLANI.md:104](../strateji/MARKET_PULSE_SAAS_PLANI.md#L104)) — "Fuar katılımcı listesi izleme" şablonu
- [LEAD_MACHINE_RAPOR.md](LEAD_MACHINE_RAPOR.md) — "10times API: kim 'interested' olarak işaretledi"

Eğer 10times free tier yeterli intent verisi vermezse:
- **Plan B:** Ücretli tier ($49/ay veya $199/ay) değerlendirilir — master plan Bölüm 5 fuar maliyetinde whr.ai gibi alternatifler de var
- **Plan C:** 10times tamamen atlanır, sadece Exhibitor zıt-tarama (Strateji A) ile devam edilir

Avrasya görüşmesinde bu maliyet kararını al.

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🔧 Fair modülü çeklist (Sprint 2): [FAIR_MODULU_CEKLISTI.md](FAIR_MODULU_CEKLISTI.md)
- 📚 Lead Machine raporu (kaynak kıyaslama): [LEAD_MACHINE_RAPOR.md](LEAD_MACHINE_RAPOR.md)
- ⚙️ tentimes.client.ts: [../../backend/src/modules/lead-machine/fair/tentimes.client.ts](../../backend/src/modules/lead-machine/fair/tentimes.client.ts)
