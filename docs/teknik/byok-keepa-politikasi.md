# BYOK Keepa Politikası — Risk Modülü Multi-Tenant Anahtarı

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint A0 — engelleyici karar)
> **Hedef okuyucu:** ⚙️ Codex — Risk modülü `.env.example` ve config schema'sını bu karara göre yazacak
> **Bağlı çeklist:** [AMOZON_AKTARIM_CEKLISTI.md](AMOZON_AKTARIM_CEKLISTI.md) Sprint A0
> **Master plan referansı:** [MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md) — "Risk modülü BYOK Keepa anahtarı"

---

## Karar

**Hybrid model. Birinci fazda env, ikinci fazda tenant başına DB:**

| Faz | Mod | Tetikleyici |
|---|---|---|
| **Faz 1** (Sprint A1-A2 — aktarım) | Tek anahtar `.env` üzerinden | amozon davranışıyla aynı, kod değişikliği minimum |
| **Faz 2** (Sprint A6 / multi-tenant ile birlikte) | Tenant başına DB'de | İkinci ödeyen Risk müşterisi geldiğinde |

İlk müşterimiz Bionluk teslimi (tek tenant). amozon zaten tek env ile çalıştı → aynı patern korunuyor. Multi-tenant'a geçişte (master plan Ay 1 hedef) anahtar storage da tenant tablosuna taşınır.

---

## Faz 1 — Env Tabanlı (aktarım sırasında)

amozon'un mevcut env yapısı korunur:

```bash
# backend/.env.example — Risk modülü
KEEPA_API_KEY=                     # zorunlu; boş bırakılırsa Keepa katmanı atlanır
KEEPA_DAILY_TOKEN_BUDGET=1000      # günlük token bütçesi (env üstünden ayarlanabilir)
```

