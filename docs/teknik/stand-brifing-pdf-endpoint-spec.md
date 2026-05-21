# Stand Brifing PDF Endpoint — Codex İş Paketi

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude → ⚙️ Codex (handover spec)
> **Bağlı:** [stand-brifing-kart-sablon.md](stand-brifing-kart-sablon.md) (sade kart şablonu) + Sprint 4 çeklist
> **Süre tahmini:** 4-6 saat (Codex)

---

## Hedef

Avrasya stand ekibi fuar haftası **basılı kartlar** taşır. Her aday için 1 sayfa A4. T-7 günü Avrasya tüm günlerin PDF setini indirir, ofis yazıcısından basar.

3 endpoint:

1. **Tek aday** — `GET /admin/lead-machine/fair/brifing/:candidate_id.pdf`
2. **Günlük toplu** — `GET /admin/lead-machine/fair/brifing/day/:date.pdf` (örn. `2026-09-10`)
3. **Toplu seçim** — `POST /admin/lead-machine/fair/brifing/bulk` body `{ candidate_ids: string[] }`

---

## Stack Önerisi

| Komponent | Seçim | Sebep |
|---|---|---|
| HTML → PDF | **Puppeteer** | Headless Chromium, CSS tam destekli; Avrasya'nın hosting'de zaten var (scraper-service stealthy mode için Playwright kurulu) |
| Template | **Handlebars** veya **EJS** | Markdown sablonu HTML'e indirgenmiş hali |
| Server | Mevcut Fastify route | `backend/src/modules/lead-machine/fair/brifing.controller.ts` |
| Caching | İlk faz: yok | Yazıcı çıktısı one-shot — sonra cache eklenir |

Alternatif: weasyprint (Python, scraper-service tarafında zaten var). Ama market_pulse backend Bun/TS → Puppeteer daha doğal entegrasyon.

---

## Dosya Yapısı

```
backend/src/modules/lead-machine/fair/
├── brifing.controller.ts        # Fastify route handler
├── brifing.service.ts            # PDF üretim mantığı
├── brifing.template.ts           # HTML template + CSS
└── __tests__/brifing.test.ts     # Snapshot test
```

---

## API Sözleşmesi

### 1. Tek aday

```http
GET /api/v1/admin/lead-machine/fair/brifing/:candidate_id.pdf
Authorization: Bearer <admin-jwt>

Response:
Content-Type: application/pdf
Content-Disposition: inline; filename="brifing-{slug}-{candidate_id}.pdf"
Body: <PDF binary>
```

### 2. Günlük toplu

```http
GET /api/v1/admin/lead-machine/fair/brifing/day/:date.pdf
  ?include_walkin=true  (opsiyonel — sadece randevu mu, walk-in beklenenler de mi)

Response:
Content-Type: application/pdf
Content-Disposition: attachment; filename="brifing-{date}.pdf"
Body: <PDF binary — her aday yeni sayfa>
```

`:date` = `2026-09-08`, `2026-09-09`, `2026-09-10`, `2026-09-11`, `2026-09-12`.

İçerik:
- O günkü Calendly randevuları (saat sıralı)
- `include_walkin=true` ise + öncelik skoru ≥ 7 olan tüm "komşu stand" adayları (10-15 firma — walk-in beklenen)

### 3. Toplu seçim

```http
POST /api/v1/admin/lead-machine/fair/brifing/bulk
Authorization: Bearer <admin-jwt>
Content-Type: application/json

Body:
{
  "candidate_ids": ["uuid1", "uuid2", "uuid3", ...]
}

Response:
Content-Type: application/pdf
Content-Disposition: attachment; filename="brifing-bulk-{timestamp}.pdf"
Body: <PDF — her aday yeni sayfa, sıralı>
```

---

## HTML Template (Codex için)

