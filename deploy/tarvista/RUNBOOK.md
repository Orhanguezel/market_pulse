# market.tarvista.com — Deploy Runbook (vps-vistainsaat / 187.124.166.65)

Hedef: market_pulse'ı `tarvista` tenant'ı olarak `/var/www/market_pulse` altına kurmak.
Sunucudaki diğer 24 PM2 servisine dokunulmaz. market_pulse temiz kurulum.

## Parametreler
- Branch: `feat/tenant-config-core`
- Portlar: backend **8087**, frontend **3077**, admin **3097** (hepsi boş doğrulandı)
- DB: `market_pulse` (MySQL 8.0.46, localhost) — yeni, kimseyi etkilemez
- Tenant: `TENANT_KEY=tarvista`
- Domain: `market.tarvista.com` (DNS A → 187.124.166.65 hazır). `www.` DNS yoksa eklenmez.
- Scraper: merkezi `https://scraper.guezelwebdesign.com` (yeni container yok)

## Topoloji (nginx)
- `/`        → frontend (3077); `/api/v1` ve `/uploads` Next rewrite ile backend'e gider
- `/panel/`  → admin (3097, basePath=/panel)
- `/uploads/`→ backend (8087)

## Adımlar

### 1) MySQL: DB + kullanıcı (root socket-auth ile)
```sql
CREATE DATABASE IF NOT EXISTS market_pulse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'market_user'@'127.0.0.1' IDENTIFIED BY '<DB_PASSWORD>';
GRANT ALL PRIVILEGES ON market_pulse.* TO 'market_user'@'127.0.0.1';
FLUSH PRIVILEGES;
```

### 2) Repo
```bash
cd /var/www && git clone git@github.com:Orhanguezel/market_pulse.git market_pulse
cd market_pulse && git checkout feat/tenant-config-core
```

### 3) backend/.env.production  (gizli — repoda DEĞİL)
```
NODE_ENV=production
TENANT_KEY=tarvista
HOST=127.0.0.1
PORT=8087
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=market_pulse
DB_USER=market_user
DB_PASSWORD=<DB_PASSWORD>
JWT_SECRET=<openssl rand -hex 32>
COOKIE_SECRET=<openssl rand -hex 32>
DB_ENCRYPTION_KEY=<openssl rand -hex 32>
APP_URL=https://market.tarvista.com
PUBLIC_URL=https://market.tarvista.com
FRONTEND_URL=https://market.tarvista.com
CORS_ORIGIN=https://market.tarvista.com
ADMIN_EMAIL=orhanguzell@gmail.com
ADMIN_PASSWORD=<güçlü-parola>
SCRAPER_SERVICE_URL=https://scraper.guezelwebdesign.com
SCRAPER_SERVICE_API_KEY=<scraper token>
# ERP YOK (tarvista) — EXTERNAL_DB_PASPAS_* girilmez.
```
> backend env.ts sadece JWT_SECRET ve COOKIE_SECRET'i zorunlu kılar; diğerleri default'lu.

### 4) frontend/.env.production
```
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://market.tarvista.com
NEXT_PUBLIC_API_URL=/api/v1
PANEL_API_URL=http://127.0.0.1:8087
API_BASE_URL=http://127.0.0.1:8087/api/v1   # server-side build/SSR fetch'leri local backend'e (ZORUNLU)
NEXT_PUBLIC_APP_NAME=TarVista
NEXT_PUBLIC_BASE_PATH=
```
> ÖNEMLİ: frontend build sırasında SSG/SSR sayfaları API'ye fetch atar. Domain (nginx+SSL) build'den ÖNCE
> canlı olmalı, aksi halde `https://market.tarvista.com/api`'ye gidip 60sn timeout ile build çöker.
> Sıra: nginx vhost + certbot → SONRA frontend/admin build.

### 5) admin_panel/.env.production
```
NODE_ENV=production
NEXT_PUBLIC_BASE_PATH=/panel
NEXT_PUBLIC_API_URL=/api/v1
PANEL_API_URL=http://127.0.0.1:8087
NEXT_PUBLIC_SITE_URL=https://market.tarvista.com
NEXT_PUBLIC_APP_NAME=TarVista Panel
```

### 6) Install + build
```bash
cd /var/www/market_pulse/backend && bun install && bun run build
cd ../frontend && bun install && bun run build
cd ../admin_panel && bun install && bun run build
```

