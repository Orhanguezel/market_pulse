'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Eye, GripVertical, LayoutGrid, List, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import CrmListView, { type CrmColumn } from '@/components/iy/CrmListView';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog, type CrmFormField } from '@/components/iy/CrmEntityDialog';
import {
  useCreateCrmDealMutation,
  useDeleteCrmDealMutation,
  useGetCrmAccountsQuery,
  useGetCrmDealsQuery,
  useGetCrmPipelinesQuery,
  useMoveCrmDealStageMutation,
  useUpdateCrmDealMutation,
  type CrmDeal,
} from '@/integrations/rtk/public/crm.endpoints';

const STATUS_TR: Record<string, string> = { open: 'Açık', won: 'Kazanıldı', lost: 'Kaybedildi' };

const dealSchema = z.object({
  title: z.string().trim().min(1, 'Fırsat adı gerekli'),
  amount: z.preprocess((value) => value === '' || value == null ? undefined : Number(value), z.number().optional()),
  currency: z.string().trim().length(3, '3 harfli para birimi').or(z.literal('')).optional(),
  account_id: z.string().trim().optional(),
  stage_id: z.string().trim().optional(),
  status: z.enum(['open', 'won', 'lost']).optional(),
  expected_close_date: z.string().trim().optional(),
});

type DealForm = z.infer<typeof dealSchema>;
type ViewMode = 'kanban' | 'list';

const emptyDeal: DealForm = {
  title: '',
  amount: undefined,
  currency: 'USD',
  account_id: '',
  stage_id: '',
  status: 'open',
  expected_close_date: '',
};

function money(value: unknown, currency = 'USD') {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(amount) ? `${amount.toLocaleString('tr-TR')} ${currency}` : `0 ${currency}`;
}

