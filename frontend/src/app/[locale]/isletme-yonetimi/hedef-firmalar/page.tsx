'use client';

import * as React from 'react';
import { AlertTriangle, BarChart3, Download, Eye, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import {
  useBulkImportMarketTargetsMutation,
  useCreateMarketTargetMutation,
  useDeleteMarketTargetMutation,
  useDownloadMarketTargetImportTemplateQuery,
  useGetMarketTargetIntelQuery,
  useGetMarketTargetMarketplaceHistoryQuery,
  useListMarketTargetsQuery,
  useRecalculateMarketTargetChurnMutation,
  useScanAllMarketTargetCompetitorsMutation,
  useScanAllMarketTargetMarketplacesMutation,
  useScanMarketTargetCompetitorMutation,
  useScanMarketTargetMarketplaceMutation,
  useUpdateMarketTargetMutation,
} from '@/integrations/rtk/public/market.endpoints';
import type { MarketBulkImportRow, MarketTarget } from '@/integrations/shared/market.types';

const targetSchema = z.object({
  name: z.string().trim().min(1, 'Firma adı gerekli'),
  category: z.string().trim().optional(),
  status: z.string().trim().optional(),
  website: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Geçerli e-posta girin').or(z.literal('')).optional(),
  contact_name: z.string().trim().optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  instagram_url: z.string().trim().optional(),
  google_maps_url: z.string().trim().optional(),
  hepsiburada_url: z.string().trim().optional(),
  trendyol_url: z.string().trim().optional(),
  amazon_url: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

type TargetForm = z.infer<typeof targetSchema>;
type Platform = 'hepsiburada' | 'trendyol' | 'amazon';

const emptyTarget: TargetForm = {
  name: '',
  category: 'dealer',
  status: 'active',
  website: '',
  phone: '',
  email: '',
  contact_name: '',
  city: '',
  district: '',
  instagram_url: '',
  google_maps_url: '',
  hepsiburada_url: '',
  trendyol_url: '',
  amazon_url: '',
  notes: '',
};

const fields: CrmFormField<TargetForm>[] = [
  { name: 'name', label: 'Firma', required: true },
  { name: 'category', label: 'Kategori', type: 'select', options: [{ value: 'dealer', label: 'Bayi' }, { value: 'distributor', label: 'Distribütör' }, { value: 'prospect', label: 'Prospect' }, { value: 'musteri', label: 'Müşteri' }] },
  { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'active', label: 'Aktif' }, { value: 'passive', label: 'Pasif' }, { value: 'risk', label: 'Risk' }] },
  { name: 'website', label: 'Web sitesi' },
  { name: 'phone', label: 'Telefon' },
  { name: 'email', label: 'E-posta', type: 'email' },
  { name: 'contact_name', label: 'Yetkili' },
  { name: 'city', label: 'Şehir' },
  { name: 'district', label: 'İlçe' },
  { name: 'instagram_url', label: 'Instagram URL' },
  { name: 'google_maps_url', label: 'Google Maps URL' },
  { name: 'hepsiburada_url', label: 'Hepsiburada URL' },
  { name: 'trendyol_url', label: 'Trendyol URL' },
  { name: 'amazon_url', label: 'Amazon URL' },
  { name: 'notes', label: 'Not', type: 'textarea' },
];

function churn(target: MarketTarget) {
  return Number(target.churnRiskScore ?? target.churn_score ?? 0);
}

function formFromTarget(target: MarketTarget | null): TargetForm {
  if (!target) return emptyTarget;
  return {
    name: target.name ?? '',
    category: target.category ?? 'dealer',
    status: target.status ?? 'active',
    website: target.website ?? '',
    phone: target.phone ?? '',
    email: target.email ?? '',
    contact_name: target.contactName ?? '',
    city: target.city ?? '',
    district: target.district ?? '',
    instagram_url: target.instagramUrl ?? '',
    google_maps_url: target.googleMapsUrl ?? '',
    hepsiburada_url: target.hepsiburadaUrl ?? '',
    trendyol_url: target.trendyolUrl ?? '',
    amazon_url: target.amazonUrl ?? '',
    notes: target.notes ?? '',
  };
}

function parseCsvRows(text: string): MarketBulkImportRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(',').map((item) => item.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((item) => item.trim());
    return Object.fromEntries(header.map((key, index) => [key, cells[index] || undefined])) as MarketBulkImportRow;
  }).filter((row) => row.name);
}

