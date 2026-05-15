'use client';

import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadToBucketMutation } from '@/integrations/rtk/public/storage_public.endpoints';

type Props = {
  /** Mevcut avatar URL (varsa) */
  src?: string | null;
  /** Avatar yoksa gösterilecek baş harfler */
  initials: string;
  /** Yükleme tamamlanınca yeni URL ile çağrılır */
  onUploaded: (url: string) => void;
  /** Boyut (px) */
  size?: number;
  /** Bucket adı (default: uploads) */
  bucket?: string;
  /** Klasör (default: avatars) */
  folder?: string;
};

export default function AvatarUpload({
  src,
  initials,
  onUploaded,
  size = 96,
  bucket = 'uploads',
  folder = 'avatars',
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [upload, { isLoading }] = useUploadToBucketMutation();

  function pickFile() {
    if (isLoading) return;
    inputRef.current?.click();
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // aynı dosya tekrar seçilebilsin
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resim 5 MB altında olmalı.');
      return;
    }

    // Anında lokal önizleme
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const res = await upload({ bucket, files: file, path: folder, upsert: true }).unwrap();
      const item = res.items?.[0];
      const url = item?.url || (item?.path ? `/uploads/${item.path}` : '');
      if (!url) throw new Error('upload_url_missing');
      onUploaded(url);
      toast.success('Profil resmi güncellendi');
    } catch (err) {
      toast.error('Resim yüklenemedi. Tekrar deneyin.');
      setPreview(null);
    }
  }

  const display = preview || src || '';

  return (
    <div
      className="relative shrink-0 group cursor-pointer"
      style={{ width: size, height: size }}
      onClick={pickFile}
      role="button"
      aria-label="Profil resmini değiştir"
    >
      <div className="w-full h-full rounded-full border-2 border-(--gm-gold)/30 p-1 overflow-hidden">
        {display ? (
          <img src={display} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <div className="w-full h-full rounded-full bg-(--gm-bg-deep) flex items-center justify-center text-(--gm-gold) font-display text-2xl">
            {initials}
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-full bg-(--gm-bg-deep)/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {isLoading ? (
          <Loader2 size={20} className="text-(--gm-gold) animate-spin" />
        ) : (
          <Camera size={20} className="text-(--gm-gold)" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