Davranış (amozon'dan korunan):
- `isKeepaConfigured()` → env varsa true → Risk modülü Keepa enrichment yapar
- env yoksa → çoğul boyutlu scoring çalışmaya devam eder (Keepa boyutu downgrade'le `INSUFFICIENT_DATA` confidence verir)
- Günlük bütçe DB'de: `amazon_keepa_daily_budget` tablosu (UTC tarih + budget + used) — bu yapı zaten 021_amazon_scoring_schema.sql'de var

Codex'in yapacağı:
- [ ] `backend/.env.example`'a yukarıdaki 2 satırı ekle
- [ ] `core/env.ts` veya zod schema içine `KEEPA_API_KEY: z.string().optional()` + `KEEPA_DAILY_TOKEN_BUDGET: z.coerce.number().default(1000)` ekle
- [ ] Risk modülü kod aktarımında [keepa.client.ts:21-22](../../backend/src/modules/risk/keepa.client.ts#L21-L22) `isKeepaConfigured()` davranışını koru

---

## Faz 2 — Multi-Tenant BYOK (ileri tarih)

Master plan Ay 1'de multi-tenant DB şeması gelecek. O zaman Risk modülü Keepa anahtarını tenant başına saklar.

### Tasarım

Yeni tablo (master plan multi-tenant şemasıyla uyumlu):

```sql
CREATE TABLE IF NOT EXISTS `tenant_module_credentials` (
  `id`         char(36)     NOT NULL,
  `tenant_id`  char(36)     NOT NULL,
  `module`     varchar(30)  NOT NULL,    -- 'risk' | 'discover' | 'outreach' | 'monitor'
  `credential_key` varchar(50) NOT NULL, -- 'keepa_api_key' | 'apollo_api_key' | 'postmark_token' ...
  `encrypted_value` text NOT NULL,       -- envelope-encrypted (AES-256-GCM via app secret)
  `created_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_used_at` datetime   DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_module_cred` (`tenant_id`, `module`, `credential_key`),
  KEY `idx_tenant` (`tenant_id`)
) ENGINE=InnoDB;
```

Davranış:
- Müşteri admin paneli'nde "Risk modülü ayarları" → Keepa anahtarını yapıştırır
- Veri yazılırken **uygulama secret'i ile AES-256-GCM** envelope encryption (master plan KVKK/GDPR maddesi)
- Risk scan job çalıştığında `tenant_id` context'i alır → bu tablodan anahtarı decrypt'le çek
- env'deki global anahtar **fallback** olarak kalır (development veya self-hosted için)

### Anahtar resolver mantığı

```typescript
async function resolveKeepaKey(tenantId: string | null): Promise<string | null> {
  if (tenantId) {
    const tenantKey = await fetchTenantCredential(tenantId, 'risk', 'keepa_api_key');
    if (tenantKey) return tenantKey;  // BYOK
  }
  return env.KEEPA_API_KEY ?? null;   // fallback (dev / single-tenant)
}
```

### Faturalandırma sonuçları

BYOK olunca **Keepa fatura müşteride** kalır. Bu master plan fiyatlandırmasıyla uyumlu:
- Risk Free tier: 5 tarama/gün — env (bizim anahtar, free Keepa quotası)
- Risk Pro tier: sınırsız — BYOK zorunlu (müşteri kendi Keepa abonesi)

Müşteri Keepa abonesi değilse → Risk Pro tier kapalı, sadece Free tier scoring (Keepa olmadan downgrade'le).

---

## Daha Geniş Resme Çıkarımlar

Bu kararın diğer modüllere etkisi:

| Modül | Anahtar | Faz 1 | Faz 2 |
|---|---|---|---|
| Risk | Keepa | env | BYOK |
| Discover | Apollo | env | BYOK önerilir |
| Outreach | Postmark / SMTP | env | BYOK önerilir (Avrasya'nın domain) |
| Monitor | (yok, ortak scraper) | — | — |

`tenant_module_credentials` tablosu **tek API**, her modül için kullanılabilir. Codex Faz 2'ye geçerken bunu Risk modülüne özel değil, generic helper olarak yazsın.

---

## Riskler

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| Faz 1'de Keepa anahtarı çalınırsa tüm müşteri trafiği etkilenir | Orta | Yüksek | env güvenlik (vault, secrets manager); production'da log'a sızdırma yasağı |
| Faz 2 encryption key kaybolursa müşteri anahtarları decrypt edilemez | Düşük | Çok yüksek | App secret'i Vault'ta sakla + yedek; rotation politikası |
| Müşteri Keepa quotasını aştığında scoring çöker | Yüksek | Orta | `KEEPA_DAILY_TOKEN_BUDGET` mekanizması zaten var; aşılınca confidence='INSUFFICIENT_DATA' downgrade'i |
| BYOK UI'sı yanlışlıkla key'i clear-text gösterir | Orta | Yüksek | Admin paneli'nde sadece `********ABCD` formatı; edit "regenerate" şeklinde olur |

---

## Codex İçin Sprint A0 Aksiyonları

- [ ] **⚙️ Codex** — `backend/.env.example` ekleme: `KEEPA_API_KEY` + `KEEPA_DAILY_TOKEN_BUDGET=1000`
- [ ] **⚙️ Codex** — Risk modülü aktarımında `isKeepaConfigured()` ve `getRemainingDailyBudget()` davranışını **dokunma** — aynı kalsın
- [ ] **⚙️ Codex** — `tenant_module_credentials` şemasını **Faz 2'ye işaretle**, Sprint A2 numarasından sonraki bir seed dosyasında (örn. `025_tenant_credentials.sql`) ama Faz 1'de implement etme
- [ ] **🧠 Claude** — Multi-tenant şeması master plana eklendiğinde bu belgeyi v2'ye güncelle

---

## Bağlantılar

- 📋 Aktarım çeklisti: [AMOZON_AKTARIM_CEKLISTI.md](AMOZON_AKTARIM_CEKLISTI.md)
- 🎯 Master plan multi-tenant: [../strateji/MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md) Bölüm 11.A
- 🔑 amozon Keepa client referans: [../../../amozon/backend/src/amazon/keepa.client.ts](../../../amozon/backend/src/amazon/keepa.client.ts)
- 📦 Risk modülü müşteri taahhütleri: [risk-modulu-musteri-taahhutleri.md](risk-modulu-musteri-taahhutleri.md)
