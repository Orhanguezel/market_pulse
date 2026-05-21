'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  ArrowRight,
  Bell,
  Building2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  MapPin,
  TrendingUp,
  LayoutGrid,
  Upload,
  ScanSearch,
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
  useListMarketTargetsQuery,
  useDeleteMarketTargetMutation,
  useRecalculateChurnMutation,
  useScanCompetitorMutation,
  useScanAllCompetitorsMutation,
  type MarketTarget,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';
import AddTargetDialog from './add-target-dialog';
import BulkImportDialog from './bulk-import-dialog';

const CATEGORY_LABELS: Record<string, string> = {
  dealer:      'Bayi',
  competitor:  'Rakip',
  partner:     'Ortak',
  distributor: 'Distribütör',
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  active:    { label: 'Aktif', cls: 'bg-gm-success/10 text-gm-success border-gm-success/20', dot: 'bg-gm-success' },
  paused:    { label: 'Durduruldu', cls: 'bg-gm-warning/10 text-gm-warning border-gm-warning/20', dot: 'bg-gm-warning' },
  churned:   { label: 'Kaybedildi', cls: 'bg-gm-error/10 text-gm-error border-gm-error/20', dot: 'bg-gm-error' },
  converted: { label: 'Dönüştürüldü', cls: 'bg-gm-primary/10 text-gm-primary border-gm-primary/20', dot: 'bg-gm-primary' },
  archived:  { label: 'Arşivlendi', cls: 'bg-gm-muted/10 text-gm-muted border-gm-muted/20', dot: 'bg-gm-muted' },
};

const HOW_TO_STEPS = [
  {
    icon: Plus,
    title: 'Firma Ekle',
    desc: 'Rakip veya potansiyel müşteri firmasını isim, web sitesi ve kategoriyle kaydet.',
  },
  {
    icon: ScanSearch,
    title: 'Otomatik İzle',
    desc: '"Tara" butonuyla web sitesi değişikliklerini, fiyat hamlelerini ve yeni ürün eklemelerini yakala.',
  },
  {
    icon: Bell,
    title: 'Sinyal Al',
    desc: 'Tespit edilen her değişiklik Sinyaller modülüne düşer — önceliklendirip aksiyon alabilirsin.',
  },
  {
    icon: TrendingUp,
    title: 'Churn Risk Takibi',
    desc: 'Paspas müşterisiyse churn risk skoru otomatik hesaplanır; kaybetmeden önce uyarı alırsın.',
  },
];

