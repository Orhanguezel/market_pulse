// =============================================================
// FILE: src/features/analytics/AnalyticsScripts.tsx
// GTM preferred, optional GA4 gtag.js (consent-mode)
// - Pages Router: DO NOT use beforeInteractive outside pages/_document
// - Consent Mode init via afterInteractive, with queued consent updates
// - If GTM exists => loads GTM (page_view will be pushed to dataLayer by GAViewPages)
// - If GTM missing but GA4 exists => loads gtag.js (send_page_view:false)
// =============================================================
'use client';

import Script from 'next/script';
import { useEffect, useMemo } from 'react';
import { useAnalyticsSettings } from './useAnalyticsSettings';
import { getAnalyticsConsentEventName } from '@/lib/site-config';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;

    __setAnalyticsConsent?: (c: { analytics_storage: 'granted' | 'denied' } | boolean) => void;
    __analyticsConsentGranted?: boolean;

    // consent init gelmeden önce banner tetiklerse kuyruk
    __pendingAnalyticsConsent?: Array<{ analytics_storage: 'granted' | 'denied' } | boolean>;
  }
}

function isProdEnv() {
  return process.env.NODE_ENV === 'production';
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

export default function AnalyticsScripts() {
  const { gtmId, ga4Id, facebookPixelId, isLoading } = useAnalyticsSettings();
  const isProd = isProdEnv();

  const hasGtm = useMemo(() => isValidGtmId(gtmId), [gtmId]);
  const hasGa = useMemo(() => isValidGa4Id(ga4Id), [ga4Id]);
  const hasFbPixel = useMemo(() => isValidFbPixelId(facebookPixelId), [facebookPixelId]);

  // GTM noscript (Document kullanılmıyorsa pratik)
  useEffect(() => {
    if (!isProd || !hasGtm || typeof document === 'undefined') return;

    const existing = document.getElementById('gtm-noscript');
    if (existing) return;

    const ns = document.createElement('noscript');
    ns.id = 'gtm-noscript';

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(String(gtmId))}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';

    ns.appendChild(iframe);
    document.body.insertBefore(ns, document.body.firstChild);
  }, [isProd, hasGtm, gtmId]);

  if (!isProd) return null;

  // DB'den henüz gelmediyse: hiçbir şey basma (flicker/yanlış init olmasın)
  if (isLoading) return null;

  if (!hasGtm && !hasGa && !hasFbPixel) return null;

  return (
    <>
      {/* 1) Consent Mode init (default denied) + external setter + queue flush */}
      <Script id="analytics-consent-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];

          // gtag shim (safe even if gtag.js not loaded yet)
          function gtag(){ window.dataLayer.push(arguments); }
          window.gtag = window.gtag || gtag;

          // consent queue
          window.__pendingAnalyticsConsent = window.__pendingAnalyticsConsent || [];

          // privacy by default
          window.gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });

          window.__analyticsConsentGranted = false;

          // External setter for cookie banner
          window.__setAnalyticsConsent = function(next){
            try {
              var granted =
                (typeof next === 'boolean')
                  ? next
                  : (next && next.analytics_storage === 'granted');

              var v = granted ? 'granted' : 'denied';
              window.__analyticsConsentGranted = (v === 'granted');

              // Update consent (gtag / Consent Mode)
              window.gtag('consent', 'update', {
                analytics_storage: v,
                // keep ads denied by default unless you explicitly enable marketing later
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });

              // Notify GTM (or any listener)
              window.dataLayer.push({ event: '${getAnalyticsConsentEventName()}', analytics_storage: v });
            } catch (e) {}
          };

          // Flush queued consent updates
          try {
            var q = window.__pendingAnalyticsConsent || [];
            for (var i=0; i<q.length; i++) {
              window.__setAnalyticsConsent(q[i]);
            }
            window.__pendingAnalyticsConsent = [];
          } catch (e) {}
        `}
      </Script>

      {/* 2) GTM (preferred) */}
      {hasGtm ? (
        <Script id="gtm-src" strategy="lazyOnload">
          {`
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),
                  dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${String(gtmId)}');
          `}
        </Script>
      ) : (
        // 3) GA4 fallback (GTM yoksa)
        <>
          {hasGa ? (
            <>
              <Script
                id="ga-src"
                src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
                  String(ga4Id),
                )}`}
                strategy="lazyOnload"
              />
              <Script id="ga-config" strategy="lazyOnload">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){ window.dataLayer.push(arguments); }
                  window.gtag = window.gtag || gtag;

                  window.gtag('js', new Date());

                  // send_page_view:false => SPA page_view GAViewPages will send
                  window.gtag('config', '${String(ga4Id)}', {
                    anonymize_ip: true,
                    send_page_view: false
                  });
                `}
              </Script>
            </>
          ) : null}
        </>
      )}

      {/* 4) Facebook Pixel */}
      {hasFbPixel ? (
        <Script id="fb-pixel" strategy="lazyOnload">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            fbq('consent', 'revoke');
            fbq('init', '${String(facebookPixelId)}');

            // Listen for consent updates
            if (window.__analyticsConsentGranted) {
              fbq('consent', 'grant');
              fbq('track', 'PageView');
            }

            // Queue consent updates
            var originalSetConsent = window.__setAnalyticsConsent;
            window.__setAnalyticsConsent = function(next) {
              if (originalSetConsent) originalSetConsent(next);
              try {
                var granted = (typeof next === 'boolean') ? next : (next && next.analytics_storage === 'granted');
                if (granted) {
                  fbq('consent', 'grant');
                  fbq('track', 'PageView');
                } else {
                  fbq('consent', 'revoke');
                }
              } catch (e) {}
            };
          `}
        </Script>
      ) : null}
    </>
  );
}
