'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { useMemo } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

import { buildAdminSettingsItems } from '@/navigation/sidebar/sidebar-items';
import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { useStatusQuery } from '@/integrations/hooks';
import type { TranslateFn } from '@/i18n';

export function AdminSettingsDropdown() {
  const { copy } = useAdminUiCopy();
  const t = useAdminT();
  const { data: statusData } = useStatusQuery();

  const isDeveloper = useMemo(() => {
    const role = String(statusData?.user?.role || '');
    return role === 'developer' || role === 'super_admin';
  }, [statusData]);

  const settingsGroups = useMemo(
    () => buildAdminSettingsItems(copy.nav, t as unknown as TranslateFn, isDeveloper),
    [copy.nav, t, isDeveloper],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-gm-muted hover:text-gm-text hover:bg-gm-surface-high transition-colors"
        >
          <Settings className="size-4" />
          <span className="sr-only">Ayarlar</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="min-w-56 rounded-xl">
        {settingsGroups.map((group, i) => (
          <div key={group.id}>
            {i > 0 && <DropdownMenuSeparator />}
            {group.label && (
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground pb-1">
                {group.label}
              </DropdownMenuLabel>
            )}
            {group.items.map((item) => (
              <DropdownMenuItem key={item.url} asChild>
                <Link href={item.url} className="flex items-center gap-2">
                  {item.icon && <item.icon className="size-4 shrink-0" />}
                  <span>{item.title}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
