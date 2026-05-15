'use client';

import * as React from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useListPaspasCustomersQuery, type PaspasCustomer } from '@/integrations/hooks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: PaspasCustomer) => void;
}

export default function ImportPaspasCustomerDialog({ open, onOpenChange, onSelect }: Props) {
  const [q, setQ] = React.useState('');
  const { data, isLoading, isFetching } = useListPaspasCustomersQuery(
    { q: q.trim() || undefined, limit: 50 },
    { skip: !open },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Paspas'tan İçe Aktar</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Müşteri adı veya telefon ile ara..."
            />
          </div>

          <ScrollArea className="h-[360px] rounded-md border">
            <div className="p-2 space-y-2">
              {(isLoading || isFetching) && (
                <>
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </>
              )}

              {!isLoading && !isFetching && (data?.length ?? 0) === 0 && (
                <p className="p-3 text-sm text-muted-foreground">Müşteri bulunamadı.</p>
              )}

              {data?.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    onSelect(customer);
                    onOpenChange(false);
                  }}
                  className="w-full rounded-md border p-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.phone || 'Telefon yok'} - {customer.address || 'Adres yok'}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
