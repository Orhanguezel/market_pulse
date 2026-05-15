// =============================================================
// FILE: src/app/(main)/admin/(admin)/storage/[id]/page.tsx
// FINAL — Admin Storage Upload/Edit Page
// =============================================================================

import AdminStorageDetailClient from '../_components/admin-storage-detail-client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminStorageDetailClient id={id} />;
}
