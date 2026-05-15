// Firebase Cloud Messaging Service Worker (placeholder)
// This file prevents 404 errors in the browser console.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
