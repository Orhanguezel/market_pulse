// Admin panel — no service worker needed.
// This file exists only to prevent 404 errors from browsers
// that previously registered a service worker on this origin.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => self.clients.matchAll()).then((clients) => {
      clients.forEach((client) => {
        if ('navigate' in client) client.navigate(client.url);
      });
    })
  );
});
