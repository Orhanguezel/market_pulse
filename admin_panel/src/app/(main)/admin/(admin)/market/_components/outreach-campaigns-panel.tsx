'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Loader2, Mail, Plus, Save, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

import {
  useListOutreachCampaignsQuery,
  useCreateOutreachCampaignMutation,
  useUpdateOutreachCampaignMutation,
  useDeleteOutreachCampaignMutation,
  useGenerateOutreachDraftsMutation,
  type OutreachCampaign,
} from '@/integrations/endpoints/admin/market_admin.endpoints';

type FormState = Partial<OutreachCampaign> & { country_to_lang_json?: string };

const EMPTY: FormState = {
  slug: '',
  name: '',
  is_active: 1,
  brand_name: '',
  brand_short: '',
  sender_label: '',
  sender_email: '',
  product_en: '',
  default_lang: 'EN',
  country_to_lang_json: '{"DE":"DE","AT":"DE","PL":"EN","NL":"EN","FR":"EN","TR":"TR"}',
};

function toFormState(c: OutreachCampaign): FormState {
  return {
    ...c,
    country_to_lang_json: c.country_to_lang ? JSON.stringify(c.country_to_lang) : '{}',
  };
}

function toApiBody(form: FormState): Partial<OutreachCampaign> {
  const body: Partial<OutreachCampaign> = { ...form };
  delete (body as Record<string, unknown>).country_to_lang_json;
  delete body.id;
  delete body.created_at;
  delete body.updated_at;
  if (form.country_to_lang_json) {
    try {
      body.country_to_lang = JSON.parse(form.country_to_lang_json);
    } catch {
      // korusun, sunucu reddederse hata gelir
    }
  }
  return body;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-gm-muted">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-gm-muted/80">{hint}</p>}
    </div>
  );
}

