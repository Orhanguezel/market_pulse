// =============================================================
// FILE: src/app/(main)/admin/(admin)/notifications/[id]/page.tsx
// FINAL — Admin Notification Detail/Edit Page
// =============================================================

import AdminNotificationDetailClient from '../_components/admin-notification-detail-client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminNotificationDetailClient id={id} />;
}
