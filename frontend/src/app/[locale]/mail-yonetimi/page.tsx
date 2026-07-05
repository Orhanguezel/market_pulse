'use client';

import * as React from 'react';
import { Edit3, Inbox, Loader2, Mail, Plug, Plus, RefreshCw, Save, Send, Settings, Sparkles, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ConfirmDeleteDialog } from '@/components/iy/ConfirmDeleteDialog';
import { CrmEntityDialog } from '@/components/iy/CrmEntityDialog';
import { useGetCrmMailSummaryQuery } from '@/integrations/rtk/public/crm.endpoints';
import {
  useCreateOutreachCampaignMutation,
  useDeleteOutreachCampaignMutation,
  useDeleteBulkOutreachListMutation,
  useGenerateCampaignDraftsMutation,
  useGenerateBulkOutreachDraftsMutation,
  useListOutreachDraftsQuery,
  useListBulkOutreachListsQuery,
  useListBulkOutreachRecipientsQuery,
  useListOutreachCampaignsQuery,
  useSendOutreachDraftMutation,
  useSendBulkOutreachListMutation,
  useSyncCampaignHostKeywordsMutation,
  useUploadBulkOutreachListMutation,
  useUpdateOutreachDraftMutation,
  useUpdateOutreachCampaignMutation,
} from '@/integrations/rtk/public/outreach.endpoints';
import {
  useCreateImapSmtpAccountMutation,
  useDeleteMailAccountMutation,
  useLazyGmailConnectUrlQuery,
  useListMailAccountsQuery,
  useListMailInboxQuery,
  useGetMailMessageQuery,
  useSendUserMailMutation,
} from '@/integrations/rtk/public/mail-accounts.endpoints';
import type { OutreachCampaign, OutreachDraft } from '@/integrations/shared/outreach.types';
import type { MailInboxMessage } from '@/integrations/shared/mail-account.types';

type FormState = Partial<OutreachCampaign> & { country_to_lang_json: string };

const EMPTY: FormState = {
  slug: '',
  name: '',
  is_active: 1,
  brand_name: '',
  brand_short: '',
  brand_legal: '',
  sender_label: '',
  sender_name: '',
  sender_title: '',
  sender_email: '',
  reply_to_email: '',
  sender_phone: '',
  sender_website: '',
  product_en: '',
  product_de: '',
  product_tr: '',
  fair_name: '',
  fair_edition: '',
  fair_dates_en: '',
  fair_hall: '',
  fair_booth: '',
  fair_url: '',
  calendly_link: '',
  calendly_placeholder: '',
  default_lang: 'EN',
  country_to_lang_json: '{"DE":"DE","AT":"DE","TR":"TR","FR":"EN","NL":"EN","PL":"EN"}',
};

function toForm(campaign: OutreachCampaign): FormState {
  return {
    ...campaign,
    country_to_lang_json: campaign.country_to_lang ? JSON.stringify(campaign.country_to_lang) : EMPTY.country_to_lang_json,
  };
}

function toBody(form: FormState): Partial<OutreachCampaign> {
  const { country_to_lang_json, id, created_at, updated_at, ...rest } = form;
  const body: Partial<OutreachCampaign> = { ...rest };
  try {
    body.country_to_lang = country_to_lang_json ? JSON.parse(country_to_lang_json) : null;
  } catch {
    throw new Error('Dil eşlemesi geçerli JSON değil.');
  }
  return body;
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[ğ]/g, 'g').replace(/[ü]/g, 'u').replace(/[ş]/g, 's')
    .replace(/[ı]/g, 'i').replace(/[ö]/g, 'o').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
      <p className="text-[12px] font-semibold uppercase text-[#64748b]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#0f172a]">{value ?? 0}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] font-semibold uppercase text-[#64748b]">{label}</span>
      {children}
    </label>
  );
}

const draftSchema = z.object({
  subject: z.string().min(2, 'Konu gerekli'),
  body: z.string().min(2, 'Gövde gerekli'),
  reply_status: z.string().optional(),
});

