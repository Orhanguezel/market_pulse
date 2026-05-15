const VERSION = 'pwa-v2';
const SHELL = `${VERSION}-shell`;
const STATIC = `${VERSION}-static`;
const PAGE = `${VERSION}-page`;
const OFFLINE = '/offline.html';
const SHELL_ASSETS = [OFFLINE, '/favicon.svg', '/favicon/apple-touch-icon.svg', '/favicon/icon-192.png', '/favicon/icon-512.png'];
const STATIC_RE = /\.(?:avif|webp|png|jpe?g|svg|gif|ico|woff2?|ttf|otf)$/i;
const SKIP_RE = /\/api\/|\/site_settings|\/_next\//;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

async function put(cacheName, request, response) {
  if (response && response.ok && response.type === 'basic') {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin || SKIP_RE.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(PAGE).then(async (cache) => {
        const cached = await cache.match(request);
        const fresh = fetch(request)
          .then((response) => put(PAGE, request, response))
          .catch(() => cached || caches.match(OFFLINE));
        return cached || fresh;
      }),
    );
    return;
  }

  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => put(STATIC, request, response))
        .catch(() => caches.match(request)),
    );
  }
});
