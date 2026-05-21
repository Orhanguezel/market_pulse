# Market Pulse

> Türk KOBİ ve sanayi firmaları için modüler operasyon SaaS'ı.
> Müşteri-rakip-bayi-pazar ilişkilerini tek panelden, Türkçe arayüzle, TL+EUR faturayla.

**Durum:** Aktif geliştirme — pilot müşteri Avrasya Paspas (ProMats) / Automechanika Frankfurt 2026 sahasında ilk büyük uygulama.
**Workspace rolü:** [/home/orhan/Documents/Projeler/CLAUDE.md](/home/orhan/Documents/Projeler/CLAUDE.md) altındaki 4-araç orkestrasyonunun (Claude Code mimar + Codex implement + Antigravity UI QA + Copilot reflex) ortak çalışma alanı.

---

## Tek cümle

Bir firmanın **müşterisini, rakibini, bayisini ve pazar sinyallerini** tek panelden takip ettiği, modüler bir SaaS. Müşteri ihtiyaca göre modül açar; tek hesap, tek fatura.

---

## Modüler Mimari

```
┌──────────────────────────────────────────────────────────────┐
│  CRM ÇEKİRDEK (her plan dahil — hesap, kişi, pipeline, görev)│
│  └─┬─────────┬──────────────┬──────────────┬───────────┐    │
│    ▼         ▼              ▼              ▼           ▼    │
│  MONITOR  DISCOVER       RISK           OUTREACH    REPORTS │
│  Pazar    Lead bulma     Amazon         E-mail      Haftalik│
│  izleme   (B2B, Fuar,    skoru          kampanya    PDF     │
│  sinyali  Amazon, ICP)   (Keepa)        + takip     + e-mail│
└──────────────────────────────────────────────────────────────┘
```

Detay: [docs/strateji/MARKET_PULSE_SAAS_PLANI.md](docs/strateji/MARKET_PULSE_SAAS_PLANI.md)

---

## Repo Yapısı

```
market_pulse/
├── README.md                         (bu dosya)
├── AUTOMECHANIKA_2026_CEKLIST.md     Avrasya Paspas fuar projesi — Codex+Claude is bölümlü
├── LICENSE
├── project.portfolio.json            Portfolio metadata
│
├── backend/                          Fastify + Bun + MySQL + Drizzle
│   └── src/
│       ├── modules/
│       │   ├── lead-machine/         Amazon + B2B + Fair lead üretim katmanı
│       │   │   ├── fair/             Automechanika gibi fuar exhibitor tarama
│       │   │   ├── b2b/              Europages/Kompass/Google Maps tarama
│       │   │   ├── amazon/           Amazon scoring engine
│       │   │   ├── enrichment/       Apollo.io / LinkedIn enrichment
│       │   │   ├── outreach/         AI mail taslağı + gönderim
│       │   │   └── icp/              ICP profil yönetimi
│       │   ├── market/               Sinyal, churn, rapor
│       │   └── externalDb/           Paspas ERP cross-DB
│       └── db/seed/sql/              CREATE TABLE seedler (018 = lead_machine)
│
├── frontend/                         Next.js 16 + Tailwind v4 + Shadcn
├── admin_panel/                      Admin UI (lead onay paneli, ICP yönetimi)
│
├── docs/
│   ├── strateji/                     Master plan + alt strateji belgeleri
│   ├── teknik/                       Modül çeklistleri + teknik raporlar
│   ├── musteri/                      Müşteri görüşme notları + dosyalar
│   ├── rakip-analizi/                BAZ Export, Zoho, Helium10, Agellic
│   ├── notlar/                       AI marketing notları vs.
│   ├── proje-teklifi/                Teklif/sözleşme dosyaları
│   ├── test-results/                 Test çıktıları
│   └── arsiv/                        Eski plan ve checklistler
│
└── scripts/
    ├── poc-automechanika-fair-scrape.sh    Automechanika PoC runner
    └── arsiv-e3/                            Eski Amazon Epic-3 runner script'leri
```

---

## Kurulum

### Backend (Fastify + Bun)

```bash
cd backend
cp .env.example .env   # SCRAPER_SERVICE_URL, MySQL bilgileri, JWT secret vs. doldur
bun install
bun run db:seed:fresh  # tabloları sıfırdan kur (ALTER TABLE yasak — CLAUDE.md)
bun run dev
```

### Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local
bun install
bun run dev
```

### Admin Panel

```bash
cd admin_panel
bun install
bun run dev
```

Bun zorunlu (`npm` veya `pnpm` yerine). TypeScript strict mode her yerde aktif.

---

## Bağımlılıklar

- **scraper-service** ([../scraper-service](../scraper-service)) — ortak Python scraper motoru. market_pulse'ın lead-machine + market modülleri scraper-service üzerinden çalışır. `SCRAPER_SERVICE_URL` env'i zorunlu.
- **MySQL 8.0+** — multi-tenant veriler
- **Redis** (opsiyonel) — outreach kuyruğu, cache
- **Apollo.io API** (opsiyonel) — karar verici enrichment

---

## Aktif Pilot: Avrasya Paspas — Automechanika Frankfurt 2026

İlk büyük canlı uygulama. **8-12 Eylül 2026** Frankfurt fuarı için Avrasya Paspas standına müşteri sinyali toplama otomasyonu kuruluyor.

- 📋 **Master strateji:** [docs/strateji/AUTOMECHANIKA_2026_PLANI.md](docs/strateji/AUTOMECHANIKA_2026_PLANI.md)
- ✅ **Çalışma çeklisti (Codex+Claude is bölümlü):** [AUTOMECHANIKA_2026_CEKLIST.md](AUTOMECHANIKA_2026_CEKLIST.md)
- 🔧 **Teknik detay:** [docs/teknik/FAIR_MODULU_CEKLISTI.md](docs/teknik/FAIR_MODULU_CEKLISTI.md)
- 👤 **Müşteri dosyası:** [docs/musteri/avrasya-paspas-automechanika.md](docs/musteri/avrasya-paspas-automechanika.md)
- 🧪 **PoC runner:** [scripts/poc-automechanika-fair-scrape.sh](scripts/poc-automechanika-fair-scrape.sh)

## Paralel İşler

Aşağıdaki iki büyük tek-seferlik iş Avrasya pilotuna paralel ilerler. İkisi de [master plan Bölüm 5 + 6](docs/strateji/MARKET_PULSE_SAAS_PLANI.md)'nın doğrudan uygulamasıdır.

- 🔄 **Amazon scoring engine aktarımı:** amozon repo'sundaki test edilmiş Amazon kodları (5 boyutlu scoring, Keepa client, admin sayfaları) market_pulse'ın **Risk modülü** olarak entegre edilir. **Senaryo A — one-time sync**, amozon dondurulur.
  → [docs/teknik/AMOZON_AKTARIM_CEKLISTI.md](docs/teknik/AMOZON_AKTARIM_CEKLISTI.md)

- 🎨 **Görsel sistem yenilemesi:** Pastel coral palet sade B2B teal+navy palete döner. amozon admin panelinin ciddi, kompakt görsel dili market_pulse'ın yeni standardı olur. Shadcn dokunulmaz, sadece CSS token'ları map edilir.
  → [docs/teknik/TEMA_MIGRASYON_CEKLISTI.md](docs/teknik/TEMA_MIGRASYON_CEKLISTI.md)

---

## 4-Araç Workspace Orkestrasyonu

Bu proje workspace seviyesinde 4 araçla yürütülür ([/home/orhan/Documents/Projeler/CLAUDE.md](/home/orhan/Documents/Projeler/CLAUDE.md)):

| Araç | Sorumluluk | Referans dosyası |
|---|---|---|
| **Claude Code** | Mimar / stratejist — tasarım, ICP, prompt, doc, karar | [CLAUDE.md](../CLAUDE.md) |
| **Codex** | Implementer — backend TS, scraper Python, DB, API, UI kod | AGENTS.md |
| **Antigravity** | UI doğrulama — screenshot, E2E senaryolar | docs/antigravity-kb.md |
| **Copilot** | Reflex — autocomplete, boilerplate | .github/copilot-instructions.md |

İlke: aynı dosyaya aynı anda iki araç dokunmaz. İş akışı: Claude tasarla → Codex implement et → Antigravity doğrula → Copilot cilala.

---

## Önemli Kurallar (CLAUDE.md'den)

- **DB schema değişikliği:** `ALTER TABLE` LOKAL ORTAMDA KESİNLİKLE YASAKTIR. Schema değişikliği `src/db/seed/sql/0XX_*_schema.sql` üzerinden `CREATE TABLE` güncellenip `bun run db:seed:fresh` ile yapılır.
- **Portfolio dosyası:** Her projede `project.portfolio.json` zorunlu. ([PROJECT_PORTFOLIO_STANDARD.md](/home/orhan/Documents/Projeler/PROJECT_PORTFOLIO_STANDARD.md))
- **Bun tercih edilen runtime** — npm/yarn/pnpm değil.
- **`.env` commit edilmez** — `.env.example` template olarak güncel tutulur.

---

## Belge Haritası

| Bölüm | Yer | Ne için |
|---|---|---|
| Master SaaS planı | [docs/strateji/MARKET_PULSE_SAAS_PLANI.md](docs/strateji/MARKET_PULSE_SAAS_PLANI.md) | Genel ürün vizyonu, modül mimarisi, fiyatlandırma, 6 aylık roadmap |
| Eski Amazon-only plan | [docs/strateji/GENISLEME_PLANI.md](docs/strateji/GENISLEME_PLANI.md) | Tarihsel referans (arşivlik) |
| Lead Machine raporu | [docs/teknik/LEAD_MACHINE_RAPOR.md](docs/teknik/LEAD_MACHINE_RAPOR.md) | Amazon + B2B + Fair üç kanalın detayı |
| Outreach kullanım rehberi | [docs/teknik/OUTREACH_FIELDS_KULLANIM_REHBERI.md](docs/teknik/OUTREACH_FIELDS_KULLANIM_REHBERI.md) | Outreach modülü alan/akış kılavuzu |
| Skorlama mantığı | [docs/teknik/SCORING_LOGIC.md](docs/teknik/SCORING_LOGIC.md) | Amazon scoring engine boyutları |
| Rakip analizleri | [docs/rakip-analizi/](docs/rakip-analizi/) | BAZ Export, Zoho, Helium10, Agellic |

---

## Geliştirme Adımları

Yeni bir geliştirme başlatmadan önce sırasıyla:

1. **Plan oku:** [docs/strateji/MARKET_PULSE_SAAS_PLANI.md](docs/strateji/MARKET_PULSE_SAAS_PLANI.md)'da hangi modülün hangi fazda olduğunu kontrol et.
2. **Çeklist bul:** İlgili `docs/teknik/*_CEKLISTI.md` dosyasını bul, sahibi (Codex/Claude) kontrol et.
3. **Önce tasarım:** Yeni feature ise Claude (mimar) doc/karar yazar; Codex sonra implement eder.
4. **DB değişikliği:** Sadece `src/db/seed/sql/` üzerinden, ALTER yasak.
5. **Test:** `bun test` (backend modül başına `__tests__/` klasörü var).
6. **Doc güncelle:** Çeklist'i tamamla, master plana yansıtılması gereken bir karar varsa not düş.

---

## Lisans

[LICENSE](LICENSE)