function DraftsPanel() {
  const { data: drafts = [], isLoading, isError, refetch } = useListOutreachDraftsQuery();
  const [updateDraft, updateState] = useUpdateOutreachDraftMutation();
  const [sendDraft, sendState] = useSendOutreachDraftMutation();
  const [editing, setEditing] = React.useState<OutreachDraft | null>(null);

  const send = async (draft: OutreachDraft) => {
    try {
      await sendDraft({ id: draft.id }).unwrap();
      toast.success('Taslak gönderildi');
      await refetch();
    } catch {
      toast.error('Taslak gönderilemedi');
    }
  };

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
        <h2 className="text-[15px] font-bold text-[#0f172a]">Taslaklar</h2>
        <button onClick={() => refetch()} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155]">
          <RefreshCw className="h-4 w-4" /> Yenile
        </button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-[#1e40af]" /></div>
      ) : isError ? (
        <p className="px-4 py-12 text-center text-[13px] text-[#64748b]">Taslaklar alınamadı.</p>
      ) : drafts.length === 0 ? (
        <p className="px-4 py-12 text-center text-[13px] text-[#64748b]">Henüz taslak yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[12px] uppercase text-[#64748b]">
                <th className="px-4 py-3">Konu</th>
                <th className="w-28 px-4 py-3">Durum</th>
                <th className="w-28 px-4 py-3">Açılma</th>
                <th className="w-28 px-4 py-3">Yanıt</th>
                <th className="w-32 px-4 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft) => (
                <tr key={draft.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#eff6ff]/50">
                  <td className="truncate px-4 py-3 font-medium text-[#0f172a]">{draft.subject}</td>
                  <td className="px-4 py-3 text-[#64748b]">{draft.status ?? '-'}</td>
                  <td className="px-4 py-3 text-[#64748b]">{draft.opened_at ? 'Açıldı' : '-'}</td>
                  <td className="px-4 py-3 text-[#64748b]">{draft.reply_status ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(draft)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button disabled={sendState.isLoading} onClick={() => send(draft)} className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#1e40af] text-white disabled:opacity-50">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CrmEntityDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Taslak Düzenle"
        defaultValues={{
          subject: editing?.subject ?? '',
          body: editing?.body ?? '',
          reply_status: editing?.reply_status ?? '',
        }}
        schema={draftSchema}
        fields={[
          { name: 'subject', label: 'Konu', required: true },
          { name: 'body', label: 'Gövde', type: 'textarea', required: true },
          { name: 'reply_status', label: 'Yanıt durumu' },
        ]}
        isSubmitting={updateState.isLoading}
        onSubmit={async (values) => {
          if (!editing) return;
          await updateDraft({ id: editing.id, patch: values }).unwrap();
          await refetch();
          setEditing(null);
        }}
      />
    </div>
  );
}

function BulkListsPanel({ campaigns }: { campaigns: OutreachCampaign[] }) {
  const { data: lists = [], isLoading, isError, refetch } = useListBulkOutreachListsQuery();
  const [uploadList, uploadState] = useUploadBulkOutreachListMutation();
  const [generateDrafts, generateState] = useGenerateBulkOutreachDraftsMutation();
  const [sendList, sendState] = useSendBulkOutreachListMutation();
  const [deleteList, deleteState] = useDeleteBulkOutreachListMutation();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [campaignId, setCampaignId] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [subjectTemplate, setSubjectTemplate] = React.useState('Merhaba {{name}}');
  const [bodyTemplate, setBodyTemplate] = React.useState('Merhaba {{name}},\n\n{{company}} için kısa bir tanışma yapmak isterim.');
  const [ratePerMinute, setRatePerMinute] = React.useState(30);
  const [sendConfirmOpen, setSendConfirmOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const selected = lists.find((list) => list.id === selectedId) ?? null;
  const { data: recipients = [] } = useListBulkOutreachRecipientsQuery({ id: selectedId ?? '', status: undefined }, { skip: !selectedId });
  const busy = uploadState.isLoading || generateState.isLoading || sendState.isLoading || deleteState.isLoading;

  const upload = async () => {
    if (!file) {
      toast.error('Dosya seçin.');
      return;
    }
    await uploadList({ file, name: name || file.name, campaignId: campaignId || null }).unwrap();
    toast.success('Liste yüklendi');
    setFile(null);
    setName('');
    await refetch();
  };

  const generate = async () => {
    if (!selectedId) return;
    await generateDrafts({ id: selectedId, subjectTemplate, bodyTemplate }).unwrap();
    toast.success('Toplu liste taslakları üretildi');
    await refetch();
  };

  const send = async () => {
    if (!selectedId) return;
    await sendList({ id: selectedId, ratePerMinute }).unwrap();
    toast.success('Toplu gönderim başlatıldı');
    await refetch();
  };

  const remove = async () => {
    if (!selectedId) return;
    await deleteList(selectedId).unwrap();
    setSelectedId(null);
    await refetch();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border border-[#e2e8f0] bg-white">
        <div className="border-b border-[#e2e8f0] px-4 py-3 text-[13px] font-semibold text-[#475569]">Alıcı Listeleri</div>
        <div className="space-y-3 border-b border-[#e2e8f0] p-3">
          <input className="h-9 w-full rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Liste adı" />
          <select className="h-9 w-full rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            <option value="">Kampanya yok</option>
            {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-[13px] text-[#475569]" />
          <button disabled={busy} onClick={upload} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
            {uploadState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Yükle
          </button>
        </div>
        <div className="max-h-[520px] overflow-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#1e40af]" /></div>
          ) : isError ? (
            <p className="px-3 py-8 text-center text-[13px] text-[#64748b]">Listeler alınamadı.</p>
          ) : lists.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-[#64748b]">Henüz liste yok.</p>
          ) : lists.map((list) => (
            <button key={list.id} onClick={() => setSelectedId(list.id)} className={`mb-2 w-full rounded-md border p-3 text-left ${selectedId === list.id ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#e2e8f0] hover:bg-[#f8fafc]'}`}>
              <p className="truncate text-[13px] font-bold text-[#0f172a]">{list.name}</p>
              <p className="mt-1 text-[12px] text-[#64748b]">{list.sent_count}/{list.total_count} gönderildi · {list.status}</p>
            </button>
          ))}
        </div>
      </aside>

      <main className="rounded-lg border border-[#e2e8f0] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e2e8f0] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-[#0f172a]">{selected?.name ?? 'Liste seçin'}</h2>
            <p className="mt-0.5 text-[12px] text-[#64748b]">{selected ? `${selected.total_count} alıcı` : 'CSV/XLSX dosyası yükleyin veya listeden seçim yapın.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={!selectedId || busy} onClick={generate} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155] disabled:opacity-50">
              <Sparkles className="h-4 w-4" /> Taslak Üret
            </button>
            <button disabled={!selectedId || busy} onClick={() => setSendConfirmOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
              <Send className="h-4 w-4" /> Gönder
            </button>
            <button disabled={!selectedId || busy} onClick={() => setDeleteConfirmOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 px-3 text-[13px] font-semibold text-rose-700 disabled:opacity-50">
              <Trash2 className="h-4 w-4" /> Sil
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-[#e2e8f0] p-4 lg:grid-cols-[1fr_1fr_140px]">
          <Field label="Konu şablonu"><input className="h-9 rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={subjectTemplate} onChange={(e) => setSubjectTemplate(e.target.value)} /></Field>
          <Field label="Gövde şablonu"><textarea className="min-h-20 rounded-md border border-[#cbd5e1] px-3 py-2 text-[13px]" value={bodyTemplate} onChange={(e) => setBodyTemplate(e.target.value)} /></Field>
          <Field label="Dakika limiti"><input type="number" className="h-9 rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={ratePerMinute} onChange={(e) => setRatePerMinute(Number(e.target.value))} /></Field>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] table-fixed text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[12px] uppercase text-[#64748b]">
                <th className="px-4 py-3">Alıcı</th>
                <th className="px-4 py-3">Firma</th>
                <th className="w-28 px-4 py-3">Durum</th>
                <th className="w-44 px-4 py-3">E-posta</th>
              </tr>
            </thead>
            <tbody>
              {recipients.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-[#64748b]">Alıcı yok.</td></tr>
              ) : recipients.map((recipient) => (
                <tr key={recipient.id} className="border-b border-[#f1f5f9] last:border-0">
                  <td className="truncate px-4 py-3 text-[#0f172a]">{recipient.name ?? '-'}</td>
                  <td className="truncate px-4 py-3 text-[#64748b]">{recipient.company ?? '-'}</td>
                  <td className="px-4 py-3 text-[#64748b]">{recipient.status ?? '-'}</td>
                  <td className="truncate px-4 py-3 text-[#64748b]">{recipient.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <ConfirmDeleteDialog open={sendConfirmOpen} onOpenChange={setSendConfirmOpen} isDeleting={sendState.isLoading} title="Toplu gönderimi başlat" description={`${ratePerMinute}/dk limitiyle gönderim başlayacak.`} onConfirm={send} />
      <ConfirmDeleteDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} isDeleting={deleteState.isLoading} title="Listeyi sil" description="Bu alıcı listesi silinecek." onConfirm={remove} />
    </div>
  );
}

function AccountsPanel() {
  const { data: accounts = [], isLoading, refetch } = useListMailAccountsQuery();
  const [getConnectUrl, connectState] = useLazyGmailConnectUrlQuery();
  const [deleteAccount, deleteState] = useDeleteMailAccountMutation();
  const [createImap, imapState] = useCreateImapSmtpAccountMutation();
  const [form, setForm] = React.useState({
    email: '',
    displayName: '',
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUsername: '',
    password: '',
    imapHost: '',
    imapPort: 993,
  });

  const connectGmail = async () => {
    try {
      const { url } = await getConnectUrl().unwrap();
      window.location.href = url;
    } catch {
      toast.error('Gmail bağlantısı başlatılamadı.');
    }
  };

  const saveImap = async () => {
    try {
      await createImap({
        email: form.email,
        displayName: form.displayName || null,
        smtpHost: form.smtpHost,
        smtpPort: Number(form.smtpPort),
        smtpSecure: form.smtpSecure,
        smtpUsername: form.smtpUsername || null,
        password: form.password,
        imapHost: form.imapHost || null,
        imapPort: form.imapHost ? Number(form.imapPort) : null,
      }).unwrap();
      toast.success('Mail hesabı kaydedildi');
      setForm({ email: '', displayName: '', smtpHost: '', smtpPort: 587, smtpSecure: false, smtpUsername: '', password: '', imapHost: '', imapPort: 993 });
      await refetch();
    } catch {
      toast.error('Mail hesabı kaydedilemedi.');
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-[#e2e8f0] bg-white">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-[#1e40af]" />
            <h2 className="text-[15px] font-bold text-[#0f172a]">Bağlı Hesaplar</h2>
          </div>
          <button disabled={connectState.isFetching} onClick={connectGmail} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
            {connectState.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Gmail Bağla
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-[#1e40af]" /></div>
        ) : accounts.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-[#64748b]">Bağlı mail hesabı yok.</p>
        ) : (
          <div className="divide-y divide-[#e2e8f0]">
            {accounts.map((account) => (
              <div key={account.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-[#0f172a]">{account.display_name || account.email}</p>
                  <p className="mt-1 text-[13px] text-[#64748b]">{account.email} · {account.provider === 'gmail_oauth' ? 'Gmail OAuth' : 'IMAP/SMTP'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-[12px] font-semibold ${account.status === 'connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{STATUS_LABELS[account.status] ?? account.status}</span>
                  <button disabled={deleteState.isLoading} onClick={() => deleteAccount(account.id).unwrap().then(() => refetch())} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="rounded-lg border border-[#e2e8f0] bg-white">
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-4 py-3">
          <Settings className="h-5 w-5 text-[#1e40af]" />
          <h2 className="text-[15px] font-bold text-[#0f172a]">Manuel SMTP</h2>
        </div>
        <div className="grid gap-3 p-4">
          <Field label="E-posta"><input className="h-9 rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Ad"><input className="h-9 rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></Field>
          <Field label="SMTP host"><input className="h-9 rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={form.smtpHost} onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SMTP port"><input type="number" className="h-9 rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={form.smtpPort} onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) })} /></Field>
            <label className="mt-6 flex h-9 items-center gap-2 text-[13px] text-[#334155]">
              <input type="checkbox" checked={form.smtpSecure} onChange={(e) => setForm({ ...form, smtpSecure: e.target.checked })} /> SSL
            </label>
          </div>
          <Field label="SMTP kullanıcı"><input className="h-9 rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={form.smtpUsername} onChange={(e) => setForm({ ...form, smtpUsername: e.target.value })} /></Field>
          <Field label="Şifre / app password"><input type="password" className="h-9 rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="IMAP host"><input className="h-9 rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={form.imapHost} onChange={(e) => setForm({ ...form, imapHost: e.target.value })} /></Field>
          <button disabled={imapState.isLoading} onClick={saveImap} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
            {imapState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet
          </button>
        </div>
      </aside>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  connected: 'Bağlı',
  expired: 'Süresi doldu',
  error: 'Hata',
  disconnected: 'Bağlantı kesildi',
};

function InboxPanel() {
  const [folder, setFolder] = React.useState('inbox');
  const [selected, setSelected] = React.useState<MailInboxMessage | null>(null);
  const [compose, setCompose] = React.useState({ to: '', subject: '', html: '' });
  const { data, isLoading, isError, refetch } = useListMailInboxQuery({ folder, limit: 20 });
  const { data: message } = useGetMailMessageQuery(selected?.id ?? '', { skip: !selected });
  const [sendMail, sendState] = useSendUserMailMutation();
  const messages = data?.messages ?? [];

  const send = async () => {
    try {
      await sendMail({ to: compose.to, subject: compose.subject, html: compose.html }).unwrap();
      toast.success('Mail gönderildi');
      setCompose({ to: '', subject: '', html: '' });
      await refetch();
    } catch {
      toast.error('Mail gönderilemedi.');
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[300px_1fr_340px]">
      <aside className="rounded-lg border border-[#e2e8f0] bg-white">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
          <h2 className="text-[15px] font-bold text-[#0f172a]">Gelen Kutusu</h2>
          <button onClick={() => refetch()} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155]"><RefreshCw className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2 border-b border-[#e2e8f0] p-3">
          {([['inbox', 'Gelen'], ['sent', 'Gönderilen'], ['drafts', 'Taslaklar'], ['trash', 'Çöp']] as const).map(([item, label]) => (
            <button key={item} onClick={() => { setFolder(item); setSelected(null); }} className={`h-8 rounded-md text-[13px] font-semibold ${folder === item ? 'bg-[#1e40af] text-white' : 'border border-[#cbd5e1] text-[#475569]'}`}>{label}</button>
          ))}
        </div>
        <div className="max-h-[640px] overflow-auto">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#1e40af]" /></div>
          ) : isError ? (
            <p className="px-3 py-8 text-center text-[13px] text-[#64748b]">Inbox alınamadı.</p>
          ) : messages.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-[#64748b]">{data?.account ? 'Mesaj yok.' : 'Önce Gmail hesabı bağlayın.'}</p>
          ) : messages.map((item) => (
            <button key={item.id} onClick={() => setSelected(item)} className={`w-full border-b border-[#f1f5f9] p-3 text-left hover:bg-[#f8fafc] ${selected?.id === item.id ? 'bg-[#eff6ff]' : ''}`}>
              <p className="truncate text-[13px] font-bold text-[#0f172a]">{item.subject}</p>
              <p className="mt-1 truncate text-[12px] text-[#64748b]">{item.from || item.to || '-'}</p>
              <p className="mt-1 line-clamp-2 text-[12px] text-[#94a3b8]">{item.snippet}</p>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex min-h-[560px] flex-col rounded-lg border border-[#e2e8f0] bg-white">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff]">
              <Inbox className="h-6 w-6 text-[#1e40af]" />
            </div>
            <p className="text-[14px] font-semibold text-[#334155]">Okumak için bir mesaj seçin</p>
            <p className="text-[13px] text-[#94a3b8]">Soldaki listeden bir e-postaya tıklayın.</p>
          </div>
        ) : (
          <>
            <div className="border-b border-[#e2e8f0] px-4 py-3">
              <h2 className="truncate text-[15px] font-bold text-[#0f172a]">{message?.subject || selected.subject || '(konu yok)'}</h2>
              <p className="mt-1 truncate text-[12px] text-[#64748b]">{message?.from || selected.from || ''}</p>
            </div>
            <div className="flex-1 p-4 text-[#0f172a]">
              {message?.html ? (
                <iframe title="mail-message" sandbox="" srcDoc={message.html} className="h-[560px] w-full rounded-md border border-[#e2e8f0] bg-white" />
              ) : message?.text || selected.snippet ? (
                <pre className="whitespace-pre-wrap font-sans text-[13px]">{message?.text || selected.snippet}</pre>
              ) : (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#1e40af]" /></div>
              )}
            </div>
          </>
        )}
      </main>

      <aside className="rounded-lg border border-[#e2e8f0] bg-white">
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-4 py-3">
          <Send className="h-5 w-5 text-[#1e40af]" />
          <h2 className="text-[15px] font-bold text-[#0f172a]">Yeni Mail</h2>
        </div>
        <div className="grid gap-3 p-4">
          <Field label="Alıcı"><input className="h-9 rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} /></Field>
          <Field label="Konu"><input className="h-9 rounded-md border border-[#cbd5e1] px-3 text-[13px]" value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} /></Field>
          <Field label="Mesaj"><textarea className="min-h-48 rounded-md border border-[#cbd5e1] px-3 py-2 text-[13px]" value={compose.html} onChange={(e) => setCompose({ ...compose, html: e.target.value })} /></Field>
          <button disabled={sendState.isLoading} onClick={send} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
            {sendState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gönder
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function MailYonetimiPage() {
  const { data: summary } = useGetCrmMailSummaryQuery();
  const { data: campaigns = [], isLoading, isError, refetch } = useListOutreachCampaignsQuery();
  const [createCampaign, createState] = useCreateOutreachCampaignMutation();
  const [updateCampaign, updateState] = useUpdateOutreachCampaignMutation();
  const [deleteCampaign, deleteState] = useDeleteOutreachCampaignMutation();
  const [generateDrafts, generateState] = useGenerateCampaignDraftsMutation();
  const [syncHost, syncState] = useSyncCampaignHostKeywordsMutation();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'campaigns' | 'drafts' | 'bulk' | 'accounts' | 'inbox'>('campaigns');

  const selected = campaigns.find((campaign) => campaign.id === selectedId) ?? null;
  const busy = createState.isLoading || updateState.isLoading || deleteState.isLoading || generateState.isLoading || syncState.isLoading;

  React.useEffect(() => {
    if (selected) setForm(toForm(selected));
  }, [selected]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startNew = () => {
    setSelectedId(null);
    setForm(EMPTY);
  };

  const save = async () => {
    try {
      const body = toBody(form);
      if (!body.slug && body.name) body.slug = slugify(body.name);
      if (!body.slug || !body.name || !body.brand_name || !body.sender_email || !body.product_en) {
        toast.error('Zorunlu alanları doldurun.');
        return;
      }
      if (selectedId) {
        await updateCampaign({ id: selectedId, patch: body }).unwrap();
        toast.success('Kampanya güncellendi');
      } else {
        const created = await createCampaign(body as Partial<OutreachCampaign> & { name: string }).unwrap();
        setSelectedId(created.id);
        toast.success('Kampanya oluşturuldu');
      }
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Kampanya kaydedilemedi.');
    }
  };

  const remove = async () => {
    if (!selectedId) return;
    await deleteCampaign(selectedId).unwrap();
    setSelectedId(null);
    setForm(EMPTY);
    await refetch();
  };

  const generate = async () => {
    if (!selectedId) return;
    await generateDrafts(selectedId).unwrap();
    toast.success('Taslak üretimi başlatıldı');
  };

  const sync = async () => {
    if (!selectedId) return;
    await syncHost(selectedId).unwrap();
    toast.success('Fuar anahtar kelimeleri eşitlendi');
  };

  const inputClass = 'h-9 rounded-md border border-[#cbd5e1] bg-white px-3 text-[13px] text-[#0f172a] outline-none focus:border-[#2563eb]';
  const textareaClass = 'min-h-20 rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-[13px] text-[#0f172a] outline-none focus:border-[#2563eb]';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Mail Yönetimi</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">Kampanyalar ve gönderim hazırlığı</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155]">
            <RefreshCw className="h-4 w-4" /> Yenile
          </button>
          <button onClick={startNew} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white">
            <Plus className="h-4 w-4" /> Yeni
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Aktif kampanya" value={summary?.campaigns_active} />
        <Metric label="Taslak" value={summary?.drafts_total} />
        <Metric label="Gönderilen" value={summary?.sent} />
        <Metric label="Bekleyen alıcı" value={summary?.recipients_pending} />
      </div>

      <div className="inline-flex rounded-lg border border-[#cbd5e1] bg-white p-1">
        <button onClick={() => setActiveTab('campaigns')} className={`h-8 rounded-md px-3 text-[13px] font-semibold ${activeTab === 'campaigns' ? 'bg-[#1e40af] text-white' : 'text-[#475569]'}`}>Kampanyalar</button>
        <button onClick={() => setActiveTab('drafts')} className={`h-8 rounded-md px-3 text-[13px] font-semibold ${activeTab === 'drafts' ? 'bg-[#1e40af] text-white' : 'text-[#475569]'}`}>Taslaklar</button>
        <button onClick={() => setActiveTab('bulk')} className={`h-8 rounded-md px-3 text-[13px] font-semibold ${activeTab === 'bulk' ? 'bg-[#1e40af] text-white' : 'text-[#475569]'}`}>Toplu Liste</button>
        <button onClick={() => setActiveTab('accounts')} className={`h-8 rounded-md px-3 text-[13px] font-semibold ${activeTab === 'accounts' ? 'bg-[#1e40af] text-white' : 'text-[#475569]'}`}>Hesap & Ayarlar</button>
        <button onClick={() => setActiveTab('inbox')} className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-[13px] font-semibold ${activeTab === 'inbox' ? 'bg-[#1e40af] text-white' : 'text-[#475569]'}`}><Inbox className="h-4 w-4" /> Gelen Kutusu</button>
      </div>

      {activeTab === 'campaigns' ? (
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-[#e2e8f0] bg-white">
          <div className="border-b border-[#e2e8f0] px-4 py-3 text-[13px] font-semibold text-[#475569]">Kampanyalar</div>
          <div className="max-h-[680px] overflow-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#1e40af]" /></div>
            ) : isError ? (
              <p className="px-3 py-8 text-center text-[13px] text-[#64748b]">Kampanyalar alınamadı.</p>
            ) : campaigns.length === 0 ? (
              <p className="px-3 py-8 text-center text-[13px] text-[#64748b]">Henüz kampanya yok.</p>
            ) : campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => setSelectedId(campaign.id)}
                className={`mb-2 w-full rounded-md border p-3 text-left transition ${selectedId === campaign.id ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#e2e8f0] hover:bg-[#f8fafc]'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${campaign.is_active ? 'bg-emerald-500' : 'bg-[#94a3b8]'}`} />
                  <span className="truncate text-[13px] font-bold text-[#0f172a]">{campaign.brand_short || campaign.brand_name}</span>
                </div>
                <p className="mt-1 truncate text-[12px] text-[#64748b]">{campaign.name}</p>
                <p className="mt-1 truncate text-[11px] text-[#94a3b8]">{campaign.sender_email}</p>
              </button>
            ))}
          </div>
        </aside>

        <main className="rounded-lg border border-[#e2e8f0] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#e2e8f0] px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#1e40af]" />
              <h2 className="text-[15px] font-bold text-[#0f172a]">{selectedId ? 'Kampanya Düzenle' : 'Yeni Kampanya'}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={!selectedId || busy} onClick={generate} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155] disabled:opacity-50">
                <Sparkles className="h-4 w-4" /> Taslak Üret
              </button>
              <button disabled={!selectedId || busy} onClick={sync} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155] disabled:opacity-50">
                <RefreshCw className="h-4 w-4" /> Sync
              </button>
              <button disabled={!selectedId || busy} onClick={() => setDeleteOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 px-3 text-[13px] font-semibold text-rose-700 disabled:opacity-50">
                <Trash2 className="h-4 w-4" /> Sil
              </button>
              <button disabled={busy} onClick={save} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1e40af] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet
              </button>
            </div>
          </div>

          <div className="grid gap-5 p-4 xl:grid-cols-2">
            <section className="space-y-3">
              <h3 className="text-[13px] font-bold uppercase text-[#475569]">Kampanya</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Slug"><input className={inputClass} value={form.slug ?? ''} onChange={(e) => setField('slug', e.target.value)} /></Field>
                <Field label="Ad"><input className={inputClass} value={form.name ?? ''} onChange={(e) => setField('name', e.target.value)} /></Field>
                <Field label="Varsayılan dil"><input className={inputClass} value={form.default_lang ?? ''} onChange={(e) => setField('default_lang', e.target.value)} /></Field>
                <Field label="Aktif"><select className={inputClass} value={form.is_active ? '1' : '0'} onChange={(e) => setField('is_active', Number(e.target.value))}><option value="1">Aktif</option><option value="0">Pasif</option></select></Field>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[13px] font-bold uppercase text-[#475569]">Marka</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Marka adı"><input className={inputClass} value={form.brand_name ?? ''} onChange={(e) => setField('brand_name', e.target.value)} /></Field>
                <Field label="Marka kısa"><input className={inputClass} value={form.brand_short ?? ''} onChange={(e) => setField('brand_short', e.target.value)} /></Field>
                <Field label="Hukuki ad"><input className={inputClass} value={form.brand_legal ?? ''} onChange={(e) => setField('brand_legal', e.target.value)} /></Field>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[13px] font-bold uppercase text-[#475569]">Gönderici</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Etiket"><input className={inputClass} value={form.sender_label ?? ''} onChange={(e) => setField('sender_label', e.target.value)} /></Field>
                <Field label="E-posta"><input className={inputClass} value={form.sender_email ?? ''} onChange={(e) => setField('sender_email', e.target.value)} /></Field>
                <Field label="Ad Soyad"><input className={inputClass} value={form.sender_name ?? ''} onChange={(e) => setField('sender_name', e.target.value)} /></Field>
                <Field label="Ünvan"><input className={inputClass} value={form.sender_title ?? ''} onChange={(e) => setField('sender_title', e.target.value)} /></Field>
                <Field label="Telefon"><input className={inputClass} value={form.sender_phone ?? ''} onChange={(e) => setField('sender_phone', e.target.value)} /></Field>
                <Field label="Web"><input className={inputClass} value={form.sender_website ?? ''} onChange={(e) => setField('sender_website', e.target.value)} /></Field>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[13px] font-bold uppercase text-[#475569]">Ürün Vaadi</h3>
              <Field label="EN"><textarea className={textareaClass} value={form.product_en ?? ''} onChange={(e) => setField('product_en', e.target.value)} /></Field>
              <Field label="DE"><textarea className={textareaClass} value={form.product_de ?? ''} onChange={(e) => setField('product_de', e.target.value)} /></Field>
              <Field label="TR"><textarea className={textareaClass} value={form.product_tr ?? ''} onChange={(e) => setField('product_tr', e.target.value)} /></Field>
            </section>

            <section className="space-y-3">
              <h3 className="text-[13px] font-bold uppercase text-[#475569]">Fuar</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Fuar adı"><input className={inputClass} value={form.fair_name ?? ''} onChange={(e) => setField('fair_name', e.target.value)} /></Field>
                <Field label="Edisyon"><input className={inputClass} value={form.fair_edition ?? ''} onChange={(e) => setField('fair_edition', e.target.value)} /></Field>
                <Field label="Tarih"><input className={inputClass} value={form.fair_dates_en ?? ''} onChange={(e) => setField('fair_dates_en', e.target.value)} /></Field>
                <Field label="Hall"><input className={inputClass} value={form.fair_hall ?? ''} onChange={(e) => setField('fair_hall', e.target.value)} /></Field>
                <Field label="Stand"><input className={inputClass} value={form.fair_booth ?? ''} onChange={(e) => setField('fair_booth', e.target.value)} /></Field>
                <Field label="URL"><input className={inputClass} value={form.fair_url ?? ''} onChange={(e) => setField('fair_url', e.target.value)} /></Field>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[13px] font-bold uppercase text-[#475569]">Randevu ve Dil</h3>
              <div className="grid gap-3">
                <Field label="Calendly"><input className={inputClass} value={form.calendly_link ?? ''} onChange={(e) => setField('calendly_link', e.target.value)} /></Field>
                <Field label="Calendly metni"><input className={inputClass} value={form.calendly_placeholder ?? ''} onChange={(e) => setField('calendly_placeholder', e.target.value)} /></Field>
                <Field label="Ülke dil eşlemesi"><textarea className={textareaClass} value={form.country_to_lang_json} onChange={(e) => setField('country_to_lang_json', e.target.value)} /></Field>
              </div>
            </section>
          </div>
        </main>
      </div>
      ) : (
        activeTab === 'drafts' ? <DraftsPanel /> : activeTab === 'bulk' ? <BulkListsPanel campaigns={campaigns} /> : activeTab === 'accounts' ? <AccountsPanel /> : <InboxPanel />
      )}

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isDeleting={deleteState.isLoading}
        title="Kampanyayı sil"
        description="Bu kampanya ve bağlı üretim ayarları silinecek."
        onConfirm={remove}
      />
    </div>
  );
}
