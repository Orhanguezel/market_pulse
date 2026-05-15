'use client';

import { useParams } from 'next/navigation';
import { localePath } from '@/i18n';
import { NotFoundContent } from '@/components/common/public/NotFoundContent';

export default function NotFound() {
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'de';

  return (
    <NotFoundContent
      locale={locale}
      homePath={localePath('/', locale)}
    />
  );
}
