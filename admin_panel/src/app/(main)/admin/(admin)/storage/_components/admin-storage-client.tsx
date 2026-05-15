'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Pencil,
  Loader2,
  Image as ImageIcon,
  File,
  Folder,
  Download,
  CheckSquare,
  Square,
  HardDrive,
  Filter,
  ExternalLink,
  MoreVertical
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

import type { StorageAsset, StorageListQuery } from '@/integrations/shared';
import {
  useListAssetsAdminQuery,
  useDeleteAssetAdminMutation,
  useBulkDeleteAssetsAdminMutation,
  useListFoldersAdminQuery,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

type Filters = {
  search: string;
  bucket: string;
  folder: string;
  mime: string;
};

const ROOT_FOLDER_VALUE = '__root__';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function fmtDate(val: string | null | undefined) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    return d.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(val);
  }
}

function getMimeIcon(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon;
  return File;
}

function getMimeColor(mime: string): string {
  if (mime.startsWith('image/')) return 'text-gm-gold';
  if (mime.startsWith('video/')) return 'text-gm-primary-light';
  if (mime.includes('pdf')) return 'text-gm-error';
  return 'text-gm-muted';
}

function isImageMime(mime: string | null | undefined) {
  return String(mime ?? '').startsWith('image/');
}

export default function AdminStorageClient() {
  const router = useRouter();
  const t = useAdminT('admin.storage');

  function getErrMsg(e: unknown): string {
    const anyErr = e as any;
    return anyErr?.data?.error?.message || anyErr?.data?.message || anyErr?.message || t('errorFallback');
  }

  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    bucket: 'all',
    folder: 'all',
    mime: 'all',
  });

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const queryParams = React.useMemo((): StorageListQuery => ({
    q: filters.search || undefined,
    bucket: filters.bucket !== 'all' ? filters.bucket : undefined,
    folder: filters.folder === 'all' ? undefined : filters.folder === ROOT_FOLDER_VALUE ? '' : filters.folder,
    mime: filters.mime !== 'all' ? filters.mime : undefined,
    sort: 'created_at',
    order: 'desc',
    limit: 100,
  }), [filters]);

  const { data: result, isLoading, isFetching, refetch } = useListAssetsAdminQuery(queryParams);
  const { data: folders = [] } = useListFoldersAdminQuery();
  const [deleteAsset] = useDeleteAssetAdminMutation();
  const [bulkDeleteAssets] = useBulkDeleteAssetsAdminMutation();

  const items = result?.items || [];
  const total = result?.total || 0;

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<StorageAsset | null>(null);

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((item) => item.id)));
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t('list.deleteSelected', { count: selectedIds.size }) + '?')) return;
    try {
      await bulkDeleteAssets({ ids: Array.from(selectedIds) }).unwrap();
      toast.success(t('list.filesDeleted', { count: selectedIds.size }));
      setSelectedIds(new Set());
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleDeleteClick = (item: StorageAsset) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteAsset({ id: itemToDelete.id }).unwrap();
      toast.success(t('list.fileDeleted'));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const busy = isLoading || isFetching;
  const hasSelection = selectedIds.size > 0;

  const buckets = React.useMemo(() => {
    const set = new Set(items.map((item) => item.bucket).filter(Boolean));
    return Array.from(set);
  }, [items]);

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">Varlık Yönetimi</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Dosya Deposu</h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            Medya varlıklarını, dökümanları ve statik dosyaları organize edin.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {hasSelection && (
            <Button
              variant="outline"
              onClick={handleBulkDelete}
              disabled={busy}
              className="rounded-full border-gm-error/40 text-gm-error px-6 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-error/10 shadow-lg backdrop-blur-sm"
            >
              <Trash2 className="mr-2 size-4" />
              Seçilenleri Sil ({selectedIds.size})
            </Button>
          )}
          <Button 
            onClick={() => refetch()} 
            disabled={busy} 
            variant="outline"
            className="rounded-full border-gm-border-soft px-8 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-surface shadow-lg backdrop-blur-sm text-gm-text"
          >
            <RefreshCcw className={cn("mr-2 size-4 text-gm-gold", isFetching && "animate-spin")} />
            Yenile
          </Button>
          <Button 
            onClick={() => router.push('/admin/storage/new')}
            className="bg-gm-gold text-black hover:bg-gm-gold-light rounded-full px-8 h-12 font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-gm-gold/20 transition-all active:scale-95"
          >
            <Plus className="mr-2 size-4" />
            Yeni Yükle
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
        <CardContent className="p-8 flex flex-wrap gap-8 items-end text-gm-text">
          <div className="flex-1 min-w-[300px] space-y-3">
            <label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Arama</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
              <Input
                placeholder="Dosya adı veya yol ara..."
                value={filters.search}
                onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
                className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text"
              />
            </div>
          </div>

          <div className="w-48 space-y-3">
            <label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Bucket</label>
            <Select value={filters.bucket} onValueChange={(v) => setFilters(p => ({ ...p, bucket: v }))}>
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 text-sm text-gm-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl text-gm-text">
                <SelectItem value="all">Tümü</SelectItem>
                {buckets.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48 space-y-3">
            <label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Klasör</label>
            <Select value={filters.folder} onValueChange={(v) => setFilters(p => ({ ...p, folder: v }))}>
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 text-sm text-gm-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl text-gm-text">
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value={ROOT_FOLDER_VALUE}>Kök Dizin</SelectItem>
                {folders.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48 space-y-3">
            <label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Dosya Tipi</label>
            <Select value={filters.mime} onValueChange={(v) => setFilters(p => ({ ...p, mime: v }))}>
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 text-sm text-gm-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl text-gm-text">
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="image/">Resimler</SelectItem>
                <SelectItem value="video/">Videolar</SelectItem>
                <SelectItem value="application/pdf">PDF Belgeleri</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Container */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="w-12 py-6 px-8 text-center">
                  <button onClick={handleSelectAll} className="p-1 rounded hover:bg-gm-surface transition-colors">
                    {selectedIds.size === items.length && items.length > 0 
                      ? <CheckSquare className="size-4 text-gm-gold" /> 
                      : <Square className="size-4 text-gm-muted" />
                    }
                  </button>
                </TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Varlık</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Konum</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted text-right">Boyut</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Yükleme</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">Aksiyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-gm-border-soft">
                    <TableCell className="py-6 px-8 text-center"><Skeleton className="size-4 mx-auto bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6">
                      <div className="flex gap-4">
                        <Skeleton className="size-12 rounded-lg bg-gm-surface/20" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-40 bg-gm-surface/20" />
                          <Skeleton className="h-3 w-60 bg-gm-surface/20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6"><Skeleton className="h-5 w-24 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6 text-right"><Skeleton className="h-5 w-16 ml-auto bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-5 w-32 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6 px-8 text-right"><Skeleton className="h-10 w-24 ml-auto rounded-full bg-gm-surface/20" /></TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <HardDrive size={64} className="text-gm-muted" />
                      <p className="font-serif italic text-lg text-gm-muted">Henüz dosya yüklenmemiş.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const Icon = getMimeIcon(item.mime);
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <TableRow key={item.id} className={cn(
                      "border-gm-border-soft hover:bg-gm-primary/2 group transition-colors",
                      isSelected && "bg-gm-gold/[0.03]"
                    )}>
                      <TableCell className="py-6 px-8 text-center">
                        <button onClick={() => handleSelectItem(item.id)} className="p-1 rounded hover:bg-gm-surface transition-colors">
                          {isSelected 
                            ? <CheckSquare className="size-4 text-gm-gold" /> 
                            : <Square className="size-4 text-gm-muted group-hover:text-gm-muted/60" />
                          }
                        </button>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-xl bg-gm-bg-deep border border-gm-border-soft overflow-hidden flex items-center justify-center shrink-0">
                            {item.url && isImageMime(item.mime) ? (
                              <img src={item.url} alt={item.name} className="size-full object-cover" />
                            ) : (
                              <Icon className={cn("size-6", getMimeColor(item.mime))} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-gm-text font-serif text-lg leading-tight truncate max-w-[200px]">{item.name}</div>
                            <div className="text-[10px] text-gm-muted font-mono truncate max-w-[300px] opacity-60">Path: {item.path || '/'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit text-[8px] font-bold tracking-widest uppercase border-gm-border-soft text-gm-muted bg-gm-surface/10 px-2 py-0">
                            {item.bucket}
                          </Badge>
                          {item.folder && (
                            <div className="flex items-center gap-1.5 text-[9px] text-gm-muted font-serif italic">
                              <Folder size={10} className="text-gm-gold" />
                              {item.folder}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-6 text-right font-mono text-[11px] text-gm-text">
                        {formatBytes(item.size)}
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="text-[10px] text-gm-muted font-mono opacity-70">
                          {fmtDate(item.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="py-6 px-8 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {item.url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 rounded-full hover:bg-gm-surface text-gm-muted hover:text-gm-gold"
                              asChild
                              title="İndir"
                            >
                              <a href={item.url} download target="_blank" rel="noopener noreferrer">
                                <Download size={14} />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-full hover:bg-gm-surface text-gm-muted hover:text-gm-text"
                            onClick={() => router.push(`/admin/storage/${item.id}`)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-full hover:bg-gm-error/10 text-gm-error/40 hover:text-gm-error"
                            onClick={() => handleDeleteClick(item)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gm-bg-deep border-gm-border-soft rounded-[32px] p-8 text-gm-text">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl">Dosya Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription className="text-gm-muted font-serif italic">
              {itemToDelete?.name} dosyası kalıcı olarak silinecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="rounded-full border-gm-border-soft bg-transparent hover:bg-gm-surface text-gm-text h-12 px-8 font-bold tracking-widest uppercase text-[10px]">
              Vazgeç
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="rounded-full bg-gm-error hover:bg-gm-error/80 text-white h-12 px-8 font-bold tracking-widest uppercase text-[10px]"
            >
              Dosyayı Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
