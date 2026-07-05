import { redirect } from 'next/navigation';

export default async function PotansiyelMusterilerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/firma-bulucu/adaylar?status=approved`);
}
