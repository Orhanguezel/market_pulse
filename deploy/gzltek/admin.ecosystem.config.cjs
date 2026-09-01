// PM2 — market_pulse admin panel (gzltek deploy)
// Kurulum: /var/www/market_pulse/admin_panel  (Next.js, port 3096, basePath=/panel)
// NOT: basePath build sırasında .env.production'daki NEXT_PUBLIC_BASE_PATH=/panel ile gomulur.
module.exports = {
  apps: [
    {
      name: 'market-pulse-gzltek-admin',
      cwd: '/var/www/market_pulse/admin_panel',
      script: '/usr/local/bin/bun',
      args: 'x next start -p 3096 -H 127.0.0.1',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: '3096',
        HOSTNAME: '127.0.0.1',
      },
      out_file: '/root/.pm2/logs/market-pulse-gzltek-admin.out.log',
      error_file: '/root/.pm2/logs/market-pulse-gzltek-admin.err.log',
    },
  ],
};
