'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Target, TrendingUp, ShoppingCart, Building2, FileText, CalendarCheck,
  CalendarPlus, Plus, ArrowRight, Clock3, Activity, CircleDollarSign, Users,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import { z } from 'zod';
import { CrmEntityDialog } from '@/components/iy/CrmEntityDialog';
import { useMeQuery } from '@/integrations/rtk/public/auth.endpoints';
import { useGetMyProfileQuery } from '@/integrations/rtk/public/profiles.endpoints';
import {
  useCreateCrmActivityMutation,
  useCreateCrmReminderMutation,
  useGetCrmDashboardSummaryQuery,
} from '@/integrations/rtk/public/crm.endpoints';
import { useGetMarketStatsQuery } from '@/integrations/rtk/public/market.endpoints';
import { useGetLeadApprovedStatsQuery, useGetLeadRejectionStatsQuery } from '@/integrations/rtk/public/lead-machine.endpoints';

const EMPTY_SUMMARY = {
  counts: { accounts: 0, contacts: 0, leads: 0, deals_open: 0, deals_won: 0, activities_pending: 0, quotes: 0, orders: 0 },
  pending: { quotes: 0, open_deals: 0 },
  sales_summary: [],
  status_breakdown: [],
  team_breakdown: [],
  totals: { records: 0 },
  upcoming_activities: [],
  recent_quotes: [],
  recent_deals: [],
  recent_accounts: [],
};

const PIE_COLORS = ['#1e40af', '#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe'];

const activitySchema = z.object({
  subject: z.string().min(2, 'Konu gerekli'),
  ref_type: z.enum(['account', 'contact', 'deal']),
  ref_id: z.string().min(1, 'İlişkili kayıt ID gerekli'),
  type: z.enum(['call', 'email', 'meeting', 'task', 'note']).optional(),
  due_at: z.string().optional(),
  body: z.string().optional(),
});

const reminderSchema = z.object({
  title: z.string().min(2, 'Başlık gerekli'),
  remind_at: z.string().min(1, 'Hatırlatma zamanı gerekli'),
  channel: z.enum(['in_app', 'email', 'sms', 'whatsapp']).optional(),
});

