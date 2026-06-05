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
NEXT_PUBLIC_APP_NAME=TarVista
NEXT_PUBLIC_BASE_PATH=
```

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
