'use client';

import * as React from 'react';
import { BarChart3, Database, FileSearch, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  useCreateCustomsTrackedEntityMutation,
  useDeleteCustomsTrackedEntityMutation,
  useGetCustomsIntelligenceEvidenceQuery,
  useGetCustomsIntelligenceSummaryQuery,
} from '@/integrations/hooks';
import type { CustomsEntitySummary, CustomsEntityType } from '@/integrations/shared';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const usd = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });

function date(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('tr-TR');
}

function EntityRow({
  entity,
  selected,
  onSelect,
  onDelete,
}: {
  entity: CustomsEntitySummary;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => Promise<void>;
}) {
  return (
    <TableRow className={selected ? 'bg-gm-gold/5' : undefined}>
      <TableCell>
        <div className="space-y-1">
          <div className="font-semibold text-gm-text">{entity.name}</div>
          <div className="max-w-xs truncate text-xs text-gm-muted" title={entity.aliases.map((item) => item.alias).join(', ')}>
            {entity.aliases.map((item) => item.alias).join(', ') || 'Alias yok'}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={entity.entity_type === 'own' ? 'border-gm-gold/50 text-gm-gold' : 'border-cyan-400/40 text-cyan-300'}>
          {entity.entity_type === 'own' ? 'Kendi firmamız' : 'Rakip'}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-mono">{number.format(entity.shipment_count)}</TableCell>
      <TableCell className="text-right font-mono">{usd.format(entity.total_value_usd)}</TableCell>
      <TableCell className="text-right font-mono">%{number.format(entity.observed_share_pct)}</TableCell>
      <TableCell className="text-right font-mono">{number.format(entity.buyer_count)}</TableCell>
      <TableCell className="text-right">{date(entity.latest_shipment_date)}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onSelect} className="rounded-full">
            <FileSearch className="mr-2 size-4" /> Kanıt
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full border-red-500/30 text-red-300">
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{entity.name} silinsin mi?</AlertDialogTitle>
                <AlertDialogDescription>Bu işlem firma ve bütün gümrük unvan eşleştirmelerini siler. Ham gümrük kayıtları etkilenmez.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction onClick={() => void onDelete()} className="bg-red-600 hover:bg-red-500">Sil</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function CustomsIntelligencePanel() {
  const [hsPrefix, setHsPrefix] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const filters = React.useMemo(() => ({
    hs_prefix: hsPrefix || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  }), [hsPrefix, dateFrom, dateTo]);
  const { data, isLoading, isFetching, refetch } = useGetCustomsIntelligenceSummaryQuery(filters);
  const [createEntity, createState] = useCreateCustomsTrackedEntityMutation();
  const [deleteEntity] = useDeleteCustomsTrackedEntityMutation();
  const [entityType, setEntityType] = React.useState<CustomsEntityType>('own');
  const [name, setName] = React.useState('');
  const [country, setCountry] = React.useState('TR');
  const [aliases, setAliases] = React.useState('');
  const [matchType, setMatchType] = React.useState<'exact' | 'prefix'>('exact');
  const [selectedEntityId, setSelectedEntityId] = React.useState<string | null>(null);
  const { data: evidence, isFetching: evidenceLoading } = useGetCustomsIntelligenceEvidenceQuery(
    { entityId: selectedEntityId ?? '', ...filters, limit: 50 },
    { skip: !selectedEntityId },
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const aliasRows = aliases.split('\n').map((item) => item.trim()).filter(Boolean);
    if (!name.trim()) return;
    try {
      await createEntity({
        entity_type: entityType,
        name: name.trim(),
        country: country.trim() || undefined,
        aliases: (aliasRows.length ? aliasRows : [name.trim()]).map((alias) => ({ alias, match_type: matchType })),
      }).unwrap();
      setName('');
      setAliases('');
      toast.success('Gümrük firma eşleştirmesi eklendi');
    } catch {
      toast.error('Firma eklenemedi; aynı isim daha önce tanımlanmış olabilir');
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteEntity(id).unwrap();
      if (selectedEntityId === id) setSelectedEntityId(null);
      toast.success('Firma eşleştirmesi silindi');
    } catch {
      toast.error('Firma silinemedi');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">
          <span className="h-px w-8 bg-gm-gold" /> Gümrük kayıtlarına dayalı
        </div>
        <h1 className="font-serif text-4xl text-gm-text">İhracat İstihbaratı</h1>
        <p className="max-w-3xl text-sm text-gm-muted">Kendi ihracatınızı ve rakip ihracatlarını unvan eşleştirmeleri üzerinden karşılaştırın; her metriği kaynak gümrük satırına kadar doğrulayın.</p>
      </div>

      <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50">
        <CardHeader><CardTitle className="font-serif text-2xl">Firma tanımla</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[180px_1fr_120px_1.4fr_150px_auto] lg:items-end">
            <div className="space-y-2">
              <Label>Tür</Label>
              <Select value={entityType} onValueChange={(value) => setEntityType(value as CustomsEntityType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="own">Kendi firmamız</SelectItem><SelectItem value="competitor">Rakip</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Görünen ad</Label><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Avrasya Paspas" required /></div>
            <div className="space-y-2"><Label>Ülke</Label><Input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="TR" /></div>
            <div className="space-y-2"><Label>Gümrükteki unvanlar (satır başına bir)</Label><Textarea value={aliases} onChange={(event) => setAliases(event.target.value)} placeholder="AVRASYA PASPAS AUTOMOTIVE INDUSTRY AND TRADE LIMITED COMPANY" rows={3} /></div>
            <div className="space-y-2">
              <Label>Eşleşme</Label>
              <Select value={matchType} onValueChange={(value) => setMatchType(value as 'exact' | 'prefix')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="exact">Tam unvan</SelectItem><SelectItem value="prefix">Bu ifadeyle başlar</SelectItem></SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={createState.isLoading} className="rounded-full bg-gm-gold text-black hover:bg-gm-gold-light">
              {createState.isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />} Ekle
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50">
        <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
          <div className="space-y-2"><Label>GTİP / HS ön eki</Label><Input value={hsPrefix} onChange={(event) => setHsPrefix(event.target.value)} placeholder="401691" /></div>
          <div className="space-y-2"><Label>Başlangıç</Label><Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></div>
          <div className="space-y-2"><Label>Bitiş</Label><Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="rounded-full">
            {isFetching ? <Loader2 className="mr-2 size-4 animate-spin" /> : <BarChart3 className="mr-2 size-4" />} Hesapla
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-gm-border-soft bg-gm-surface/10"><CardContent className="p-5"><div className="text-xs uppercase tracking-widest text-gm-muted">Takip edilen firma</div><div className="mt-2 font-serif text-3xl text-gm-text">{data?.entities.length ?? 0}</div></CardContent></Card>
        <Card className="border-gm-border-soft bg-gm-surface/10"><CardContent className="p-5"><div className="text-xs uppercase tracking-widest text-gm-muted">Gözlemlenen ihracat</div><div className="mt-2 font-serif text-3xl text-gm-text">{usd.format(data?.observed_total_value_usd ?? 0)}</div></CardContent></Card>
        <Card className="border-gm-border-soft bg-gm-surface/10"><CardContent className="p-5"><div className="text-xs uppercase tracking-widest text-gm-muted">Gümrük kaydı</div><div className="mt-2 font-serif text-3xl text-gm-text">{number.format(data?.observed_shipment_count ?? 0)}</div></CardContent></Card>
      </div>

      <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50">
        <CardContent className="p-0">
          {isLoading ? <div className="flex justify-center p-16"><Loader2 className="size-7 animate-spin text-gm-gold" /></div> : data?.entities.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Firma / unvanlar</TableHead><TableHead>Tür</TableHead><TableHead className="text-right">Kayıt</TableHead><TableHead className="text-right">USD değer</TableHead><TableHead className="text-right">Gözlemlenen pay</TableHead><TableHead className="text-right">Alıcı</TableHead><TableHead className="text-right">Son kayıt</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>{data.entities.map((entity) => <EntityRow key={entity.id} entity={entity} selected={selectedEntityId === entity.id} onSelect={() => setSelectedEntityId(entity.id)} onDelete={() => remove(entity.id)} />)}</TableBody>
            </Table>
          ) : (
            <div className="py-16 text-center text-gm-muted"><Database className="mx-auto mb-3 size-10 text-gm-gold/40" />Karşılaştırma için önce kendi firmanızı ve rakipleri tanımlayın.</div>
          )}
        </CardContent>
      </Card>

      {selectedEntityId && (
        <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50">
          <CardHeader><CardTitle className="font-serif text-2xl">Kaynak gümrük kayıtları {evidence ? `— ${evidence.entity.name}` : ''}</CardTitle></CardHeader>
          <CardContent className="p-0">
            {evidenceLoading ? <div className="flex justify-center p-12"><Loader2 className="size-6 animate-spin" /></div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>İhracatçı unvanı</TableHead><TableHead>Alıcı</TableHead><TableHead>Ülke</TableHead><TableHead>GTİP</TableHead><TableHead className="text-right">USD</TableHead><TableHead>Kaynak</TableHead></TableRow></TableHeader>
                <TableBody>{evidence?.rows.map((row) => (
                  <TableRow key={row.id}><TableCell>{date(row.shipment_date ?? row.month_year)}</TableCell><TableCell className="max-w-xs truncate" title={row.exporter_name ?? ''}>{row.exporter_name ?? '—'}</TableCell><TableCell>{row.buyer_name ?? '—'}</TableCell><TableCell>{row.buyer_country ?? '—'}</TableCell><TableCell className="font-mono">{row.hs_code ?? '—'}</TableCell><TableCell className="text-right font-mono">{usd.format(Number(row.total_value ?? 0))}</TableCell><TableCell className="text-xs text-gm-muted">{row.source_provider ?? 'Bilinmiyor'} · {row.source_file ?? '—'}:{row.source_row_number ?? '—'}</TableCell></TableRow>
                ))}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-gm-muted">“Gözlemlenen pay”, yalnızca seçili firmaların mevcut gümrük veri setindeki toplamına göre hesaplanır; resmî toplam pazar payı değildir.</p>
    </div>
  );
}
