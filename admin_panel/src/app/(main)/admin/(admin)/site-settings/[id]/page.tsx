// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/[id]/page.tsx
// FINAL — App Router wrapper (params Promise safe)
// =============================================================

import SiteSettingsDetailClient from '../_components/admin-site_settings-detail-client';

type Params = { id: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const p = await params;
  return <SiteSettingsDetailClient id={p.id} />;
}
