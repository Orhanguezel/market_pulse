'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateMarketSignalMutation } from '@/integrations/hooks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddSignalDialog({ open, onOpenChange }: Props) {
  const [form, setForm] = React.useState({
    signalType: 'manual',
    severity: 'medium',
    title: '',
    description: '',
    source_url: '',
  });

  const [create, { isLoading }] = useCreateMarketSignalMutation();

  React.useEffect(() => {
    if (!open) {
      setForm({ signalType: 'manual', severity: 'medium', title: '', description: '', source_url: '' });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Başlık zorunlu'); return; }

    try {
      await create({
        signalType:  form.signalType,
        severity:    form.severity as any,
        title:       form.title.trim(),
        description: form.description || undefined,
        sourceUrl:   form.source_url || undefined,
      }).unwrap();
      toast.success('Sinyal eklendi');
      onOpenChange(false);
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manuel Sinyal Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tür</Label>
              <Select value={form.signalType} onValueChange={(v) => setForm((p) => ({ ...p, signalType: v }))} disabled={isLoading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuel</SelectItem>
                  <SelectItem value="new_product">Yeni Ürün</SelectItem>
                  <SelectItem value="price_change">Fiyat Değişikliği</SelectItem>
                  <SelectItem value="social_activity">Sosyal Aktivite</SelectItem>
                  <SelectItem value="site_change">Site Değişikliği</SelectItem>
                  <SelectItem value="churn_risk">Churn Riski</SelectItem>
                  <SelectItem value="review_change">Yorum Değişikliği</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Önem</Label>
              <Select value={form.severity} onValueChange={(v) => setForm((p) => ({ ...p, severity: v }))} disabled={isLoading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Kritik</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="low">Düşük</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Başlık *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Kısa açıklama"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Detay</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Ek bilgi..."
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Kaynak URL</Label>
            <Input
              value={form.source_url}
              onChange={(e) => setForm((p) => ({ ...p, source_url: e.target.value }))}
              placeholder="https://..."
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
