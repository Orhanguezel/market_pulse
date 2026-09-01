# Hardcode Temizligi — Outreach Metinleri Tenant DB'sine

**Karar (2026-07-19, kullanici talimati):** Mail metinlerinde marka, fuar, salon/stand,
tarih gibi **tenant'a ozel hicbir deger kodda durmayacak.** Hepsi veritabanindan,
tenant bazli gelecek.

**Durum: ACIK — yapilmadi.** Bu dosya isin tarifi.

---

## Tespit: is sanildigi kadar buyuk degil

Bu bir "sifirdan tenant sistemi kurma" isi **degil**. Altyapinin tamami zaten yazilmis,
sadece eski kod yeni altyapiya baglanmamis. Iki paralel implementasyon var:

| | Yol A — DOGRU (kullanilmiyor) | Yol B — HARDCODE (kullaniliyor) |
|---|---|---|
| Dosya | `campaign/draft.generator.ts` | `outreach/draft.service.ts` + `outreach/outreach.service.ts` |
| Metin kaynagi | `outreach_campaigns` satiri | Kodda `const` |
| Dil secimi | `campaign.country_to_lang` JSON | Kodda `Record<Lang, string>` |
| Tenant | `getActiveTenantKey()` + kampanya | yok |

`campaign/draft.generator.ts` dosyasinin kendi basligi bunu zaten soyluyor:
*"Multi-tenant: every text element comes from outreach_campaigns row."*

`outreach_campaigns` tablosu (`db/seed/sql/025_outreach_campaigns_schema.sql`) ihtiyac
duyulan **her kolona zaten sahip**: `brand_name`, `brand_short`, `sender_name`,
`sender_title`, `sender_email`, `reply_to_email`, `product_en/de/tr`, `fair_name`,
`fair_edition`, `fair_dates_en/de/tr`, `fair_hall`, `fair_booth`, `calendly_link`,
`default_lang`, `country_to_lang`.

CRUD API'si de canli: `router.ts:164-170` (`/lead-machine/outreach/campaigns`).

**Yani yapilacak is: Yol B'yi silip Yol A'ya yonlendirmek.**

---

## Temizlenecek somut yerler

### 1. `outreach/draft.service.ts:10-14` — konu satirlari
```ts
const SUBJECTS: Record<OutreachLanguage, string> = {
  EN: 'Automechanika Frankfurt - 10 min meeting? - Avrasya / ProMats',
  DE: 'Automechanika Frankfurt - 10 Min Termin? - Avrasya / ProMats',
  TR: 'Automechanika Frankfurt - 10 dk randevu? - Avrasya / ProMats',
};
```
→ `campaign.fair_name` + `campaign.brand_name` ile sablondan uretilecek.

### 2. `outreach/outreach.service.ts:75-153` — takip mail govdeleri
Alti dilde/asamada tam mail metni gomulu. Ornek:
> `'...wir sind 8.-12. September auf der Automechanika Frankfurt, Halle 3.1, Stand D11...\nAvrasya / ProMats'`

Icinde: fuar adi, tarih, salon (`3.1`), stand (`D11`), marka (`Avrasya / ProMats`).
Hepsi `outreach_campaigns`'te kolon olarak **zaten var**.

### 3. `outreach/outreach.service.ts:29-38` — SABIT TARIHLER (en kritik)
```ts
{ step: 'reminder_1', previous: 'initial', dueDate: '2026-08-25' },
{ step: 'reminder_2', previous: 'reminder_1', dueDate: '2026-09-01' },
{ step: 'closing',    previous: 'reminder_2', dueDate: '2026-09-07' },
```
Bu takvim Automechanika 2026'ya cakili. **Eylul 2026'dan sonra tum sistem sessizce
bozulur** — gecmis tarihli adimlar ya hemen tetiklenir ya hic tetiklenmez.

Bu tek basina yeni bir tablo gerektiriyor (asagida).

### 4. `core/env.ts:45` — `TENANT_KEY: process.env.TENANT_KEY ?? 'avrasya'`
Fallback tenant. Env unutulan bir kurulumda **baska musterinin verisine** yazar/okur.
Guvenlik taramasindaki fail-closed ilkesiyle ayni: `requireEnv('TENANT_KEY')` olmali.

### 5. Schema default'lari — `DEFAULT 'avrasya'`
`market/schema.ts` (5 tablo) ve `db/migrate/index.ts:139,276`. Yeni tenant'in kaydi
tenant_key yazilmadan girerse sessizce avrasya'ya dusуer. Default kaldirilip
`NOT NULL` birakilmali.

---

## Eksik olan tek sey: sequence tablosu

