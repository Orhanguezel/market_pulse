'use client';

import { useMemo, useState } from 'react';

import { AlertTriangle, CheckCircle2, Code2, ExternalLink, ImageIcon, MessageSquarePlus, Paperclip, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateMarketDeveloperNoteMutation,
  useDeleteMarketDeveloperNoteMutation,
  useListMarketDeveloperNotesQuery,
  useUpdateMarketDeveloperNoteMutation,
} from '@/integrations/hooks';
import {
  type MarketDeveloperNotePriority,
} from '@/integrations/endpoints/admin/market_admin.endpoints';

const priorityLabels: Record<MarketDeveloperNotePriority, string> = {
  low: 'Düşük',
  normal: 'Normal',
  high: 'Yüksek',
  critical: 'Kritik',
};

const architectureNotes = [
  {
    title: 'Backend sınırı',
    text: 'Market modülü hedef, lead, sinyal ve raporu; Lead Machine modülü aday, ICP, enrichment ve outreach akışını taşır.',
  },
  {
    title: 'Admin sınırı',
    text: 'Market admin route grubu sadece /admin/market altındaki yüzeyleri içerir. API sözleşmesi market_admin.endpoints.ts dosyasında toplanır.',
  },
  {
    title: 'Çalışmama kontrolü',
    text: 'Önce env ve dış servis anahtarları, sonra API response sözleşmesi, en son UI state yönetimi kontrol edilmelidir.',
  },
  {
    title: 'Paspas ile paralellik',
    text: 'Bu ekran Paspas page feedback yapısına hazırlanmış hafif kayıt yüzeyidir; kalıcı backend tablo bağlantısı sonraki adımdır.',
  },
];

function priorityClass(priority: MarketDeveloperNotePriority) {
  if (priority === 'critical') return 'bg-gm-error text-white hover:bg-gm-error';
  if (priority === 'high') return 'bg-gm-warning text-black hover:bg-gm-warning';
  return 'border-gm-border-soft bg-gm-surface/20 text-gm-muted';
}

function isImageAttachment(url: string) {
  return /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(url);
}

