'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Building2, Plus, Save, UserPlus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateTenantRoleMutation,
  useListTenantRolesQuery,
  useListTenantsQuery,
  useOnboardTenantMutation,
  useUpdateTenantProfileMutation,
  type TenantSummary,
} from '@/integrations/hooks';

function safeJson(text: string) {
  if (!text.trim()) return {};
  return JSON.parse(text);
}

function TenantEditor({ tenant }: { tenant: TenantSummary }) {
  const [brandingText, setBrandingText] = React.useState(() => JSON.stringify(tenant.branding ?? {}, null, 2));
  const [userId, setUserId] = React.useState('');
  const [updateTenant, updateState] = useUpdateTenantProfileMutation();
  const [createRole, roleState] = useCreateTenantRoleMutation();
  const { data: roles = [] } = useListTenantRolesQuery(tenant.key);

  React.useEffect(() => {
    setBrandingText(JSON.stringify(tenant.branding ?? {}, null, 2));
  }, [tenant]);

  const save = async () => {
    try {
      await updateTenant({ key: tenant.key, body: { branding: safeJson(brandingText) } }).unwrap();
      toast.success('Tenant profili güncellendi');
    } catch {
      toast.error('JSON veya kayıt hatası');
    }
  };

  const addRole = async () => {
    if (!userId.trim()) return;
    try {
      await createRole({ key: tenant.key, user_id: userId.trim(), role: 'tenant_admin' }).unwrap();
      setUserId('');
      toast.success('Rol atandı');
    } catch {
      toast.error('Rol atanamadı');
    }
  };

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{tenant.branding?.displayName || tenant.name}</CardTitle>
          <Badge variant="outline">{tenant.key}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Branding JSON</Label>
          <Textarea value={brandingText} onChange={(e) => setBrandingText(e.target.value)} className="min-h-36 font-mono text-xs" />
        </div>
        <Button onClick={save} disabled={updateState.isLoading} size="sm">
          <Save className="mr-2 size-4" />
          Kaydet
        </Button>
        <div className="grid gap-2 border-t pt-4">
          <Label>Tenant admin ata</Label>
          <div className="flex gap-2">
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user_id" />
            <Button onClick={addRole} disabled={roleState.isLoading || !userId.trim()} size="icon" aria-label="Rol ata">
              <UserPlus className="size-4" />
            </Button>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {roles.map((role) => (
              <div key={role.id} className="flex justify-between rounded border px-2 py-1">
                <span>{role.email || role.user_id}</span>
                <span>{role.role}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantsClient() {
  const { data: tenants = [], isLoading } = useListTenantsQuery();
  const [tenantKey, setTenantKey] = React.useState('');
  const [name, setName] = React.useState('');
  const [onboard, onboardState] = useOnboardTenantMutation();

  const handleOnboard = async () => {
    if (!tenantKey.trim() || !name.trim()) return;
    try {
      await onboard({
        tenant_key: tenantKey.trim(),
        name: name.trim(),
        branding: { appName: 'MarketPulse', displayName: name.trim(), logoUrl: '', sector: 'platform' },
      }).unwrap();
      setTenantKey('');
      setName('');
      toast.success('Tenant oluşturuldu');
    } catch {
      toast.error('Tenant oluşturulamadı');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-gm-gold">
          <Building2 className="size-5" />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">SaaS</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl text-gm-text">Tenant Yönetimi</h1>
      </div>

      <Card className="rounded-lg">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]">
          <Input value={tenantKey} onChange={(e) => setTenantKey(e.target.value)} placeholder="tenant_key" />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Görünen ad" />
          <Button onClick={handleOnboard} disabled={onboardState.isLoading || !tenantKey.trim() || !name.trim()}>
            <Plus className="mr-2 size-4" />
            Onboard
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {tenants.map((tenant) => <TenantEditor key={tenant.key} tenant={tenant} />)}
        </div>
      )}
    </div>
  );
}
