'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { 
  Activity, 
  CheckCircle2, 
  Plus, 
  RefreshCw, 
  Trash2,
  AlertCircle,
  ExternalLink,
  Filter,
  Check
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  useListMarketSignalsQuery,
  useReviewMarketSignalMutation,
  useDeleteMarketSignalMutation,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';
import AddSignalDialog from './add-signal-dialog';

const SEVERITY_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  critical: { label: 'Kritik', cls: 'bg-gm-error/20 text-gm-error border-gm-error/30', dot: 'bg-gm-error' },
  high:     { label: 'Yüksek', cls: 'bg-gm-warning/20 text-gm-warning border-gm-warning/30', dot: 'bg-gm-warning' },
  medium:   { label: 'Orta', cls: 'bg-gm-gold/20 text-gm-gold border-gm-gold/30', dot: 'bg-gm-gold' },
  low:      { label: 'Düşük', cls: 'bg-gm-success/20 text-gm-success border-gm-success/30', dot: 'bg-gm-success' },
};

const TYPE_LABELS: Record<string, string> = {
  new_product:     'Yeni Ürün',
  price_change:    'Fiyat Değişikliği',
  social_activity: 'Sosyal Aktivite',
  site_change:     'Site Değişikliği',
  churn_risk:      'Churn Riski',
  review_change:   'Yorum Değişikliği',
  manual:          'Manuel',
};

