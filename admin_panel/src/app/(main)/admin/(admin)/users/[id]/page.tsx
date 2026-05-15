// src/app/(main)/admin/users/[id]/page.tsx

import UserDetailClient from '../_components/user-detail-client';

type Params = { id: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const p = await params;
  return <UserDetailClient id={p.id} />;
}
