'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useListPaspasCustomersQuery,
  useCreateMarketTargetMutation,
  useUpdateMarketTargetMutation,
  type MarketTarget,
  type PaspasCustomer,
} from '@/integrations/hooks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: MarketTarget | null;
}

type Form = {
  name: string;
  category: string;
  status: string;
  website: string;
  phone: string;
  email: string;
  contact_name: string;
  city: string;
  district: string;
  notes: string;
  instagram_url: string;
  google_maps_url: string;
};

const EMPTY: Form = {
  name: '', category: 'dealer', status: 'active',
  website: '', phone: '', email: '', contact_name: '',
  city: '', district: '', notes: '', instagram_url: '', google_maps_url: '',
};

export default function AddTargetDialog({ open, onOpenChange, existing }: Props) {
  const [form, setForm] = React.useState<Form>(EMPTY);
  const [paspasQ, setPaspasQ] = React.useState('');
  const [create, { isLoading: isCreating }] = useCreateMarketTargetMutation();
  const [update, { isLoading: isUpdating }] = useUpdateMarketTargetMutation();
  const { data: paspasCustomers = [], isFetching: isPaspasLoading } = useListPaspasCustomersQuery(
    { q: paspasQ || undefined, limit: 8 },
    { skip: !open },
  );
  const busy = isCreating || isUpdating;

  React.useEffect(() => {
    if (existing) {
      setForm({
        name:            existing.name,
        category:        existing.category,
        status:          existing.status,
        website:         existing.website ?? '',
        phone:           existing.phone ?? '',
        email:           existing.email ?? '',
        contact_name:    existing.contactName ?? '',
        city:            existing.city ?? '',
        district:        existing.district ?? '',
        notes:           existing.notes ?? '',
        instagram_url:   existing.instagramUrl ?? '',
        google_maps_url: existing.googleMapsUrl ?? '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [existing, open]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const importPaspasCustomer = (customer: PaspasCustomer) => {
    setForm((p) => ({
      ...p,
      name: customer.name,
      category: customer.tur === 'tedarikci' ? 'partner' : 'dealer',
      phone: customer.phone ?? '',
      notes: [p.notes, customer.address ? `Paspas adres: ${customer.address}` : '']
        .filter(Boolean)
        .join('\n'),
    }));
    toast.success('Paspas müşterisi forma aktarıldı');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Firma adı zorunlu'); return; }

    const body: any = {
      name:            form.name.trim(),
      category:        form.category,
      status:          form.status,
      contact_name:    form.contact_name || undefined,
      phone:           form.phone || undefined,
      email:           form.email || undefined,
      city:            form.city || undefined,
      district:        form.district || undefined,
      notes:           form.notes || undefined,
      instagram_url:   form.instagram_url || undefined,
      google_maps_url: form.google_maps_url || undefined,
    };
    if (form.website) {
      try { new URL(form.website); body.website = form.website; } catch { /* skip invalid url */ }
    }

    try {
      if (existing) {
        await update({ id: existing.id, body }).unwrap();
        toast.success('Hedef güncellendi');
      } else {
        await create(body).unwrap();
        toast.success('Hedef eklendi');
      }
      onOpenChange(false);
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? 'Hedef Düzenle' : 'Yeni Hedef Ekle'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!existing && (
            <div className="space-y-2 rounded-md border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <Label>Paspas'tan İçe Aktar</Label>
                <Input
                  value={paspasQ}
                  onChange={(e) => setPaspasQ(e.target.value)}
                  placeholder="Müşteri adı veya telefon ara"
                  disabled={busy}
                />
              </div>
              <div className="max-h-40 overflow-y-auto rounded border bg-background">
                {isPaspasLoading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Yükleniyor...</div>
                ) : paspasCustomers.length ? (
                  paspasCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                      onClick={() => importPaspasCustomer(customer)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{customer.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{customer.phone ?? customer.tur}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">Seç</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Kayıt yok veya bağlantı kapalı.</div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Firma Adı *</Label>
            <Input value={form.name} onChange={set('name')} placeholder="Örn: ABC Otomotiv" disabled={busy} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))} disabled={busy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dealer">Bayi</SelectItem>
                  <SelectItem value="competitor">Rakip</SelectItem>
                  <SelectItem value="partner">Ortak</SelectItem>
                  <SelectItem value="distributor">Distribütör</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Durum</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))} disabled={busy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="paused">Duraklatıldı</SelectItem>
                  <SelectItem value="churned">Kaybedildi</SelectItem>
                  <SelectItem value="converted">Dönüştürüldü</SelectItem>
                  <SelectItem value="archived">Arşivlendi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Şehir</Label>
              <Input value={form.city} onChange={set('city')} placeholder="İstanbul" disabled={busy} />
            </div>
            <div className="space-y-1.5">
              <Label>İlçe</Label>
              <Input value={form.district} onChange={set('district')} placeholder="Kadıköy" disabled={busy} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>İlgili Kişi</Label>
            <Input value={form.contact_name} onChange={set('contact_name')} placeholder="Ad Soyad" disabled={busy} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={set('phone')} placeholder="05XX..." disabled={busy} />
            </div>
            <div className="space-y-1.5">
              <Label>E-posta</Label>
              <Input type="email" value={form.email} onChange={set('email')} placeholder="info@..." disabled={busy} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Web Sitesi</Label>
            <Input value={form.website} onChange={set('website')} placeholder="https://..." disabled={busy} />
          </div>

          <div className="space-y-1.5">
            <Label>Instagram</Label>
            <Input value={form.instagram_url} onChange={set('instagram_url')} placeholder="https://instagram.com/..." disabled={busy} />
          </div>

          <div className="space-y-1.5">
            <Label>Google Maps</Label>
            <Input value={form.google_maps_url} onChange={set('google_maps_url')} placeholder="https://maps.google.com/..." disabled={busy} />
          </div>

          <div className="space-y-1.5">
            <Label>Notlar</Label>
            <Textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Ek bilgi..." disabled={busy} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              İptal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Kaydediliyor...' : existing ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
