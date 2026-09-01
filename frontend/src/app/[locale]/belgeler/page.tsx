'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Download, Eye, File, FileArchive, FileImage, FileSpreadsheet, FileText,
  FileVideo, Folder, HardDrive, Loader2, Pencil, RefreshCw, Search, Trash2, Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { AppCard, AppPage, AppPageHeader } from '@/components/iy/AppPage';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import type { StorageAsset } from '@/integrations/shared/storage';
import {
  useDeleteMyStorageAssetMutation,
  useListMyStorageAssetsQuery,
  useListMyStorageFoldersQuery,
  usePatchMyStorageAssetMutation,
  useUploadMyStorageAssetsMutation,
} from '@/integrations/rtk/hooks';

const editSchema = z.object({ name: z.string().trim().min(1, 'Dosya adı gerekli'), folder: z.string().trim().optional() });
type EditForm = z.infer<typeof editSchema>;
const editFields: CrmFormField<EditForm>[] = [
  { name: 'name', label: 'Dosya adı', required: true },
  { name: 'folder', label: 'Klasör', placeholder: 'Örn. Sözleşmeler / 2026' },
];

const MIME_FILTERS = [
  { value: '', label: 'Tüm dosyalar' },
  { value: 'image/', label: 'Resimler' },
  { value: 'application/pdf', label: 'PDF' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml', label: 'Excel' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml', label: 'Word' },
  { value: 'video/', label: 'Videolar' },
  { value: 'application/zip', label: 'Arşivler' },
];

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}

function iconFor(mime: string) {
  if (mime.startsWith('image/')) return FileImage;
  if (mime.startsWith('video/')) return FileVideo;
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') return FileSpreadsheet;
  if (mime.includes('pdf') || mime.includes('word') || mime.includes('text')) return FileText;
  if (mime.includes('zip') || mime.includes('compressed')) return FileArchive;
  return File;
}

function typeLabel(mime: string) {
  if (mime.startsWith('image/')) return 'Resim';
  if (mime.startsWith('video/')) return 'Video';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'Excel';
  if (mime === 'text/csv') return 'CSV';
  if (mime.includes('word')) return 'Word';
  if (mime.includes('zip')) return 'Arşiv';
  return mime.split('/').at(-1)?.toUpperCase() || 'Dosya';
}

