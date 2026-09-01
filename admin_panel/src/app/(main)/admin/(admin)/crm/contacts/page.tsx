'use client';

import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useListCrmContactsQuery } from '@/integrations/hooks';

export default function CrmContactsPage() {
  const { data: contacts = [], isLoading } = useListCrmContactsQuery();
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-gm-gold">
          <Users className="size-5" />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">CRM</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl text-gm-text">Kontaklar</h1>
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">Yükleniyor...</div> : (
        <div className="grid gap-3">
          {contacts.map((contact) => (
            <Card key={contact.id} className="rounded-lg">
              <CardContent className="grid gap-1 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="truncate font-semibold">{[contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email || contact.id}</div>
                <div className="truncate text-sm text-muted-foreground sm:text-right">{contact.email || contact.phone || '-'}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
