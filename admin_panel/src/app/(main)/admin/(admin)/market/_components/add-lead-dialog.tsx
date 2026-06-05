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
  useListErpCustomersQuery,
  useCreateMarketLeadMutation,
  useUpdateMarketLeadMutation,
  type MarketLead,
  type ErpCustomer,
} from '@/integrations/hooks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: MarketLead | null;
}

type Form = {
  name: string;
  category: string;
  source: string;
  status: string;
  priority: string;
  website: string;
  phone: string;
  email: string;
  contact_name: string;
  city: string;
  district: string;
  notes: string;
  assigned_to: string;
};

const EMPTY: Form = {
  name: '', category: '', source: 'manual', status: 'new', priority: 'medium',
  website: '', phone: '', email: '', contact_name: '',
  city: '', district: '', notes: '', assigned_to: '',
};

export default function AddLeadDialog({ open, onOpenChange, existing }: Props) {
  const [form, setForm] = React.useState<Form>(EMPTY);
  const [erpQ, setErpQ] = React.useState('');
  const [create, { isLoading: isCreating }] = useCreateMarketLeadMutation();
  const [update, { isLoading: isUpdating }] = useUpdateMarketLeadMutation();
  const { data: erpCustomers, isFetching: isErpLoading } = useListErpCustomersQuery(
    { q: erpQ || undefined, limit: 8 },
    { skip: !open },
  );
  const erpItems = erpCustomers?.items ?? [];
  const busy = isCreating || isUpdating;

  React.useEffect(() => {
    if (existing) {
      setForm({
        name:         existing.name,
        category:     existing.category ?? '',
        source:       existing.source,
        status:       existing.status,
        priority:     existing.priority,
        website:      existing.website ?? '',
        phone:        existing.phone ?? '',
        email:        existing.email ?? '',
        contact_name: existing.contactName ?? '',
        city:         existing.city ?? '',
        district:     existing.district ?? '',
        notes:        existing.notes ?? '',
        assigned_to:  existing.assignedTo ?? '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [existing, open]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const importErpCustomer = (customer: ErpCustomer) => {
    setForm((p) => ({
      ...p,
      name: customer.name,
      source: 'erp',
      phone: customer.phone ?? '',
      notes: [p.notes, customer.address ? `ERP adres: ${customer.address}` : '']
        .filter(Boolean)
        .join('\n'),
    }));
    toast.success('ERP müşterisi forma aktarıldı');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Firma adı zorunlu'); return; }

    const body: any = {
      name:         form.name.trim(),
      category:     form.category || undefined,
      source:       form.source,
      status:       form.status,
      priority:     form.priority,
      contact_name: form.contact_name || undefined,
      phone:        form.phone || undefined,
      email:        form.email || undefined,
      city:         form.city || undefined,
      district:     form.district || undefined,
      notes:        form.notes || undefined,
      assigned_to:  form.assigned_to || undefined,
    };
    if (form.website) {
      try { new URL(form.website); body.website = form.website; } catch { /* skip invalid url */ }
    }

    try {
      if (existing) {
        await update({ id: existing.id, body }).unwrap();
        toast.success('Lead güncellendi');
      } else {
        await create(body).unwrap();
        toast.success('Lead eklendi');
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
          <DialogTitle>{existing ? 'Lead Düzenle' : 'Yeni Lead Ekle'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!existing && (
            <div className="space-y-2 rounded-md border bg-muted/20 p-3">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label>ERP'den İçe Aktar</Label>
                  <Input
                    value={erpQ}
                    onChange={(e) => setErpQ(e.target.value)}
                    placeholder="Müşteri adı veya telefon ara"
                    disabled={busy}
                  />
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto rounded border bg-background">
                {isErpLoading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Yükleniyor...</div>
                ) : erpItems.length ? (
                  erpItems.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                      onClick={() => importErpCustomer(customer)}
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
            <Label>Firma / Kişi Adı *</Label>
            <Input value={form.name} onChange={set('name')} placeholder="Örn: XYZ Oto Yedek Parça" disabled={busy} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Input value={form.category} onChange={set('category')} placeholder="otomotiv, bayi..." disabled={busy} />
            </div>
            <div className="space-y-1.5">
              <Label>Kaynak</Label>
              <Select value={form.source} onValueChange={(v) => setForm((p) => ({ ...p, source: v }))} disabled={busy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuel</SelectItem>
                  <SelectItem value="google_places">Google Places</SelectItem>
                  <SelectItem value="tobb">TOBB</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="referral">Referans</SelectItem>
                  <SelectItem value="scraper">Scraper</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Durum</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))} disabled={busy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Yeni</SelectItem>
                  <SelectItem value="contacted">İletişim Kuruldu</SelectItem>
                  <SelectItem value="qualified">Nitelikli</SelectItem>
                  <SelectItem value="negotiating">Görüşmede</SelectItem>
                  <SelectItem value="converted">Dönüştürüldü</SelectItem>
                  <SelectItem value="rejected">Reddedildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Öncelik</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))} disabled={busy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="low">Düşük</SelectItem>
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
            <Label>Sorumlu Kişi</Label>
            <Input value={form.assigned_to} onChange={set('assigned_to')} placeholder="Satış temsilcisi adı" disabled={busy} />
          </div>

          <div className="space-y-1.5">
            <Label>Notlar</Label>
            <Textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Ek bilgi, ilk temas notları..." disabled={busy} />
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