export default function BelgelerPage() {
  const { locale = 'tr' } = useParams<{ locale: string }>();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState('');
  const deferredQuery = React.useDeferredValue(query);
  const [mime, setMime] = React.useState('');
  const [folder, setFolder] = React.useState('');
  const [uploadFolder, setUploadFolder] = React.useState('');
  const [dragging, setDragging] = React.useState(false);
  const [editing, setEditing] = React.useState<StorageAsset | null>(null);
  const [deleting, setDeleting] = React.useState<StorageAsset | null>(null);

  const list = useListMyStorageAssetsQuery({ q: deferredQuery || undefined, mime: mime || undefined, folder: folder || undefined, limit: 100 });
  const { data: folders = [] } = useListMyStorageFoldersQuery();
  const [uploadFiles, uploadState] = useUploadMyStorageAssetsMutation();
  const [patchAsset, patchState] = usePatchMyStorageAssetMutation();
  const [deleteAsset, deleteState] = useDeleteMyStorageAssetMutation();
  const assets = list.data?.items ?? [];

  const upload = async (files: File[]) => {
    if (!files.length) return;
    const oversized = files.filter((file) => file.size > 50 * 1024 * 1024);
    const accepted = files.filter((file) => file.size <= 50 * 1024 * 1024);
    if (oversized.length) toast.error(`${oversized.length} dosya 50 MB sınırını aştığı için atlandı`);
    if (!accepted.length) return;
    try {
      const result = await uploadFiles({ files: accepted, folder: uploadFolder || undefined }).unwrap();
      toast.success(`${result.items.length} dosya yüklendi`);
      if (result.failed.length) toast.error(`${result.failed.length} dosya yüklenemedi: ${result.failed.join(', ')}`);
      if (inputRef.current) inputRef.current.value = '';
    } catch {
      toast.error('Dosyalar yüklenemedi. Dosya boyutunun 50 MB altında olduğunu kontrol edin.');
    }
  };

  const imageCount = assets.filter((asset) => asset.mime.startsWith('image/')).length;
  const totalSize = assets.reduce((sum, asset) => sum + Number(asset.size || 0), 0);

  return (
    <AppPage>
      <AppPageHeader
        icon={HardDrive}
        title="Dosya Deposu"
        description="Resim, PDF, Word, Excel, video ve diğer çalışma dosyalarınızı güvenle saklayın."
        actions={<button type="button" onClick={() => list.refetch()} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-3 text-[13px] font-semibold text-[#334155]"><RefreshCw className={`h-4 w-4 ${list.isFetching ? 'animate-spin' : ''}`} /> Yenile</button>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AppCard className="p-4"><p className="text-[12px] font-semibold text-[#64748b]">Toplam dosya</p><p className="mt-1 text-2xl font-bold text-[#0f172a]">{list.data?.total ?? 0}</p></AppCard>
        <AppCard className="p-4"><p className="text-[12px] font-semibold text-[#64748b]">Görünen resim</p><p className="mt-1 text-2xl font-bold text-[#0f172a]">{imageCount}</p></AppCard>
        <AppCard className="p-4"><p className="text-[12px] font-semibold text-[#64748b]">Görünen boyut</p><p className="mt-1 text-2xl font-bold text-[#0f172a]">{formatBytes(totalSize)}</p></AppCard>
      </div>

      <AppCard className="p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row">
          <label className="grid flex-1 gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Yüklenecek klasör</span><input value={uploadFolder} onChange={(event) => setUploadFolder(event.target.value)} placeholder="Örn. Sözleşmeler / 2026 (opsiyonel)" className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" /></label>
        </div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(event) => void upload(Array.from(event.target.files ?? []))} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); void upload(Array.from(event.dataTransfer.files)); }}
          className={`flex min-h-36 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 text-center transition-colors ${dragging ? 'border-[#1e40af] bg-[#eff6ff]' : 'border-[#cbd5e1] bg-[#f8fafc] hover:border-[#93c5fd]'}`}
        >
          {uploadState.isLoading ? <Loader2 className="h-7 w-7 animate-spin text-[#1e40af]" /> : <Upload className="h-7 w-7 text-[#1e40af]" />}
          <span className="mt-2 text-[14px] font-bold text-[#0f172a]">Dosyaları seçin veya buraya sürükleyin</span>
          <span className="mt-1 text-[12px] text-[#64748b]">Resim, PDF, doküman, Excel, video, ZIP ve diğer dosyalar · dosya başına en fazla 50 MB</span>
        </button>
      </AppCard>

      <AppCard className="grid gap-3 p-4 md:grid-cols-[1fr_220px_220px]">
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Ara</span><span className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Dosya adı ara" className="h-10 w-full rounded-md border border-[#cbd5e1] pl-9 pr-3 text-[13px]" /></span></label>
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Dosya türü</span><select value={mime} onChange={(event) => setMime(event.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]">{MIME_FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Klasör</span><select value={folder} onChange={(event) => setFolder(event.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]"><option value="">Tüm klasörler</option>{folders.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </AppCard>

      {list.isLoading ? (
        <AppCard className="grid min-h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#1e40af]" /></AppCard>
      ) : list.isError ? (
        <AppCard className="p-10 text-center text-[13px] text-rose-700">Dosya deposu yüklenemedi.</AppCard>
      ) : assets.length === 0 ? (
        <AppCard className="p-12 text-center"><Folder className="mx-auto h-9 w-9 text-[#94a3b8]" /><p className="mt-3 text-[14px] font-semibold text-[#334155]">Henüz dosya yok</p><p className="mt-1 text-[12px] text-[#64748b]">İlk dosyanızı yukarıdaki alandan yükleyin.</p></AppCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {assets.map((asset) => {
            const Icon = iconFor(asset.mime);
            return (
              <AppCard key={asset.id} className="overflow-hidden">
                <div className="grid h-36 place-items-center bg-[#f8fafc]">
                  {asset.mime.startsWith('image/') && asset.url ? <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" /> : <Icon className="h-12 w-12 text-[#1e40af]" /> /* eslint-disable-line @next/next/no-img-element */}
                </div>
                <div className="p-4">
                  <p className="truncate text-[14px] font-bold text-[#0f172a]" title={asset.name}>{asset.name}</p>
                  <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-[#64748b]"><Folder className="h-3 w-3" /> {asset.folder || 'Ana klasör'}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#64748b]"><span>{typeLabel(asset.mime)} · {formatBytes(Number(asset.size))}</span><span>{formatDate(asset.created_at)}</span></div>
                  <div className="mt-4 flex items-center gap-2">
                    <Link href={`/${locale}/belgeler/${asset.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#cbd5e1] px-2.5 text-[12px] font-semibold text-[#334155]"><Eye className="h-3.5 w-3.5" /> Detay</Link>
                    {asset.url && <a href={asset.url} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]" title="Aç / indir"><Download className="h-3.5 w-3.5" /></a>}
                    <button type="button" onClick={() => setEditing(asset)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]" title="Düzenle"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => setDeleting(asset)} className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700" title="Sil"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </AppCard>
            );
          })}
        </div>
      )}

      <CrmEntityDialog<EditForm>
        open={Boolean(editing)}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        title="Dosyayı düzenle"
        submitLabel="Kaydet"
        defaultValues={{ name: editing?.name ?? '', folder: editing?.folder ?? '' }}
        fields={editFields}
        schema={editSchema}
        isSubmitting={patchState.isLoading}
        onSubmit={async (values) => { if (!editing) return; await patchAsset({ id: editing.id, patch: { name: values.name, folder: values.folder || null } }).unwrap(); toast.success('Dosya bilgileri güncellendi'); setEditing(null); }}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Dosyayı sil"
        description="Dosya depodan kalıcı olarak silinecek. Bu işlem geri alınamaz."
        isDeleting={deleteState.isLoading}
        onConfirm={async () => { if (!deleting) return; await deleteAsset(deleting.id).unwrap(); setDeleting(null); }}
      />
    </AppPage>
  );
}
