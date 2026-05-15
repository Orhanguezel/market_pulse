import { redirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

// /profile artık ayrı bir sayfa değil — kullanıcı hub'ı /dashboard altında.
export default async function ProfileRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard?tab=profile`);
}
