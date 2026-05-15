// =============================================================
// FILE: src/features/analytics/useAnalyticsSettings.ts
// – Analytics settings from DB (locale + fallback)
// - Locale source: useLocaleShort() (dynamic, validated by provider)
// - DB values override env (optional fallback)
// =============================================================
'use client';

import { useMemo } from 'react';
import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import { useLocaleShort } from '@/i18n';

function coerceId(v: unknown): string {
  return String(v ?? '').trim();
}

export function useAnalyticsSettings() {
  const locale = useLocaleShort(); // ✅ single source of truth

  // Backend fallback chain (requested -> default -> app_locales -> '*') handled server-side.
  const {
    data: ga,
    isLoading: gaLoading,
    isFetching: gaFetching,
  } = useGetSiteSettingByKeyQuery({ key: 'ga4_measurement_id', locale } as any);

  const {
    data: gtm,
    isLoading: gtmLoading,
    isFetching: gtmFetching,
  } = useGetSiteSettingByKeyQuery({ key: 'gtm_container_id', locale } as any);

  const ga4Id = useMemo(() => {
    const db = coerceId((ga as any)?.value);
    const env = coerceId(process.env.NEXT_PUBLIC_GA_ID); // optional fallback
    return db || env;
  }, [ga]);

  const gtmId = useMemo(() => {
    const db = coerceId((gtm as any)?.value);
    const env = coerceId(process.env.NEXT_PUBLIC_GTM_ID); // optional fallback
    return db || env;
  }, [gtm]);

  const {
    data: fbPixel,
    isLoading: fbPixelLoading,
    isFetching: fbPixelFetching,
  } = useGetSiteSettingByKeyQuery({ key: 'facebook_pixel_id', locale } as any);

  const {
    data: gscVerification,
    isLoading: gscLoading,
    isFetching: gscFetching,
  } = useGetSiteSettingByKeyQuery({ key: 'google_site_verification', locale } as any);

  const facebookPixelId = useMemo(() => {
    const db = coerceId((fbPixel as any)?.value);
    const env = coerceId(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID);
    return db || env;
  }, [fbPixel]);

  const googleSiteVerification = useMemo(() => {
    return coerceId((gscVerification as any)?.value);
  }, [gscVerification]);

  const isLoading = gaLoading || gtmLoading || gaFetching || gtmFetching || fbPixelLoading || fbPixelFetching || gscLoading || gscFetching;

  return { locale, ga4Id, gtmId, facebookPixelId, googleSiteVerification, isLoading };
}
