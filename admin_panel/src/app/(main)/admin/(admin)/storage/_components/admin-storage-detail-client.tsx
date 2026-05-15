'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/storage/_components/admin-storage-detail-client.tsx
// FINAL — Admin Storage Upload/Edit (App Router + shadcn)
// - File upload (multipart FormData)
// - Edit metadata
// - Preview
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2, Loader2, Upload, Image as ImageIcon, File } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

import type { StorageUpdateInput } from '@/integrations/shared';
import {
  useGetAssetAdminQuery,
  useCreateAssetAdminMutation,
  usePatchAssetAdminMutation,
  useDeleteAssetAdminMutation,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

type FormData = {
  name: string;
  bucket: string;
  folder: string;
  metadataText: string;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function isImageMime(mime: string | null | undefined) {
  return String(mime ?? '').startsWith('image/');
}

type PreviewPreset = 'original' | 'thumb' | 'card' | 'hero';

function toCloudinaryPreview(url: string, preset: PreviewPreset): string {
  const raw = String(url || '').trim();
  if (!raw.includes('res.cloudinary.com') || !raw.includes('/upload/')) return raw;

  const transforms =
    preset === 'thumb'
      ? 'f_auto,q_auto:eco,w_240,h_240,c_fill'
      : preset === 'card'
        ? 'f_auto,q_auto:eco,w_640,h_420,c_fill'
        : preset === 'hero'
          ? 'f_auto,q_auto:good,w_1440,h_900,c_fit'
          : '';

  if (!transforms) return raw.replace(/\/upload\/[^/]+\/(.*)$/i, '/upload/$1');
  return raw.replace('/upload/', `/upload/${transforms}/`);
}

export default function AdminStorageDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useAdminT('admin.storage');
  const isNew = id === 'new';

  function getErrMsg(e: unknown): string {
    const anyErr = e as any;
    return (
      anyErr?.data?.error?.message ||
      anyErr?.data?.message ||
      anyErr?.message ||
      t('errorFallback')
    );
  }

  // RTK Query - only fetch if editing
  const {
    data: existingItem,
    isLoading: loadingItem,
    error: loadError,
  } = useGetAssetAdminQuery(
    { id },
    { skip: isNew }
  );

  const [createAsset, { isLoading: isCreating }] = useCreateAssetAdminMutation();
  const [patchAsset, { isLoading: isUpdating }] = usePatchAssetAdminMutation();
  const [deleteAsset, { isLoading: isDeleting }] = useDeleteAssetAdminMutation();

  // Form state
  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    bucket: 'public',
    folder: '',
    metadataText: '{}',
  });

  // File state (only for upload)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewPreset, setPreviewPreset] = React.useState<PreviewPreset>('card');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Load existing data
  React.useEffect(() => {
    if (!isNew && existingItem) {
      setFormData({
        name: existingItem.name || '',
        bucket: existingItem.bucket || 'public',
        folder: existingItem.folder || '',
        metadataText: JSON.stringify(existingItem.metadata ?? {}, null, 2),
      });

      if (existingItem.url && isImageMime(existingItem.mime)) {
        setPreviewUrl(existingItem.url);
      } else {
        setPreviewUrl(null);
      }
    }
  }, [existingItem, isNew]);

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Auto-fill name from filename
    if (!formData.name) {
      setFormData((prev) => ({ ...prev, name: file.name }));
    }

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const busy = isCreating || isUpdating || isDeleting || loadingItem;
  const currentPreviewBase = previewUrl || existingItem?.url || '';
  const currentPreviewSrc = React.useMemo(
    () => toCloudinaryPreview(currentPreviewBase, previewPreset),
    [currentPreviewBase, previewPreset],
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isNew) {
        // Upload mode
        if (!selectedFile) {
          toast.error(t('detail.selectFileError'));
          return;
        }

        if (!formData.bucket.trim()) {
          toast.error(t('detail.bucketRequiredError'));
          return;
        }

        await createAsset({
          file: selectedFile,
          bucket: formData.bucket.trim(),
          folder: formData.folder.trim() || undefined,
        }).unwrap();

        toast.success(t('detail.fileUploaded'));
        router.push('/admin/storage');
      } else {
        // Edit mode
        let metadata: Record<string, string> | null | undefined = undefined;
        const raw = formData.metadataText.trim();
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
              toast.error('Metadata JSON object olmalı.');
              return;
            }
            metadata = Object.fromEntries(
              Object.entries(parsed).map(([k, v]) => [String(k), String(v ?? '')]),
            );
          } catch {
            toast.error('Metadata JSON geçersiz.');
            return;
          }
        } else {
          metadata = null;
        }

        const updateData: StorageUpdateInput = {
          name: formData.name.trim() || undefined,
          folder: formData.folder.trim() || null,
          metadata,
        };

        await patchAsset({
          id,
          body: updateData,
        }).unwrap();

        toast.success(t('detail.recordUpdated'));
      }
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (isNew) return;

    try {
      await deleteAsset({ id }).unwrap();
      toast.success(t('list.fileDeleted'));
      router.push('/admin/storage');
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  if (loadError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-destructive">
              {t('detail.loadError', { error: getErrMsg(loadError) })}
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/storage')}
              className="mt-4 gap-2"
            >
              <ArrowLeft className="size-4" />
              {t('detail.backToList')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isNew && loadingItem) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span>{t('list.loading')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle>
                  {isNew ? t('detail.uploadTitle') : t('detail.editTitle')}
                </CardTitle>
                <CardDescription>
                  {isNew
                    ? t('detail.uploadDescription')
                    : t('detail.editDescription')}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/storage')}
                disabled={busy}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                {t('detail.backButton')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Preview */}
        {(previewUrl || existingItem?.url) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detail.previewTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center rounded-lg border bg-muted p-8">
                {((previewUrl || existingItem?.url) &&
                  (isNew ? isImageMime(selectedFile?.type) : isImageMime(existingItem?.mime))) ? (
                  <img
                    src={currentPreviewSrc}
                    alt="Preview"
                    className="max-h-96 rounded object-contain"
                  />
                ) : (
                  <div className="flex size-32 items-center justify-center">
                    <File className="size-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* File Info */}
              {existingItem && (
                <div className="mt-4 space-y-2 text-sm">
                  {existingItem.url && isImageMime(existingItem.mime) ? (
                    <div className="space-y-2 border-t pt-4">
                      <Label htmlFor="preview_preset" className="text-sm">
                        Preview Transform
                      </Label>
                      <Select
                        value={previewPreset}
                        onValueChange={(value) => setPreviewPreset(value as PreviewPreset)}
                      >
                        <SelectTrigger id="preview_preset" className="max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original">Original</SelectItem>
                          <SelectItem value="thumb">Thumbnail 240x240</SelectItem>
                          <SelectItem value="card">Card 640x420</SelectItem>
                          <SelectItem value="hero">Hero 1440x900</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('detail.mimeLabel')}</span>
                    <Badge variant="secondary">{existingItem.mime}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('detail.sizeLabel')}</span>
                    <span>{formatBytes(existingItem.size)}</span>
                  </div>
                  {existingItem.width && existingItem.height && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('detail.dimensionsLabel')}</span>
                      <span>{existingItem.width} × {existingItem.height}</span>
                    </div>
                  )}
                  {existingItem.url && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('detail.urlLabel')}</span>
                      <a
                        href={existingItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {t('detail.openLink')}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Form (only for new) */}
        {isNew && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <div className="flex items-center gap-2">
                  <Upload className="size-4" />
                  {t('detail.selectFileTitle')}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Input */}
              <div className="space-y-2">
                <Label htmlFor="file" className="text-sm">
                  {t('detail.fileLabel')} <span className="text-destructive">{t('detail.required')}</span>
                </Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={busy}
                  required
                />
                {selectedFile && (
                  <div className="text-xs text-muted-foreground">
                    {t('detail.selectedFile', { name: selectedFile.name, size: formatBytes(selectedFile.size) })}
                  </div>
                )}
              </div>

              {/* Bucket */}
              <div className="space-y-2">
                <Label htmlFor="bucket" className="text-sm">
                  {t('detail.bucketLabel')} <span className="text-destructive">{t('detail.required')}</span>
                </Label>
                <Input
                  id="bucket"
                  value={formData.bucket}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bucket: e.target.value }))
                  }
                  placeholder={t('detail.bucketPlaceholder')}
                  disabled={busy}
                  required
                />
              </div>

              {/* Folder */}
              <div className="space-y-2">
                <Label htmlFor="folder" className="text-sm">
                  {t('detail.folderLabel')}
                </Label>
                <Input
                  id="folder"
                  value={formData.folder}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, folder: e.target.value }))
                  }
                  placeholder={t('detail.folderPlaceholder')}
                  disabled={busy}
                />
                <p className="text-xs text-muted-foreground">
                  {t('detail.folderHelp')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Form (only for existing) */}
        {!isNew && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detail.fileInfoTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                  {t('detail.fileNameLabel')}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={t('detail.fileNamePlaceholder')}
                  disabled={busy}
                />
              </div>

              {/* Bucket (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="bucket_readonly" className="text-sm">
                  {t('detail.bucketLabel')}
                </Label>
                <Input
                  id="bucket_readonly"
                  value={formData.bucket}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {t('detail.bucketReadonlyHelp')}
                </p>
              </div>

              {/* Folder */}
              <div className="space-y-2">
                <Label htmlFor="folder_edit" className="text-sm">
                  {t('detail.folderLabel')}
                </Label>
                <Input
                  id="folder_edit"
                  value={formData.folder}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, folder: e.target.value }))
                  }
                  placeholder={t('detail.folderPlaceholder')}
                  disabled={busy}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadata_edit" className="text-sm">
                  Metadata (JSON)
                </Label>
                <textarea
                  id="metadata_edit"
                  value={formData.metadataText}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, metadataText: e.target.value }))
                  }
                  placeholder='{"alt":"Homepage hero","title":"Logo"}'
                  disabled={busy}
                  className="min-h-[180px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:justify-between">
            <div>
              {!isNew && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={busy}
                  className="gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t('detail.deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4" />
                      {t('detail.deleteButton')}
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/storage')}
                disabled={busy}
              >
                {t('detail.cancelButton')}
              </Button>
              <Button type="submit" disabled={busy} className="gap-2">
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {isNew ? t('detail.uploading') : t('detail.saving')}
                  </>
                ) : (
                  <>
                    {isNew ? <Upload className="size-4" /> : <Save className="size-4" />}
                    {isNew ? t('detail.uploadButton') : t('detail.saveButton')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('list.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('list.deleteConfirmDescription', { name: formData.name || t('list.defaultFileName') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('detail.cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>{t('detail.deleteButton')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
