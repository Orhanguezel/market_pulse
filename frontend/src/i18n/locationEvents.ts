// =============================================================
// FILE: src/i18n/locationEvents.ts  (FINAL)
// – SPA navigation detector (no next/router)
// FIX: dispatchLocationChange is async to avoid React insertion effect warnings
// =============================================================
'use client';

let patched = false;

function dispatchLocationChangeAsync() {
  // ✅ defer: do NOT trigger state updates inside pushState/replaceState sync phase
  try {
    queueMicrotask(() => {
      try {
        window.dispatchEvent(new Event('locationchange'));
      } catch {
        // ignore
      }
    });
  } catch {
    // older env fallback
    setTimeout(() => {
      try {
        window.dispatchEvent(new Event('locationchange'));
      } catch {
        // ignore
      }
    }, 0);
  }
}

export function ensureLocationEventsPatched() {
  if (patched) return;
  if (typeof window === 'undefined') return;

  patched = true;

  const { pushState, replaceState } = window.history;

  window.history.pushState = function (this: History, ...args: any[]) {
    const ret = pushState.apply(this, args as any);
    dispatchLocationChangeAsync();
    return ret;
  } as any;

  window.history.replaceState = function (this: History, ...args: any[]) {
    const ret = replaceState.apply(this, args as any);
    dispatchLocationChangeAsync();
    return ret;
  } as any;

  window.addEventListener('popstate', dispatchLocationChangeAsync);
  window.addEventListener('hashchange', dispatchLocationChangeAsync);
}
