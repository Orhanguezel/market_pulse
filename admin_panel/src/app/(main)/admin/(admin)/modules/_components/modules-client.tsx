'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Boxes, CalendarClock, CheckCircle2, PauseCircle, Tag } from 'lucide-react';

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
  useUpdateModuleCatalogMutation,
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

function CatalogPriceRow({ item }: { item: ModuleCatalogItem }) {
  const [update, state] = useUpdateModuleCatalogMutation();
  const [price, setPrice] = React.useState(String(item.base_price ?? 0));
  const [currency, setCurrency] = React.useState(item.currency || 'TRY');
  const [period, setPeriod] = React.useState<'monthly' | 'yearly'>(item.billing_period);

  React.useEffect(() => {
    setPrice(String(item.base_price ?? 0));
    setCurrency(item.currency || 'TRY');
    setPeriod(item.billing_period);
  }, [item.base_price, item.currency, item.billing_period]);

  const save = async () => {
    try {
      await update({
        moduleKey: item.module_key,
        base_price: Number(price) || 0,
        currency,
        billing_period: period,
      }).unwrap();
      toast.success('Fiyat güncellendi');
    } catch {
      toast.error('Fiyat güncellenemedi');
    }
  };

  return (
    <div className="grid items-center gap-2 border-t py-2 first:border-t-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{item.name}</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.module_key}</div>
      </div>
      <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} disabled={state.isLoading} />
      <Select value={currency} onValueChange={setCurrency} disabled={state.isLoading}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="TRY">TRY</SelectItem>
          <SelectItem value="USD">USD</SelectItem>
          <SelectItem value="EUR">EUR</SelectItem>
        </SelectContent>
      </Select>
      <Select value={period} onValueChange={(v) => setPeriod(v as 'monthly' | 'yearly')} disabled={state.isLoading}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="monthly">Aylık</SelectItem>
          <SelectItem value="yearly">Yıllık</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={save} disabled={state.isLoading} size="sm" variant="outline">Kaydet</Button>
    </div>
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

      {!catalogLoading && catalog.length > 0 && (
        <Card className="rounded-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="size-4 text-gm-gold" />
              Paket Fiyatları (katalog — tüm workspace'ler)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="hidden gap-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)_auto]">
              <span>Paket</span><span>Fiyat</span><span>Para</span><span>Dönem</span><span />
            </div>
            {catalog.map((item) => (
              <CatalogPriceRow key={item.module_key} item={item} />
            ))}
            <p className="pt-3 text-xs text-muted-foreground">
              Mail &amp; Takvim ücretsiz (0). Ödeme havale ile manuel — fiyatı buradan güncelle, erişimi aşağıdan/kullanıcı kartından aç.
            </p>
          </CardContent>
        </Card>
      )}

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
