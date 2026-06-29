'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Boxes, CalendarClock, CheckCircle2, PauseCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  useActivateTenantModuleMutation,
  useListModuleCatalogQuery,
  useListTenantModulesQuery,
  useListTenantsQuery,
  useSuspendTenantModuleMutation,
  type ModuleCatalogItem,
  type ModuleStatus,
  type TenantModule,
} from '@/integrations/hooks';
import { getSelectedTenantKey, setSelectedTenantKey } from '@/integrations/core/tenant';

const ACTIVE_STATUSES: ModuleStatus[] = ['trial', 'active'];

function money(value: string | number, currency: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ${currency}`;
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(n);
}

function dateOnly(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

function statusLabel(status: ModuleStatus | undefined) {
  if (status === 'trial') return 'Trial';
  if (status === 'active') return 'Aktif';
  if (status === 'suspended') return 'Askıda';
  if (status === 'cancelled') return 'İptal';
  return 'Kapalı';
}

function ModuleRow({
  catalog,
  module,
  tenantKey,
}: {
  catalog: ModuleCatalogItem;
  module?: TenantModule;
  tenantKey: string;
}) {
  const [activate, activateState] = useActivateTenantModuleMutation();
  const [suspend, suspendState] = useSuspendTenantModuleMutation();
  const [status, setStatus] = React.useState<ModuleStatus>(module?.status ?? 'active');
  const [expiresAt, setExpiresAt] = React.useState(dateOnly(module?.expires_at));

  React.useEffect(() => {
    setStatus(module?.status ?? 'active');
    setExpiresAt(dateOnly(module?.expires_at));
  }, [module?.status, module?.expires_at]);

  const active = module ? ACTIVE_STATUSES.includes(module.status) : false;
  const busy = activateState.isLoading || suspendState.isLoading;

  const save = async (nextStatus = status, nextExpiresAt = expiresAt) => {
    try {
      await activate({
        tenantKey,
        module_key: catalog.module_key,
        status: nextStatus,
        expires_at: nextExpiresAt ? `${nextExpiresAt} 23:59:59` : null,
      }).unwrap();
      toast.success('Modül güncellendi');
    } catch {
      toast.error('Modül güncellenemedi');
    }
  };

  const toggle = async (checked: boolean) => {
    try {
      if (checked) {
        const nextStatus = status === 'trial' ? 'trial' : 'active';
        setStatus(nextStatus);
        await activate({
          tenantKey,
          module_key: catalog.module_key,
          status: nextStatus,
          expires_at: expiresAt ? `${expiresAt} 23:59:59` : null,
        }).unwrap();
      } else {
        await suspend({ tenantKey, module_key: catalog.module_key }).unwrap();
      }
      toast.success(checked ? 'Modül açıldı' : 'Modül askıya alındı');
    } catch {
      toast.error('İşlem tamamlanamadı');
    }
  };

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{catalog.name}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{catalog.module_key}</Badge>
              <Badge variant={active ? 'default' : 'secondary'}>{statusLabel(module?.status)}</Badge>
            </div>
          </div>
          <Switch
            checked={active}
            disabled={busy}
            onCheckedChange={toggle}
            className="data-[state=checked]:bg-gm-gold"
            aria-label={`${catalog.name} modülü`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="grid gap-2">
            <Label>Durum</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                const next = value as ModuleStatus;
                setStatus(next);
                void save(next, expiresAt);
              }}
              disabled={busy}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="suspended">Askıda</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Bitiş</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              disabled={busy}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={() => void save()} disabled={busy} size="icon" aria-label="Kaydet">
              <CalendarClock className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{catalog.category}</span>
          <span>{money(catalog.base_price, catalog.currency)}</span>
          <span>{catalog.billing_period}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ModulesClient() {
  const { data: tenants = [], isLoading: tenantsLoading } = useListTenantsQuery();
  const { data: catalog = [], isLoading: catalogLoading } = useListModuleCatalogQuery();
  const [tenantKey, setTenantKey] = React.useState('');

  React.useEffect(() => {
    const selected = getSelectedTenantKey();
    const first = tenants[0]?.key ?? '';
    setTenantKey(selected || first);
  }, [tenants]);

  const selectedTenant = tenants.find((tenant) => tenant.key === tenantKey) ?? tenants[0];
  const { data: tenantModules = [], isLoading: modulesLoading } = useListTenantModulesQuery(tenantKey, {
    skip: !tenantKey,
  });
  const moduleMap = React.useMemo(() => new Map(tenantModules.map((item) => [item.module_key, item])), [tenantModules]);

  const loading = tenantsLoading || catalogLoading || modulesLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-gm-gold">
            <Boxes className="size-5" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">SaaS</span>
          </div>
          <h1 className="mt-2 font-serif text-3xl text-gm-text">Modüller</h1>
        </div>
        <div className="w-full lg:w-80">
          <Label className="mb-2 block">Tenant</Label>
          <Select
            value={tenantKey}
            onValueChange={(next) => {
              setTenantKey(next);
              setSelectedTenantKey(next);
            }}
          >
            <SelectTrigger>
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
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tenant</div>
          <div className="mt-2 truncate text-lg font-semibold">{selectedTenant?.branding?.displayName || selectedTenant?.name || '-'}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Aktif</div>
          <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 className="size-4 text-emerald-600" />
            {tenantModules.filter((item) => ACTIVE_STATUSES.includes(item.status)).length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Askıda</div>
          <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
            <PauseCircle className="size-4 text-amber-600" />
            {tenantModules.filter((item) => item.status === 'suspended').length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {catalog.map((item) => (
            <ModuleRow
              key={item.module_key}
              catalog={item}
              module={moduleMap.get(item.module_key)}
              tenantKey={tenantKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}