Kolonlar var ama **adim/zamanlama** tutan tablo yok. Onerilen:

```sql
CREATE TABLE `outreach_sequence_steps` (
  `id`            char(36)     NOT NULL,
  `tenant_key`    varchar(64)  NOT NULL,
  `campaign_id`   char(36)     NOT NULL,
  `step_key`      varchar(50)  NOT NULL,   -- 'initial','reminder_1','closing'
  `step_order`    int          NOT NULL,
  `channel`       varchar(20)  NOT NULL DEFAULT 'email',  -- email | linkedin
  -- MUTLAK TARIH DEGIL: onceki adimdan kac gun sonra
  `offset_days`   int          NOT NULL,
  `previous_step` varchar(50)  DEFAULT NULL,
  `subject_en`    varchar(300) DEFAULT NULL,
  `subject_de`    varchar(300) DEFAULT NULL,
  `subject_tr`    varchar(300) DEFAULT NULL,
  `body_en`       text         DEFAULT NULL,
  `body_de`       text         DEFAULT NULL,
  `body_tr`       text         DEFAULT NULL,
  `is_active`     tinyint(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_seq_step` (`tenant_key`,`campaign_id`,`step_key`),
  KEY `idx_seq_campaign` (`tenant_key`,`campaign_id`,`step_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**`offset_days` kritik:** mutlak tarih yerine gorece gun. Boylece kampanya 2027'ye
tasindiginda kod da veri de degismez. Fuar tarihi zaten `outreach_campaigns.fair_dates_*`'te.

> **DB kurali (workspace CLAUDE.md):** `ALTER TABLE` lokalde YASAK. Yeni kolonlar
> ilgili `0XX_*_schema.sql` dosyasindaki `CREATE TABLE` tanimina dogrudan eklenir,
> sonra `bun run build && bun run db:seed:*:fresh`.

---

## Sablon degiskenleri

Metinler DB'ye tasinirken `{{...}}` placeholder'lari standartlasmali. Zaten kismen var
(`{calendly_link}`, `{gonderici_ad_soyad}`) ama tek suslu parantez ve tutarsiz.
Onerilen set:

`{{brand_name}}` `{{brand_short}}` `{{sender_name}}` `{{sender_title}}`
`{{fair_name}}` `{{fair_dates}}` `{{fair_hall}}` `{{fair_booth}}`
`{{calendly_link}}` `{{contact_first_name}}` `{{company_name}}` `{{product_line}}`

Dil secimi `campaign.country_to_lang` + `default_lang` uzerinden — `draft.generator.ts`'te
`pickLanguage()` olarak **zaten yazili**, tekrar yazma.

---

## Onerilen sira

1. `outreach_sequence_steps` semasini ekle + avrasya kampanyasini seed et (mevcut 6 metin
   oraya tasinsin — davranis birebir korunsun)
2. `outreach.service.ts`'i `REMINDER_STAGES`/`FOLLOWUP_STAGES` yerine bu tablodan okut
3. `draft.service.ts`'i emekliye ayir → cagrilari `campaign/draft.generator.ts`'e yonlendir
4. `core/env.ts` TENANT_KEY fallback'ini kaldir (`requireEnv`)
5. Schema `DEFAULT 'avrasya'` degerlerini kaldir
6. Regresyon: avrasya kampanyasi icin uretilen taslak, degisiklik oncesiyle **birebir ayni**
   metni vermeli. Aksi halde pilot musteriye giden mail bozulur.

## Dogrulama

```bash
# Sifir olmali (test/fixture haric):
grep -rniE "avrasya|promats|automechanika|hall 3\.1|stand d11" \
  --include=*.ts --include=*.tsx backend/src admin_panel/src frontend/src \
  | grep -viE "\.test\.|\.spec\.|/fixtures?/|__tests__"
```

Su an bu komut **97 satir** donuyor.

---

## Neden onemli — is tarafi

Bugun ikinci bir musteri (ornegin bir tekstil ihracatcisi, bambaska bir fuar) eklemek
**kod degisikligi** gerektiriyor. Yani musteri sayisi arttikca is yuku de artiyor.
Bu temizlik yapildiginda yeni musteri = bir `outreach_campaigns` satiri + sequence
adimlari; kod hic degismiyor.

Ayni sey ajans/cold-email senaryosu icin de gecerli: o modelin tek sarti "ikinci musteri
birinciyle ayni is yukunde olsun". Bu hardcode duruyorken o sart saglanmiyor.

_Ilgili: `docs/strateji/MARKET_PULSE_TENANT_CEKLIST_PLANI.md` (tek-tenant deploy karari),
`docs/strateji/ISLETMENIYONET_BIRLESTIRME.md` (urun yonu)._
