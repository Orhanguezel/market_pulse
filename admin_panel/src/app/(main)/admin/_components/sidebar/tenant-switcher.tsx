'use client';

import * as React from 'react';
import { Building2 } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useListTenantsQuery } from '@/integrations/hooks';
import { getSelectedTenantKey, setSelectedTenantKey } from '@/integrations/core/tenant';
import { cn } from '@/lib/utils';

export function TenantSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { data: tenants = [] } = useListTenantsQuery();
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    const selected = getSelectedTenantKey();
    if (selected) {
      setValue(selected);
      return;
    }
    const first = tenants[0]?.key;
    if (first) {
      setSelectedTenantKey(first);
      setValue(first);
    }
  }, [tenants]);

  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-3 text-sidebar-foreground/70">
        <Building2 className="size-4" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <div className="mb-2 flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/50">
        <Building2 className="size-3.5" />
        Tenant
      </div>
      <Select
        value={value}
        onValueChange={(next) => {
          setSelectedTenantKey(next);
          setValue(next);
          window.location.reload();
        }}
      >
        <SelectTrigger className={cn('h-9 border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground')}>
          <SelectValue placeholder="Tenant seç" />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.key} value={tenant.key}>
              {tenant.branding?.displayName || tenant.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
