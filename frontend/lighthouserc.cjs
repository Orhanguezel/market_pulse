// lighthouserc.cjs
const baseUrl = (process.env.LHCI_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3095').replace(/\/$/, '');
const shouldStartServer = process.env.LHCI_START_SERVER !== 'false';

const paths = [
  '/tr',
  '/tr/consultants',
  '/tr/blog',
  '/tr/burclar',
  '/tr/sinastri',
  '/tr/tarot',
  '/tr/numeroloji',
];

const collect = {
  url: paths.map((path) => `${baseUrl}${path}`),
  numberOfRuns: Number(process.env.LHCI_RUNS || 1),
  settings: {
    preset: process.env.LHCI_PRESET || 'desktop',
    chromeFlags: [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
  },
};

if (shouldStartServer) {
  collect.startServerCommand = 'bun run start -- -p 3095';
  collect.startServerReadyPattern = 'Ready|started server|Local:|localhost:3095';
  collect.startServerReadyTimeout = 120000;
}

module.exports = {
  ci: {
    collect,
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'uses-http2': 'off',
        'bf-cache': 'off',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci/reports',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};