export default function OutreachCampaignsPanel() {
  const { data: campaigns, isLoading, refetch } = useListOutreachCampaignsQuery();
  const [createCampaign, createState] = useCreateOutreachCampaignMutation();
  const [updateCampaign, updateState] = useUpdateOutreachCampaignMutation();
  const [deleteCampaign, deleteState] = useDeleteOutreachCampaignMutation();
  const [generateDrafts, generateState] = useGenerateOutreachDraftsMutation();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [creating, setCreating] = React.useState(false);

  const selected = campaigns?.find((c) => c.id === selectedId) ?? null;

  React.useEffect(() => {
    if (selected) {
      setForm(toFormState(selected));
      setCreating(false);
    }
  }, [selected]);

  function startNew() {
    setSelectedId(null);
    setCreating(true);
    setForm(EMPTY);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    try {
      const body = toApiBody(form);
      if (creating) {
        const created = await createCampaign(body).unwrap();
        toast.success('Kampanya oluşturuldu');
        setCreating(false);
        setSelectedId(created.id);
      } else if (selectedId) {
        await updateCampaign({ id: selectedId, body }).unwrap();
        toast.success('Kampanya güncellendi');
      }
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kayıt hatası';
      toast.error(msg);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (!confirm('Bu kampanyayı silmek istediğine emin misin?')) return;
    try {
      await deleteCampaign(selectedId).unwrap();
      toast.success('Kampanya silindi');
      setSelectedId(null);
      setForm(EMPTY);
      refetch();
    } catch {
      toast.error('Silinemedi');
    }
  }

  async function handleGenerateDrafts() {
    if (!selectedId) return;
    if (!confirm('APPROVE_FAVORITE + APPROVE_DIRECT adaylar için mail taslakları üretilsin mi?')) return;
    try {
      const result = await generateDrafts(selectedId).unwrap();
      toast.success(
        `${result.draft_count} taslak üretildi · ${result.skipped_existing} mevcut atlandı · ${result.approved_count} aday onaylandı`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Taslak üretilemedi');
    }
  }

  const busy =
    createState.isLoading
    || updateState.isLoading
    || deleteState.isLoading
    || generateState.isLoading;

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-gm-text">Outreach Kampanyaları</h1>
          <p className="mt-1 text-sm text-gm-muted">
            Her firmanın kendi gönderici/marka/fuar bilgisi. Mail taslakları buradan dinamik üretilir.
          </p>
        </div>
        <Button onClick={startNew} className="rounded-full bg-gm-primary text-black hover:bg-gm-primary-light">
          <Plus className="mr-2 size-4" />
          Yeni Kampanya
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sol: Liste */}
        <aside className="space-y-2">
          {isLoading && <div className="text-sm text-gm-muted">Yükleniyor...</div>}
          {campaigns?.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full rounded-2xl border p-3 text-left transition ${
                selectedId === c.id
                  ? 'border-gm-primary bg-gm-primary/10'
                  : 'border-gm-border-soft bg-gm-surface/20 hover:bg-gm-surface/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${c.is_active ? 'bg-gm-success' : 'bg-gm-muted'}`}
                  title={c.is_active ? 'Aktif' : 'Pasif'}
                />
                <span className="font-bold text-gm-text">{c.brand_short || c.brand_name}</span>
              </div>
              <p className="mt-1 text-xs text-gm-muted line-clamp-2">{c.name}</p>
              {c.fair_name && (
                <p className="mt-1 text-[10px] font-mono text-gm-muted/80">
                  {c.fair_name} {c.fair_edition} · {c.fair_hall} {c.fair_booth}
                </p>
              )}
            </button>
          ))}
        </aside>

        {/* Sağ: Form */}
        <main>
          {!creating && !selected && (
            <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/20 p-10 text-center">
              <p className="text-gm-muted">
                Sol taraftaki listeden bir kampanya seç veya yeni oluştur.
              </p>
            </div>
          )}

          {(creating || selected) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-6 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-6"
            >
              {/* Kampanya */}
              <section>
                <h2 className="mb-3 font-serif text-xl text-gm-text">Kampanya</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Slug" hint="Benzersiz tanımlayıcı (URL-safe). Örn: avrasya-automechanika-2026">
                    <Input value={form.slug ?? ''} onChange={(e) => setField('slug', e.target.value)} />
                  </Field>
                  <Field label="Ad" hint="İçerideki tanım. Örn: Avrasya - Automechanika 2026">
                    <Input value={form.name ?? ''} onChange={(e) => setField('name', e.target.value)} />
                  </Field>
                  <Field label="Aktif">
                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={!!form.is_active}
                        onCheckedChange={(v) => setField('is_active', v ? 1 : 0)}
                      />
                      <span className="text-sm text-gm-muted">{form.is_active ? 'Aktif' : 'Pasif'}</span>
                    </div>
                  </Field>
                  <Field label="ICP ID" hint="İlgili ICP profili (uuid). Boş bırakılabilir.">
                    <Input value={form.icp_id ?? ''} onChange={(e) => setField('icp_id', e.target.value)} />
                  </Field>
                </div>
              </section>

              {/* Marka */}
              <section>
                <h2 className="mb-3 font-serif text-xl text-gm-text">Marka</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Marka adı" hint="Mail içinde geçen marka. Örn: Avrasya / ProMats">
                    <Input value={form.brand_name ?? ''} onChange={(e) => setField('brand_name', e.target.value)} />
                  </Field>
                  <Field label="Marka kısa" hint="Liste/badge'lerde. Örn: ProMats">
                    <Input value={form.brand_short ?? ''} onChange={(e) => setField('brand_short', e.target.value)} />
                  </Field>
                  <Field label="Hukuki ad (opsiyonel)" hint="Resmi şirket adı">
                    <Input value={form.brand_legal ?? ''} onChange={(e) => setField('brand_legal', e.target.value)} />
                  </Field>
                </div>
              </section>

              {/* Gönderici */}
              <section>
                <h2 className="mb-3 font-serif text-xl text-gm-text">Gönderici</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="İmza etiketi" hint="Mail altında ilk satır. Örn: Avrasya / ProMats Export">
                    <Input value={form.sender_label ?? ''} onChange={(e) => setField('sender_label', e.target.value)} />
                  </Field>
                  <Field label="Gönderici ad" hint="Gerçek kişi adı (görüşme sonrası)">
                    <Input value={form.sender_name ?? ''} onChange={(e) => setField('sender_name', e.target.value)} />
                  </Field>
                  <Field label="Pozisyon" hint="Örn: Export Manager">
                    <Input value={form.sender_title ?? ''} onChange={(e) => setField('sender_title', e.target.value)} />
                  </Field>
                  <Field label="Gönderici e-posta (FROM)" hint="DKIM/SPF doğrulanmış domain">
                    <Input
                      type="email"
                      value={form.sender_email ?? ''}
                      onChange={(e) => setField('sender_email', e.target.value)}
                    />
                  </Field>
                  <Field label="Yanıt e-posta (REPLY-TO)" hint="Farklıysa boş bırakılabilir">
                    <Input
                      type="email"
                      value={form.reply_to_email ?? ''}
                      onChange={(e) => setField('reply_to_email', e.target.value)}
                    />
                  </Field>
                  <Field label="GSM" hint="Mail imzasında">
                    <Input value={form.sender_phone ?? ''} onChange={(e) => setField('sender_phone', e.target.value)} />
                  </Field>
                  <Field label="Ofis tel">
                    <Input value={form.sender_office ?? ''} onChange={(e) => setField('sender_office', e.target.value)} />
                  </Field>
                  <Field label="Web sitesi" hint="Örn: www.promats.com.tr">
                    <Input value={form.sender_website ?? ''} onChange={(e) => setField('sender_website', e.target.value)} />
                  </Field>
                  <Field label="Adres" hint="İmza altında">
                    <Textarea
                      rows={2}
                      value={form.sender_address ?? ''}
                      onChange={(e) => setField('sender_address', e.target.value)}
                    />
                  </Field>
                </div>
              </section>

              {/* Ürün */}
              <section>
                <h2 className="mb-3 font-serif text-xl text-gm-text">Ürün vaadi (3 dilde tek cümle)</h2>
                <div className="grid gap-3">
                  <Field label="EN (zorunlu)" hint="Örn: 'Turkish floor mat manufacturer exporting to 30+ markets'">
                    <Textarea
                      rows={2}
                      value={form.product_en ?? ''}
                      onChange={(e) => setField('product_en', e.target.value)}
                    />
                  </Field>
                  <Field label="DE">
                    <Textarea
                      rows={2}
                      value={form.product_de ?? ''}
                      onChange={(e) => setField('product_de', e.target.value)}
                    />
                  </Field>
                  <Field label="TR">
                    <Textarea
                      rows={2}
                      value={form.product_tr ?? ''}
                      onChange={(e) => setField('product_tr', e.target.value)}
                    />
                  </Field>
                </div>
              </section>

              {/* Fuar */}
              <section>
                <h2 className="mb-3 font-serif text-xl text-gm-text">Fuar (opsiyonel — bu kampanya fuara bağlıysa)</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Fuar adı" hint="Örn: Automechanika Frankfurt">
                    <Input value={form.fair_name ?? ''} onChange={(e) => setField('fair_name', e.target.value)} />
                  </Field>
                  <Field label="Edition" hint="Yıl. Örn: 2026">
                    <Input value={form.fair_edition ?? ''} onChange={(e) => setField('fair_edition', e.target.value)} />
                  </Field>
                  <Field label="Tarih (EN)">
                    <Input
                      value={form.fair_dates_en ?? ''}
                      onChange={(e) => setField('fair_dates_en', e.target.value)}
                      placeholder="September 8-12, 2026"
                    />
                  </Field>
                  <Field label="Tarih (DE)">
                    <Input
                      value={form.fair_dates_de ?? ''}
                      onChange={(e) => setField('fair_dates_de', e.target.value)}
                      placeholder="8.-12. September 2026"
                    />
                  </Field>
                  <Field label="Tarih (TR)">
                    <Input
                      value={form.fair_dates_tr ?? ''}
                      onChange={(e) => setField('fair_dates_tr', e.target.value)}
                      placeholder="8-12 Eylül 2026"
                    />
                  </Field>
                  <Field label="Hall">
                    <Input value={form.fair_hall ?? ''} onChange={(e) => setField('fair_hall', e.target.value)} />
                  </Field>
                  <Field label="Booth">
                    <Input value={form.fair_booth ?? ''} onChange={(e) => setField('fair_booth', e.target.value)} />
                  </Field>
                  <Field label="Fuar URL">
                    <Input value={form.fair_url ?? ''} onChange={(e) => setField('fair_url', e.target.value)} />
                  </Field>
                </div>
              </section>

              {/* Calendly */}
              <section>
                <h2 className="mb-3 font-serif text-xl text-gm-text">Randevu</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Calendly link" hint="Avrasya hesabı açıldığında doldur">
                    <Input
                      value={form.calendly_link ?? ''}
                      onChange={(e) => setField('calendly_link', e.target.value)}
                      placeholder="https://calendly.com/..."
                    />
                  </Field>
                  <Field label="Calendly placeholder (link boşken gösterilecek metin)">
                    <Input
                      value={form.calendly_placeholder ?? ''}
                      onChange={(e) => setField('calendly_placeholder', e.target.value)}
                    />
                  </Field>
                </div>
              </section>

              {/* Dil */}
              <section>
                <h2 className="mb-3 font-serif text-xl text-gm-text">Dil ayarları</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Varsayılan dil" hint="EN | DE | TR">
                    <Input
                      value={form.default_lang ?? 'EN'}
                      onChange={(e) => setField('default_lang', e.target.value)}
                    />
                  </Field>
                  <Field label="Ülke → Dil eşleşmesi (JSON)" hint='Örn: {"DE":"DE","PL":"EN","NL":"EN"}'>
                    <Textarea
                      rows={3}
                      className="font-mono text-xs"
                      value={form.country_to_lang_json ?? ''}
                      onChange={(e) => setField('country_to_lang_json', e.target.value)}
                    />
                  </Field>
                </div>
              </section>

              <div className="flex items-center justify-between gap-3 border-t border-gm-border-soft pt-4">
                <div className="text-xs text-gm-muted">
                  {selected && (
                    <span>Son güncelleme: {new Date(selected.updated_at).toLocaleString('tr-TR')}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected && !creating && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateDrafts}
                      disabled={busy}
                      className="rounded-full border-gm-primary/40 text-gm-primary hover:bg-gm-primary hover:text-black"
                    >
                      {generateState.isLoading ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 size-4" />
                      )}
                      Mail Taslaklarını Üret
                    </Button>
                  )}
                  {selected && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDelete}
                      disabled={busy}
                      className="rounded-full border-gm-error/40 text-gm-error hover:bg-gm-error hover:text-black"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Sil
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={busy}
                    className="rounded-full bg-gm-success text-black hover:bg-gm-success-light"
                  >
                    {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                    {creating ? 'Oluştur' : 'Güncelle'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
