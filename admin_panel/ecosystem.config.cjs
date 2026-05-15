module.exports = {
  apps: [
    {
      name: 'mp-panel',
      cwd: '/var/www/market_pulse/market_pulse/admin_panel',
      script: '/root/.bun/bin/bun',
      args: 'run start -- -p 3096 -H 127.0.0.1',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: '500M',
      min_uptime: '30s',
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_BASE_PATH: '/market',
        NEXT_PUBLIC_API_BASE: '/market/api/v1',
        PANEL_API_URL: 'http://127.0.0.1:8086',
        PATH: '/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      },
    },
  ],
};