Tek aday — A4 portrait, 1.5cm margin, Inter font:

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>{{ candidate.name }}</title>
  <style>
    @page { size: A4; margin: 1.5cm; }
    body { font-family: Inter, -apple-system, sans-serif; font-size: 11pt; color: #111827; line-height: 1.4; }
    h1 { font-size: 18pt; margin: 0 0 4pt 0; color: #0f766e; }
    .meta-row { display: flex; gap: 16pt; margin-bottom: 12pt; font-size: 9pt; color: #64748b; }
    .meta-row strong { color: #111827; }
    .section { margin-top: 14pt; }
    .section-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5pt; color: #64748b; margin-bottom: 4pt; border-bottom: 1px solid #d9dee7; padding-bottom: 2pt; }
    table.kv { width: 100%; font-size: 10pt; }
    table.kv td:first-child { color: #64748b; width: 35%; padding: 1pt 0; }
    table.kv td:last-child { font-weight: 500; }
    ul { margin: 4pt 0; padding-left: 14pt; }
    li { margin-bottom: 2pt; }
    .signal-yes { color: #15803d; font-weight: 600; }
    .signal-no { color: #64748b; }
    .post-meeting { margin-top: 24pt; padding-top: 12pt; border-top: 2px solid #d9dee7; font-size: 9pt; }
    .checkbox-group { display: flex; gap: 10pt; flex-wrap: wrap; margin: 4pt 0; }
    .checkbox-group span { padding: 2pt 6pt; border: 1px solid #d9dee7; border-radius: 3pt; }
    .signature-line { margin-top: 18pt; padding-top: 4pt; border-top: 1px solid #d9dee7; display: flex; gap: 20pt; font-size: 9pt; color: #64748b; }
    .signature-line span { flex: 1; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>

<h1>{{ candidate.name }}</h1>
<div class="meta-row">
  <div><strong>Ülke:</strong> {{ candidate.country }} {{ candidate.city }}</div>
  <div><strong>ICP Skoru:</strong> {{ candidate.lead_score }}/10</div>
</div>

<div class="section">
  <div class="section-title">Stand Bilgisi</div>
  <table class="kv">
    <tr><td>Bizim stand</td><td>Hall 3.1, Booth D11</td></tr>
    <tr><td>Onların stand</td><td>{{ candidate.fair_info.hall }} / {{ candidate.fair_info.booth_number }}</td></tr>
    <tr><td>Komşu mu</td><td>{{#if candidate.fair_info.is_neighbor}}EVET ✓{{else}}—{{/if}}</td></tr>
  </table>
</div>

{{#if appointment}}
<div class="section">
  <div class="section-title">Randevu</div>
  <table class="kv">
    <tr><td>Tarih + saat</td><td>{{ appointment.datetime_formatted }}</td></tr>
    <tr><td>Görüşülen kişi</td><td>{{ enrichment.decision_maker.name }} ({{ enrichment.decision_maker.title }})</td></tr>
    <tr><td>Dil tercihi</td><td>{{ candidate.language_pref }}</td></tr>
  </table>
</div>
{{else}}
<div class="section">
  <div class="section-title">Randevu</div>
  <p style="font-size: 10pt; color: #b45309;">⚠️ Randevu yok — walk-in beklenen aday</p>
</div>
{{/if}}

<div class="section">
  <div class="section-title">Firma — kim, ne yapıyor</div>
  <p style="font-size: 10pt;">{{ candidate.ai_summary }}</p>

  <strong style="font-size: 10pt;">Ürün kategorileri:</strong>
  <ul>
    {{#each candidate.product_groups}}
    <li>{{ this }}</li>
    {{/each}}
  </ul>

  <strong style="font-size: 10pt;">Web sinyalleri:</strong>
  <ul>
    <li>B2B sinyali: <span class="{{#if candidate.has_b2b}}signal-yes{{else}}signal-no{{/if}}">{{#if candidate.has_b2b}}✓ var{{else}}—{{/if}}</span></li>
    <li>Çin'den import: <span class="{{#if candidate.has_china}}signal-yes{{else}}signal-no{{/if}}">{{#if candidate.has_china}}✓ var{{else}}—{{/if}}</span></li>
    <li>Private label arıyor: <span class="{{#if candidate.has_private_label}}signal-yes{{else}}signal-no{{/if}}">{{#if candidate.has_private_label}}✓ var{{else}}—{{/if}}</span></li>
    <li>Satış kanalları: {{ candidate.sales_channels_csv }}</li>
  </ul>
</div>

<div class="section">
  <div class="section-title">ICP eşleşme — niye burada</div>
  <p style="font-size: 10pt;">{{ candidate.match_notes }}</p>
</div>

<div class="post-meeting">
  <div class="section-title">Görüşme sonrası (stand çalışanı doldurur — 30 sn)</div>

  <p>İlgi düzeyi:
    <span class="checkbox-group">
      <span>⚪ Soğuk</span><span>⚪ Sıcak</span><span>⚪ Kapanış yakın</span>
    </span>
  </p>

  <p>İstedikleri:</p>
  <div class="checkbox-group">
    <span>☐ Katalog</span><span>☐ Fiyat listesi</span><span>☐ Numune</span>
    <span>☐ Audit raporu</span><span>☐ Private label</span><span>☐ ODM</span>
    <span>☐ Diğer: ____________</span>
  </div>

  <p>Sonraki adım:</p>
  <div class="checkbox-group">
    <span>⚪ Takip yok</span><span>⚪ Mail at</span><span>⚪ Numune gönder</span>
    <span>⚪ Telkonferans</span><span>⚪ Teklif</span>
  </div>

  <p style="margin-top: 12pt;">Notlar (3 satır maks):</p>
  <p style="border-bottom: 1px solid #d9dee7; height: 14pt;">&nbsp;</p>
  <p style="border-bottom: 1px solid #d9dee7; height: 14pt;">&nbsp;</p>
  <p style="border-bottom: 1px solid #d9dee7; height: 14pt;">&nbsp;</p>

  <div class="signature-line">
    <span>Stand çalışanı: ____________</span>
    <span>Tarih: __/09/2026</span>
    <span>Saat: ___:___</span>
  </div>
</div>

</body>
</html>
```

Toplu PDF için: her aday yeni sayfa, aralara `<div class="page-break"></div>`.

---

## Service Implementation (Codex iskeleti)

```typescript
// backend/src/modules/lead-machine/fair/brifing.service.ts

import puppeteer, { Browser } from 'puppeteer';
import Handlebars from 'handlebars';
import { template } from './brifing.template';
import { getCandidate, getEnrichment, getAppointment } from '../_shared/db';

let browserSingleton: Browser | null = null;

async function getBrowser() {
  if (!browserSingleton) {
    browserSingleton = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserSingleton;
}

const compiled = Handlebars.compile(template);

export async function renderCandidatePdf(candidateId: string): Promise<Buffer> {
  const cand = await getCandidate(candidateId);
  if (!cand) throw new Error('CANDIDATE_NOT_FOUND');
  const enrichment = await getEnrichment(candidateId);
  const appointment = await getAppointment(candidateId);

  const html = compiled({
    candidate: cand,
    enrichment,
    appointment,
  });

  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '1.5cm', right: '1.5cm', bottom: '1.5cm', left: '1.5cm' } });
  await page.close();
  return pdf;
}

export async function renderBulkPdf(candidateIds: string[]): Promise<Buffer> {
  // Hepsini tek HTML'e bağla, page-break ile ayır
  const candidates = await Promise.all(candidateIds.map(getCandidate));
  // ... similar pattern
}

export async function renderDayPdf(date: string, includeWalkin: boolean): Promise<Buffer> {
  const appointments = await db.query(
    `SELECT candidate_id FROM lead_appointments
     WHERE DATE(appointment_datetime) = ? AND cancelled_at IS NULL
     ORDER BY appointment_datetime`,
    [date],
  );
  const ids = appointments.map((a) => a.candidate_id);

  if (includeWalkin) {
    const walkin = await db.query(
      `SELECT id FROM lead_candidates
       WHERE channel='trade_fair' AND status='approved'
         AND lead_score >= 7 AND JSON_EXTRACT(raw_data, '$.fair_info.is_neighbor')=true
         AND id NOT IN (SELECT candidate_id FROM lead_appointments)`,
    );
    ids.push(...walkin.map((w) => w.id));
  }

  return renderBulkPdf(ids);
}
```

---

## Performans / Kaynak

- Puppeteer browser singleton — restart'da kapanır, request başına yeniden açma 2-3 sn yavaş
- Tek aday PDF: ~500 ms
- 30 aday toplu PDF: ~8-12 sn (her sayfa için page.setContent + page.pdf)
- RAM: Chromium ~150 MB

T-7 günü Avrasya günde 1 kez basar — dakikada 50+ request bekleniyor değil. Optimizasyon **gereksiz** ilk fazda.

---

## Test (Codex)

```typescript
// backend/src/modules/lead-machine/fair/__tests__/brifing.test.ts

describe('renderCandidatePdf', () => {
  it('generates A4 PDF with expected sections', async () => {
    const cand = await seedCandidate({ /* sample data */ });
    const pdf = await renderCandidatePdf(cand.id);
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(20_000);  // >20 KB minimum
    // PDF binary inspect: A4 size check
    expect(pdf.slice(0, 4).toString()).toBe('%PDF');
  });

  it('handles missing appointment gracefully', async () => {
    const cand = await seedCandidate({ /* no appointment */ });
    const pdf = await renderCandidatePdf(cand.id);
    // Should render "walk-in beklenen aday" badge
    expect(pdf.length).toBeGreaterThan(20_000);
  });
});
```

Görsel test: snapshot bazlı değil (PDF binary diff zor) — manuel kalite review yeterli (Sprint 4 sonu Claude QA).

---

## Sprint 4 Çıkış Kriterleri

- [ ] Codex Puppeteer + Handlebars eklendi, package.json güncellendi
- [ ] 3 endpoint çalışıyor (tek aday + günlük + bulk)
- [ ] Test'ler yeşil (en az 3 test)
- [ ] Manuel test: Avrasya örneği için PDF doğru çıktı
- [ ] **Claude QA:** 5 farklı aday için PDF görsel kontrol — yazıcıda okunabilir mi, alanlar düzgün hizalı mı

---

## Bağlantılar

- 🃏 Kart şablonu (markdown): [stand-brifing-kart-sablon.md](stand-brifing-kart-sablon.md)
- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🛠️ Stand operasyon SOP: [../musteri/fuar-stand-operasyon-sop.md](../musteri/fuar-stand-operasyon-sop.md)
- 📅 Calendly kurulum: [../musteri/calendly-kurulum-rehberi.md](../musteri/calendly-kurulum-rehberi.md)
