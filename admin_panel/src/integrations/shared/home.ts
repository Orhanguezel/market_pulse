import type { CustomPageView } from '@/integrations/shared';

export function normalizeAssetPath(raw: string | null | undefined): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
  if (s.startsWith('/')) return s;
  if (s.startsWith('assets/')) return `/${s}`;
  return s;
}

export function toTelHref(phone?: string) {
  if (!phone) return '#';
  return phone.startsWith('tel:') ? phone : `tel:${phone}`;
}

export function toMailHref(email?: string) {
  if (!email) return '#';
  return email.startsWith('mailto:') ? email : `mailto:${email}`;
}

export function toSkypeHref(skype?: string) {
  if (!skype) return '#';
  return skype.startsWith('skype:') ? skype : `skype:${skype}`;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function pickBlogImage(p: CustomPageView, fallback: string) {
  return (
    p.featured_image_effective_url ||
    p.image_effective_url ||
    p.featured_image ||
    p.image_url ||
    p.images_effective_urls?.[0] ||
    p.images?.[0] ||
    fallback
  );
}
