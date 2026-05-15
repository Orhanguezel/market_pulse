'use client';

import { useEffect } from 'react';

export default function PwaRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const isDevHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

    if (process.env.NODE_ENV !== 'production' || isDevHost) {
      const cleanup = async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
          if ('caches' in window) {
            const keys = await window.caches.keys();
            await Promise.all(keys.map((key) => window.caches.delete(key)));
          }
        } catch {
          // Silent fail: dev should continue even if browser blocks SW cleanup.
        }
      };

      void cleanup();
      return;
    }

    const register = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
        await navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` });
      } catch {
        // Silent fail: site should continue without PWA features.
      }
    };

    void register();
  }, []);

  return null;
}
