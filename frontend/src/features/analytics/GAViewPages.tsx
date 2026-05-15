// =============================================================
// FILE: src/features/analytics/GAViewPages.tsx
// Page view tracking (Pages Router) respecting consent
// - If GTM present: push a custom dataLayer event (no dependency on window.gtag)
// - If only GA4 gtag present: send gtag('event','page_view', ...)
// =============================================================
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAnalyticsSettings } from './useAnalyticsSettings';
import { getAnalyticsPageViewEventName } from '@/lib/site-config';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    __analyticsConsentGranted?: boolean;
  }
}

function isValidGtmId(v: unknown) {
  const s = String(v ?? '').trim();
  return !!s && s.startsWith('GTM-');
}

function isValidGa4Id(v: unknown) {
  const s = String(v ?? '').trim();
  return !!s && s.startsWith('G-');
}

function isValidFbPixelId(v: unknown) {
  const s = String(v ?? '').trim();
  return !!s && /^\d+$/.test(s);
}

export default function GAViewPages() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale, ga4Id, gtmId, facebookPixelId } = useAnalyticsSettings();

  const hasGtm = useMemo(() => isValidGtmId(gtmId), [gtmId]);
  const hasGa = useMemo(() => isValidGa4Id(ga4Id), [ga4Id]);
  const hasFbPixel = useMemo(() => isValidFbPixelId(facebookPixelId), [facebookPixelId]);

  const hasAnyAnalytics = hasGtm || hasGa || hasFbPixel;

  const lastAbsUrlRef = useRef<string>('');

  useEffect(() => {
    if (!hasAnyAnalytics) return;
    
    // Simulate current URL
    const nextUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    const send = (url: string) => {
      try {
        if (typeof window === 'undefined') return;
        if (window.__analyticsConsentGranted !== true) return;

        const path = (url || '/').split(/[?#]/)[0] || '/';
        const abs = window.location.origin + path;

        if (lastAbsUrlRef.current === abs) return;
        lastAbsUrlRef.current = abs;

        const payload = {
          page_title: document.title,
          page_location: abs,
          page_path: path,
          language: locale,
        };

        // 1) GTM path: push custom event (recommended)
        if (hasGtm) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: getAnalyticsPageViewEventName(),
            ...payload,
          });
        }
        
        // 2) GA4 direct
        else if (hasGa && typeof window.gtag === 'function') {
           window.gtag('event', 'page_view', payload);
        }

        // 3) Facebook Pixel
        if (hasFbPixel && typeof window.fbq === 'function') {
          window.fbq('track', 'PageView');
        }
      } catch (e) {
          // ignore
      }
    };
    
    send(nextUrl);

    // No routeChangeComplete in App Router. The effect itself runs on change.
  }, [pathname, searchParams, hasAnyAnalytics, hasGtm, hasGa, hasFbPixel, locale]);

  return null;
}
