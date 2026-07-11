'use client';

import * as React from 'react';
import { useOpenCreateFromQuery } from '@/hooks/useOpenCreateFromQuery';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import { useCreateCrmProductMutation, useDeleteCrmProductMutation, useGetCrmProductsQuery, useUpdateCrmProductMutation, type CrmProduct } from '@/integrations/rtk/public/crm.endpoints';

const productSchema = z.object({
  sku: z.string().trim().optional(),
  name: z.string().trim().min(1, 'Ürün adı gerekli'),
  description: z.string().trim().optional(),
  unit_price: z.preprocess((value) => value === '' || value == null ? undefined : Number(value), z.number().optional()),
  currency: z.string().trim().length(3, '3 harfli para birimi').or(z.literal('')).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
type ProductForm = z.infer<typeof productSchema>;
const emptyProduct: ProductForm = { sku: '', name: '', description: '', unit_price: undefined, currency: 'USD', status: 'active' };
const fields: CrmFormField<ProductForm>[] = [
  { name: 'sku', label: 'SKU' },
  { name: 'name', label: 'Ürün', required: true },
  { name: 'description', label: 'Açıklama', type: 'textarea' },
  { name: 'unit_price', label: 'Birim fiyat' },
  { name: 'currency', label: 'Para birimi' },
  { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Pasif' }] },
];

function money(value: unknown, currency = 'USD') {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(amount) ? `${amount.toLocaleString('tr-TR')} ${currency}` : '-';
}
function formFromProduct(product: CrmProduct | null): ProductForm {
  return product ? { sku: product.sku ?? '', name: product.name ?? '', description: product.description ?? '', unit_price: product.unit_price == null ? undefined : Number(product.unit_price), currency: product.currency ?? 'USD', status: (product.status as ProductForm['status']) ?? 'active' } : emptyProduct;
}

export default function UrunlerPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale || 'tr';
  const { data, isLoading, isError } = useGetCrmProductsQuery();
  const [createProduct, createState] = useCreateCrmProductMutation();
  const [updateProduct, updateState] = useUpdateCrmProductMutation();
  const [deleteProduct, deleteState] = useDeleteCrmProductMutation();
  const [editing, setEditing] = React.useState<CrmProduct | null>(null);
  const [deleting, setDeleting] = React.useState<CrmProduct | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  useOpenCreateFromQuery(() => { setEditing(null); setDialogOpen(true); });
  const defaultValues = React.useMemo(() => formFromProduct(editing), [editing]);
  const cols: CrmColumn<CrmProduct>[] = [
    { key: 'sku', label: 'SKU', render: (r) => r.sku || '-' },
    { key: 'name', label: 'Ürün', render: (r) => <span className="font-semibold text-[#0f172a]">{r.name}</span> },
    { key: 'unit_price', label: 'Fiyat', render: (r) => r.unit_price != null ? money(r.unit_price, r.currency || 'USD') : '-' },
    { key: 'status', label: 'Durum', render: (r) => <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[12px] font-medium text-[#1e40af]">{r.status || 'active'}</span> },
  ];
  const submit = async (values: ProductForm) => {
    const patch = { ...values, sku: values.sku || null, description: values.description || null, currency: values.currency || 'USD' };
    if (editing) await updateProduct({ id: editing.id, patch }).unwrap();
    else await createProduct({ ...patch, name: values.name }).unwrap();
  };
  return (
    <>
      <CrmListView title="Ürünler" subtitle="Ürün/hizmet kataloğu" columns={cols} rows={data} isLoading={isLoading} isError={isError} emptyText="Henüz ürün kaydı yok." toolbarActions={<button onClick={() => { setEditing(null); setDialogOpen(true); }} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Yeni Ürün</button>} rowActions={(row) => (
        <div className="flex items-center gap-1">
          <Link href={`/${locale}/urunler/${row.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]"><Eye className="h-4 w-4" /></Link>
          <button onClick={() => { setEditing(row); setDialogOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700"><Trash2 className="h-4 w-4" /></button>
        </div>
      )} />
      <CrmEntityDialog<ProductForm> open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Ürünü düzenle' : 'Yeni ürün'} submitLabel={editing ? 'Güncelle' : 'Oluştur'} defaultValues={defaultValues} schema={productSchema} fields={fields} isSubmitting={createState.isLoading || updateState.isLoading} onSubmit={submit} />
      <ConfirmDeleteDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Ürünü sil" description="Bu ürün kaydı silinecek." isDeleting={deleteState.isLoading} onConfirm={() => deleting ? deleteProduct(deleting.id).unwrap() : undefined} />
    </>
  );
}
