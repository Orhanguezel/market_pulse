# Deploy Fresh Seed ve Owner Backfill Planı

Bu plan `gzltek`, `tarvista` ve canlı Avrasya verisini owner-scoped yapıya taşımak için kullanılır. Fresh seed komutları destructive olduğu için prod ortamda yalnızca DB yedeği alındıktan sonra çalıştırılır.

## Ortak Ön Koşullar

1. Uygulama env dosyasını doğrula: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `COOKIE_SECRET`.
2. Admin sahibi netleştir: `ADMIN_ID` veya `OWNER_USER_ID`.
3. DB yedeği al ve geri dönüş komutunu deploy notuna ekle.
4. Fresh seed çalışacak prod ortamlarında `ALLOW_DROP=true` açıkça verilir; aksi halde seed script'i drop işlemini durdurur.

## gzltek Fresh Seed

```bash
cd backend
NODE_ENV=production TENANT_KEY=gzltek ALLOW_DROP=true bun run db:seed
bun run build
```

Kontrol:

```sql
SELECT tenant_key, name, status FROM tenants WHERE tenant_key = 'gzltek';
SELECT tenant_key, module_key, status FROM module_entitlements WHERE tenant_key = 'gzltek';
```

## tarvista Fresh Seed

```bash
cd backend
NODE_ENV=production TENANT_KEY=tarvista ALLOW_DROP=true bun run db:seed
bun src/scripts/onboard-tarvista.ts
bun run build
```

Kontrol:

```sql
SELECT tenant_key, name, status FROM tenants WHERE tenant_key = 'tarvista';
SELECT COUNT(*) AS starter_icp_count FROM icp_profiles WHERE tenant_key = 'tarvista';
```

## Avrasya Canlı Backfill

Avrasya canlı verisi fresh seed ile silinmez. Önce migration, sonra owner backfill çalışır. Mevcut owner'ı boş kayıtlar admin kullanıcıya atanır.

```bash
cd backend
NODE_ENV=production TENANT_KEY=avrasya bun run db:migrate
NODE_ENV=production TENANT_KEY=avrasya OWNER_USER_ID="$ADMIN_ID" bun run owner:backfill -- --tenant=avrasya --dry-run
NODE_ENV=production TENANT_KEY=avrasya OWNER_USER_ID="$ADMIN_ID" bun run owner:backfill -- --tenant=avrasya
bun run build
```

Backfill script'i yalnızca `tenant_key` ve `owner_user_id` kolonları bulunan tablolarda `owner_user_id IS NULL` kayıtları günceller. Ayrıca seçilen kullanıcıyı ilgili tenant için `tenant_admin` rolüne yükseltir.

Kontrol:

```sql
SELECT COUNT(*) AS missing_owner FROM market_targets WHERE tenant_key = 'avrasya' AND owner_user_id IS NULL;
SELECT COUNT(*) AS missing_owner FROM crm_accounts WHERE tenant_key = 'avrasya' AND owner_user_id IS NULL;
SELECT COUNT(*) AS missing_owner FROM lead_candidates WHERE tenant_key = 'avrasya' AND owner_user_id IS NULL;
```

## Rollback

1. Uygulama servisini durdur.
2. Deploy öncesi alınan DB yedeğini geri yükle.
3. Önceki uygulama imajını/commit'ini devreye al.
4. Login, CRM listeleme, Firma Bulucu listeleme ve mail kuyruk smoke testlerini tekrar çalıştır.
