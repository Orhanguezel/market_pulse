'use client';

// =============================================================
// FILE: src/components/common/AdminImageUploadField.tsx
// FINAL — Admin Image Upload Field (App Router + shadcn)
// - Bootstrap yok, inline style minimum (sadece zorunlu yerlerde)
// - Multiple preview: one image per row
// - Cover cannot be removed
// - URL truncated + full on hover + copy
// - previewAspect + previewObjectFit (single preview)
// - SVG preview support (+ Cloudinary sanitize) + ICO destekli
// - Cloudinary raw/upload uzantısız => svg sayılmaz
// =============================================================

import React, { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Image as ImageIcon, Library, Upload, Star, Trash2, X } from 'lucide-react';

import { useCreateAssetAdminMutation, useListAssetsAdminQuery } from '@/integrations/hooks';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type AdminImageUploadFieldProps = {
  label?: string;
  helperText?: React.ReactNode;

  bucket?: string;
  folder?: string;
  metadata?: Record<string, string | number | boolean>;

  value?: string;
  onChange?: (url: string) => void;

  values?: string[];
  onChangeMultiple?: (urls: string[]) => void;

  onSelectAsCover?: (url: string) => void;
  coverValue?: string;

  disabled?: boolean;

  openLibraryHref?: string;
  onOpenLibraryClick?: () => void;

  multiple?: boolean;

  previewAspect?: '16x9' | '4x3' | '1x1';
  previewObjectFit?: 'cover' | 'contain';
};

const norm = (v: unknown) => String(v ?? '').trim();

const isSvgUrl = (raw: string | undefined | null): boolean => {
  const s = norm(raw);
  if (!s) return false;

  const lower = s.toLowerCase();
  const base = lower.split('?')[0].split('#')[0];

  if (base.endsWith('.svg')) return true;
  if (lower.startsWith('data:image/svg+xml')) return true;
  if (lower.includes('format=svg') || lower.includes('f_svg')) return true;

  // raw/upload + uzantısız (favicon gibi) artık svg değil
  return false;
};

const withCloudinarySanitizeIfSvg = (raw: string): string => {
  const s = norm(raw);
  if (!s) return '';
  if (!isSvgUrl(s)) return s;

  if (s.startsWith('data:image/svg+xml')) return s;
  if (!s.includes('res.cloudinary.com')) return s;

  // raw/upload ise hiç dokunma
  if (s.includes('/raw/upload/')) return s;
  if (s.includes('fl_sanitize')) return s;

  const marker = '/upload/';
  const idx = s.indexOf(marker);
  if (idx < 0) return s;

  const before = s.slice(0, idx + marker.length);
  const after = s.slice(idx + marker.length);

  const firstSeg = after.split('/')[0] || '';
  const rest = after.slice(firstSeg.length);

  if (firstSeg.startsWith('v')) {
    return `${before}fl_sanitize/${after}`;
  }

  return `${before}${firstSeg},fl_sanitize${rest}`;
};

const toMeta = (metadata?: Record<string, string | number | boolean>) => {
  if (!metadata) return undefined;
  return Object.fromEntries(Object.entries(metadata).map(([k, v]) => [k, String(v)]));
};

const uniqAppend = (arr: string[], items: string[]) => {
  const set = new Set(arr.map((x) => norm(x)));
  const out = [...arr];
  for (const it of items) {
    const v = norm(it);
    if (v && !set.has(v)) {
      set.add(v);
      out.push(v);
    }
  }
  return out;
};

const displayUrl = (raw: string, max = 72) => {
  const s = norm(raw);
  if (!s) return '';
  if (s.length <= max) return s;

  try {
    const u = new URL(s);
    const host = u.host;
    const path = u.pathname || '';
    const last = path.split('/').filter(Boolean).pop() || '';
    const short = `${host}/…/${last}`;
    if (short.length <= max) return short;
  } catch {
    // ignore
  }

  const head = s.slice(0, Math.max(18, Math.floor(max * 0.55)));
  const tail = s.slice(-Math.max(12, Math.floor(max * 0.25)));
  return `${head}…${tail}`;
};

const ratioOf = (aspect: '16x9' | '4x3' | '1x1') => {
  if (aspect === '4x3') return 4 / 3;
  if (aspect === '1x1') return 1;
  return 16 / 9;
};