function IntelPanel({ target, platform }: { target: MarketTarget; platform: Platform }) {
  const { data, isFetching } = useGetMarketTargetIntelQuery(target.id);
  const { data: history } = useGetMarketTargetMarketplaceHistoryQuery({ id: target.id, platform, limit: 20 });
  const trend = data?.orders?.trend ?? {};
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#0f172a]">{target.name} istihbaratı</h2>
          <p className="mt-0.5 text-[12px] text-[#64748b]">Churn, sinyal ve marketplace geçmişi</p>
        </div>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-[#1e40af]" />}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-md bg-[#f8fafc] p-3"><div className="text-[12px] text-[#64748b]">Churn skor</div><div className="text-xl font-bold text-[#0f172a]">{churn(data?.target ?? target).toFixed(1)}</div></div>
        <div className="rounded-md bg-[#f8fafc] p-3"><div className="text-[12px] text-[#64748b]">Sinyal</div><div className="text-xl font-bold text-[#0f172a]">{data?.signals?.length ?? 0}</div></div>
        <div className="rounded-md bg-[#f8fafc] p-3"><div className="text-[12px] text-[#64748b]">Son 90 gün sipariş</div><div className="text-xl font-bold text-[#0f172a]">{String(trend.last90_count ?? '-')}</div></div>
        <div className="rounded-md bg-[#f8fafc] p-3"><div className="text-[12px] text-[#64748b]">Marketplace nokta</div><div className="text-xl font-bold text-[#0f172a]">{history?.points?.length ?? 0}</div></div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-[#e2e8f0]">
          <div className="border-b border-[#e2e8f0] px-3 py-2 text-[12px] font-bold text-[#64748b]">Son sinyaller</div>
          <div className="max-h-52 overflow-auto">
            {(data?.signals ?? []).slice(0, 6).map((signal) => {
              const item = signal as { id?: string; title?: string; severity?: string; created_at?: string };
              return <div key={item.id} className="border-b border-[#f1f5f9] px-3 py-2 text-[12px]"><b>{item.severity}</b> · {item.title}</div>;
            })}
            {!data?.signals?.length && <div className="px-3 py-8 text-center text-[12px] text-[#94a3b8]">Sinyal yok.</div>}
          </div>
        </div>
        <div className="rounded-md border border-[#e2e8f0]">
          <div className="border-b border-[#e2e8f0] px-3 py-2 text-[12px] font-bold text-[#64748b]">Marketplace geçmişi</div>
          <div className="max-h-52 overflow-auto">
            {(history?.points ?? []).slice(-6).map((point) => (
              <div key={`${point.at}-${point.content_hash}`} className="grid grid-cols-3 border-b border-[#f1f5f9] px-3 py-2 text-[12px]">
                <span>{new Date(point.at).toLocaleDateString('tr-TR')}</span><span>{point.product_count} ürün</span><span>{point.out_of_stock_count} stok dışı</span>
              </div>
            ))}
            {!history?.points?.length && <div className="px-3 py-8 text-center text-[12px] text-[#94a3b8]">Geçmiş yok.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HedefFirmalarPage() {
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [platform, setPlatform] = React.useState<Platform>('trendyol');
  const [editing, setEditing] = React.useState<MarketTarget | null>(null);
  const [deleting, setDeleting] = React.useState<MarketTarget | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [intelTarget, setIntelTarget] = React.useState<MarketTarget | null>(null);
  const [importText, setImportText] = React.useState('name,category,website,phone,email,contact_name,city,district,notes\n');
  const { data = [], isLoading, isError } = useListMarketTargetsQuery({ q: query || undefined, category: category || undefined, status: status || undefined, limit: 200, sort: 'churn_risk_score', order: 'desc' });
  const [createTarget, createState] = useCreateMarketTargetMutation();
  const [updateTarget, updateState] = useUpdateMarketTargetMutation();
  const [deleteTarget, deleteState] = useDeleteMarketTargetMutation();
  const [recalculateChurn, churnState] = useRecalculateMarketTargetChurnMutation();
  const [scanCompetitor, competitorState] = useScanMarketTargetCompetitorMutation();
  const [scanAllCompetitors, scanAllCompetitorsState] = useScanAllMarketTargetCompetitorsMutation();
  const [scanMarketplace, marketplaceState] = useScanMarketTargetMarketplaceMutation();
  const [scanAllMarketplaces, scanAllMarketplacesState] = useScanAllMarketTargetMarketplacesMutation();
  const [bulkImport, bulkImportState] = useBulkImportMarketTargetsMutation();
  const { refetch: downloadTemplate } = useDownloadMarketTargetImportTemplateQuery(undefined, { skip: true });
  const defaultValues = React.useMemo(() => formFromTarget(editing), [editing]);
  const busy = createState.isLoading || updateState.isLoading;

  const cols: CrmColumn<MarketTarget>[] = [
    { key: 'name', label: 'Firma', render: (row) => <span className="font-semibold text-[#0f172a]">{row.name}</span> },
    { key: 'category', label: 'Kategori', render: (row) => row.category || '-' },
    { key: 'status', label: 'Durum', render: (row) => row.status || '-' },
    { key: 'city', label: 'Şehir', render: (row) => [row.city, row.district].filter(Boolean).join(' / ') || '-' },
    { key: 'churnRiskScore', label: 'Churn', render: (row) => <span className={`font-bold ${churn(row) >= 7 ? 'text-rose-700' : churn(row) >= 4 ? 'text-amber-700' : 'text-emerald-700'}`}>{churn(row).toFixed(1)}</span> },
    { key: 'website', label: 'Web', render: (row) => row.website ? <a href={row.website} target="_blank" rel="noreferrer" className="font-medium text-[#1e40af] hover:underline">Aç</a> : '-' },
  ];

  const submit = async (values: TargetForm) => {
    const patch = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value || undefined]));
    if (editing) await updateTarget({ id: editing.id, patch }).unwrap();
    else await createTarget({ ...patch, name: values.name }).unwrap();
  };

  const downloadCsvTemplate = async () => {
    const result = await downloadTemplate();
    const blob = result.data;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hedef-sablonu.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importRows = async (dryRun: boolean) => {
    const rows = parseCsvRows(importText);
    if (!rows.length) {
      toast.error('CSV satırı bulunamadı');
      return;
    }
    const result = await bulkImport({ rows, dry_run: dryRun, on_conflict: 'update' }).unwrap();
    toast.success(dryRun ? `${result.total} satır önizlendi` : `${result.inserted} eklendi, ${result.updated} güncellendi`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Hedef Firmalar</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">Kategori, churn, istihbarat ve marketplace taramalarını yönetin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={scanAllCompetitorsState.isLoading} onClick={() => scanAllCompetitors().unwrap().then(() => toast.success('Toplu rakip tarama tamamlandı'))} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155] disabled:opacity-50">
            {scanAllCompetitorsState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Tüm Rakipler
          </button>
          <button disabled={scanAllMarketplacesState.isLoading} onClick={() => scanAllMarketplaces().unwrap().then(() => toast.success('Toplu marketplace tarama tamamlandı'))} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155] disabled:opacity-50">
            {scanAllMarketplacesState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />} Tüm Marketplace
          </button>
          <button onClick={() => { setEditing(null); setDialogOpen(true); }} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Hedef Ekle</button>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-[#e2e8f0] bg-white p-4 md:grid-cols-4">
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Ara</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" /></label>
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Kategori</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]"><option value="">Tümü</option><option value="dealer">Bayi</option><option value="distributor">Distribütör</option><option value="prospect">Prospect</option><option value="musteri">Müşteri</option></select></label>
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Durum</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]"><option value="">Tümü</option><option value="active">Aktif</option><option value="passive">Pasif</option><option value="risk">Risk</option></select></label>
        <label className="grid gap-1.5"><span className="text-[12px] font-semibold text-[#64748b]">Marketplace</span><select value={platform} onChange={(event) => setPlatform(event.target.value as Platform)} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]"><option value="trendyol">Trendyol</option><option value="hepsiburada">Hepsiburada</option><option value="amazon">Amazon</option></select></label>
      </div>

      {intelTarget && <IntelPanel target={intelTarget} platform={platform} />}

      <CrmListView
        title="Hedef Firma Listesi"
        subtitle={`${data.length} kayıt`}
        columns={cols}
        rows={data}
        isLoading={isLoading}
        isError={isError}
        emptyText="Henüz hedef firma yok."
        rowActions={(row) => (
          <div className="flex items-center gap-1">
            <button onClick={() => setIntelTarget(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]" title="İstihbarat"><Eye className="h-4 w-4" /></button>
            <button disabled={churnState.isLoading} onClick={() => recalculateChurn(row.id).unwrap().then(() => toast.success('Churn skoru yenilendi'))} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155] disabled:opacity-50" title="Churn yenile"><RefreshCw className="h-4 w-4" /></button>
            <button disabled={competitorState.isLoading} onClick={() => scanCompetitor(row.id).unwrap().then((result) => toast.success(`${result.signals_created ?? 0} sinyal üretildi`))} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155] disabled:opacity-50" title="Rakip tara"><Search className="h-4 w-4" /></button>
            <button disabled={marketplaceState.isLoading} onClick={() => scanMarketplace({ id: row.id, platform }).unwrap().then(() => toast.success('Marketplace tarandı'))} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155] disabled:opacity-50" title="Marketplace tara"><BarChart3 className="h-4 w-4" /></button>
            <button onClick={() => { setEditing(row); setDialogOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]" title="Düzenle"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700" title="Sil"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-[#0f172a]">Toplu Import</h2>
            <p className="mt-0.5 text-[12px] text-[#64748b]">CSV içeriğini yapıştırın; dry-run ile önizleyip sonra içeri alın.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadCsvTemplate} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155]"><Download className="h-4 w-4" /> Şablon</button>
            <button disabled={bulkImportState.isLoading} onClick={() => importRows(true)} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155] disabled:opacity-50"><AlertTriangle className="h-4 w-4" /> Dry-run</button>
            <button disabled={bulkImportState.isLoading} onClick={() => importRows(false)} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-50">{bulkImportState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} İçeri Al</button>
          </div>
        </div>
        <textarea value={importText} onChange={(event) => setImportText(event.target.value)} className="mt-3 min-h-36 w-full rounded-md border border-[#cbd5e1] p-3 font-mono text-[12px]" />
        {bulkImportState.data?.preview?.length ? (
          <div className="mt-3 max-h-44 overflow-auto rounded-md border border-[#e2e8f0]">
            {bulkImportState.data.preview.slice(0, 20).map((row, index) => <div key={`${row.name}-${index}`} className="grid grid-cols-[1fr_auto] border-b border-[#f1f5f9] px-3 py-2 text-[12px]"><span>{row.name}</span><b>{row._action}</b></div>)}
          </div>
        ) : null}
      </div>

      <CrmEntityDialog<TargetForm> open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Hedef firmayı düzenle' : 'Yeni hedef firma'} submitLabel={editing ? 'Güncelle' : 'Oluştur'} defaultValues={defaultValues} schema={targetSchema} fields={fields} isSubmitting={busy} onSubmit={submit} />
      <ConfirmDeleteDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Hedef firmayı sil" description={deleting ? `${deleting.name} kaydı silinecek.` : undefined} isDeleting={deleteState.isLoading} onConfirm={() => deleting ? deleteTarget(deleting.id).unwrap() : undefined} />
    </div>
  );
}