export default function SignalsPanel() {
  const [severity, setSeverity] = React.useState('');
  const [isReviewed, setIsReviewed] = React.useState('pending');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { data, isLoading, isFetching, refetch } = useListMarketSignalsQuery({
    severity: (severity || undefined) as any,
    is_reviewed: isReviewed === 'all' ? undefined : isReviewed === 'reviewed',
    limit: 100,
  });

  const [reviewSignal, { isLoading: isReviewing }] = useReviewMarketSignalMutation();
  const [deleteSignal, { isLoading: isDeleting }] = useDeleteMarketSignalMutation();

  const handleReview = async (id: string) => {
    try {
      await reviewSignal({ id }).unwrap();
      toast.success('Sinyal incelendi');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu sinyal silinsin mi?')) return;
    try {
      await deleteSignal(id).unwrap();
      toast.success('Sinyal silindi');
    } catch {
      toast.error('Silinemedi');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-text font-bold text-[10px] tracking-[0.2em] uppercase opacity-70">Anlık Takip</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Pazar Sinyalleri</h1>
          <p className="text-gm-muted text-sm font-serif italic max-w-xl">
            Rakipler ve hedeflerden gelen dijital ayak izlerini ve pazar değişikliklerini analiz edin.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="rounded-full border-gm-border-soft px-8 h-12 bg-gm-surface/20 hover:bg-gm-surface transition-all font-bold tracking-widest uppercase text-[10px] text-gm-text"
          >
            <RefreshCw className={cn("mr-2 size-4", isFetching && "animate-spin")} />
            Yenile
          </Button>
          <Button 
            size="sm" 
            onClick={() => setDialogOpen(true)}
            className="rounded-full bg-gm-gold hover:bg-gm-gold-light text-black px-8 h-12 transition-all font-bold tracking-widest uppercase text-[10px]"
          >
            <Plus className="mr-2 size-4" />
            Manuel Sinyal
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
        <CardContent className="p-8 flex flex-wrap gap-8 items-end text-gm-text">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gm-text tracking-[0.2em] uppercase ml-1 opacity-70">İnceleme Durumu</label>
            <Select value={isReviewed} onValueChange={setIsReviewed}>
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 w-48 focus:ring-gm-gold/50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-surface border-gm-border-soft rounded-2xl text-gm-text">
                <SelectItem value="pending">İncelenmemiş</SelectItem>
                <SelectItem value="reviewed">İncelenmiş</SelectItem>
                <SelectItem value="all">Tümü</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gm-text tracking-[0.2em] uppercase ml-1 opacity-70">Önem Derecesi</label>
            <Select value={severity || 'all'} onValueChange={(v) => setSeverity(v === 'all' ? '' : v)}>
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 w-48 focus:ring-gm-gold/50 text-sm">
                <SelectValue placeholder="Önem" />
              </SelectTrigger>
              <SelectContent className="bg-gm-surface border-gm-border-soft rounded-2xl text-gm-text">
                <SelectItem value="all">Tüm Önem Dereceleri</SelectItem>
                <SelectItem value="critical">Kritik</SelectItem>
                <SelectItem value="high">Yüksek</SelectItem>
                <SelectItem value="medium">Orta</SelectItem>
                <SelectItem value="low">Düşük</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Signals List Card */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <div className="divide-y divide-gm-border-soft">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-8 flex gap-6">
                  <Skeleton className="size-12 rounded-full bg-gm-surface/20 shrink-0" />
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-5 w-1/3 bg-gm-surface/20" />
                    <Skeleton className="h-4 w-2/3 bg-gm-surface/20" />
                    <Skeleton className="h-3 w-20 bg-gm-surface/20 rounded" />
                  </div>
                </div>
              ))
            ) : data?.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-8">
                  <Activity className="w-16 h-16 text-gm-gold/50 opacity-50" />
                  <h3 className="font-serif text-2xl text-gm-text">Henüz sinyal yok</h3>
                  <p className="text-sm leading-relaxed text-gm-muted">
                    Sinyaller, Market Pulse'nin <strong className="text-gm-text">Hedef Firmalar</strong> sayfasındaki
                    bayilerin web sitelerini periyodik olarak taradığında otomatik üretilir.
                  </p>
                  <div className="space-y-3 rounded-2xl border border-gm-border-soft bg-gm-surface/30 p-5 text-left text-xs text-gm-muted">
                    <div className="flex gap-2"><span>🔍</span><span><strong className="text-gm-text">Rakip taraması</strong> — Hedef Firmalar → "Rakipleri Tara" butonu, web sitesindeki fiyat / ürün / kampanya değişikliklerini sinyal olarak kaydeder.</span></div>
                    <div className="flex gap-2"><span>⚡</span><span><strong className="text-gm-text">Manuel sinyal</strong> — Bir bayinin sosyal medyada veya görüşmede aktardığı bilgiyi ekleyebilirsiniz.</span></div>
                    <div className="flex gap-2"><span>📉</span><span><strong className="text-gm-text">Churn skoru</strong> — Birikmiş sinyaller + son görülme tarihi + paspas sipariş geçmişine göre 0-100 hesaplanır.</span></div>
                  </div>
                  <p className="text-[11px] italic text-gm-muted/70">
                    Sinyal üretmek için önce Hedef Firmalar sayfasından bayilerin web sitelerini eklemeniz gerekir.
                  </p>
                </div>
              </div>
            ) : (
              data?.map((signal) => (
                <div 
                  key={signal.id} 
                  className={cn(
                    "flex items-start gap-6 p-8 transition-all group hover:bg-gm-primary/[0.02]",
                    signal.isReviewed && "opacity-40 grayscale-[0.5]"
                  )}
                >
                  <div className={cn(
                    "size-12 rounded-full flex items-center justify-center border shadow-inner shrink-0",
                    "bg-gm-surface border-gm-border-soft group-hover:border-gm-gold/30 transition-all"
                  )}>
                    <AlertCircle className={cn(
                      "size-5",
                      signal.severity === 'critical' ? 'text-gm-error' : 
                      signal.severity === 'high' ? 'text-gm-warning' : 
                      signal.severity === 'medium' ? 'text-gm-gold' : 
                      'text-gm-success'
                    )} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      {(() => {
                        const cfg = SEVERITY_CONFIG[signal.severity] || SEVERITY_CONFIG.low;
                        return (
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                            cfg.cls
                          )}>
                            <div className={cn("size-1 rounded-full", cfg.dot)} />
                            {cfg.label}
                          </div>
                        );
                      })()}
                      <Badge 
                        variant="outline"
                        className="text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border border-gm-border-soft text-gm-muted bg-gm-surface/10"
                      >
                        {TYPE_LABELS[signal.signalType] ?? signal.signalType}
                      </Badge>
                    </div>

                    <h3 className="font-serif text-lg text-gm-text leading-tight group-hover:text-gm-gold transition-colors">
                      {signal.title}
                    </h3>
                    
                    {signal.description && (
                      <p className="text-sm text-gm-muted font-serif italic line-clamp-2 max-w-3xl">
                        {signal.description}
                      </p>
                    )}

                    {signal.sourceUrl && (
                      <div className="pt-2">
                        <a
                          href={signal.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] text-gm-primary-light hover:text-gm-primary transition-colors font-mono opacity-60 hover:opacity-100"
                        >
                          <ExternalLink size={10} />
                          {new URL(signal.sourceUrl).hostname}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 opacity-20 group-hover:opacity-100 transition-all shrink-0">
                    {!signal.isReviewed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-gm-success/10 hover:text-gm-success transition-colors text-gm-text/50"
                        disabled={isReviewing}
                        onClick={() => handleReview(signal.id)}
                        title="İncelendi"
                      >
                        <Check className="size-5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-gm-error/10 hover:text-gm-error transition-colors text-gm-text/50"
                      disabled={isDeleting}
                      onClick={() => handleDelete(signal.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AddSignalDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