const UrlLine: React.FC<{ url: string; disabled?: boolean }> = ({ url, disabled }) => {
  const safe = norm(url);
  if (!safe) return null;

  const shown = displayUrl(safe, 80);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(safe);
      toast.success('URL kopyalandı.');
    } catch {
      toast.error('Kopyalanamadı.');
    }
  };

  return (
    <div className="mt-2 flex min-w-0 items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs text-muted-foreground" title={safe}>
          {shown}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copy}
        disabled={disabled}
        title="Kopyala"
      >
        <Copy className="mr-2 size-4" />
        Kopyala
      </Button>
    </div>
  );
};

export const AdminImageUploadField: React.FC<AdminImageUploadFieldProps> = ({
  label = 'Görsel',
  helperText,
  bucket = 'public',
  folder = 'uploads',
  metadata,

  value,
  onChange,

  values,
  onChangeMultiple,
  onSelectAsCover,
  coverValue,

  disabled,
  openLibraryHref,
  onOpenLibraryClick,
  multiple = false,

  previewAspect = '16x9',
  previewObjectFit = 'cover',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [createAssetAdmin, { isLoading: isUploading }] = useCreateAssetAdminMutation();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');

  // Fetch library assets (show all folders, not filtered)
  const { data: assetsData, isLoading: isLoadingAssets } = useListAssetsAdminQuery(
    { bucket, limit: 50, sort: 'created_at', order: 'desc' },
    { skip: !isModalOpen || activeTab !== 'library' }
  );

  const meta = useMemo(() => toMeta(metadata), [metadata]);
  const gallery = useMemo(
    () => (Array.isArray(values) ? values.map(norm).filter(Boolean) : []),
    [values],
  );

  const busy = !!disabled || isUploading;

  const handlePickClick = () => {
    if (busy) return;
    setActiveTab('upload');
    setIsModalOpen(true);
  };

  const handleDirectFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSelectFromLibrary = (url: string) => {
    if (!url) return;

    if (multiple && onChangeMultiple) {
      onChangeMultiple(uniqAppend(gallery, [url]));
      toast.success('Görsel eklendi.');
    } else if (onChange) {
      onChange(url);
      toast.success('Görsel seçildi.');
    }

    setIsModalOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;

    if (!multiple) {
      const file = files[0];
      console.debug('[AdminImageUpload] file selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // SVG dosya için MIME type düzeltmesi
      // Bazı tarayıcılar SVG'yi doğru MIME ile göndermeyebilir
      let uploadFile: File = file;
      if (
        file.name.toLowerCase().endsWith('.svg') &&
        file.type !== 'image/svg+xml'
      ) {
        console.debug('[AdminImageUpload] fixing SVG MIME type:', file.type, '→ image/svg+xml');
        uploadFile = new File([file], file.name, { type: 'image/svg+xml' });
      }

      try {
        const res = await createAssetAdmin({
          file: uploadFile,
          bucket,
          folder,
          metadata: meta,
        } as any).unwrap();
        const url = norm((res as any)?.url);
        if (!url) throw new Error("Görsel URL'i alınamadı.");
        onChange?.(url);
        toast.success('Görsel yüklendi.');
        setIsModalOpen(false);
      } catch (err: any) {
        console.error('[AdminImageUpload] upload failed:', JSON.stringify(err, null, 2), err);
        const msg =
          err?.data?.error?.message ||
          err?.data?.message ||
          err?.error ||
          err?.message ||
          'Görsel yüklenirken hata oluştu.';
        toast.error(typeof msg === 'string' ? msg : 'Görsel yüklenirken hata oluştu.');
      }
      return;
    }

    const uploadedUrls: string[] = [];
    let successCount = 0;

    for (const file of files) {
      // SVG dosya için MIME type düzeltmesi
      let uploadFile: File = file;
      if (
        file.name.toLowerCase().endsWith('.svg') &&
        file.type !== 'image/svg+xml'
      ) {
        uploadFile = new File([file], file.name, { type: 'image/svg+xml' });
      }

      try {
        const res = await createAssetAdmin({
          file: uploadFile,
          bucket,
          folder,
          metadata: meta,
        } as any).unwrap();
        const url = norm((res as any)?.url);
        if (url) {
          uploadedUrls.push(url);
          successCount += 1;
        }
      } catch (err: any) {
        console.error('[AdminImageUpload] bulk upload failed:', JSON.stringify(err, null, 2), err);
        const emsg =
          err?.data?.error?.message ||
          err?.data?.message ||
          err?.error ||
          err?.message ||
          'Bazı görseller yüklenirken hata oluştu.';
        toast.error(
          typeof emsg === 'string' ? emsg : 'Bazı görseller yüklenirken hata oluştu.',
        );
      }
    }

    if (successCount > 0) {
      if (onChangeMultiple) {
        onChangeMultiple(uniqAppend(gallery, uploadedUrls));
      } else {
        onChange?.(uploadedUrls[0]);
      }
      toast.success(successCount === 1 ? 'Görsel yüklendi.' : `${successCount} görsel yüklendi.`);
      setIsModalOpen(false);
    }
  };

  const handleOpenLibrary = (e: React.MouseEvent) => {
    if (onOpenLibraryClick) {
      e.preventDefault();
      onOpenLibraryClick();
    }
  };

  const removeAt = (idx: number) => {
    if (!onChangeMultiple) return;

    const url = gallery[idx];
    const isCover = !!coverValue && norm(coverValue) === url;

    if (isCover) {
      toast.error('Kapak görseli silinemez. Önce başka bir kapak seç.');
      return;
    }
    onChangeMultiple(gallery.filter((_, i) => i !== idx));
  };

  const aspect = ratioOf(previewAspect);

  const SinglePreview = () => {
    if (!value) {
      return (
        <div className="rounded-md border bg-muted/20 p-3 text-center text-sm text-muted-foreground">
          Henüz görsel seçilmedi.
        </div>
      );
    }

    const svg = isSvgUrl(value);
    const previewUrl = svg ? withCloudinarySanitizeIfSvg(value) : value;

    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Önizleme</div>

        <div className="overflow-hidden rounded-md border bg-background">
          <AspectRatio ratio={aspect}>
            {svg ? (
              <object
                data={previewUrl}
                type="image/svg+xml"
                className="h-full w-full"
                aria-label="SVG preview"
              >
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  SVG önizleme açılamadı.
                </div>
              </object>
            ) : (
              <div className="relative h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Görsel"
                  className="h-full w-full"
                  style={{ objectFit: previewObjectFit }}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.display = 'none';
                    const parent = img.parentElement;
                    if (parent && !parent.querySelector('.error-placeholder')) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className =
                        'error-placeholder absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/50';
                      errorDiv.innerHTML = `
                        <svg class="size-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span class="text-xs text-muted-foreground">Görsel yüklenemedi</span>
                      `;
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
              </div>
            )}
          </AspectRatio>
        </div>

        {/* Full URL display */}
        <div className="rounded-md border bg-muted/50 p-2">
          <div className="mb-1 text-xs font-medium text-muted-foreground">URL:</div>
          <code className="block wrap-break-word text-xs font-mono leading-relaxed text-foreground">
            {value}
          </code>
        </div>

        <UrlLine url={value} disabled={busy} />
      </div>
    );
  };

  const MultiPreview = () => {
    if (!gallery.length) {
      return (
        <div className="rounded-md border bg-muted/20 p-3 text-center text-sm text-muted-foreground">
          Henüz galeri görseli yok.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Galeri</div>

        <div className="flex flex-col gap-2">
          {gallery.map((u, idx) => {
            const isCover = !!coverValue && norm(coverValue) === u;
            const svg = isSvgUrl(u);
            const previewUrl = svg ? withCloudinarySanitizeIfSvg(u) : u;

            return (
              <div
                key={`${u}-${idx}`}
                className={cn('rounded-md border p-2', isCover && 'border-primary')}
              >
                <div className="flex gap-3">
                  <div className="w-35 shrink-0">
                    <div className="overflow-hidden rounded-md border bg-background">
                      <AspectRatio ratio={16 / 9}>
                        {svg ? (
                          <object
                            data={previewUrl}
                            type="image/svg+xml"
                            className="h-full w-full"
                            aria-label={`SVG image ${idx + 1}`}
                          >
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              SVG yüklenemedi.
                            </div>
                          </object>
                        ) : (
                          <div className="relative h-full w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt={`image-${idx + 1}`}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent && !parent.querySelector('.error-placeholder')) {
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className =
                                    'error-placeholder absolute inset-0 flex items-center justify-center bg-muted/50';
                                  errorDiv.innerHTML = `
                                    <svg class="size-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  `;
                                  parent.appendChild(errorDiv);
                                }
                              }}
                            />
                          </div>
                        )}
                      </AspectRatio>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium" title={u}>
                          {isCover ? 'Kapak' : `Görsel ${idx + 1}`}
                        </div>
                        {isCover ? (
                          <Badge variant="secondary" className="mt-1">
                            Kapak
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {onSelectAsCover ? (
                          <Button
                            type="button"
                            variant={isCover ? 'default' : 'outline'}
                            size="sm"
                            disabled={busy}
                            onClick={() => onSelectAsCover(u)}
                            title="Kapak yap"
                          >
                            <Star className="mr-2 size-4" />
                            Kapak
                          </Button>
                        ) : null}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy || !onChangeMultiple || isCover}
                          onClick={() => removeAt(idx)}
                          title={isCover ? 'Kapak silinemez' : 'Sil'}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Sil
                        </Button>
                      </div>
                    </div>

                    <UrlLine url={u} disabled={busy} />

                    {!onChangeMultiple ? (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Not: <code>onChangeMultiple</code> verilmediği için galeri parent tarafından
                        yönetilmiyor.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">{label}</div>
            {helperText ? <div className="text-xs text-muted-foreground">{helperText}</div> : null}
          </div>
          {isUploading ? <Badge variant="secondary">Yükleniyor…</Badge> : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <Label className="sr-only">Upload</Label>
        <Input
          ref={fileInputRef as any}
          type="file"
          accept="image/*,.svg,.ico"
          multiple={!!multiple}
          className="hidden"
          onChange={handleFileChange}
          disabled={busy}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handlePickClick} disabled={busy}>
            <Upload className="mr-2 size-4" />
            {multiple ? 'Görseller Yükle' : 'Görsel Yükle'}
          </Button>
        </div>

        {!multiple ? <SinglePreview /> : <MultiPreview />}

        {/* Upload/Library Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{multiple ? 'Görseller Yükle' : 'Görsel Yükle'}</DialogTitle>
              <DialogDescription>
                Bilgisayarınızdan yükleyin veya kütüphaneden seçin.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'library')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">
                  <Upload className="mr-2 size-4" />
                  Yükle
                </TabsTrigger>
                <TabsTrigger value="library">
                  <Library className="mr-2 size-4" />
                  Kütüphane
                </TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload" className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-6 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Upload className="size-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">Görsel seçin</h3>
                      <p className="text-sm text-muted-foreground">
                        {multiple
                          ? 'Birden fazla görsel yükleyebilirsiniz.'
                          : 'Tek bir görsel yükleyebilirsiniz.'}
                      </p>
                    </div>
                    <Button type="button" onClick={handleDirectFileSelect} disabled={busy} size="lg">
                      <Upload className="mr-2 size-4" />
                      Dosya Seç
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Library Tab */}
              <TabsContent value="library" className="space-y-4">
                {isLoadingAssets ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                  </div>
                ) : !assetsData?.items?.length ? (
                  <div className="rounded-lg border bg-muted/20 p-6 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                      <div className="rounded-full bg-muted p-3">
                        <ImageIcon className="size-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Kütüphane boş</h3>
                        <p className="text-sm text-muted-foreground">
                          Henüz yüklenmiş görsel yok. "Yükle" sekmesinden görsel yükleyebilirsiniz.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {assetsData.items.map((asset) => {
                      const url = asset.url || '';
                      const isSelected = multiple
                        ? gallery.includes(url)
                        : value === url;

                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => handleSelectFromLibrary(url)}
                          disabled={busy}
                          className={cn(
                            'group relative overflow-hidden rounded-lg border transition-all hover:border-primary',
                            isSelected && 'border-primary ring-2 ring-primary/20'
                          )}
                        >
                          <AspectRatio ratio={1}>
                            <img
                              src={url}
                              alt={asset.name || 'Asset'}
                              className="size-full object-cover transition-transform group-hover:scale-105"
                            />
                          </AspectRatio>
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                              <Badge>Seçildi</Badge>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
