'use client';

import * as React from 'react';
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { Activity, Check, Columns3, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateCrmActivityMutation,
  useListCrmActivitiesQuery,
  useListCrmDealsQuery,
  useListCrmPipelinesQuery,
  useMoveCrmDealStageMutation,
  useUpdateCrmActivityMutation,
  type CrmActivityType,
  type CrmDeal,
  type CrmStage,
} from '@/integrations/hooks';

function money(value: string | number | null, currency: string) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ${currency}`;
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(n);
}

function DealCard({ deal, selected, onSelect }: { deal: CrmDeal; selected: boolean; onSelect: (deal: CrmDeal) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      onClick={() => onSelect(deal)}
      className={[
        'w-full rounded-lg border bg-card p-3 text-left shadow-xs transition',
        selected ? 'border-gm-gold ring-2 ring-gm-gold/20' : 'border-border hover:border-gm-gold/60',
        isDragging ? 'opacity-60' : '',
      ].join(' ')}
      {...listeners}
      {...attributes}
    >
      <div className="line-clamp-2 text-sm font-semibold">{deal.title}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {deal.account_name && <span className="truncate">{deal.account_name}</span>}
        {money(deal.amount, deal.currency) && <Badge variant="secondary">{money(deal.amount, deal.currency)}</Badge>}
      </div>
    </button>
  );
}

function StageColumn({
  stage,
  deals,
  selectedDealId,
  onSelectDeal,
}: {
  stage: CrmStage;
  deals: CrmDeal[];
  selectedDealId: string;
  onSelectDeal: (deal: CrmDeal) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <section
      ref={setNodeRef}
      className={[
        'flex min-h-[28rem] min-w-72 flex-col rounded-lg border bg-muted/30',
        isOver ? 'border-gm-gold bg-gm-gold/10' : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b px-3 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{stage.name}</h2>
          <p className="text-xs text-muted-foreground">%{Number(stage.probability).toFixed(0)}</p>
        </div>
        <Badge variant="outline">{deals.length}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} selected={deal.id === selectedDealId} onSelect={onSelectDeal} />
        ))}
      </div>
    </section>
  );
}

function ActivityPanel({ deal }: { deal: CrmDeal | null }) {
  const [subject, setSubject] = React.useState('');
  const [type, setType] = React.useState<CrmActivityType>('task');
  const { data: activities = [] } = useListCrmActivitiesQuery(
    deal ? { ref_type: 'deal', ref_id: deal.id } : undefined,
    { skip: !deal },
  );
  const [createActivity, createState] = useCreateCrmActivityMutation();
  const [updateActivity, updateState] = useUpdateCrmActivityMutation();

  const add = async () => {
    if (!deal || !subject.trim()) return;
    try {
      await createActivity({ ref_type: 'deal', ref_id: deal.id, type, subject: subject.trim() }).unwrap();
      setSubject('');
      toast.success('Aktivite eklendi');
    } catch {
      toast.error('Aktivite eklenemedi');
    }
  };

  if (!deal) {
    return (
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-base">Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Deal seçilmedi</CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-gm-gold" />
          <CardTitle className="min-w-0 truncate text-base">{deal.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Aktivite</Label>
          <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
            <Select value={type} onValueChange={(value) => setType(value as CrmActivityType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Görev</SelectItem>
                <SelectItem value="call">Arama</SelectItem>
                <SelectItem value="email">E-posta</SelectItem>
                <SelectItem value="meeting">Toplantı</SelectItem>
                <SelectItem value="note">Not</SelectItem>
              </SelectContent>
            </Select>
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
            <Button type="button" size="icon" onClick={add} disabled={createState.isLoading || !subject.trim()} aria-label="Aktivite ekle">
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {activities.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <div className="min-w-0">
                <div className={item.done ? 'truncate text-sm text-muted-foreground line-through' : 'truncate text-sm font-medium'}>{item.subject}</div>
                <div className="text-xs text-muted-foreground">{item.type}</div>
              </div>
              {!item.done && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={updateState.isLoading}
                  onClick={() => void updateActivity({ id: item.id, done: true }).unwrap().catch(() => toast.error('Aktivite güncellenemedi'))}
                  aria-label="Aktiviteyi tamamla"
                >
                  <Check className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CrmPipelineClient() {
  const { data: pipelineData, isLoading: pipelinesLoading } = useListCrmPipelinesQuery();
  const { data: deals = [], isLoading: dealsLoading } = useListCrmDealsQuery();
  const [moveDeal] = useMoveCrmDealStageMutation();
  const [selectedDealId, setSelectedDealId] = React.useState('');

  const stages = React.useMemo(() => [...(pipelineData?.stages ?? [])].sort((a, b) => Number(a.sort) - Number(b.sort)), [pipelineData]);
  const selectedDeal = deals.find((deal) => deal.id === selectedDealId) ?? deals[0] ?? null;

  React.useEffect(() => {
    if (!selectedDealId && deals[0]) setSelectedDealId(deals[0].id);
  }, [deals, selectedDealId]);

  const onDragEnd = async (event: DragEndEvent) => {
    const dealId = String(event.active.id);
    const stageId = event.over ? String(event.over.id) : '';
    const deal = deals.find((item) => item.id === dealId);
    if (!deal || !stageId || deal.stage_id === stageId) return;
    try {
      await moveDeal({ id: dealId, stage_id: stageId }).unwrap();
      toast.success('Stage güncellendi');
    } catch {
      toast.error('Stage güncellenemedi');
    }
  };

  const loading = pipelinesLoading || dealsLoading;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-gm-gold">
          <Columns3 className="size-5" />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">CRM</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl text-gm-text">Pipeline</h1>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <DndContext onDragEnd={onDragEnd}>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4">
                {stages.map((stage) => (
                  <StageColumn
                    key={stage.id}
                    stage={stage}
                    deals={deals.filter((deal) => deal.stage_id === stage.id)}
                    selectedDealId={selectedDeal?.id ?? ''}
                    onSelectDeal={(deal) => setSelectedDealId(deal.id)}
                  />
                ))}
              </div>
            </div>
          </DndContext>
          <ActivityPanel deal={selectedDeal} />
        </div>
      )}
    </div>
  );
}