### 7) DB seed (fresh, --no-drop çünkü DB önceden oluşturuldu) + onboard
```bash
cd /var/www/market_pulse/backend
bun run src/db/seed/index.ts --no-drop      # market_user'a DROP DATABASE yetkisi yok
bun run src/scripts/onboard-tarvista.ts     # agri ICP iskeleti
```

### 8) PM2
```bash
cd /var/www/market_pulse
pm2 start deploy/tarvista/backend.ecosystem.config.cjs
pm2 start deploy/tarvista/frontend.ecosystem.config.cjs
pm2 start deploy/tarvista/admin.ecosystem.config.cjs
pm2 save
```

### 9) Nginx + SSL
```bash
cp deploy/tarvista/nginx-market.tarvista.com.conf /etc/nginx/sites-available/market.tarvista.com
ln -s /etc/nginx/sites-available/market.tarvista.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d market.tarvista.com --redirect -n --agree-tos -m orhanguzell@gmail.com
nginx -t && systemctl reload nginx
```

### 10) Smoke test
```bash
curl -fsS http://127.0.0.1:8087/api/v1/health || echo "backend health FAIL"
curl -fsS -o /dev/null -w "%{http_code}\n" https://market.tarvista.com/
curl -fsS -o /dev/null -w "%{http_code}\n" https://market.tarvista.com/panel/
```

## Güncelleme (sonraki deploy'lar)
```bash
bash /var/www/market_pulse/deploy/tarvista/deploy.sh
```

---

## EK — Faz 7 Merkezi Çok-Tenant Deploy (2026-06-05, CANLI)

Bu deploy artık MERKEZİ çok-tenant: vistaseeds + bereketfide + tarvista + default.
Admin panel root'ta (frontend kapalı). Tenant runtime'da `X-Tenant` header / `?tenantKey=` ile seçilir.

### Kaynak DB (her tenant kendi DB'sinden okur) — read-only kullanıcı
```sql
CREATE USER IF NOT EXISTS 'market_reader'@'localhost'  IDENTIFIED BY '<pw>';
CREATE USER IF NOT EXISTS 'market_reader'@'127.0.0.1'  IDENTIFIED BY '<pw>';
GRANT SELECT ON vistaseed.*   TO 'market_reader'@'localhost','market_reader'@'127.0.0.1';
GRANT SELECT ON bereketfide.* TO 'market_reader'@'localhost','market_reader'@'127.0.0.1';
FLUSH PRIVILEGES;
```

### backend/.env eklenenler
```
TENANT_KEY=vistaseeds            # default/fallback (switcher header'ı geçersiz kılar)
EXTERNAL_DB_VISTASEEDS_HOST=127.0.0.1
EXTERNAL_DB_VISTASEEDS_NAME=vistaseed
EXTERNAL_DB_VISTASEEDS_USER=market_reader
EXTERNAL_DB_VISTASEEDS_PASSWORD=<pw>
EXTERNAL_DB_BEREKETFIDE_HOST=127.0.0.1
EXTERNAL_DB_BEREKETFIDE_NAME=bereketfide
EXTERNAL_DB_BEREKETFIDE_USER=market_reader
EXTERNAL_DB_BEREKETFIDE_PASSWORD=<pw>
```
> connectionKey ('vistaseeds'/'bereketfide') → env prefix EXTERNAL_DB_<KEY>_USER/PASSWORD. host/db tenant_settings'ten.

### Canlı şema güncelleme (additive, veri korunur)
```bash
cd backend
bun run db:migrate                                  # Faz3 kolon rename + tenant_key
bun run src/db/seed/index.ts --no-drop --only=026,027   # yeni tablolar + tenant config (idempotent)
```

### Sync (ecosystem → market_pulse lead)
```
POST /api/v1/admin/market/erp/sync  (Authorization: Bearer + X-Tenant: vistaseeds, body: {})
→ dealer_profiles -> market_targets (tenant_key=vistaseeds)
```

### Deploy sırasında bulunan 2 kritik bug (DÜZELTİLDİ — tekrar etmesin)
1. ALS: `tenantStorage.run(key, done)` Fastify lifecycle'i context dışında bırakıyordu → `enterWith` kullan.
2. `tenantContextPlugin` `fastify-plugin` (fp) ile sarılmalı; aksi halde onRequest hook encapsulate olur,
   route'lara uygulanmaz → her istek env.TENANT_KEY'e düşer (cross-tenant sızıntı).
