'use client';

import { getAdminBrandSubtitle } from '@/lib/admin-brand';
import { useAdminSettings } from '../admin-settings-provider';

export function AdminHeaderBrand() {
  const { branding } = useAdminSettings();
  const headerTitle = branding.app_name;
  const headerSub = getAdminBrandSubtitle();

  return (
    <div className="flex flex-col">
      <h2 className="hidden text-sm font-serif font-bold tracking-tight text-foreground sm:block">
        {headerTitle}
      </h2>
      {headerSub ? (
        <span className="hidden text-[8px] font-bold tracking-[0.3em] text-gm-gold uppercase sm:block">
          {headerSub}
        </span>
      ) : null}
    </div>
  );
}
