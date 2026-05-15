'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { 
  Pencil, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Users,
  Search,
  Filter,
  MapPin,
  TrendingUp,
  Target
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  useListMarketLeadsQuery,
  useDeleteMarketLeadMutation,
  type MarketLead,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';
import AddLeadDialog from './add-lead-dialog';

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  new:         { label: 'Yeni', cls: 'bg-gm-primary/10 text-gm-primary border-gm-primary/20', dot: 'bg-gm-primary' },
  contacted:   { label: 'İletişim Kuruldu', cls: 'bg-gm-warning/10 text-gm-warning border-gm-warning/20', dot: 'bg-gm-warning' },
  qualified:   { label: 'Nitelikli', cls: 'bg-gm-success/10 text-gm-success border-gm-success/20', dot: 'bg-gm-success' },
  negotiating: { label: 'Görüşmede', cls: 'bg-gm-gold/10 text-gm-gold border-gm-gold/20', dot: 'bg-gm-gold' },
  converted:   { label: 'Dönüştürüldü', cls: 'bg-gm-success/10 text-gm-success border-gm-success/20', dot: 'bg-gm-success' },
  rejected:    { label: 'Reddedildi', cls: 'bg-gm-error/10 text-gm-error border-gm-error/20', dot: 'bg-gm-error' },
};

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  high:   { label: 'Yüksek', cls: 'text-gm-error' },
  medium: { label: 'Orta', cls: 'text-gm-warning' },
  low:    { label: 'Düşük', cls: 'text-gm-muted' },
};

const SOURCE_LABELS: Record<string, string> = {
  manual:        'Manuel',
  google_places: 'Google Places',
  tobb:          'TOBB',
  instagram:     'Instagram',
  referral:      'Referans',
  scraper:       'Scraper',
};