export function MarketDeveloperNotesClient() {
  const { data: notes = [], isFetching } = useListMarketDeveloperNotesQuery({ limit: 50 });
  const [createNoteMutation, createState] = useCreateMarketDeveloperNoteMutation();
  const [updateNote] = useUpdateMarketDeveloperNoteMutation();
  const [deleteNoteMutation] = useDeleteMarketDeveloperNoteMutation();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [priority, setPriority] = useState<MarketDeveloperNotePriority>('normal');

  const openRiskCount = useMemo(
    () => notes.filter((note) => note.priority === 'high' || note.priority === 'critical').length,
    [notes],
  );

  const createNote = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Konu ve not zorunlu.');
      return;
    }

    createNoteMutation({
      subject: subject.trim(),
      body: body.trim(),
      priority,
      attachment_url: attachmentUrl.trim() || undefined,
      page_path: '/admin/market/developer-notes',
    }).unwrap()
      .then(() => {
        setSubject('');
        setBody('');
        setAttachmentUrl('');
        setPriority('normal');
        toast.success('Yazılımcı notu kaydedildi.');
      })
      .catch(() => toast.error('Yazılımcı notu kaydedilemedi.'));
  };

  const removeNote = (id: string) => {
    deleteNoteMutation(id).unwrap()
      .then(() => toast.success('Not silindi.'))
      .catch(() => toast.error('Not silinemedi.'));
  };

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-700">
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-gm-gold" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">MarketPulse</span>
        </div>
        <div className="max-w-4xl space-y-4">
          <h1 className="font-serif text-4xl text-gm-text md:text-5xl">Yazılımcı Notları</h1>
          <p className="font-serif text-base italic leading-7 text-gm-muted md:text-lg">
            Paspas admin panelindeki sayfa notu yaklaşımının Market Pulse’a uyarlanmış başlangıç yüzeyidir. Bu sürüm notları tarayıcıda saklar;
            notlar backend üzerinde kalıcı olarak saklanır ve ekip tarafından durumlandırılabilir.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-gm-muted">Toplam Not</p>
            <p className="mt-2 font-serif text-2xl text-gm-text">{notes.length}</p>
          </CardContent>
        </Card>
        <Card className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-gm-muted">Yüksek Risk</p>
            <p className="mt-2 font-serif text-2xl text-gm-gold">{openRiskCount}</p>
          </CardContent>
        </Card>
        <Card className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-gm-muted">Kayıt Modeli</p>
            <p className="mt-2 font-serif text-2xl text-gm-text">Backend</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <Card className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <MessageSquarePlus className="size-5 text-gm-gold" />
                <h2 className="font-serif text-2xl text-gm-text">Yeni Not</h2>
              </div>
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Konu" />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-gm-muted">
                  <Paperclip className="size-3.5" />
                  Dosya / görsel eki
                </div>
                <Input value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} placeholder="https://... ekran-goruntusu.png veya dokuman.pdf" />
              </div>
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Sorun, karar, risk veya yapılacak teknik aksiyon"
                className="min-h-32"
              />
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as MarketDeveloperNotePriority)}
                className="h-10 w-full rounded-md border border-gm-border-soft bg-gm-bg-deep px-3 text-sm text-gm-text"
              >
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
                <option value="critical">Kritik</option>
              </select>
              <Button type="button" onClick={createNote} disabled={createState.isLoading} className="w-full gap-2">
                <Send className="size-4" />
                Notu kaydet
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <Code2 className="size-5 text-gm-gold" />
                <h2 className="font-serif text-2xl text-gm-text">Mimari Notlar</h2>
              </div>
              {architectureNotes.map((item) => (
                <div key={item.title} className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4">
                  <h3 className="font-serif text-lg text-gm-text">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gm-muted">{item.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-gm-gold" />
            <h2 className="font-serif text-2xl text-gm-text">Not Geçmişi</h2>
            <span className="text-xs text-gm-muted">{isFetching ? 'Güncelleniyor' : `${notes.length} kayıt`}</span>
          </div>
          {notes.length ? (
            notes.map((note) => (
              <Card key={note.id} className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
                <CardContent className="space-y-4 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-xl text-gm-text">{note.subject}</h3>
                      <p className="mt-1 text-xs text-gm-muted">{new Date(note.createdAt).toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`rounded-full ${priorityClass(note.priority)}`}>{priorityLabels[note.priority]}</Badge>
                      {note.status !== 'resolved' ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateNote({ id: note.id, body: { status: 'resolved' } })}
                        >
                          Çözüldü
                        </Button>
                      ) : null}
                      <Button type="button" variant="outline" size="icon" onClick={() => removeNote(note.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-gm-muted">{note.body}</p>
                  {note.attachmentUrl ? (
                    isImageAttachment(note.attachmentUrl) ? (
                      <div className="mt-4 overflow-hidden rounded-lg border border-gm-border-soft">
                        <div className="flex items-center gap-2 border-b border-gm-border-soft bg-gm-surface/10 px-3 py-2 text-xs text-gm-muted">
                          <ImageIcon className="size-4" />
                          Görsel eki
                        </div>
                        <img src={note.attachmentUrl} alt="Yazılımcı notu görsel eki" className="max-h-80 w-full object-contain" />
                      </div>
                    ) : (
                      <a
                        href={note.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-gm-border-soft bg-gm-surface/10 px-3 py-2 text-xs font-medium text-gm-gold hover:text-gm-text"
                      >
                        <Paperclip className="size-4" />
                        Dosya ekini aç
                        <ExternalLink className="size-3.5" />
                      </a>
                    )
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
              <CardContent className="flex gap-3 p-6 text-sm leading-6 text-gm-muted">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gm-gold" />
                <p>Henüz yazılımcı notu yok. Çalışmayan akış, karar veya risk yakaladığında buradan kayıt oluştur.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