function numberFrom(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value?: string | null) {
  if (!value) return 'Tarih yok';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Tarih yok' : date.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatMoney(value?: number | string | null, currency?: string | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '-';
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString('tr-TR')} ${currency || ''}`.trim();
  }
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-4 py-8 text-center text-[13px] text-[#94a3b8]">{text}</div>;
}

function StatCard({ icon: Icon, label, value, href, accent }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number; href: string; accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6">
      <span className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${accent ? 'bg-[#1e40af]' : 'bg-[#eff6ff]'}`}>
        <Icon className={`h-6 w-6 ${accent ? 'text-white' : 'text-[#1e40af]'}`} />
      </span>
      <p className="text-[13px] text-[#64748b]">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#0f172a]">{value}</p>
      <Link href={href} className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1e40af] hover:underline">
        Detaylar <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { locale } = useParams<{ locale: string }>();
  const l = locale || 'tr';
  const { data: me } = useMeQuery();
  const { data: profile } = useGetMyProfileQuery();
  const { data: summary, isError } = useGetCrmDashboardSummaryQuery();
  const { data: marketStats } = useGetMarketStatsQuery();
  const { data: approvedStats } = useGetLeadApprovedStatsQuery();
  const { data: rejectionStats } = useGetLeadRejectionStatsQuery();
  const [activityOpen, setActivityOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [createActivity, activityState] = useCreateCrmActivityMutation();
  const [createReminder, reminderState] = useCreateCrmReminderMutation();
  const d = summary ?? EMPTY_SUMMARY;
  const team = d.team_breakdown ?? [];

  const name = profile?.full_name || me?.user?.full_name || me?.user?.email?.split('@')[0] || '';
  const avatar = profile?.avatar_url;
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

  const soon = `/${l}/dashboard`;
  const cards = [
    { icon: Target, label: 'Potansiyel Müşteriler', value: d.counts.leads, href: `/${l}/firma-bulucu/adaylar?status=approved` },
    { icon: TrendingUp, label: 'Satış Fırsatları', value: d.counts.deals_open, href: `/${l}/satis-firsatlari` },
    { icon: ShoppingCart, label: 'Siparişler', value: d.counts.orders ?? d.counts.deals_won, href: `/${l}/siparisler`, accent: true },
    { icon: Building2, label: 'Müşteriler', value: d.counts.accounts, href: `/${l}/musteriler` },
    { icon: FileText, label: 'Teklifler', value: d.counts.quotes, href: `/${l}/teklifler` },
    { icon: CalendarCheck, label: 'Aktiviteler', value: d.counts.activities_pending, href: `/${l}/aktiviteler`, accent: true },
  ];
  const leadMachineStats = [
    { label: 'Hedef Firma', value: numberFrom((marketStats as Record<string, unknown> | undefined)?.totalTargets), href: `/${l}/isletme-yonetimi` },
    { label: 'Market Lead', value: numberFrom((marketStats as Record<string, unknown> | undefined)?.totalLeads), href: `/${l}/firma-bulucu/adaylar?status=approved` },
    { label: 'Bekleyen Sinyal', value: numberFrom((marketStats as Record<string, unknown> | undefined)?.pendingSignals), href: `/${l}/raporlar` },
    { label: 'Onaylı Profil', value: numberFrom((approvedStats as Record<string, unknown> | undefined)?.total ?? (approvedStats as Record<string, unknown> | undefined)?.approved), href: `/${l}/firma-bulucu/adaylar?status=approved` },
    { label: 'Red Sinyali', value: numberFrom((rejectionStats as Record<string, unknown> | undefined)?.total ?? (rejectionStats as Record<string, unknown> | undefined)?.rejected), href: `/${l}/firma-bulucu/adaylar?status=rejected` },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-[#1e40af] text-xl font-bold text-white">
              {(name || '?').slice(0, 2).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">Hoş Geldin {name}</h1>
            <p className="text-[13px] text-[#64748b]">{me?.user?.email} · {today}</p>
            <p className="mt-1 text-[13px] font-medium text-[#1e40af]">
              {d.pending.quotes} Bekleyen Teklif & {d.pending.open_deals} Açık Satış Fırsatı
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => setActivityOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#1e40af] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#15317f]">
            <Plus className="h-4 w-4" /> Aktivite Ekle
          </button>
          <button onClick={() => setReminderOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#1e40af]/30 px-4 py-2.5 text-[13px] font-semibold text-[#1e40af] hover:bg-[#eff6ff]">
            <CalendarPlus className="h-4 w-4" /> Takvim Ekle
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Dashboard özeti alınamadı. Kartlar gerçek veri gelene kadar boş gösteriliyor.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#0f172a]">Lead Machine ve Market Özeti</h2>
          <Link href={`/${l}/firma-bulucu/tarama`} className="text-[12.5px] font-semibold text-[#1e40af] hover:underline">Tarama başlat</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {leadMachineStats.map((item) => (
            <Link key={item.label} href={item.href} className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 hover:border-[#93c5fd]">
              <p className="text-[12px] font-semibold text-[#64748b]">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-[#0f172a]">{item.value}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Satış Özeti */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 lg:col-span-1">
          <h2 className="mb-4 text-[15px] font-bold text-[#0f172a]">Satış Özeti</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.sales_summary} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="iyArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e40af" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#1e40af" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#1e40af" strokeWidth={2} fill="url(#iyArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ekip Durumu */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6">
          <h2 className="mb-4 text-[15px] font-bold text-[#0f172a]">Ekip Durumu</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={team.length ? team : [{ label: 'Veri yok', count: 1 }]} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {(team.length ? team : [{ label: 'Veri yok', count: 1 }]).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* İş Durumu Özeti */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#0f172a]">İş Durumu Özeti</h2>
            <span className="text-[13px] text-[#64748b]">Toplam <b className="text-[#0f172a]">{d.totals.records}</b></span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.status_breakdown.length ? d.status_breakdown : [{ label: 'Veri yok', count: 1 }]} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {(d.status_breakdown.length ? d.status_breakdown : [{ label: 'Veri yok', count: 1 }]).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {d.status_breakdown.map((s, i) => (
              <div key={s.label} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-2 text-[#64748b]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {s.label}
                </span>
                <b className="text-[#0f172a]">{s.count}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operasyon akışı */}
      <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-[#0f172a]">Yaklaşan Aktiviteler</h2>
            <p className="mt-0.5 text-[12px] text-[#64748b]">Arama, toplantı, e-posta ve takip planınız</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActivityOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#1e40af] px-3 text-[12.5px] font-semibold text-white"><Plus className="h-4 w-4" /> Yeni Aktivite</button>
            <Link href={`/${l}/aktiviteler`} className="inline-flex h-9 items-center rounded-md border border-[#cbd5e1] px-3 text-[12.5px] font-semibold text-[#334155]">Tümünü Gör</Link>
          </div>
        </div>
        {(d.upcoming_activities?.length ?? 0) > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[12.5px]">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#64748b]"><tr><th className="px-5 py-3">Aktivite</th><th className="px-5 py-3">Tip</th><th className="px-5 py-3">İlişkili Kayıt</th><th className="px-5 py-3">Planlanan Tarih</th><th className="px-5 py-3 text-right">Aksiyon</th></tr></thead>
              <tbody className="divide-y divide-[#eef2f7]">
                {d.upcoming_activities?.map((item) => <tr key={item.id} className="hover:bg-[#f8fafc]"><td className="px-5 py-3.5 font-semibold text-[#0f172a]">{item.subject}</td><td className="px-5 py-3.5 capitalize text-[#475569]">{item.type || 'aktivite'}</td><td className="px-5 py-3.5 text-[#475569]">{item.related_name || '-'}</td><td className="px-5 py-3.5 text-[#475569]">{formatDate(item.due_at)}</td><td className="px-5 py-3.5 text-right"><Link href={`/${l}/aktiviteler`} className="font-semibold text-[#1e40af]">Görüntüle</Link></td></tr>)}
              </tbody>
            </table>
          </div>
        ) : <EmptyRow text="Planlanmış açık aktivite bulunmuyor." />}
      </section>

      {/* Son kayıtlar */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <RecentPanel title="Son Teklifler" href={`/${l}/teklifler`} icon={FileText} empty="Henüz teklif yok.">
          {d.recent_quotes?.map((item) => <Link key={item.id} href={`/${l}/teklifler/${item.id}`} className="flex items-center gap-3 border-t border-[#eef2f7] px-4 py-3 hover:bg-[#f8fafc]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eff6ff] text-[12px] font-bold text-[#1e40af]">{(item.title || 'T')[0]}</span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-[#0f172a]">{item.title}</span><span className="block truncate text-[11.5px] text-[#64748b]">{item.quote_no || item.account_name || item.status}</span></span><span className="shrink-0 text-[12px] font-semibold text-[#334155]">{formatMoney(item.amount, item.currency)}</span></Link>)}
        </RecentPanel>
        <RecentPanel title="Son Satış Fırsatları" href={`/${l}/satis-firsatlari`} icon={CircleDollarSign} empty="Henüz satış fırsatı yok.">
          {d.recent_deals?.map((item) => <Link key={item.id} href={`/${l}/satis-firsatlari/${item.id}`} className="flex items-center gap-3 border-t border-[#eef2f7] px-4 py-3 hover:bg-[#f8fafc]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eff6ff] text-[12px] font-bold text-[#1e40af]">{(item.title || 'F')[0]}</span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-[#0f172a]">{item.title}</span><span className="block truncate text-[11.5px] text-[#64748b]">{item.stage_name || item.account_name || item.status}</span></span><span className="shrink-0 text-[12px] font-semibold text-[#334155]">{formatMoney(item.amount, item.currency)}</span></Link>)}
        </RecentPanel>
        <RecentPanel title="Son Eklenen Müşteriler" href={`/${l}/musteriler`} icon={Users} empty="Henüz müşteri yok.">
          {d.recent_accounts?.map((item) => <Link key={item.id} href={`/${l}/musteriler/${item.id}`} className="flex items-center gap-3 border-t border-[#eef2f7] px-4 py-3 hover:bg-[#f8fafc]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eff6ff] text-[12px] font-bold text-[#1e40af]">{(item.name || 'M')[0]}</span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-[#0f172a]">{item.name}</span><span className="block truncate text-[11.5px] text-[#64748b]">{[item.city, item.country].filter(Boolean).join(', ') || 'Konum yok'} · {item.status || 'aktif'}</span></span><span className="shrink-0 text-[11.5px] text-[#64748b]">{item.created_at ? new Date(item.created_at).toLocaleDateString('tr-TR') : ''}</span></Link>)}
        </RecentPanel>
      </div>

      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-[15px] font-bold text-[#0f172a]">İşletmenin Son Hareketleri</h2><p className="mt-0.5 text-[12px] text-[#64748b]">Size ait son CRM kayıtları</p></div><Activity className="h-5 w-5 text-[#1e40af]" /></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ...(d.recent_deals ?? []).slice(0, 2).map((x) => ({ key: `d-${x.id}`, label: 'Yeni satış fırsatı', title: x.title, date: x.created_at, href: `/${l}/satis-firsatlari/${x.id}`, color: 'bg-cyan-50 text-cyan-700' })),
            ...(d.recent_accounts ?? []).slice(0, 2).map((x) => ({ key: `a-${x.id}`, label: 'Yeni müşteri', title: x.name, date: x.created_at, href: `/${l}/musteriler/${x.id}`, color: 'bg-emerald-50 text-emerald-700' })),
            ...(d.recent_quotes ?? []).slice(0, 2).map((x) => ({ key: `q-${x.id}`, label: 'Yeni teklif', title: x.title, date: x.created_at, href: `/${l}/teklifler/${x.id}`, color: 'bg-blue-50 text-blue-700' })),
          ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 4).map((item) => <Link key={item.key} href={item.href} className="rounded-xl border border-[#e2e8f0] p-4 hover:border-[#93c5fd]"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.color}`}>{item.label}</span><p className="mt-2 truncate text-[13px] font-semibold text-[#0f172a]">{item.title}</p><p className="mt-1 flex items-center gap-1 text-[11.5px] text-[#64748b]"><Clock3 className="h-3.5 w-3.5" />{formatDate(item.date)}</p></Link>)}
        </div>
      </section>
      <CrmEntityDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        title="Aktivite Ekle"
        defaultValues={{ subject: '', ref_type: 'account', ref_id: '', type: 'note', due_at: '', body: '' }}
        schema={activitySchema}
        fields={[
          { name: 'ref_type', label: 'İlişki tipi', type: 'select', options: [{ value: 'account', label: 'Müşteri' }, { value: 'contact', label: 'Kontak' }, { value: 'deal', label: 'Fırsat' }] },
          { name: 'ref_id', label: 'İlişkili kayıt ID', required: true },
          { name: 'subject', label: 'Konu', required: true },
          { name: 'type', label: 'Tip', type: 'select', options: [{ value: 'call', label: 'Arama' }, { value: 'email', label: 'E-posta' }, { value: 'meeting', label: 'Toplantı' }, { value: 'task', label: 'Görev' }, { value: 'note', label: 'Not' }] },
          { name: 'due_at', label: 'Tarih', type: 'datetime-local' },
          { name: 'body', label: 'Not', type: 'textarea' },
        ]}
        isSubmitting={activityState.isLoading}
        onSubmit={(values) => createActivity(values).unwrap()}
      />
      <CrmEntityDialog
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        title="Takvim Ekle"
        defaultValues={{ title: '', remind_at: '', channel: 'in_app' }}
        schema={reminderSchema}
        fields={[
          { name: 'title', label: 'Başlık', required: true },
          { name: 'remind_at', label: 'Hatırlatma zamanı', type: 'datetime-local', required: true },
          { name: 'channel', label: 'Kanal', type: 'select', options: [{ value: 'in_app', label: 'Uygulama' }, { value: 'email', label: 'E-posta' }, { value: 'sms', label: 'SMS' }, { value: 'whatsapp', label: 'WhatsApp' }] },
        ]}
        isSubmitting={reminderState.isLoading}
        onSubmit={(values) => createReminder(values).unwrap()}
      />
    </div>
  );
}

function RecentPanel({ title, href, icon: Icon, empty, children }: { title: string; href: string; icon: React.ComponentType<{ className?: string }>; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white"><div className="flex items-center justify-between px-4 py-4"><h2 className="flex items-center gap-2 text-[14px] font-bold text-[#0f172a]"><Icon className="h-4 w-4 text-[#1e40af]" />{title}</h2><Link href={href} className="text-[12px] font-semibold text-[#1e40af]">Tümünü Gör</Link></div>{hasChildren ? children : <EmptyRow text={empty} />}</section>;
}
