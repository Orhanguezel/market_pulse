# CLAUDE.md — Market Pulse

Workspace kurallari (`/home/orhan/Documents/Projeler/CLAUDE.md`) aynen gecerlidir.
Bu dosya sadece bu repoya ozel olanlari ekler.

## Proje ozeti

Turk KOBI ve sanayi firmalari icin **dis ticaret istihbarati + hafif CRM** SaaS'i.
Moduller: CRM Cekirdek + Monitor / Discover / Risk / Outreach / Reports.

**Ne DEGIL:** cold email gonderim platformu. Warm-up, inbox rotation, SPF/DKIM/DMARC
yonetimi, gercek bounce parsing, reply detection ve **unsubscribe linki YOK.**
Toplu gonderim ozelligi bunlar olmadan gercek bir cold-email kampanyasinda
kullanilmamali (deliverability coker + CAN-SPAM/GDPR riski).

## Tenant modeli — okumadan degistirme

`docs/strateji/MARKET_PULSE_TENANT_CEKLIST_PLANI.md` Bolum 0'daki **onayli karar**:
deploy-basina TEK aktif tenant. Klasik SaaS (tenant_members + her sorguda zorunlu
filtre middleware) bilincli olarak YOK.

Her tablo `tenant_key` tasir; `core/tenant.ts`, `tenant-context.ts` ve CI guard
`scripts/tenant-scope-guard.ts` bunu korur. **Yeni tabloya `tenant_key` eklemeyi unutma.**

## KURAL: Tenant'a ozel metin KODDA DURMAZ

Marka, fuar adi, salon/stand, tarih, gonderici imzasi gibi musteriye ozel hicbir deger
kaynak kodda sabit yazilmaz. Hepsi `outreach_campaigns` (+ sequence tablosu) uzerinden
veritabanindan gelir.

**Su an bu kural IHLAL EDILIYOR** — `outreach/draft.service.ts` ve
`outreach/outreach.service.ts` icinde "Avrasya / ProMats", "Automechanika Frankfurt",
"Hall 3.1 / Stand D11" ve sabit tarihler (`'2026-08-25'`) gomulu. 97 satir.

Is tarifi ve temizlik sirasi:
**[docs/strateji/HARDCODE_TEMIZLIGI_TENANT_METINLERI.md](docs/strateji/HARDCODE_TEMIZLIGI_TENANT_METINLERI.md)**

Kisa hali: altyapi zaten yazilmis. `campaign/draft.generator.ts` DB'den okuyor ve
`outreach_campaigns` tablosunun gerekli tum kolonlari (`brand_name`, `sender_*`,
`fair_name`, `fair_hall`, `fair_booth`, `fair_dates_*`, `country_to_lang`) mevcut.
Yapilacak is eski hardcode yolu silip yeni yola yonlendirmek + sequence adimlarini
**mutlak tarih yerine `offset_days`** ile tabloya tasimak.

Bu temizlik yapilmadan ikinci musteri eklemek kod degisikligi gerektiriyor.

Yeni outreach metni yazarken: **hicbir yeni sabit ekleme**, dogrudan kampanya
satirindan oku. Kontrol:
```bash
grep -rniE "avrasya|promats|automechanika|hall 3\.1|stand d11" \
  --include=*.ts --include=*.tsx backend/src admin_panel/src frontend/src \
  | grep -viE "\.test\.|\.spec\.|/fixtures?/|__tests__"
```

## Stack & deploy

Bun + Fastify 5 + MySQL 8 + Drizzle (+ raw SQL), BullMQ/Redis, Zod, Sentry.
Next.js 16 frontend + admin. Ayri Python scraper: `services/scraper-service/`.
AI: Groq (llama-3.1-8b-instant) → OpenAI (gpt-4o-mini) fallback.

Canli kurulumlar (`deploy/*/RUNBOOK.md`):

| Kurulum | backend | frontend | admin | tenant |
|---|---|---|---|---|
| gzltek.tech | 8086 | 3077 | 3096 | `gzltek` |
| market.tarvista.com | 8087 | 3077 | 3097 | `tarvista` |

Ortak scraper: `https://scraper.guezelwebdesign.com`. Nginx + PM2 (`ecosystem.config.cjs`).

## DB semasi

Workspace kurali burada da kesin: **`ALTER TABLE` lokalde YASAK.** Yeni kolon ilgili
`backend/src/db/seed/sql/0XX_*_schema.sql` icindeki `CREATE TABLE` tanimina eklenir,
sonra `bun run build && bun run db:seed:*:fresh`.

## Urun yonu

`docs/strateji/ISLETMENIYONET_BIRLESTIRME.md` onayli yon: isletmeniyonet'in ~10M HS-kodlu
gumruk kaydini Market Pulse'a tasi, PHP CRM'i emekliye ayir. Rakip: **BAZ Export**.
Gumruk katmani uygulandi (`modules/lead-machine/customs/`) — urunun asil farklilastiricisi bu.
