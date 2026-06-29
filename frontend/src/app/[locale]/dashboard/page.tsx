'use client';

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
import { useMeQuery } from '@/integrations/rtk/public/auth.endpoints';
import { useGetMyProfileQuery } from '@/integrations/rtk/public/profiles.endpoints';

// TODO: Codex /crm/dashboard/summary gelince RTK query ile değiştir (kontrat: docs/crm/DASHBOARD_PLAN.md §5.1)
const MOCK = {
  counts: { accounts: 25, contacts: 71, leads: 71, deals_open: 7, deals_won: 7, activities_pending: 0, quotes: 1, orders: 7 },
  pending: { quotes: 1, open_deals: 7 },
  sales_summary: [
    { month: 'Oca', amount: 14 }, { month: 'Şub', amount: 21 }, { month: 'Mar', amount: 14 },
    { month: 'Nis', amount: 28 }, { month: 'May', amount: 20 }, { month: 'Haz', amount: 7 },
  ],
  status_breakdown: [
    { label: 'Müşteri', count: 25 }, { label: 'Potansiyel', count: 71 },
    { label: 'Satış Fırsatı', count: 7 }, { label: 'Sipariş', count: 7 },
  ],
  team_breakdown: [{ label: 'Admin', count: 1 }, { label: 'Ekip', count: 0 }],
  totals: { records: 110 },
};

const PIE_COLORS = ['#1e40af', '#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe'];

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
  const d = MOCK;

  const name = profile?.full_name || me?.user?.full_name || me?.user?.email?.split('@')[0] || '';
  const avatar = profile?.avatar_url;
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

  const soon = `/${l}/dashboard`;
  const cards = [
    { icon: Target, label: 'Potansiyel Müşteriler', value: d.counts.leads, href: soon },
    { icon: TrendingUp, label: 'Satış Fırsatları', value: d.counts.deals_open, href: soon },
    { icon: ShoppingCart, label: 'Siparişler', value: d.counts.orders, href: soon, accent: true },
    { icon: Building2, label: 'Müşteriler', value: d.counts.accounts, href: soon },
    { icon: FileText, label: 'Teklifler', value: d.counts.quotes, href: soon },
    { icon: CalendarCheck, label: 'Aktiviteler', value: d.counts.activities_pending, href: soon, accent: true },
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
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#1e40af] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#15317f]">
            <Plus className="h-4 w-4" /> Aktivite Ekle
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-[#1e40af]/30 px-4 py-2.5 text-[13px] font-semibold text-[#1e40af] hover:bg-[#eff6ff]">
            <CalendarPlus className="h-4 w-4" /> Takvim Ekle
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
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
                <Pie data={d.team_breakdown} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {d.team_breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
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
                <Pie data={d.status_breakdown} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {d.status_breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
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
    </div>
  );
}
