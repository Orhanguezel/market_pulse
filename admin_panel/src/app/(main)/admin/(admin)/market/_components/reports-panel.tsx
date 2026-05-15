'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { 
  FileText, 
  Send, 
  Eye, 
  Mail,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  useLazyPreviewWeeklyReportQuery,
  useSendWeeklyReportMutation,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

export default function ReportsPanel() {
  const [email, setEmail] = React.useState('');
  const [previewWeeklyReport, { isFetching: isPreviewing }] = useLazyPreviewWeeklyReportQuery();
  const [sendWeeklyReport, { isLoading: isSending }] = useSendWeeklyReportMutation();

  const onPreview = async () => {
    try {
      const blob = await previewWeeklyReport().unwrap();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Rapor önizleme alınamadı');
    }
  };

  const onSend = async () => {
    if (!email.trim()) {
      toast.error('E-posta adresi zorunlu');
      return;
    }
    try {
      await sendWeeklyReport({ to: email.trim() }).unwrap();
      toast.success('Haftalık rapor e-posta ile gönderildi');
    } catch {
      toast.error('Rapor gönderilemedi');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-text font-bold text-[10px] tracking-[0.2em] uppercase opacity-70">Raporlama</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">İstihbarat Raporları</h1>
          <p className="text-gm-muted text-sm font-serif italic max-w-xl">
            Sektör analizlerini ve haftalık özetleri PDF formatında görüntüleyin veya paylaşın.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Weekly Report Card */}
        <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl group">
          <CardContent className="p-10 space-y-8">
            <div className="flex items-start justify-between">
              <div className="size-16 rounded-2xl bg-gm-gold/10 border border-gm-gold/20 flex items-center justify-center text-gm-gold group-hover:bg-gm-gold/20 transition-all shadow-inner">
                <FileText size={32} />
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-gm-text tracking-widest uppercase opacity-70">Otomatik Oluşturulan</div>
                <div className="text-gm-text font-serif text-2xl">Haftalık Özet</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gm-muted text-sm font-serif italic">
                <Calendar size={14} className="text-gm-gold" />
                Her Pazartesi 08:00'de güncellenir
              </div>
              <p className="text-gm-muted/80 text-sm leading-relaxed">
                Bu rapor son 7 gündeki kritik sinyalleri, en yüksek riskli hedefleri ve satış hunisindeki gelişmeleri içerir.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <Button 
                onClick={onPreview} 
                disabled={isPreviewing}
                className="rounded-full bg-gm-gold hover:bg-gm-gold-light text-black px-8 h-12 transition-all font-bold tracking-widest uppercase text-[10px]"
              >
                <Eye className="mr-2 size-4" />
                {isPreviewing ? 'Hazırlanıyor...' : 'PDF Önizle'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Distribution Card */}
        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
          <CardContent className="p-10 space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-gm-gold" />
                <h3 className="text-gm-text font-serif text-xl">Hızlı Paylaşım</h3>
              </div>
              <p className="text-gm-muted text-xs">
                Raporu anında paydaşlara veya yöneticilere e-posta ile ulaştırın.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-text opacity-70">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/60" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@firma.com"
                    className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-14 focus:ring-gm-gold/50 text-sm placeholder:text-gm-text/30 text-gm-text"
                  />
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={onSend} 
                disabled={isSending}
                className="w-full rounded-full border-gm-border-soft h-14 hover:bg-gm-surface transition-all font-bold tracking-widest uppercase text-[10px] text-gm-text"
              >
                <Send className="mr-2 size-4" />
                {isSending ? 'Gönderiliyor...' : 'Şimdi Gönder'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Placeholder */}
      <div className="pt-12 space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">Geçmiş Raporlar</span>
          <div className="h-px flex-1 bg-gm-border-soft" />
        </div>
        
        <div className="grid gap-4 opacity-50">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-6 rounded-2xl border border-gm-border-soft bg-gm-surface/10">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-gm-surface flex items-center justify-center text-gm-muted">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-gm-text text-sm font-medium">Haftalık İstihbarat Özeti</div>
                  <div className="text-[10px] text-gm-muted font-mono">{i === 1 ? '2024-05-06' : '2024-04-29'}</div>
                </div>
              </div>
              <ChevronRight className="text-gm-muted" size={16} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