export default function LeadsPanel() {
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [priority, setPriority] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editLead, setEditLead] = React.useState<MarketLead | null>(null);

  const { data, isLoading, isFetching, refetch } = useListMarketLeadsQuery({
    q: q || undefined,
    status: (status || undefined) as any,
    priority: (priority || undefined) as any,
    sort: 'created_at',
    order: 'desc',
    limit: 200,
  });

  const [deleteLead, { isLoading: isDeleting }] = useDeleteMarketLeadMutation();

  const handleDelete = async (lead: MarketLead) => {
    if (!confirm(`"${lead.name}" silinsin mi?`)) return;
    try {
      await deleteLead(lead.id).unwrap();
      toast.success('Lead silindi');
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
            <span className="text-gm-text font-bold text-[10px] tracking-[0.2em] uppercase opacity-70">Satış Hunisi</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Lead Pipeline</h1>
          <p className="text-gm-muted text-sm font-serif italic max-w-xl">
            Potansiyel satış fırsatlarını yönetin ve dönüşüm oranlarını artırın.
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
            onClick={() => { setEditLead(null); setDialogOpen(true); }}
            className="rounded-full bg-gm-gold hover:bg-gm-gold-light text-black px-8 h-12 transition-all font-bold tracking-widest uppercase text-[10px]"
          >
            <Plus className="mr-2 size-4" />
            Yeni Lead
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
        <CardContent className="p-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4 items-end text-gm-text">
          <div className="space-y-3 md:col-span-2">
            <label className="text-[10px] font-bold text-gm-text tracking-[0.2em] uppercase ml-1 opacity-70">Arama</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/60" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Firma adı, şehir veya ilgili kişi ara..."
                className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm placeholder:text-gm-text/30"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gm-text tracking-[0.2em] uppercase ml-1 opacity-70">Durum</label>
            <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
                <SelectValue placeholder="Durum Seç" />
              </SelectTrigger>
              <SelectContent className="bg-gm-surface border-gm-border-soft rounded-2xl text-gm-text">
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="new">Yeni</SelectItem>
                <SelectItem value="contacted">İletişim Kuruldu</SelectItem>
                <SelectItem value="qualified">Nitelikli</SelectItem>
                <SelectItem value="negotiating">Görüşmede</SelectItem>
                <SelectItem value="converted">Dönüştürüldü</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gm-text tracking-[0.2em] uppercase ml-1 opacity-70">Öncelik</label>
            <Select value={priority || 'all'} onValueChange={(v) => setPriority(v === 'all' ? '' : v)}>
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
                <SelectValue placeholder="Öncelik Seç" />
              </SelectTrigger>
              <SelectContent className="bg-gm-surface border-gm-border-soft rounded-2xl text-gm-text">
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="high">Yüksek</SelectItem>
                <SelectItem value="medium">Orta</SelectItem>
                <SelectItem value="low">Düşük</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text">Lead Bilgileri</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-text text-center">Durum</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-text text-center">Öncelik</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-text text-center">Kaynak</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-text text-center">Şehir</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-text text-right pr-12">Skor</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-text">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-gm-border-soft">
                    <TableCell className="py-6 px-8"><Skeleton className="h-10 w-48 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6 text-center"><Skeleton className="h-6 w-24 mx-auto bg-gm-surface/20 rounded-full" /></TableCell>
                    <TableCell className="py-6 text-center"><Skeleton className="h-6 w-16 mx-auto bg-gm-surface/20 rounded" /></TableCell>
                    <TableCell className="py-6 text-center"><Skeleton className="h-6 w-20 mx-auto bg-gm-surface/20 rounded" /></TableCell>
                    <TableCell className="py-6 text-center"><Skeleton className="h-6 w-16 mx-auto bg-gm-surface/20 rounded" /></TableCell>
                    <TableCell className="py-6 text-right pr-12"><Skeleton className="h-6 w-8 ml-auto bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6 px-8 text-right"><Skeleton className="h-8 w-16 ml-auto bg-gm-surface/20 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Target className="w-16 h-16 text-gm-gold/50" />
                      <span className="font-serif italic text-lg text-gm-muted">Henüz kayıtlı lead bulunmuyor.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.map((lead) => (
                  <TableRow key={lead.id} className="border-gm-border-soft hover:bg-gm-primary/3 transition-colors group">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gm-surface border border-gm-border-soft flex items-center justify-center text-gm-gold font-serif text-xl shadow-inner group-hover:border-gm-gold/50 transition-all">
                          {lead.name[0]}
                        </div>
                        <div>
                          <div className="font-serif text-lg text-gm-text flex items-center gap-2 group-hover:text-gm-primary transition-colors">
                            {lead.name}
                          </div>
                          {lead.contactName && (
                            <div className="text-[10px] text-gm-muted font-mono opacity-60 uppercase tracking-tighter">İlgili: {lead.contactName}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      {(() => {
                        const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                        return (
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                            cfg.cls
                          )}>
                            <div className={cn("w-1 h-1 rounded-full", cfg.dot)} />
                            {cfg.label}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      {(() => {
                        const cfg = PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.low;
                        return (
                          <div className={cn("text-[10px] font-bold uppercase tracking-widest", cfg.cls)}>
                            {lead.priority === 'high' ? '↑ ' : lead.priority === 'medium' ? '→ ' : '↓ '}
                            {cfg.label}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <Badge 
                        variant="outline"
                        className="text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded border border-gm-border-soft text-gm-muted bg-gm-surface/10"
                      >
                        {SOURCE_LABELS[lead.source] ?? lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-gm-muted">
                        <MapPin size={12} className="text-gm-gold/60" />
                        <span className="font-mono">{lead.city || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-right pr-12">
                      <span className="text-lg font-serif text-gm-text tracking-tighter">{lead.score.toFixed(0)}</span>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-all">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full hover:bg-gm-gold/10 hover:text-gm-gold transition-colors text-gm-text/50"
                          onClick={() => { setEditLead(lead); setDialogOpen(true); }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full hover:bg-gm-error/10 hover:text-gm-error transition-colors text-gm-text/50"
                          onClick={() => handleDelete(lead)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-8">
        <div className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase bg-gm-surface/30 px-6 py-3 rounded-full border border-gm-border-soft text-gm-text">
          Toplam {data?.length ?? 0} Lead
        </div>
      </div>

      <AddLeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existing={editLead}
      />
    </div>
  );
}
