'use client';

import * as React from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Mail,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  useDeleteBulkListMutation,
  useGenerateBulkDraftsMutation,
  useListBulkListsQuery,
  useListBulkRecipientsQuery,
  useListOutreachCampaignsQuery,
  useSendBulkListMutation,
  useUploadBulkListMutation,
  type OutreachRecipientList,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

const NO_CAMPAIGN = '__none__';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  ready:   { label: 'Hazır',       cls: 'border-gm-gold/30 bg-gm-gold/10 text-gm-gold' },
  sending: { label: 'Gönderiliyor', cls: 'border-gm-primary/30 bg-gm-primary/10 text-gm-primary-light' },
  sent:    { label: 'Gönderildi',  cls: 'border-gm-success/30 bg-gm-success/10 text-gm-success' },
};

const RECIPIENT_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Beklemede', cls: 'border-gm-border-soft bg-gm-surface/20 text-gm-muted' },
  drafted: { label: 'Taslak',    cls: 'border-gm-gold/30 bg-gm-gold/10 text-gm-gold' },
  sent:    { label: 'Gönderildi', cls: 'border-gm-success/30 bg-gm-success/10 text-gm-success' },
  bounced: { label: 'Hata',      cls: 'border-gm-error/30 bg-gm-error/5 text-gm-error' },
};

// ─── Yükleme Dialog ──────────────────────────────────────────────────────────

function UploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [file, setFile]             = React.useState<File | null>(null);
  const [name, setName]             = React.useState('');
  const [campaignId, setCampaignId] = React.useState<string>(NO_CAMPAIGN);

  const { data: campaigns = [] } = useListOutreachCampaignsQuery();
  const [uploadList, { isLoading }] = useUploadBulkListMutation();

  const reset = () => {
    setFile(null);
    setName('');
    setCampaignId(NO_CAMPAIGN);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!name) setName(f.name.replace(/\.(csv|xlsx|xlsm)$/i, ''));
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Lütfen bir dosya seçin.');
      return;
    }
    try {
      const result = await uploadList({
        file,
        name: name.trim() || file.name,
        campaignId: campaignId === NO_CAMPAIGN ? null : campaignId,
      }).unwrap();
      toast.success(
        `Liste oluşturuldu: ${result.inserted} alıcı eklendi` +
        (result.invalid ? `, ${result.invalid} geçersiz` : '') +
        (result.duplicates ? `, ${result.duplicates} tekrar` : '') + '.',
      );
      reset();
      onClose();
    } catch (e) {
      const msg = (e as { error?: string; data?: { error?: { message?: string } } });
      toast.error(msg?.data?.error?.message ?? msg?.error ?? 'Yükleme başarısız oldu.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni Alıcı Listesi Yükle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50">
            <Upload className="size-5" />
            <span>{file ? file.name : 'CSV veya XLSX dosyası seç'}</span>
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFile} />
          </label>

          <div className="space-y-1.5">
            <Label htmlFor="list-name">Liste Adı</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Almanya Fuar Kontakları"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="list-campaign">Kampanya (opsiyonel)</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger id="list-campaign">
                <SelectValue placeholder="Kampanya seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CAMPAIGN}>Kampanya yok</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={isLoading}>
            Vazgeç
          </Button>
          <Button onClick={handleUpload} disabled={isLoading || !file}>
            {isLoading ? 'Yükleniyor...' : 'Yükle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Liste Detayı (inline expand) ────────────────────────────────────────────

function ListDetail({ list }: { list: OutreachRecipientList }) {
  const { data: recipients = [], isLoading } = useListBulkRecipientsQuery({ id: list.id });

  const [subject, setSubject] = React.useState('');
  const [body, setBody]       = React.useState('');
  const [rate, setRate]       = React.useState('30');
  const [confirmSend, setConfirmSend] = React.useState(false);

  const [generateDrafts, genState] = useGenerateBulkDraftsMutation();
  const [sendList, sendState]      = useSendBulkListMutation();

  const draftedCount = recipients.filter((r) => r.status === 'drafted').length;
  const pct = list.total_count > 0 ? Math.round((list.sent_count / list.total_count) * 100) : 0;

  const handleGenerate = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Konu ve gövde şablonu gereklidir.');
      return;
    }
    try {
      const r = await generateDrafts({ id: list.id, subjectTemplate: subject, bodyTemplate: body }).unwrap();
      toast.success(`${r.generated} taslak üretildi${r.skipped ? `, ${r.skipped} atlandı` : ''}.`);
    } catch {
      toast.error('Taslak üretilemedi.');
    }
  };

  const handleSend = async () => {
    setConfirmSend(false);
    try {
      const r = await sendList({
        id: list.id,
        ratePerMinute: Number(rate) > 0 ? Number(rate) : undefined,
      }).unwrap();
      toast.success(`Gönderim tamamlandı: ${r.sent} gönderildi, ${r.bounced} hata.`);
    } catch {
      toast.error('Gönderim başarısız oldu.');
    }
  };

  return (
    <div className="space-y-5 border-t border-gm-border-soft bg-gm-surface/5 p-5">
      {/* İlerleme */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gm-muted">
          <span>Gönderim ilerlemesi</span>
          <span className="font-mono text-gm-text">{list.sent_count} / {list.total_count}</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* Alıcılar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
          <Users className="size-3.5" /> Alıcılar ({recipients.length})
        </div>
        {isLoading ? (
          <Skeleton className="h-32 w-full bg-gm-surface/20" />
        ) : recipients.length ? (
          <ScrollArea className="h-56 rounded-md border border-gm-border-soft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Ülke</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((r) => {
                  const sc = RECIPIENT_STATUS[r.status] ?? RECIPIENT_STATUS.pending;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.email}</TableCell>
                      <TableCell>{r.name ?? '—'}</TableCell>
                      <TableCell>{r.company ?? '—'}</TableCell>
                      <TableCell>{r.country ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', sc.cls)}>
                          {sc.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <p className="text-sm italic text-gm-muted">Bu listede alıcı yok.</p>
        )}
      </div>

      {/* Şablon Hazırla & Taslak Üret */}
      <div className="space-y-3 rounded-xl border border-gm-border-soft bg-gm-bg-deep/40 p-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">
          <Sparkles className="size-3.5" /> Şablon Hazırla &amp; Taslak Üret
        </div>
        <p className="text-xs text-gm-muted">
          Yer tutucular: <code className="rounded bg-gm-surface/30 px-1 py-0.5 font-mono text-gm-text">{'{{name}}'}</code>{' '}
          <code className="rounded bg-gm-surface/30 px-1 py-0.5 font-mono text-gm-text">{'{{company}}'}</code>{' '}
          <code className="rounded bg-gm-surface/30 px-1 py-0.5 font-mono text-gm-text">{'{{country}}'}</code>
        </p>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Konu şablonu — örn. Merhaba {{name}}"
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Gövde şablonu — {{company}} için özel teklif..."
          className="min-h-32"
        />
        <Button onClick={handleGenerate} disabled={genState.isLoading || !recipients.length} size="sm">
          <Sparkles className="mr-2 size-4" />
          {genState.isLoading ? 'Üretiliyor...' : 'Taslak Üret'}
        </Button>
      </div>

      {/* Gönder */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gm-border-soft bg-gm-bg-deep/40 p-4">
        <div className="space-y-1.5">
          <Label htmlFor={`rate-${list.id}`} className="text-xs">Dakikada gönderim</Label>
          <Input
            id={`rate-${list.id}`}
            type="number"
            min={1}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-32"
          />
        </div>
        <Button
          onClick={() => setConfirmSend(true)}
          disabled={sendState.isLoading || draftedCount === 0}
          className="bg-gm-success/20 text-gm-success hover:bg-gm-success hover:text-black"
          size="sm"
        >
          <Send className="mr-2 size-4" />
          {sendState.isLoading ? 'Gönderiliyor...' : `Gönder (${draftedCount} taslak)`}
        </Button>
      </div>

      <Dialog open={confirmSend} onOpenChange={setConfirmSend}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gönderimi onayla</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gm-muted">
            <strong className="text-gm-text">{draftedCount}</strong> alıcıya, dakikada{' '}
            <strong className="text-gm-text">{Number(rate) > 0 ? rate : 30}</strong> hızında e-posta gönderilecek. Devam edilsin mi?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSend(false)}>Vazgeç</Button>
            <Button onClick={handleSend} className="bg-gm-success text-black hover:bg-gm-success/80">
              <Mail className="mr-2 size-4" /> Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Liste Satırı ────────────────────────────────────────────────────────────

function ListRow({ list }: { list: OutreachRecipientList }) {
  const [open, setOpen] = React.useState(false);
  const [deleteList, { isLoading: deleting }] = useDeleteBulkListMutation();

  const status = STATUS_CONFIG[list.status] ?? { label: list.status, cls: 'border-gm-border-soft bg-gm-surface/20 text-gm-muted' };
  const pct = list.total_count > 0 ? Math.round((list.sent_count / list.total_count) * 100) : 0;

  const handleDelete = async () => {
    if (!window.confirm(`"${list.name}" listesi ve tüm alıcıları silinecek. Emin misiniz?`)) return;
    try {
      await deleteList(list.id).unwrap();
      toast.success('Liste silindi.');
    } catch {
      toast.error('Liste silinemedi.');
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-gm-border-soft bg-gm-bg-deep/60">
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center gap-4 p-5">
          <FileSpreadsheet className="size-8 shrink-0 text-gm-gold/60" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-serif text-lg text-gm-text">{list.name}</span>
              <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', status.cls)}>
                {status.label}
              </Badge>
              <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/20 text-[9px] font-bold uppercase tracking-widest text-gm-muted">
                {list.source}
              </Badge>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-gm-muted">
              <span>{list.total_count} alıcı</span>
              <span className="text-gm-border-soft">·</span>
              <span>{list.sent_count} gönderildi ({pct}%)</span>
              <span className="text-gm-border-soft">·</span>
              <span>{new Date(list.created_at).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}
              className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface">
              {open ? <ChevronUp className="mr-1.5 size-4" /> : <ChevronDown className="mr-1.5 size-4" />}
              Detay
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting}
              className="rounded-full border-gm-error/30 bg-gm-error/5 text-gm-error hover:bg-gm-error hover:text-black">
              <Trash2 className="mr-1.5 size-4" /> Sil
            </Button>
          </div>
        </div>
        {open && <ListDetail list={list} />}
      </CardContent>
    </Card>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

export default function BulkListPanel() {
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const { data, isLoading, isFetching, isError, refetch } = useListBulkListsQuery();

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Lead Machine</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Toplu Liste Gönderimi</h1>
          <p className="max-w-xl font-serif text-sm italic text-gm-muted">
            CSV / XLSX alıcı listesi yükle, şablondan taslak üret, rate-limit ile toplu gönder.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}
            className="h-12 rounded-full border-gm-border-soft bg-gm-surface/20 px-6 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface">
            <RefreshCw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
            Yenile
          </Button>
          <Button size="sm" onClick={() => setUploadOpen(true)}
            className="h-12 rounded-full bg-gm-gold px-8 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light">
            <Upload className="mr-2 size-4" />
            Yeni Liste Yükle
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-gm-border-soft bg-gm-bg-deep/60">
              <CardContent className="p-5">
                <Skeleton className="h-12 w-full bg-gm-surface/20" />
              </CardContent>
            </Card>
          ))
        ) : isError ? (
          <Card className="rounded-2xl border-gm-error/30 bg-gm-error/5">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="font-serif text-lg italic text-gm-error">Listeler yüklenemedi.</div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Tekrar dene</Button>
            </CardContent>
          </Card>
        ) : data && data.length ? (
          data.map((list) => <ListRow key={list.id} list={list} />)
        ) : (
          <Card className="rounded-2xl border-gm-border-soft bg-gm-bg-deep/50">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <Search className="size-12 text-gm-gold/40" />
              <div className="font-serif text-xl italic text-gm-muted">Henüz toplu liste yok.</div>
              <Button size="sm" onClick={() => setUploadOpen(true)}
                className="rounded-full bg-gm-gold px-6 text-black hover:bg-gm-gold-light">
                <Upload className="mr-2 size-4" /> İlk listeni yükle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
