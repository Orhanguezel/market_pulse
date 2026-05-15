import { env } from '@/core/env';

export async function getFairAttendeeIntent(fairId: string) {
  if (!env.TENTIMES_API_KEY) return [];
  const res = await fetch(`https://api.10times.com/v1/events/${encodeURIComponent(fairId)}/attendees`, {
    headers: { authorization: `Bearer ${env.TENTIMES_API_KEY}` },
  });
  if (!res.ok) throw new Error(`TENTIMES_FAILED_${res.status}`);
  const data = await res.json() as { attendees?: Array<{ company?: string; interested_count?: number; attending_count?: number }> };
  return data.attendees ?? [];
}
