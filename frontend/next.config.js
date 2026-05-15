/** @type {import('next').NextConfig} */

// ✅ Bundle Analyzer (ANALYZE=true için)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

function imageHostsFromSiteUrl() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (!raw) return [];
  try {
    const u = new URL(raw);
    const host = u.hostname;
    const proto = u.protocol === 'http:' ? 'http' : 'https';
    const out = [{ protocol: proto, hostname: host, pathname: '/**' }];
    if (host.startsWith('www.')) {
      out.push({ protocol: proto, hostname: host.slice(4), pathname: '/**' });
    } else if (host && host !== 'localhost' && !host.startsWith('127.')) {
      out.push({ protocol: 'https', hostname: `www.${host}`, pathname: '/**' });
    }
    return out;
  } catch {
    return [];
  }
}

const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  turbopack: {},
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,

  // ✅ Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // ✅ Experimental optimizations
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      'lucide-react',
      'date-fns',
    ],
  },

  // ✅ Webpack config
  webpack: (config, { isServer }) => {
    return config;
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },

      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },
      ...imageHostsFromSiteUrl(),
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },

  // Backend uploads klasörünü frontend domain'i üzerinden serve et.
  // Dev: localhost:3000/uploads/x.png → backend origin/uploads (varsayilan 8086)
  // Prod'da Nginx aynı yönlendirmeyi /uploads location bloğuyla yapar.
  async rewrites() {
    // PANEL_API_URL: sunucu-taraflı backend adresi (SSR + rewrite için)
    const backendOrigin = (
      process.env.PANEL_API_URL || 'http://127.0.0.1:8086'
    ).replace(/\/+$/, '').replace(/\/api(\/v\d+)?$/, '');
    return [
      { source: '/api/v1/:path*', destination: `${backendOrigin}/api/v1/:path*` },
      { source: '/:locale/about', destination: '/:locale?section=promises' },
      { source: '/:locale/hakkimizda', destination: '/:locale?section=promises' },
      { source: '/:locale/how-it-works', destination: '/:locale?section=hybrid_model' },
      { source: '/:locale/nasil-calisir', destination: '/:locale?section=hybrid_model' },
      { source: '/:locale/referanslar', destination: '/:locale?section=testimonials' },
      { source: '/:locale/testimonials', destination: '/:locale?section=testimonials' },
      { source: '/:locale/yorumlar', destination: '/:locale?section=testimonials' },
      { source: '/:locale/featured', destination: '/:locale?section=consultants_featured' },
      { source: '/:locale/popular', destination: '/:locale?section=consultants_popular' },
      { source: '/:locale/trust', destination: '/:locale?section=trust' },
      { source: '/:locale/privacy', destination: '/:locale?section=trust' },
      { source: '/:locale/gizlilik', destination: '/:locale?section=trust' },
      { source: '/uploads/:path*', destination: `${backendOrigin}/uploads/:path*` },
    ];
  },

  async headers() {
    const staticContentCache = [
      {
        key: 'Cache-Control',
        value: 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    ];

    return [
      {
        source: '/:locale(tr|en|de)',
        headers: staticContentCache,
      },
      {
        source:
          '/:locale(tr|en|de)/:page(about|blog|explore|consultants|tarot|numeroloji|yildizname|kahve-fali|ruya-tabiri|faqs|editorial-policy|contact|pricing|become-consultant|booking|login|register|dashboard)',
        headers: staticContentCache,
      },
      {
        source: '/:locale(tr|en|de)/blog/:path*',
        headers: staticContentCache,
      },
      {
        source: '/:locale(tr|en|de)/consultants/:path*',
        headers: staticContentCache,
      },
    ];
  },

  async redirects() {
    return [
      { source: '/:locale/gutschein', destination: '/:locale', permanent: true },
      { source: '/:locale/services', destination: '/:locale/consultants', permanent: true },
      { source: '/:locale/appointment', destination: '/:locale/consultants', permanent: true },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