function dealAmount(deal: CrmDeal) {
  const value = typeof deal.amount === 'number' ? deal.amount : Number(deal.amount ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function formFromDeal(deal: CrmDeal | null): DealForm {
  if (!deal) return emptyDeal;
  return {
    title: deal.title ?? '',
    amount: deal.amount == null ? undefined : Number(deal.amount),
    currency: deal.currency ?? 'USD',
    account_id: deal.account_id ?? '',
    stage_id: deal.stage_id ?? '',
    status: (deal.status as DealForm['status']) ?? 'open',
    expected_close_date: deal.expected_close_date ?? '',
  };
}

function statusBadge(status?: string | null) {
  const value = status || 'open';
  const cls = value === 'won' ? 'bg-[#dcfce7] text-[#166534]' : value === 'lost' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#eff6ff] text-[#1e40af]';
  return <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${cls}`}>{STATUS_TR[value] || value}</span>;
}

export default function SatisFirsatlariPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale || 'tr';
  const { data = [], isLoading, isError } = useGetCrmDealsQuery();
  const { data: pipelineData } = useGetCrmPipelinesQuery();
  const { data: accounts = [] } = useGetCrmAccountsQuery();
  const [createDeal, createState] = useCreateCrmDealMutation();
  const [updateDeal, updateState] = useUpdateCrmDealMutation();
  const [moveDealStage, moveState] = useMoveCrmDealStageMutation();
  const [deleteDeal, deleteState] = useDeleteCrmDealMutation();
  const [mode, setMode] = React.useState<ViewMode>('kanban');
  const [editing, setEditing] = React.useState<CrmDeal | null>(null);
  const [deleting, setDeleting] = React.useState<CrmDeal | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const stages = React.useMemo(() => pipelineData?.stages ?? [], [pipelineData]);
  const accountNames = React.useMemo(() => new Map(accounts.map((account) => [account.id, account.name])), [accounts]);
  const defaultValues = React.useMemo(() => formFromDeal(editing), [editing]);
  const busy = createState.isLoading || updateState.isLoading;

  const fields = React.useMemo<CrmFormField<DealForm>[]>(() => [
    { name: 'title', label: 'Fırsat', required: true },
    { name: 'amount', label: 'Tutar' },
    { name: 'currency', label: 'Para birimi' },
    { name: 'account_id', label: 'Müşteri', type: 'select', options: [{ value: '', label: 'Müşteri seçilmedi' }, ...accounts.map((account) => ({ value: account.id, label: account.name }))] },
    { name: 'stage_id', label: 'Aşama', type: 'select', options: [{ value: '', label: 'Varsayılan aşama' }, ...stages.map((stage) => ({ value: stage.id, label: stage.name }))] },
    { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'open', label: 'Açık' }, { value: 'won', label: 'Kazanıldı' }, { value: 'lost', label: 'Kaybedildi' }] },
    { name: 'expected_close_date', label: 'Tahmini kapanış', type: 'date' },
  ], [accounts, stages]);

  const stats = React.useMemo(() => {
    const open = data.filter((deal) => (deal.status || 'open') === 'open');
    const won = data.filter((deal) => deal.status === 'won');
    const lost = data.filter((deal) => deal.status === 'lost');
    const wonValue = won.reduce((sum, deal) => sum + dealAmount(deal), 0);
    const openValue = open.reduce((sum, deal) => sum + dealAmount(deal), 0);
    const closedCount = won.length + lost.length;
    const winRate = closedCount ? Math.round((won.length / closedCount) * 100) : 0;
    return { open, won, lost, wonValue, openValue, winRate };
  }, [data]);

  const cols = React.useMemo<CrmColumn<CrmDeal>[]>(() => [
    { key: 'title', label: 'Fırsat', render: (row) => <span className="font-semibold text-[#0f172a]">{row.title}</span> },
    { key: 'account_name', label: 'Müşteri', render: (row) => row.account_id ? <Link href={`/${locale}/musteriler/${row.account_id}`} className="font-medium text-[#1e40af] hover:underline">{row.account_name ?? accountNames.get(row.account_id) ?? row.account_id}</Link> : '-' },
    { key: 'stage_name', label: 'Aşama', render: (row) => row.stage_name || stages.find((stage) => stage.id === row.stage_id)?.name || '-' },
    { key: 'amount', label: 'Tutar', render: (row) => row.amount != null ? money(row.amount, row.currency || 'USD') : '-' },
    { key: 'status', label: 'Durum', render: (row) => statusBadge(row.status) },
    { key: 'expected_close_date', label: 'Tahmini Kapanış', render: (row) => row.expected_close_date ? new Date(row.expected_close_date).toLocaleDateString('tr-TR') : '-' },
  ], [accountNames, locale, stages]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const submit = async (values: DealForm) => {
    const patch = {
      ...values,
      account_id: values.account_id || null,
      stage_id: values.stage_id || undefined,
      currency: values.currency || 'USD',
      expected_close_date: values.expected_close_date || null,
    };
    if (editing) {
      await updateDeal({ id: editing.id, patch }).unwrap();
      return;
    }
    await createDeal({ ...patch, title: values.title }).unwrap();
  };

  const moveToStage = async (stageId: string) => {
    if (!draggingId) return;
    const deal = data.find((item) => item.id === draggingId);
    if (!deal || deal.stage_id === stageId) return;
    try {
      await moveDealStage({ id: draggingId, stage_id: stageId }).unwrap();
      toast.success('Fırsat aşaması güncellendi');
    } catch {
      toast.error('Aşama güncellenemedi');
    } finally {
      setDraggingId(null);
    }
  };

  const renderActions = (row: CrmDeal) => (
    <div className="flex items-center gap-1">
      <Link href={`/${locale}/satis-firsatlari/${row.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]" title="Detay">
        <Eye className="h-4 w-4" />
      </Link>
      <button onClick={() => { setEditing(row); setDialogOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]" title="Düzenle">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700" title="Sil">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">Satış Fırsatları</h1>
            <p className="mt-0.5 text-[13px] text-[#64748b]">Pipeline aşamalarını yönetin, fırsatları sürükleyerek taşıyın.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex h-9 overflow-hidden rounded-md border border-[#cbd5e1] bg-white">
              <button onClick={() => setMode('kanban')} className={`inline-flex items-center gap-1.5 px-3 text-[13px] font-semibold ${mode === 'kanban' ? 'bg-[#eff6ff] text-[#1e40af]' : 'text-[#475569]'}`}><LayoutGrid className="h-4 w-4" /> Kanban</button>
              <button onClick={() => setMode('list')} className={`inline-flex items-center gap-1.5 border-l border-[#cbd5e1] px-3 text-[13px] font-semibold ${mode === 'list' ? 'bg-[#eff6ff] text-[#1e40af]' : 'text-[#475569]'}`}><List className="h-4 w-4" /> Liste</button>
            </div>
            <button onClick={openCreate} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white">
              <Plus className="h-4 w-4" /> Yeni Fırsat
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-4"><div className="text-[12px] font-semibold text-[#64748b]">Açık fırsat</div><div className="mt-1 text-xl font-bold text-[#0f172a]">{stats.open.length}</div><div className="text-[12px] text-[#64748b]">{money(stats.openValue)}</div></div>
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-4"><div className="text-[12px] font-semibold text-[#64748b]">Kazanılan</div><div className="mt-1 text-xl font-bold text-emerald-700">{stats.won.length}</div><div className="text-[12px] text-[#64748b]">{money(stats.wonValue)}</div></div>
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-4"><div className="text-[12px] font-semibold text-[#64748b]">Kaybedilen</div><div className="mt-1 text-xl font-bold text-rose-700">{stats.lost.length}</div><div className="text-[12px] text-[#64748b]">Kapalı fırsatlar</div></div>
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-4"><div className="text-[12px] font-semibold text-[#64748b]">Conversion</div><div className="mt-1 text-xl font-bold text-[#1e40af]">%{stats.winRate}</div><div className="text-[12px] text-[#64748b]">Won / closed</div></div>
        </div>

        {mode === 'list' ? (
          <CrmListView
            title="Fırsat Listesi"
            subtitle="Liste görünümü"
            columns={cols}
            rows={data}
            isLoading={isLoading}
            isError={isError}
            emptyText="Henüz satış fırsatı yok."
            rowActions={renderActions}
          />
        ) : isLoading ? (
          <div className="flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white py-16">Yükleniyor...</div>
        ) : isError ? (
          <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-12 text-center text-[13px] text-[#64748b]">Satış fırsatları alınamadı.</div>
        ) : (
          <div className="grid gap-3 overflow-x-auto pb-2 lg:grid-cols-4">
            {(stages.length ? stages : [{ id: 'open', name: 'Açık', pipeline_id: 'default' }]).map((stage) => {
              const rows = data.filter((deal) => stages.length ? deal.stage_id === stage.id : (deal.status || 'open') === 'open');
              return (
                <section key={stage.id} onDragOver={(event) => event.preventDefault()} onDrop={() => moveToStage(stage.id)} className="min-h-80 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                  <div className="flex items-center justify-between border-b border-[#e2e8f0] px-3 py-3">
                    <h2 className="text-[13px] font-bold text-[#0f172a]">{stage.name}</h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[12px] font-semibold text-[#64748b]">{rows.length}</span>
                  </div>
                  <div className="space-y-2 p-3">
                    {rows.map((deal) => (
                      <article key={deal.id} draggable onDragStart={() => setDraggingId(deal.id)} onDragEnd={() => setDraggingId(null)} className={`rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm ${moveState.isLoading && draggingId === deal.id ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-2">
                          <GripVertical className="mt-0.5 h-4 w-4 text-[#94a3b8]" />
                          <div className="min-w-0 flex-1">
                            <Link href={`/${locale}/satis-firsatlari/${deal.id}`} className="block truncate text-[13px] font-bold text-[#0f172a] hover:text-[#1e40af]">{deal.title}</Link>
                            <div className="mt-1 truncate text-[12px] text-[#64748b]">{deal.account_name || (deal.account_id ? accountNames.get(deal.account_id) : null) || 'Müşteri yok'}</div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-[12px] font-semibold text-[#334155]">{deal.amount != null ? money(deal.amount, deal.currency || 'USD') : '-'}</span>
                              {statusBadge(deal.status)}
                            </div>
                            <div className="mt-3">{renderActions(deal)}</div>
                          </div>
                        </div>
                      </article>
                    ))}
                    {!rows.length && <div className="rounded-md border border-dashed border-[#cbd5e1] bg-white px-3 py-8 text-center text-[12px] text-[#94a3b8]">Bu aşamada fırsat yok.</div>}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <CrmEntityDialog<DealForm>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Fırsatı düzenle' : 'Yeni fırsat'}
        description="Fırsat bilgilerini, müşteri ilişkisini ve pipeline aşamasını yönetin."
        submitLabel={editing ? 'Güncelle' : 'Oluştur'}
        defaultValues={defaultValues}
        schema={dealSchema}
        fields={fields}
        isSubmitting={busy}
        onSubmit={submit}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Fırsatı sil"
        description={deleting ? `${deleting.title} kaydı silinecek. Bu işlem geri alınamaz.` : undefined}
        isDeleting={deleteState.isLoading}
        onConfirm={() => deleting ? deleteDeal(deleting.id).unwrap() : undefined}
      />
    </>
  );
}
