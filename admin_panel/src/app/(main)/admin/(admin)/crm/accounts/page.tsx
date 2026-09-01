'use client';

import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useListCrmAccountsQuery } from '@/integrations/hooks';

export default function CrmAccountsPage() {
  const { data: accounts = [], isLoading } = useListCrmAccountsQuery();
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-gm-gold">
          <Building2 className="size-5" />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">CRM</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl text-gm-text">Hesaplar</h1>
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">Yükleniyor...</div> : (
        <div className="grid gap-3">
          {accounts.map((account) => (
            <Card key={account.id} className="rounded-lg">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{account.name}</div>
                  <div className="text-sm text-muted-foreground">{[account.country, account.city].filter(Boolean).join(' / ')}</div>
                </div>
                <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>{account.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
