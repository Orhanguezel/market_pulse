// PM2 — market_pulse admin panel (tarvista deploy)
// Kurulum: /var/www/market_pulse/admin_panel  (Next.js, port 3097, basePath=/panel)
// NOT: basePath build sırasında .env.production'daki NEXT_PUBLIC_BASE_PATH=/panel ile gömülür.
module.exports = {
  apps: [
    {
      name: 'market-pulse-admin',
      cwd: '/var/www/market_pulse/admin_panel',
      script: '/usr/bin/bun',
      args: 'x next start -p 3097 -H 127.0.0.1',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: '3097',
        HOSTNAME: '127.0.0.1',
      },
      out_file: '/root/.pm2/logs/market-pulse-admin.out.log',
      error_file: '/root/.pm2/logs/market-pulse-admin.err.log',
    },
  ],
};
