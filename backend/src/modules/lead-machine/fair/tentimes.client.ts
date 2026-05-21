import { env } from '@/core/env';

/**
 * @deprecated 2026-05-21 — 10times entegrasyonu drop edildi.
 *
 * Sebep:
 *  - 10times.com'da public/self-serve API yok (resmî developer portalı mevcut değil)
 *  - "Free tier API key" varsayımı LLM halüsinasyonuydu — doğrulanmadı
 *  - Avrasya Automechanika 2026 use case'i için ihtiyacımız da değil:
 *    Messe Frankfurt public API zaten 429 exhibitor + mail %88 + website %90 veriyor
 *  - Ziyaretçi intent verisi B2B alıcı havuzunu büyütmüyor
 *
 * Detay karar belgesi: docs/teknik/10times-drop-karari.md
 *
 * Bu dosya tarihsel referans olarak korunur. `fair.job.ts` ÇAĞIRMIYOR.
 * İleride 10times'ın gerçek partner API'sı netleşirse yeniden değerlendirilebilir.
 */
export async function getFairAttendeeIntent(fairId: string) {
  if (!env.TENTIMES_API_KEY) return [];
  const res = await fetch(`https://api.10times.com/v1/events/${encodeURIComponent(fairId)}/attendees`, {
    headers: { authorization: `Bearer ${env.TENTIMES_API_KEY}` },
  });
  if (!res.ok) throw new Error(`TENTIMES_FAILED_${res.status}`);
  const data = await res.json() as { attendees?: Array<{ company?: string; interested_count?: number; attending_count?: number }> };
  return data.attendees ?? [];
}
