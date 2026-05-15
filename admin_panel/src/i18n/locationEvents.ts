// =============================================================
// FILE: src/i18n/locationEvents.ts
// guezelwebdesign – SPA navigation detector (no next/router)
// =============================================================
'use client';

let patched = false;

function dispatchLocationChange() {
  // Defer to avoid "useInsertionEffect must not schedule updates" error
  // This ensures the event is dispatched after React finish its current update cycle
  setTimeout(() => {
    try {
      window.dispatchEvent(new Event('locationchange'));
    } catch {
      // ignore
    }
  }, 0);
}

/**
 * ✅ Intercepts pushState/replaceState and emits:
 * - locationchange
 * Also listens to:
 * - popstate
 * - hashchange
 */
export function ensureLocationEventsPatched() {
  if (patched) return;
  if (typeof window === 'undefined') return;

  patched = true;

  const { pushState, replaceState } = window.history;

  // ✅ TS fix: annotate `this`
  window.history.pushState = function (this: History, ...args: any[]) {
    const ret = pushState.apply(this, args as any);
    dispatchLocationChange();
    return ret;
  } as any;

  window.history.replaceState = function (this: History, ...args: any[]) {
    const ret = replaceState.apply(this, args as any);
    dispatchLocationChange();
    return ret;
  } as any;

  window.addEventListener('popstate', dispatchLocationChange);
  window.addEventListener('hashchange', dispatchLocationChange);
}
