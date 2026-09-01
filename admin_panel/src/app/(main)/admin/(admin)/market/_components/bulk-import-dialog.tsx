'use client';

import * as React from 'react';
import Papa from 'papaparse';
import { Upload, Download, AlertCircle, CheckCircle2, Minus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  useSyncErpTargetsMutation,
  useBulkImportTargetsMutation,
  useLazyDownloadImportTemplateQuery,
  type BulkImportRow,
  type BulkImportPreviewRow,
} from '@/integrations/hooks';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type SyncMode = 'all' | 'customers' | 'dealers';
type ConflictMode = 'skip' | 'update';

// ─── Sekme 1: ERP Senkronizasyon ────────────────────────────────────────────

function ErpSyncTab({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = React.useState<SyncMode>('all');
  const [syncErp, { isLoading }] = useSyncErpTargetsMutation();

  const handleSync = async () => {
    try {
      const result = await syncErp({ mode }).unwrap();
      toast.success(result.message);
      onSuccess();
    } catch {
      toast.error('Senkronizasyon başarısız oldu.');
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        ERP veritabanındaki tüm aktif müşteri ve bayileri Market Pulse hedef tablosuna çeker.
        Mevcut kayıtlarda yalnızca ad, telefon ve kategori güncellenir; el ile girilen alanlar korunur.
      </p>

      <RadioGroup value={mode} onValueChange={(v) => setMode(v as SyncMode)} className="space-y-2">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="all" id="sync-all" />
          <Label htmlFor="sync-all">Tümü — Müşteri ve Bayiler</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="customers" id="sync-customers" />
          <Label htmlFor="sync-customers">Sadece Müşteriler</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="dealers" id="sync-dealers" />
          <Label htmlFor="sync-dealers">Sadece Bayiler / Distribütörler</Label>
        </div>
      </RadioGroup>

      <Button onClick={handleSync} disabled={isLoading} className="w-full">
        {isLoading ? 'Senkronize ediliyor...' : 'Senkronize Et'}
      </Button>
    </div>
  );
}

// ─── Sekme 2: CSV / JSON Yükle ───────────────────────────────────────────────

const ACTION_ICON: Record<BulkImportPreviewRow['_action'], React.ReactNode> = {
  insert: <CheckCircle2 className="size-4 text-gm-success" />,
  update: <AlertCircle className="size-4 text-gm-warning" />,
  skip:   <Minus className="size-4 text-gm-muted" />,
};

const ACTION_LABEL: Record<BulkImportPreviewRow['_action'], string> = {
  insert: 'Yeni',
  update: 'Güncelle',
  skip:   'Mevcut (atla)',
};

function FileUploadTab({ onSuccess }: { onSuccess: () => void }) {
  const [rows, setRows]             = React.useState<BulkImportRow[]>([]);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [onConflict, setOnConflict] = React.useState<ConflictMode>('skip');
  const [preview, setPreview]       = React.useState<BulkImportPreviewRow[] | null>(null);
  const [isDryDone, setIsDryDone]   = React.useState(false);

  const [bulkImport, { isLoading }] = useBulkImportTargetsMutation();
  const [getTemplate]               = useLazyDownloadImportTemplateQuery();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setPreview(null);
    setIsDryDone(false);
    setRows([]);

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = JSON.parse(ev.target?.result as string) as unknown;
          const arr = Array.isArray(raw) ? raw : (raw as { rows?: unknown[] }).rows ?? [];
          setRows(arr as BulkImportRow[]);
        } catch {
          setParseError('Geçersiz JSON dosyası.');
        }
      };
      reader.readAsText(file);
    } else {
      Papa.parse<BulkImportRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length > 0) {
            setParseError(`CSV parse hatası: ${result.errors[0]?.message}`);
            return;
          }
          setRows(result.data);
        },
        error: (err) => setParseError(err.message),
      });
    }
    e.target.value = '';
  };

  const handlePreview = async () => {
    try {
      const result = await bulkImport({ rows, dry_run: true, on_conflict: onConflict }).unwrap();
      setPreview(result.preview);
      setIsDryDone(true);
    } catch {
      toast.error('Önizleme alınamadı.');
    }
  };

  const handleConfirm = async () => {
    try {
      const result = await bulkImport({ rows, dry_run: false, on_conflict: onConflict }).unwrap();
      toast.success(`${result.total} satır işlendi: ${result.inserted} eklendi, ${result.updated} güncellendi, ${result.skipped} atlandı.`);
      onSuccess();
    } catch {
      toast.error('Yükleme başarısız oldu.');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const csv = await getTemplate().unwrap();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'hedef-sablonu.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Şablon indirilemedi.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">CSV veya JSON dosyası yükle (maks. 500 satır).</p>
        <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
          <Download className="mr-1.5 size-4" />
          Şablon İndir
        </Button>
      </div>

      <label className="flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 p-6 hover:border-primary/50 transition-colors">
        <span className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
          <Upload className="size-5" />
          <span>CSV veya JSON dosyası seç</span>
        </span>
        <input type="file" accept=".csv,.json" className="hidden" onChange={handleFile} />
      </label>

      {parseError && (
        <p className="text-sm text-destructive">{parseError}</p>
      )}

      {rows.length > 0 && (
        <p className="text-sm text-muted-foreground">{rows.length} satır yüklendi.</p>
      )}

      {rows.length > 500 && (
        <p className="text-sm text-destructive">Maksimum 500 satır yüklenebilir. Dosyayı bölün.</p>
      )}

      <div className="flex items-center gap-2">
        <Checkbox
          id="on-conflict"
          checked={onConflict === 'update'}
          onCheckedChange={(checked) => setOnConflict(checked ? 'update' : 'skip')}
        />
        <Label htmlFor="on-conflict" className="text-sm">Mevcut kayıtları güncelle (işaretli değilse atlanır)</Label>
      </div>

      {rows.length > 0 && rows.length <= 500 && !isDryDone && (
        <Button onClick={handlePreview} disabled={isLoading} variant="outline" className="w-full">
          {isLoading ? 'Önizleme hazırlanıyor...' : 'Önizle'}
        </Button>
      )}

      {isDryDone && preview && (
        <>
          <ScrollArea className="h-60 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row, i) => (
                  <TableRow key={i} className={
                    row._action === 'insert' ? 'bg-gm-success/10' :
                    row._action === 'update' ? 'bg-gm-warning/10' : ''
                  }>
                    <TableCell>{ACTION_ICON[row._action]}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.category ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[160px]">{row.website ?? '—'}</TableCell>
                    <TableCell className="text-xs">{ACTION_LABEL[row._action]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <Button onClick={handleConfirm} disabled={isLoading} className="w-full">
            {isLoading ? 'Yükleniyor...' : `Onayla ve Yükle (${preview.filter(r => r._action !== 'skip').length} kayıt)`}
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Ana Dialog ──────────────────────────────────────────────────────────────

export default function BulkImportDialog({ open, onClose, onSuccess }: Props) {
  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Hedefleri İçe Aktar</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="erp">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="erp" className="flex-1">ERP&apos;den Çek</TabsTrigger>
            <TabsTrigger value="file" className="flex-1">Dosyadan Yükle</TabsTrigger>
          </TabsList>

          <TabsContent value="erp">
            <ErpSyncTab onSuccess={handleSuccess} />
          </TabsContent>

          <TabsContent value="file">
            <FileUploadTab onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