function EmptyTargetsState({ onAdd, onImport }: { onAdd: () => void; onImport: () => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-16 items-center justify-center rounded-full border border-gm-gold/30 bg-gm-gold/10">
          <Building2 className="size-8 text-gm-gold/70" />
        </div>
        <h2 className="font-serif text-2xl text-gm-text">Henüz hedef firma eklenmedi</h2>
        <p className="max-w-md font-serif text-sm italic text-gm-muted">
          Bu modül rakip firmaları ve potansiyel müşterileri periyodik olarak izler;
          web sitesi değişikliği, fiyat hamlesi veya yeni ürün tespitinde sinyal üretir.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 text-left">
        {HOW_TO_STEPS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-3 rounded-2xl border border-gm-border-soft bg-gm-bg-deep/40 p-4">
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-gm-gold/20 bg-gm-gold/10">
              <Icon className="size-3.5 text-gm-gold" />
            </div>
            <div>
              <div className="text-xs font-bold text-gm-text">{title}</div>
              <div className="mt-0.5 text-[10px] leading-4 text-gm-muted">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gm-border-soft/60 bg-gm-surface/5 px-5 py-4 text-left">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gm-gold">Örnek Senaryo</div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gm-muted">
          <span className="rounded-full border border-gm-border-soft bg-gm-surface/20 px-2.5 py-1 font-medium text-gm-text">Plastik Ambalaj A.Ş.</span>
          <ArrowRight className="size-3 shrink-0" />
          <span>Rakip olarak eklendi, website kaydedildi</span>
          <ArrowRight className="size-3 shrink-0" />
          <span>Haftalık otomatik tarama tetiklendi</span>
          <ArrowRight className="size-3 shrink-0" />
          <span className="rounded-full border border-gm-warning/30 bg-gm-warning/10 px-2.5 py-1 font-medium text-gm-warning">Fiyat düşürme sinyali</span>
          <ArrowRight className="size-3 shrink-0" />
          <span>Sinyaller modülünde incelenip aksiyon alındı</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button
          onClick={onAdd}
          className="h-11 rounded-full bg-gm-gold px-8 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light"
        >
          <Plus className="mr-2 size-4" />
          İlk Firmayı Ekle
        </Button>
        <Button
          variant="outline"
          onClick={onImport}
          className="h-11 rounded-full border-gm-border-soft bg-gm-surface/20 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface"
        >
          <Upload className="mr-2 size-4" />
          Excel&apos;den Aktar
        </Button>
      </div>
    </div>
  );
}

function churnBadge(score: number): { label: string; cls: string; dot: string } {
  if (score >= 60) return { label: 'Yüksek Risk', cls: 'bg-gm-error/10 text-gm-error border-gm-error/20', dot: 'bg-gm-error' };
  if (score >= 30) return { label: 'Orta Risk', cls: 'bg-gm-warning/10 text-gm-warning border-gm-warning/20', dot: 'bg-gm-warning' };
  return { label: 'Düşük Risk', cls: 'bg-gm-success/10 text-gm-success border-gm-success/20', dot: 'bg-gm-success' };
}

export default function TargetsPanel() {
  const [q, setQ] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [dialogOpen, setDialogOpen]     = React.useState(false);
  const [importOpen, setImportOpen]     = React.useState(false);
  const [editTarget, setEditTarget]     = React.useState<MarketTarget | null>(null);

  const { data, isLoading, isFetching, refetch } = useListMarketTargetsQuery({
    q: q || undefined,
    category: category || undefined,
    status: status || undefined,
    limit: 200,
  });

  const [deleteTarget]                                         = useDeleteMarketTargetMutation();
  const [recalculateChurn, { isLoading: isRecalculating }]   = useRecalculateChurnMutation();
  const [scanCompetitor, { isLoading: isScanning }]     = useScanCompetitorMutation();
  const [scanAll, { isLoading: isScanningAll }]         = useScanAllCompetitorsMutation();

  const handleDelete = async (target: MarketTarget) => {
    if (!confirm(`"${target.name}" silinsin mi?`)) return;
    try {
      await deleteTarget(target.id).unwrap();
      toast.success('Hedef silindi');
    } catch {
      toast.error('Silinemedi');
    }
  };

  const handleRecalculate = async (target: MarketTarget) => {
    try {
      await recalculateChurn(target.id).unwrap();
      toast.success('Churn skoru yeniden hesaplandı');
    } catch {
      toast.error('Skor hesaplanamadı');
    }
  };

  const handleScanCompetitor = async (target: MarketTarget) => {
    if (!target.website) { toast.error('Hedefin web sitesi yok'); return; }
    try {
      const r = await scanCompetitor(target.id).unwrap();
      if (r.signals_created > 0)
        toast.success(`${target.name}: ${r.changed_fields.join(', ')} değişikliği tespit edildi`);
      else
        toast.info(`${target.name}: değişiklik yok`);
    } catch {
      toast.error('Tarama başarısız');
    }
  };

  const handleScanAll = async () => {
    try {
      const r = await scanAll().unwrap() as {
        scanned: number;
        signals_created: number;
        without_website?: number;
        total_active?: number;
      };
      if (r.scanned === 0 && (r.without_website ?? 0) > 0) {
        toast.warning(
          `Hiç hedef taranamadı — ${r.without_website} aktif hedefin web sitesi girilmemiş. Her bayinin web/sosyal medya hesabını ekleyince tarama anlamlı çalışır.`,
        );
        return;
      }
      const parts = [`${r.scanned} hedef tarandı`, `${r.signals_created} yeni sinyal`];
      if (r.without_website && r.without_website > 0) parts.push(`${r.without_website} web sitesiz`);
      toast.success(parts.join(' · '));
    } catch {
      toast.error('Toplu tarama başarısız');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-text font-bold text-[10px] tracking-[0.2em] uppercase opacity-70">Pazar İstihbaratı</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Hedef Firmalar</h1>
          <p className="text-gm-muted text-sm font-serif italic max-w-xl">
            Rakip ve potansiyel müşterilerin periyodik izleme tahtası — web sitesi değişikliği,
            fiyat hamlesi ve churn riskini otomatik algılar.
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
            variant="outline"
            size="sm"
            onClick={handleScanAll}
            disabled={isScanningAll}
            className="rounded-full border-gm-border-soft px-8 h-12 bg-gm-surface/20 hover:bg-gm-surface transition-all font-bold tracking-widest uppercase text-[10px] text-gm-text"
          >
            <ScanSearch className={cn("mr-2 size-4", isScanningAll && "animate-pulse")} />
            Rakipleri Tara
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="rounded-full border-gm-border-soft px-8 h-12 bg-gm-surface/20 hover:bg-gm-surface transition-all font-bold tracking-widest uppercase text-[10px] text-gm-text"
          >
            <Upload className="mr-2 size-4" />
            İçe Aktar
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditTarget(null); setDialogOpen(true); }}
            className="rounded-full bg-gm-gold hover:bg-gm-gold-light text-black px-8 h-12 transition-all font-bold tracking-widest uppercase text-[10px]"
          >
            <Plus className="mr-2 size-4" />
            Yeni Hedef
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
            <label className="text-[10px] font-bold text-gm-text tracking-[0.2em] uppercase ml-1 opacity-70">Kategori</label>
            <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
                <SelectValue placeholder="Kategori Seç" />
              </SelectTrigger>
              <SelectContent className="bg-gm-surface border-gm-border-soft rounded-2xl text-gm-text">
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                <SelectItem value="dealer">Bayi</SelectItem>
                <SelectItem value="competitor">Rakip</SelectItem>
                <SelectItem value="partner">Ortak</SelectItem>
                <SelectItem value="distributor">Distribütör</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gm-text tracking-[0.2em] uppercase ml-1 opacity-70">Durum</label>
            <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
                <SelectValue placeholder="Durum Seç" />
              </SelectTrigger>
              <SelectContent className="bg-gm-surface border-gm-border-soft rounded-2xl text-gm-text">
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="paused">Durduruldu</SelectItem>
                <SelectItem value="churned">Kaybedildi</SelectItem>
                <SelectItem value="converted">Dönüştürüldü</SelectItem>
                <SelectItem value="archived">Arşivlendi</SelectItem>
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
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text">Firma Bilgileri</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-text text-center">Kategori</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-text text-center">Durum</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-text text-center">Şehir</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-text text-right pr-12">Churn Riski</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-text">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-gm-border-soft">
                    <TableCell className="py-6 px-8"><Skeleton className="h-10 w-48 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6 text-center"><Skeleton className="h-6 w-20 mx-auto bg-gm-surface/20 rounded" /></TableCell>
                    <TableCell className="py-6 text-center"><Skeleton className="h-6 w-24 mx-auto bg-gm-surface/20 rounded-full" /></TableCell>
                    <TableCell className="py-6 text-center"><Skeleton className="h-6 w-16 mx-auto bg-gm-surface/20 rounded" /></TableCell>
                    <TableCell className="py-6 text-right pr-12"><Skeleton className="h-8 w-24 ml-auto bg-gm-surface/20 rounded-full" /></TableCell>
                    <TableCell className="py-6 px-8 text-right"><Skeleton className="h-8 w-16 ml-auto bg-gm-surface/20 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10">
                    <EmptyTargetsState
                      onAdd={() => { setEditTarget(null); setDialogOpen(true); }}
                      onImport={() => setImportOpen(true)}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data?.map((target) => (
                  <TableRow key={target.id} className="border-gm-border-soft hover:bg-gm-primary/3 transition-colors group">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gm-surface border border-gm-border-soft flex items-center justify-center text-gm-gold font-serif text-xl shadow-inner group-hover:border-gm-gold/50 transition-all">
                          {target.name[0]}
                        </div>
                        <div>
                          <div className="font-serif text-lg text-gm-text flex items-center gap-2 group-hover:text-gm-primary transition-colors">
                            {target.name}
                          </div>
                          {target.contactName && (
                            <div className="text-[10px] text-gm-muted font-mono opacity-60 uppercase tracking-tighter">İlgili: {target.contactName}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <Badge 
                        variant="outline"
                        className="text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded border border-gm-border-soft text-gm-muted bg-gm-surface/10"
                      >
                        {CATEGORY_LABELS[target.category] ?? target.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                        (STATUS_CONFIG[target.status] || STATUS_CONFIG.archived).cls
                      )}>
                        <div className={cn("w-1 h-1 rounded-full", (STATUS_CONFIG[target.status] || STATUS_CONFIG.archived).dot)} />
                        {(STATUS_CONFIG[target.status] || STATUS_CONFIG.archived).label}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-gm-muted">
                        <MapPin size={12} className="text-gm-gold/60" />
                        <span className="font-mono">{target.city || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-right pr-12">
                      <div className="flex flex-col items-end gap-1 group/score">
                        <div className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter border",
                          churnBadge(target.churnRiskScore).cls
                        )}>
                          {churnBadge(target.churnRiskScore).label}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-serif text-gm-text tracking-tighter">{target.churnRiskScore.toFixed(0)}%</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-gm-gold/10 text-gm-gold"
                            onClick={() => handleRecalculate(target)}
                            disabled={isRecalculating}
                            title="Yeniden Hesapla"
                          >
                            <RefreshCw className={cn("size-3", isRecalculating && "animate-spin")} />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-all">
                        {target.website && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-gm-primary/10 hover:text-gm-primary transition-colors text-gm-text/50"
                            onClick={() => handleScanCompetitor(target)}
                            disabled={isScanning}
                            title="Rakip Tara"
                          >
                            <ScanSearch className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-gm-gold/10 hover:text-gm-gold transition-colors text-gm-text/50"
                          onClick={() => { setEditTarget(target); setDialogOpen(true); }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-gm-error/10 hover:text-gm-error transition-colors text-gm-text/50"
                          onClick={() => handleDelete(target)}
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

      {/* Pagination / Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-8">
        <div className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase bg-gm-surface/30 px-6 py-3 rounded-full border border-gm-border-soft text-gm-text">
          Toplam {data?.length ?? 0} Kayıt
        </div>
      </div>

      <AddTargetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existing={editTarget}
      />
      <BulkImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
