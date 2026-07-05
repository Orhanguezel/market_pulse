'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Target, TrendingUp, ShoppingCart, Building2, FileText, CalendarCheck,
  CalendarPlus, Plus, ArrowRight,
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
    { icon: Target, label: 'Potansiyel Müşteriler', value: d.counts.leads, href: `/${l}/potansiyel-musteriler` },
    { icon: TrendingUp, label: 'Satış Fırsatları', value: d.counts.deals_open, href: `/${l}/satis-firsatlari` },
    { icon: ShoppingCart, label: 'Siparişler', value: d.counts.orders ?? d.counts.deals_won, href: `/${l}/siparisler`, accent: true },
    { icon: Building2, label: 'Müşteriler', value: d.counts.accounts, href: `/${l}/musteriler` },
    { icon: FileText, label: 'Teklifler', value: d.counts.quotes, href: `/${l}/teklifler` },
    { icon: CalendarCheck, label: 'Aktiviteler', value: d.counts.activities_pending, href: `/${l}/aktiviteler`, accent: true },
  ];
  const leadMachineStats = [
    { label: 'Hedef Firma', value: numberFrom((marketStats as Record<string, unknown> | undefined)?.totalTargets), href: `/${l}/isletme-yonetimi` },
    { label: 'Market Lead', value: numberFrom((marketStats as Record<string, unknown> | undefined)?.totalLeads), href: `/${l}/potansiyel-musteriler` },
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
