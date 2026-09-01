'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, File, FileImage, Folder, Loader2 } from 'lucide-react';
import { AppCard, AppPage, AppPageHeader } from '@/components/iy/AppPage';
import { useGetMyStorageAssetQuery } from '@/integrations/rtk/hooks';

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(3, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export default function BelgeDetayPage() {
  const { id = '', locale = 'tr' } = useParams<{ id: string; locale: string }>();
  const { data, isLoading, isError } = useGetMyStorageAssetQuery(id, { skip: !id });
  if (isLoading) return <div className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#1e40af]" /></div>;
  if (isError || !data) return <AppCard className="p-10 text-center text-[13px] text-rose-700">Dosya bulunamadı veya bu dosyaya erişim yetkiniz yok.</AppCard>;
  const PreviewIcon = data.mime.startsWith('image/') ? FileImage : File;
  return (
    <AppPage>
      <AppPageHeader icon={PreviewIcon} title={data.name} description={`${data.mime} · ${formatBytes(Number(data.size))}`} actions={<Link href={`/${locale}/belgeler`} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-3 text-[13px] font-semibold text-[#334155]"><ArrowLeft className="h-4 w-4" /> Dosyalara dön</Link>} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <AppCard className="min-h-[480px] overflow-hidden p-3">
          {data.url && data.mime.startsWith('image/') ? <img src={data.url} alt={data.name} className="mx-auto max-h-[70vh] max-w-full object-contain" /> /* eslint-disable-line @next/next/no-img-element */
            : data.url && data.mime === 'application/pdf' ? <iframe src={data.url} title={data.name} className="h-[70vh] w-full rounded-md" />
            : <div className="grid min-h-[450px] place-items-center text-center"><div><PreviewIcon className="mx-auto h-16 w-16 text-[#1e40af]" /><p className="mt-3 text-[13px] text-[#64748b]">Bu dosya türü tarayıcı içinde önizlenemiyor.</p>{data.url && <a href={data.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-4 text-[13px] font-semibold text-white"><Download className="h-4 w-4" /> Aç / indir</a>}</div></div>}
        </AppCard>
        <AppCard className="h-fit p-5">
          <h2 className="text-[15px] font-bold text-[#0f172a]">Dosya bilgileri</h2>
          <dl className="mt-4 space-y-4 text-[13px]">
            <div><dt className="font-semibold text-[#64748b]">Klasör</dt><dd className="mt-1 flex items-center gap-1 text-[#0f172a]"><Folder className="h-3.5 w-3.5" /> {data.folder || 'Ana klasör'}</dd></div>
            <div><dt className="font-semibold text-[#64748b]">Dosya türü</dt><dd className="mt-1 break-all text-[#0f172a]">{data.mime}</dd></div>
            <div><dt className="font-semibold text-[#64748b]">Boyut</dt><dd className="mt-1 text-[#0f172a]">{formatBytes(Number(data.size))}</dd></div>
            <div><dt className="font-semibold text-[#64748b]">Yükleme tarihi</dt><dd className="mt-1 text-[#0f172a]">{new Date(data.created_at).toLocaleString('tr-TR')}</dd></div>
          </dl>
          {data.url && <a href={data.url} target="_blank" rel="noreferrer" className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1e40af] px-4 text-[13px] font-semibold text-white"><Download className="h-4 w-4" /> Dosyayı aç / indir</a>}
        </AppCard>
      </div>
    </AppPage>
  );
}
