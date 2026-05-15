'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/audit/admin-audit-client.tsx
// FINAL — Admin Audit (POLISHED)
// Tema: design tokens (site_settings / CSS variables)
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Activity,
  ShieldCheck,
  UserCheck,
  RefreshCcw,
  Search,
  Calendar,
  Filter,
  Loader2,
  Globe,
  Trash2,
  LayoutGrid,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { AuditDailyChart } from './AuditDailyChart';
import { AuditGeoMap } from './AuditGeoMap';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { BASE_URL } from '@/integrations/baseApi';

import type {
  AuditAuthEvent,
  AuditAuthEventDto,
  AuditRequestLogDto,
  AuditListResponse,
  AuditMetricsDailyResponseDto,
  AuditGeoStatsResponseDto,
} from '@/integrations/shared';
import { AUDIT_AUTH_EVENTS } from '@/integrations/shared';
import {
  useListAuditRequestLogsAdminQuery,
  useListAuditAuthEventsAdminQuery,
  useGetAuditMetricsDailyAdminQuery,
  useGetAuditGeoStatsAdminQuery,
  useClearAuditLogsAdminMutation,
} from '@/integrations/hooks';

/* ----------------------------- helpers ----------------------------- */

type TabKey = 'requests' | 'auth' | 'metrics' | 'map' | 'stream';

type StreamStatus = 'connecting' | 'open' | 'closed' | 'error';

type AuditStreamEvent = {
  id?: string;
  ts?: string;
  level?: string;
  topic?: string;
  message?: string | null;
  actor_user_id?: string | null;
  ip?: string | null;
  meta?: Record<string, unknown> | null;
};

type AuditCompareRow = {
  lineNo: number;
  left: string;
  right: string;
  changed: boolean;
};

function safeText(v: unknown, fb = ''): string {
  const s = String(v ?? '').trim();
  return s ? s : fb;
}

function safeInt(v: string | null, fb: number): number {
  const n = Number(v ?? '');
  return Number.isFinite(n) && n >= 0 ? n : fb;
}

function parseStatusCode(v: string): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  if (n < 100 || n > 599) return undefined;
  return Math.floor(n);
}

function normalizeTab(v: string | null): TabKey {
  const s = String(v ?? '').toLowerCase();
  if (s === 'auth') return 'auth';
  if (s === 'metrics') return 'metrics';
  if (s === 'map') return 'map';
  if (s === 'stream') return 'stream';
  return 'requests';
}

function normalizeBoolLike(v: string | null): boolean {
  return v === '1' || v === 'true';
}

function toQS(next: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(next).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

function getErrMessage(err: unknown, fallback: string): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return fallback;
}

function fmtWhen(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function statusVariant(code: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (code >= 500) return 'destructive';
  if (code >= 400) return 'secondary';
  if (code >= 300) return 'outline';
  return 'default';
}

function authEventVariant(ev: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (ev === 'login_success') return 'default';
  if (ev === 'login_failed') return 'destructive';
  if (ev === 'logout') return 'secondary';
  return 'outline';
}

function streamStatusVariant(
  status: StreamStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'open') return 'default';
  if (status === 'connecting') return 'secondary';
  if (status === 'error') return 'destructive';
  return 'outline';
}

function streamEventVariant(
  level: string | null | undefined,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (level === 'error') return 'destructive';
  if (level === 'warn') return 'secondary';
  if (level === 'debug') return 'outline';
  return 'default';
}

function truncate(s: string | null | undefined, max = 60): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '…' : s;
}

function geoLabel(country: string | null | undefined, city: string | null | undefined): string {
  if (country === 'LOCAL') return 'Localhost';
  const parts: string[] = [];
  if (city) parts.push(city);
  if (country) parts.push(country);
  return parts.join(', ') || '';
}

type SortKey = 'created_at' | 'response_time_ms' | 'status_code';

function normalizeSnapshotForCompare(v: string | null | undefined): string[] {
  return String(v ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n');
}

/* ----------------------------- component ----------------------------- */

export default function AdminAuditClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useAdminT('admin.audit');

  const tab = normalizeTab(sp.get('tab'));

  const q = sp.get('q') ?? '';
  const method = sp.get('method') ?? '';
  const status = sp.get('status') ?? '';
  const from = sp.get('from') ?? '';
  const to = sp.get('to') ?? '';
  const onlyAdmin = normalizeBoolLike(sp.get('only_admin'));

  const reqUserId = sp.get('req_user_id') ?? '';
  const reqIp = sp.get('req_ip') ?? '';
  const sort = (sp.get('sort') ?? 'created_at') as SortKey;
  const orderDir = (sp.get('orderDir') ?? 'desc') as 'asc' | 'desc';

  const event = sp.get('event') ?? '';
  const email = sp.get('email') ?? '';
  const user_id = sp.get('user_id') ?? '';
  const ip = sp.get('ip') ?? '';

  const days = String(safeInt(sp.get('days'), 14) || 14);
  const path_prefix = sp.get('path_prefix') ?? '';

  const limit = safeInt(sp.get('limit'), 50) || 50;
  const offset = safeInt(sp.get('offset'), 0);

  // local state for request filters
  const [qText, setQText] = React.useState(q);
  const [methodText, setMethodText] = React.useState(method);
  const [statusText, setStatusText] = React.useState(status);
  const [fromText, setFromText] = React.useState(from);
  const [toText, setToText] = React.useState(to);
  const [onlyAdminFlag, setOnlyAdminFlag] = React.useState(onlyAdmin);
  const [reqUserIdText, setReqUserIdText] = React.useState(reqUserId);
  const [reqIpText, setReqIpText] = React.useState(reqIp);
  const [sortText, setSortText] = React.useState<SortKey>(sort);
  const [orderDirText, setOrderDirText] = React.useState<'asc' | 'desc'>(orderDir);

  // local state for auth filters
  const [eventText, setEventText] = React.useState(event);
  const [emailText, setEmailText] = React.useState(email);
  const [userIdText, setUserIdText] = React.useState(user_id);
  const [ipText, setIpText] = React.useState(ip);

  // local state for metrics
  const [daysText, setDaysText] = React.useState(days);
  const [pathPrefixText, setPathPrefixText] = React.useState(path_prefix);
  const [streamStatus, setStreamStatus] = React.useState<StreamStatus>('connecting');
  const [streamEvents, setStreamEvents] = React.useState<AuditStreamEvent[]>([]);
  const [compareIds, setCompareIds] = React.useState<number[]>([]);
  const [compareOpen, setCompareOpen] = React.useState(false);

  React.useEffect(() => setQText(q), [q]);
  React.useEffect(() => setMethodText(method), [method]);
  React.useEffect(() => setStatusText(status), [status]);
  React.useEffect(() => setFromText(from), [from]);
  React.useEffect(() => setToText(to), [to]);
  React.useEffect(() => setOnlyAdminFlag(onlyAdmin), [onlyAdmin]);
  React.useEffect(() => setReqUserIdText(reqUserId), [reqUserId]);
  React.useEffect(() => setReqIpText(reqIp), [reqIp]);
  React.useEffect(() => setSortText(sort), [sort]);
  React.useEffect(() => setOrderDirText(orderDir), [orderDir]);

  React.useEffect(() => setEventText(event), [event]);
  React.useEffect(() => setEmailText(email), [email]);
  React.useEffect(() => setUserIdText(user_id), [user_id]);
  React.useEffect(() => setIpText(ip), [ip]);

  React.useEffect(() => setDaysText(days), [days]);
  React.useEffect(() => setPathPrefixText(path_prefix), [path_prefix]);

  React.useEffect(() => {
    if (tab !== 'stream' || typeof window === 'undefined') return;

    const base = String(BASE_URL || '').replace(/\/+$/, '');
    const url = `${base}/admin/audit/stream`;
    const es = new EventSource(url, { withCredentials: true });

    setStreamStatus('connecting');

    es.addEventListener('open', () => {
      setStreamStatus('open');
    });

    es.addEventListener('error', () => {
      setStreamStatus(es.readyState === EventSource.CLOSED ? 'closed' : 'error');
    });

    es.addEventListener('hello', () => {
      setStreamStatus('open');
    });

    es.addEventListener('app.event', (evt) => {
      try {
        const next = JSON.parse((evt as MessageEvent).data || '{}') as AuditStreamEvent;
        setStreamEvents((prev) => [next, ...prev].slice(0, 100));
      } catch {
        // ignore malformed events
      }
    });

    return () => {
      es.close();
      setStreamStatus('closed');
    };
  }, [tab]);

  function apply(next: Partial<Record<string, any>>) {
    const merged = {
      tab,
      q,
      method,
      status,
      from,
      to,
      only_admin: onlyAdmin ? '1' : '',
      req_user_id: reqUserId,
      req_ip: reqIp,
      sort,
      orderDir,
      event,
      email,
      user_id,
      ip,
      days,
      path_prefix,
      limit,
      offset,
      ...next,
    };

    if (next.offset == null) merged.offset = 0;

    const qs = toQS({
      tab: merged.tab,
      q: merged.q || undefined,
      method: merged.method || undefined,
      status: merged.status || undefined,
      from: merged.from || undefined,
      to: merged.to || undefined,
      only_admin: merged.only_admin || undefined,
      req_user_id: merged.req_user_id || undefined,
      req_ip: merged.req_ip || undefined,
      sort: merged.sort !== 'created_at' ? merged.sort : undefined,
      orderDir: merged.orderDir !== 'desc' ? merged.orderDir : undefined,
      event: merged.event && merged.event !== ALL ? merged.event : undefined,
      email: merged.email || undefined,
      user_id: merged.user_id || undefined,
      ip: merged.ip || undefined,
      days: merged.days || undefined,
      path_prefix: merged.path_prefix || undefined,
      limit: merged.limit || undefined,
      offset: merged.offset || undefined,
    });

    router.push(`/admin/audit${qs}`);
  }

  function onTabChange(next: string) {
    apply({ tab: next, offset: 0 });
  }

  function onSubmitRequests(e: React.FormEvent) {
    e.preventDefault();
    apply({
      tab: 'requests',
      q: qText.trim(),
      method: methodText.trim().toUpperCase(),
      status: statusText.trim(),
      from: fromText.trim(),
      to: toText.trim(),
      only_admin: onlyAdminFlag ? '1' : '',
      req_user_id: reqUserIdText.trim(),
      req_ip: reqIpText.trim(),
      sort: sortText,
      orderDir: orderDirText,
      offset: 0,
    });
  }

  function onResetRequests() {
    setQText('');
    setMethodText('');
    setStatusText('');
    setFromText('');
    setToText('');
    setOnlyAdminFlag(false);
    setReqUserIdText('');
    setReqIpText('');
    setSortText('created_at');
    setOrderDirText('desc');
    apply({
      tab: 'requests',
      q: '',
      method: '',
      status: '',
      from: '',
      to: '',
      only_admin: '',
      req_user_id: '',
      req_ip: '',
      sort: 'created_at',
      orderDir: 'desc',
      offset: 0,
    });
  }

  function onSubmitAuth(e: React.FormEvent) {
    e.preventDefault();
    apply({
      tab: 'auth',
      event: eventText,
      email: emailText.trim(),
      user_id: userIdText.trim(),
      ip: ipText.trim(),
      from: fromText.trim(),
      to: toText.trim(),
      offset: 0,
    });
  }

  function onResetAuth() {
    setEventText('');
    setEmailText('');
    setUserIdText('');
    setIpText('');
    setFromText('');
    setToText('');
    apply({
      tab: 'auth',
      event: '',
      email: '',
      user_id: '',
      ip: '',
      from: '',
      to: '',
      offset: 0,
    });
  }

  function onSubmitMetrics(e: React.FormEvent) {
    e.preventDefault();
    const d = String(safeInt(daysText, 14) || 14);
    setDaysText(d);
    apply({
      tab: 'metrics',
      days: d,
      path_prefix: pathPrefixText.trim(),
      only_admin: onlyAdminFlag ? '1' : '',
    });
  }

  function onResetMetrics() {
    setDaysText('14');
    setPathPrefixText('');
    setOnlyAdminFlag(false);
    apply({
      tab: 'metrics',
      days: '14',
      path_prefix: '',
      only_admin: '',
    });
  }

  /* ----------------------------- queries ----------------------------- */

  const reqParams = React.useMemo(() => {
    const code = parseStatusCode(status);
    return {
      q: q || undefined,
      method: method || undefined,
      status_code: code,
      user_id: reqUserId || undefined,
      ip: reqIp || undefined,
      only_admin: onlyAdmin ? 1 : undefined,
      created_from: from || undefined,
      created_to: to || undefined,
      sort: sort as 'created_at' | 'response_time_ms' | 'status_code',
      orderDir: orderDir as 'asc' | 'desc',
      limit,
      offset,
    };
  }, [q, method, status, reqUserId, reqIp, onlyAdmin, from, to, sort, orderDir, limit, offset]);

  const authParams = React.useMemo(() => {
    const ev = event && event !== ALL ? event : undefined;
    return {
      event: ev as AuditAuthEvent | undefined,
      email: email || undefined,
      user_id: user_id || undefined,
      ip: ip || undefined,
      created_from: from || undefined,
      created_to: to || undefined,
      sort: 'created_at' as const,
      orderDir: 'desc' as const,
      limit,
      offset,
    };
  }, [event, email, user_id, ip, from, to, limit, offset]);

  const metricsParams = React.useMemo(() => {
    const d = safeInt(days, 14) || 14;
    return {
      days: d,
      only_admin: onlyAdmin ? 1 : undefined,
      path_prefix: path_prefix || undefined,
    };
  }, [days, onlyAdmin, path_prefix]);

  const reqQ = useListAuditRequestLogsAdminQuery(
    tab === 'requests' ? (reqParams as any) : (undefined as any),
    { skip: tab !== 'requests', refetchOnFocus: true } as any,
  ) as any;

  const authQ = useListAuditAuthEventsAdminQuery(
    tab === 'auth' ? (authParams as any) : (undefined as any),
    { skip: tab !== 'auth', refetchOnFocus: true } as any,
  ) as any;

  const metricsQ = useGetAuditMetricsDailyAdminQuery(
    tab === 'metrics' ? (metricsParams as any) : (undefined as any),
    { skip: tab !== 'metrics', refetchOnFocus: true } as any,
  ) as any;

  const geoParams = React.useMemo(() => {
    const d = safeInt(days, 30) || 30;
    return {
      days: d,
      only_admin: onlyAdmin ? 1 : undefined,
      source: 'requests' as const,
    };
  }, [days, onlyAdmin]);

  const geoQ = useGetAuditGeoStatsAdminQuery(
    tab === 'map' ? (geoParams as any) : (undefined as any),
    { skip: tab !== 'map', refetchOnFocus: true } as any,
  ) as any;

  const EMPTY_LIST = React.useMemo(() => ({ items: [] as any[], total: 0 }), []);
  const reqData = (reqQ.data as AuditListResponse<AuditRequestLogDto> | undefined) ?? EMPTY_LIST;
  const authData = (authQ.data as AuditListResponse<AuditAuthEventDto> | undefined) ?? EMPTY_LIST;
  const metricsData = (metricsQ.data as AuditMetricsDailyResponseDto | undefined) ?? { days: [] };
  const geoData = (geoQ.data as AuditGeoStatsResponseDto | undefined) ?? { items: [] };

  const reqLoading = reqQ.isLoading || reqQ.isFetching;
  const authLoading = authQ.isLoading || authQ.isFetching;
  const metricsLoading = metricsQ.isLoading || metricsQ.isFetching;
  const geoLoading = geoQ.isLoading || geoQ.isFetching;

  const reqTotal = reqData.total ?? 0;
  const authTotal = authData.total ?? 0;
  const compareItems = reqData.items.filter((item) => compareIds.includes(Number(item.id))).slice(0, 2);
  const compareLeft = compareItems[0];
  const compareRight = compareItems[1];
  const compareRows = React.useMemo<AuditCompareRow[]>(() => {
    const left = normalizeSnapshotForCompare(compareLeft?.body_snapshot);
    const right = normalizeSnapshotForCompare(compareRight?.body_snapshot);
    const size = Math.max(left.length, right.length, 1);
    return Array.from({ length: size }, (_, idx) => {
      const l = left[idx] ?? '';
      const r = right[idx] ?? '';
      return { lineNo: idx + 1, left: l, right: r, changed: l !== r };
    });
  }, [compareLeft?.body_snapshot, compareRight?.body_snapshot]);

  const reqItems = reqData.items;
  React.useEffect(() => {
    setCompareIds((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.filter((id) => reqItems.some((item) => Number(item.id) === Number(id))).slice(0, 2);
      return next.length === prev.length ? prev : next;
    });
  }, [reqItems]);

  const canPrev = offset > 0;
  const canNextReq = offset + limit < reqTotal;
  const canNextAuth = offset + limit < authTotal;

  const ALL = '__all__' as const;

  const [clearAuditLogs, { isLoading: isClearing }] = useClearAuditLogsAdminMutation();

  async function onRefresh() {
    try {
      if (tab === 'requests') await reqQ.refetch();
      if (tab === 'auth') await authQ.refetch();
      if (tab === 'metrics') await metricsQ.refetch();
      if (tab === 'map') await geoQ.refetch();
      toast.success(t('refreshed'));
    } catch (err) {
      toast.error(getErrMessage(err, t('error')));
    }
  }

  async function onClearLogs() {
    if (!window.confirm(t('clear.dialogDescription'))) return;
    const target = tab === 'requests' ? 'requests' : tab === 'auth' ? 'auth' : 'all';
    try {
      const data = await clearAuditLogs({ target }).unwrap();
      const total =
        (data.deletedRequests ?? 0) +
        (data.deletedAuth ?? 0) +
        (data.deletedEvents ?? 0);
      toast.success(t('clear.success', { count: String(total) }));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('error'));
    }
  }

  function toggleCompare(id: number, checked: boolean) {
    setCompareIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id].slice(-2);
      }
      return prev.filter((x) => x !== id);
    });
  }

  const anyLoading = reqLoading || authLoading || metricsLoading || geoLoading || isClearing;

  return (
    <div className="space-y-8 pb-12">
      {/* ---- HEADER ---- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.3em] uppercase">Sistem Güvenliği</span>
          </div>
          <h1 className="font-serif text-5xl text-foreground leading-tight tracking-tight">{t('header.title')}</h1>
          <p className="text-gm-muted text-lg mt-3 font-serif italic max-w-2xl leading-relaxed">
            {t('header.description')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={onRefresh} 
            disabled={anyLoading}
            className="rounded-full border-gm-border-soft px-8 h-12 hover:bg-gm-surface transition-all"
          >
            <RefreshCcw className={cn("mr-2 h-4 w-4 text-gm-gold", anyLoading && "animate-spin")} />
            {t('refresh')}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClearLogs} 
            disabled={isClearing}
            className="rounded-full text-gm-error hover:bg-gm-error/10 h-12 px-8 font-bold tracking-widest uppercase text-[10px]"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('clear.button')}
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="space-y-8">
        <TabsList className="bg-gm-surface/30 border border-gm-border-soft p-1.5 rounded-full h-auto backdrop-blur-sm">
          <TabsTrigger value="requests" className="rounded-full px-8 py-2.5 data-[state=active]:bg-gm-gold data-[state=active]:text-gm-bg data-[state=active]:shadow-lg transition-all text-[10px] font-bold tracking-widest uppercase">
            <Activity className="mr-2 h-4 w-4" /> {t('tabs.requests')}
          </TabsTrigger>
          <TabsTrigger value="auth" className="rounded-full px-8 py-2.5 data-[state=active]:bg-gm-gold data-[state=active]:text-gm-bg data-[state=active]:shadow-lg transition-all text-[10px] font-bold tracking-widest uppercase">
            <UserCheck className="mr-2 h-4 w-4" /> {t('tabs.auth')}
          </TabsTrigger>
          <TabsTrigger value="metrics" className="rounded-full px-8 py-2.5 data-[state=active]:bg-gm-gold data-[state=active]:text-gm-bg data-[state=active]:shadow-lg transition-all text-[10px] font-bold tracking-widest uppercase">
            <LayoutGrid className="mr-2 h-4 w-4" /> {t('tabs.metrics')}
          </TabsTrigger>
          <TabsTrigger value="map" className="rounded-full px-8 py-2.5 data-[state=active]:bg-gm-gold data-[state=active]:text-gm-bg data-[state=active]:shadow-lg transition-all text-[10px] font-bold tracking-widest uppercase">
            <Globe className="mr-2 h-4 w-4" /> {t('tabs.map')}
          </TabsTrigger>
          <TabsTrigger value="stream" className="rounded-full px-8 py-2.5 data-[state=active]:bg-gm-gold data-[state=active]:text-gm-bg data-[state=active]:shadow-lg transition-all text-[10px] font-bold tracking-widest uppercase">
            <Zap className="mr-2 h-4 w-4" /> {t('tabs.stream')}
          </TabsTrigger>
        </TabsList>

        {/* ==================== REQUESTS TAB ==================== */}
        <TabsContent value="requests" className="space-y-8 animate-in fade-in duration-700">
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 border-b border-gm-border-soft bg-gm-surface/40">
              <CardTitle className="font-serif text-2xl flex items-center gap-3">
                <Filter className="h-5 w-5 text-gm-gold" /> {t('requests.filtersTitle')}
              </CardTitle>
              <CardDescription className="font-serif italic opacity-70 text-gm-muted">{t('requests.filtersDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={onSubmitRequests} className="grid gap-6 md:grid-cols-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('requests.search')}</Label>
                  <Input 
                    value={qText} 
                    onChange={(e) => setQText(e.target.value)} 
                    placeholder="/api/orders" 
                    className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-gold/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('requests.method')}</Label>
                  <Input 
                    value={methodText} 
                    onChange={(e) => setMethodText(e.target.value)} 
                    placeholder="GET" 
                    className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-gold/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('requests.status')}</Label>
                  <Input 
                    value={statusText} 
                    onChange={(e) => setStatusText(e.target.value)} 
                    placeholder="200" 
                    className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-gold/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('requests.sort')}</Label>
                  <div className="flex gap-2">
                    <Select value={sortText} onValueChange={(v) => setSortText(v as SortKey)}>
                      <SelectTrigger className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gm-surface border-gm-border-soft rounded-2xl">
                        <SelectItem value="created_at">{t('requests.sortDate')}</SelectItem>
                        <SelectItem value="response_time_ms">{t('requests.sortResponseTime')}</SelectItem>
                        <SelectItem value="status_code">{t('requests.sortStatusCode')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('common.from')}</Label>
                  <Input 
                    type="datetime-local" 
                    value={fromText} 
                    onChange={(e) => setFromText(e.target.value)} 
                    className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-gold/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('common.to')}</Label>
                  <Input 
                    type="datetime-local" 
                    value={toText} 
                    onChange={(e) => setToText(e.target.value)} 
                    className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-gold/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('common.userId')}</Label>
                  <Input 
                    value={reqUserIdText} 
                    onChange={(e) => setReqUserIdText(e.target.value)} 
                    placeholder={t('common.userId')} 
                    className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-gold/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Sıralama Yönü</Label>
                   <Select value={orderDirText} onValueChange={(v) => setOrderDirText(v as 'asc' | 'desc')}>
                      <SelectTrigger className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gm-surface border-gm-border-soft rounded-2xl">
                        <SelectItem value="desc">{t('common.desc')}</SelectItem>
                        <SelectItem value="asc">{t('common.asc')}</SelectItem>
                      </SelectContent>
                    </Select>
                </div>

                <div className="md:col-span-4 flex items-center justify-between pt-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-gm-surface/40 px-6 py-3 rounded-2xl border border-gm-border-soft">
                      <Label className="text-xs font-bold tracking-wide cursor-pointer" htmlFor="only-admin-sw">{t('common.onlyAdmin')}</Label>
                      <Switch id="only-admin-sw" checked={onlyAdminFlag} onCheckedChange={setOnlyAdminFlag} className="data-[state=checked]:bg-gm-gold" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={onResetRequests} className="rounded-full border-gm-border-soft px-8 h-12 hover:bg-gm-surface transition-all">
                      {t('common.reset')}
                    </Button>
                    <Button type="submit" className="bg-gm-gold text-gm-bg hover:bg-gm-gold-dim rounded-full px-10 h-12 font-bold tracking-widest uppercase shadow-lg shadow-gm-gold/20">
                      <Search className="mr-2 h-4 w-4" /> {t('common.apply')}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 border-b border-gm-border-soft bg-gm-surface/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif text-2xl">{t('requests.logsTitle')}</CardTitle>
                <CardDescription className="font-serif italic opacity-70 text-gm-muted">
                  {t('common.totalRecords', { count: String(reqTotal) })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Badge className="bg-gm-gold/10 text-gm-gold border-gm-gold/20 rounded-full px-4 py-1 font-mono text-xs">
                  {reqLoading ? t('common.loading') : `${reqData.items.length} kayıt`}
                </Badge>
                <Separator orientation="vertical" className="h-6 bg-gm-border-soft" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={compareIds.length !== 2}
                  onClick={() => setCompareOpen(true)}
                  className="rounded-full border-gm-gold/40 text-gm-gold hover:bg-gm-gold/10 transition-all font-bold tracking-widest uppercase text-[10px]"
                >
                  {t('requests.compareAction')} ({compareIds.length}/2)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {reqQ.error && (
                <div className="m-8 p-6 rounded-2xl bg-gm-error/10 border border-gm-error/20 text-gm-error font-serif italic text-center">
                  {getErrMessage(reqQ.error, t('error'))}
                </div>
              )}

              <Table>
                <TableHeader className="bg-gm-surface/40">
                  <TableRow className="border-gm-border-soft hover:bg-transparent">
                    <TableHead className="w-12 text-center text-[10px] font-bold text-gm-muted tracking-widest uppercase py-6">{t('requests.compareCol')}</TableHead>
                    <TableHead className="text-[10px] font-bold text-gm-muted tracking-widest uppercase py-6">{t('common.status')}</TableHead>
                    <TableHead className="text-[10px] font-bold text-gm-muted tracking-widest uppercase py-6">{t('requests.method')}</TableHead>
                    <TableHead className="text-[10px] font-bold text-gm-muted tracking-widest uppercase py-6">{t('requests.path')}</TableHead>
                    <TableHead className="text-[10px] font-bold text-gm-muted tracking-widest uppercase py-6">{t('requests.duration')}</TableHead>
                    <TableHead className="text-[10px] font-bold text-gm-muted tracking-widest uppercase py-6">{t('common.user')}</TableHead>
                    <TableHead className="text-[10px] font-bold text-gm-muted tracking-widest uppercase py-6 text-right pr-8">{t('common.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reqLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-gm-border-soft">
                        <TableCell colSpan={7} className="p-8">
                          <Skeleton className="h-12 w-full rounded-2xl bg-gm-surface/40" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : reqData.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center font-serif italic text-gm-muted opacity-60">
                        {t('common.noRecords')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    reqData.items.map((item: AuditRequestLogDto) => (
                      <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-surface/40 transition-colors group">
                        <TableCell className="text-center py-5">
                          <Checkbox
                            checked={compareIds.includes(Number(item.id))}
                            onCheckedChange={(checked) => toggleCompare(Number(item.id), !!checked)}
                            className="border-gm-border-soft data-[state=checked]:bg-gm-gold data-[state=checked]:border-gm-gold"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={statusVariant(item.status_code || 0)}
                            className="rounded-full font-mono font-bold px-3"
                          >
                            {item.status_code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-black tracking-widest uppercase text-gm-gold/80">{item.method}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs font-medium text-gm-text max-w-[300px] truncate">{item.path}</span>
                            <span className="text-[10px] font-mono text-gm-muted opacity-60">{item.ip}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-gm-muted">{item.response_time_ms}ms</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-gm-text">{truncate((item as any).user_email ?? '', 20) || t('common.guest')}</span>
                            <span className="text-[10px] font-mono text-gm-muted opacity-60">{truncate(item.user_id, 8)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-gm-text">{fmtWhen(item.created_at)}</span>
                            <span className="text-[10px] font-mono text-gm-muted opacity-60 italic">{geoLabel(item.country, item.city)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="p-8 border-t border-gm-border-soft bg-gm-surface/40 flex items-center justify-between">
                <p className="text-xs font-serif italic text-gm-muted">
                  {t('common.showingRange', { 
                    start: String(offset + 1), 
                    end: String(Math.min(offset + limit, reqTotal)), 
                    total: String(reqTotal) 
                  })}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrev || reqLoading}
                    onClick={() => apply({ offset: Math.max(0, offset - limit) })}
                    className="rounded-full border-gm-border-soft px-8 h-12 hover:bg-gm-surface transition-all text-[10px] font-bold tracking-widest uppercase"
                  >
                    {t('common.prev')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNextReq || reqLoading}
                    onClick={() => apply({ offset: offset + limit })}
                    className="rounded-full border-gm-border-soft px-8 h-12 hover:bg-gm-surface transition-all text-[10px] font-bold tracking-widest uppercase"
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== AUTH TAB ==================== */}
        <TabsContent value="auth" className="space-y-8 animate-in fade-in duration-700">
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 border-b border-gm-border-soft bg-gm-surface/40">
              <CardTitle className="font-serif text-2xl flex items-center gap-3">
                <Filter className="h-5 w-5 text-gm-gold" /> {t('auth.filtersTitle')}
              </CardTitle>
              <CardDescription className="font-serif italic opacity-70 text-gm-muted">{t('auth.filtersDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={onSubmitAuth} className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('auth.event')}</Label>
                  <Select value={eventText || ''} onValueChange={setEventText}>
                    <SelectTrigger className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50">
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent className="bg-gm-surface border-gm-border-soft rounded-2xl">
                      <SelectItem value={ALL}>{t('common.all')}</SelectItem>
                      {AUDIT_AUTH_EVENTS.map((ev) => (
                        <SelectItem key={ev} value={ev}>
                          {ev}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('auth.email')}</Label>
                  <Input 
                    value={emailText} 
                    onChange={(e) => setEmailText(e.target.value)} 
                    placeholder="example@mail.com"
                    className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-gold/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('common.userId')}</Label>
                  <Input 
                    value={userIdText} 
                    onChange={(e) => setUserIdText(e.target.value)} 
                    placeholder="UUID"
                    className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-gold/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('common.ip')}</Label>
                  <Input 
                    value={ipText} 
                    onChange={(e) => setIpText(e.target.value)} 
                    placeholder="127.0.0.1"
                    className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-gold/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('common.from')}</Label>
                  <Input 
                    type="datetime-local" 
                    value={fromText} 
                    onChange={(e) => setFromText(e.target.value)} 
                    className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-gold/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('common.to')}</Label>
                  <Input 
                    type="datetime-local" 
                    value={toText} 
                    onChange={(e) => setToText(e.target.value)} 
                    className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-gold/50"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onResetAuth} className="rounded-full border-gm-border-soft px-8 h-12 hover:bg-gm-surface transition-all">
                    {t('common.reset')}
                  </Button>
                  <Button type="submit" className="bg-gm-gold text-gm-bg hover:bg-gm-gold-dim rounded-full px-10 h-12 font-bold tracking-widest uppercase shadow-lg shadow-gm-gold/20">
                    <Search className="mr-2 h-4 w-4" /> {t('common.apply')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 border-b border-gm-border-soft bg-gm-surface/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif text-2xl">{t('auth.eventsTitle')}</CardTitle>
                <CardDescription className="font-serif italic opacity-70 text-gm-muted">
                  {t('common.totalRecords', { count: String(authTotal) })}
                </CardDescription>
              </div>
              <Badge className="bg-gm-gold/10 text-gm-gold border-gm-gold/20 rounded-full px-4 py-1 font-mono text-xs">
                {authLoading ? t('common.loading') : `${authData.items.length} kayıt`}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {authQ.error && (
                <div className="m-8 p-6 rounded-2xl bg-gm-error/10 border border-gm-error/20 text-gm-error font-serif italic text-center">
                  {getErrMessage(authQ.error, t('error'))}
                </div>
              )}

              <Table>
                <TableHeader className="bg-gm-surface/40">
                  <TableRow className="border-gm-border-soft hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold text-gm-muted tracking-widest uppercase py-6 pl-8">{t('common.date')}</TableHead>
                    <TableHead className="text-[10px] font-bold text-gm-muted tracking-widest uppercase py-6">{t('auth.event')}</TableHead>
                    <TableHead className="text-[10px] font-bold text-gm-muted tracking-widest uppercase py-6">{t('columns.user')}</TableHead>
                    <TableHead className="text-[10px] font-bold text-gm-muted tracking-widest uppercase py-6">{t('common.ip')}</TableHead>
                    <TableHead className="text-[10px] font-bold text-gm-muted tracking-widest uppercase py-6 text-right pr-8">{t('columns.location')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-gm-border-soft">
                        <TableCell colSpan={5} className="p-8">
                          <Skeleton className="h-12 w-full rounded-2xl bg-gm-surface/40" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : authData.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center font-serif italic text-gm-muted opacity-60">
                        {t('common.noRecords')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    authData.items.map((r) => {
                      const geo = geoLabel(r.country, r.city);
                      return (
                        <TableRow key={String(r.id)} className="border-gm-border-soft hover:bg-gm-surface/40 transition-colors group">
                          <TableCell className="py-5 pl-8 text-xs font-medium text-gm-text">{fmtWhen(r.created_at)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={authEventVariant(r.event)}
                              className="rounded-full px-3 font-bold"
                            >
                              {safeText(r.event)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-gm-text">{safeText(r.email || r.user_id || '—')}</span>
                              <span className="text-[10px] font-mono text-gm-muted opacity-60">{r.user_id ? `uid:${truncate(r.user_id, 8)}` : ''}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-gm-muted">{safeText(r.ip)}</span>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <span className="text-xs font-serif italic text-gm-muted opacity-60">{geo || '—'}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              <div className="p-8 border-t border-gm-border-soft bg-gm-surface/40 flex items-center justify-between">
                <p className="text-xs font-serif italic text-gm-muted">
                  {authTotal === 0 ? '0' : `${offset + 1}-${Math.min(offset + limit, authTotal)}`}
                  {' / '} {authTotal}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrev || authLoading}
                    onClick={() => apply({ offset: Math.max(0, offset - limit) })}
                    className="rounded-full border-gm-border-soft px-8 h-12 hover:bg-gm-surface transition-all text-[10px] font-bold tracking-widest uppercase"
                  >
                    {t('common.prev')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNextAuth || authLoading}
                    onClick={() => apply({ offset: offset + limit })}
                    className="rounded-full border-gm-border-soft px-8 h-12 hover:bg-gm-surface transition-all text-[10px] font-bold tracking-widest uppercase"
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== METRICS TAB ==================== */}
        <TabsContent value="metrics" className="space-y-8 animate-in fade-in duration-700">
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 border-b border-gm-border-soft bg-gm-surface/40">
              <CardTitle className="font-serif text-2xl flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gm-gold" /> {t('metrics.title')}
              </CardTitle>
              <CardDescription className="font-serif italic opacity-70 text-gm-muted">{t('metrics.description')}</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={onSubmitMetrics} className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('metrics.days')}</Label>
                  <Select value={daysText} onValueChange={setDaysText}>
                    <SelectTrigger className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gm-surface border-gm-border-soft rounded-2xl">
                      <SelectItem value="7">{t('metrics.nDays', { n: '7' })}</SelectItem>
                      <SelectItem value="14">{t('metrics.nDays', { n: '14' })}</SelectItem>
                      <SelectItem value="30">{t('metrics.nDays', { n: '30' })}</SelectItem>
                      <SelectItem value="60">{t('metrics.nDays', { n: '60' })}</SelectItem>
                      <SelectItem value="90">{t('metrics.nDays', { n: '90' })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('metrics.pathPrefix')}</Label>
                  <Input 
                    value={pathPrefixText} 
                    onChange={(e) => setPathPrefixText(e.target.value)} 
                    placeholder="/api" 
                    className="bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-gold/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('common.onlyAdmin')}</Label>
                  <div className="flex items-center gap-3 bg-gm-surface/40 px-6 py-3 rounded-2xl border border-gm-border-soft h-12">
                    <Label className="text-xs font-bold tracking-wide cursor-pointer" htmlFor="metrics-only-admin-sw">{t('common.onlyAdmin')}</Label>
                    <Switch id="metrics-only-admin-sw" checked={onlyAdminFlag} onCheckedChange={setOnlyAdminFlag} className="data-[state=checked]:bg-gm-gold" />
                  </div>
                </div>

                <div className="md:col-span-3 flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onResetMetrics} className="rounded-full border-gm-border-soft px-8 h-12 hover:bg-gm-surface transition-all">
                    {t('common.reset')}
                  </Button>
                  <Button type="submit" className="bg-gm-gold text-gm-bg hover:bg-gm-gold-dim rounded-full px-10 h-12 font-bold tracking-widest uppercase shadow-lg shadow-gm-gold/20">
                    <Filter className="mr-2 h-4 w-4" /> {t('common.apply')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 border-b border-gm-border-soft bg-gm-surface/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif text-2xl">{t('metrics.chartTitle')}</CardTitle>
                <CardDescription className="font-serif italic opacity-70 text-gm-muted">{t('metrics.lastNDays', { n: String(metricsData.days?.length ?? 0) })}</CardDescription>
              </div>
              {metricsLoading && (
                <Badge className="bg-gm-gold/10 text-gm-gold border-gm-gold/20 rounded-full px-4 py-1 font-mono text-xs animate-pulse">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" /> {t('common.loading')}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-8">
              {metricsQ.error && (
                <div className="p-6 rounded-2xl bg-gm-error/10 border border-gm-error/20 text-gm-error font-serif italic text-center mb-6">
                  {getErrMessage(metricsQ.error, t('error'))}
                </div>
              )}
              <div className="bg-gm-surface/40 p-8 rounded-[24px] border border-gm-border-soft shadow-inner">
                <AuditDailyChart rows={metricsData.days ?? []} loading={metricsLoading} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== MAP TAB ==================== */}
        <TabsContent value="map" className="space-y-8 animate-in fade-in duration-700">
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 border-b border-gm-border-soft bg-gm-surface/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif text-2xl flex items-center gap-3">
                  <Globe className="h-5 w-5 text-gm-gold" /> {t('map.title')}
                </CardTitle>
                <CardDescription className="font-serif italic opacity-70 text-gm-muted">
                  {t('map.description', { days: String(geoParams.days) })}
                </CardDescription>
              </div>
              {geoLoading && (
                <Badge className="bg-gm-gold/10 text-gm-gold border-gm-gold/20 rounded-full px-4 py-1 font-mono text-xs animate-pulse">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" /> {t('common.loading')}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-8">
              {geoQ.error && (
                <div className="p-6 rounded-2xl bg-gm-error/10 border border-gm-error/20 text-gm-error font-serif italic text-center mb-6">
                  {getErrMessage(geoQ.error, t('error'))}
                </div>
              )}
              <div className="bg-gm-bg-deep p-4 rounded-[24px] border border-gm-border-soft overflow-hidden h-[600px] shadow-inner">
                <AuditGeoMap items={geoData.items ?? []} loading={geoLoading} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== STREAM TAB ==================== */}
        <TabsContent value="stream" className="space-y-8 animate-in fade-in duration-700">
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 border-b border-gm-border-soft bg-gm-surface/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif text-2xl flex items-center gap-3">
                  <Zap className="h-5 w-5 text-gm-gold" /> {t('stream.title')}
                </CardTitle>
                <CardDescription className="font-serif italic opacity-70 text-gm-muted">{t('stream.description')}</CardDescription>
              </div>
              <Badge 
                variant={streamStatusVariant(streamStatus)}
                className="rounded-full px-4 py-1 font-bold uppercase tracking-widest text-[10px]"
              >
                {t(`stream.status.${streamStatus}`)}
              </Badge>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-serif italic text-gm-muted">{t('stream.recentCount', { count: String(streamEvents.length) })}</span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStreamEvents([])}
                  className="rounded-full text-gm-gold hover:bg-gm-gold/10 font-bold tracking-widest uppercase text-[10px]"
                >
                  {t('stream.clearLocal')}
                </Button>
              </div>

              <div className="space-y-4">
                {streamEvents.length === 0 ? (
                  <div className="rounded-[24px] border border-gm-border-soft bg-gm-surface/40 p-12 text-center font-serif italic text-gm-muted opacity-60">
                    {t('stream.empty')}
                  </div>
                ) : (
                  streamEvents.map((evt, idx) => (
                    <div key={`${evt.id || evt.ts || 'evt'}-${idx}`} className="rounded-[24px] border border-gm-border-soft bg-gm-surface/40 p-6 hover:border-gm-gold/30 transition-all group">
                      <div className="flex flex-wrap items-center gap-4">
                        <Badge 
                          variant={streamEventVariant(evt.level)}
                          className="rounded-full px-3 font-bold"
                        >
                          {safeText(evt.level, 'info')}
                        </Badge>
                        <span className="text-xs font-bold text-gm-text tracking-wide uppercase">{safeText(evt.topic, t('stream.unknownTopic'))}</span>
                        <span className="text-[10px] font-mono text-gm-muted ml-auto">{fmtWhen(evt.ts)}</span>
                      </div>
                      <div className="mt-3 text-sm text-gm-text leading-relaxed">
                        {safeText(evt.message, t('stream.noMessage'))}
                      </div>
                      <div className="mt-3 text-[10px] font-mono text-gm-muted/60 flex gap-3">
                        {evt.actor_user_id && <span className="bg-gm-surface px-2 py-1 rounded">uid: {evt.actor_user_id}</span>}
                        {evt.ip && <span className="bg-gm-surface px-2 py-1 rounded">ip: {evt.ip}</span>}
                      </div>
                      {evt.meta && (
                        <pre className="mt-4 overflow-x-auto rounded-xl bg-gm-bg-deep/80 p-4 text-[10px] font-mono text-gm-gold/70 border border-gm-border-soft/50">
                          {JSON.stringify(evt.meta, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-6xl bg-gm-bg-deep border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl p-0">
          <DialogHeader className="p-8 border-b border-gm-border-soft bg-gm-surface/40">
            <DialogTitle className="font-serif text-3xl text-gm-gold">{t('compare.title')}</DialogTitle>
            <DialogDescription className="font-serif italic opacity-70 text-gm-muted">{t('compare.description')}</DialogDescription>
          </DialogHeader>

          <div className="p-8">
            {compareLeft && compareRight ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[24px] border border-gm-border-soft bg-gm-surface/40 overflow-hidden shadow-inner">
                  <div className="border-b border-gm-border-soft px-6 py-4 bg-gm-surface/60">
                    <div className="font-mono text-xs font-bold text-gm-gold uppercase tracking-widest">{safeText(compareLeft.method)} {safeText(compareLeft.path)}</div>
                    <div className="text-[10px] font-mono text-gm-muted mt-1 opacity-60">
                      #{compareLeft.id} · {fmtWhen(compareLeft.created_at)}
                    </div>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="p-6 font-mono text-[11px] leading-relaxed">
                      {compareRows.map((row) => (
                        <div
                          key={`left-${row.lineNo}`}
                          className={cn(
                            "flex gap-4 px-2 py-0.5 rounded transition-colors",
                            row.changed ? 'bg-gm-gold/10 text-gm-gold' : 'text-gm-text/70'
                          )}
                        >
                          <span className="shrink-0 w-8 text-gm-muted/40 text-right select-none border-r border-gm-border-soft/30 pr-3">{row.lineNo}</span>
                          <span className="whitespace-pre-wrap break-all font-mono">{row.left || ' '}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="rounded-[24px] border border-gm-border-soft bg-gm-surface/40 overflow-hidden shadow-inner">
                  <div className="border-b border-gm-border-soft px-6 py-4 bg-gm-surface/60">
                    <div className="font-mono text-xs font-bold text-gm-gold uppercase tracking-widest">{safeText(compareRight.method)} {safeText(compareRight.path)}</div>
                    <div className="text-[10px] font-mono text-gm-muted mt-1 opacity-60">
                      #{compareRight.id} · {fmtWhen(compareRight.created_at)}
                    </div>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="p-6 font-mono text-[11px] leading-relaxed">
                      {compareRows.map((row) => (
                        <div
                          key={`right-${row.lineNo}`}
                          className={cn(
                            "flex gap-4 px-2 py-0.5 rounded transition-colors",
                            row.changed ? 'bg-gm-primary/10 text-gm-primary-light' : 'text-gm-text/70'
                          )}
                        >
                          <span className="shrink-0 w-8 text-gm-muted/40 text-right select-none border-r border-gm-border-soft/30 pr-3">{row.lineNo}</span>
                          <span className="whitespace-pre-wrap break-all font-mono">{row.right || ' '}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-gm-border-soft bg-gm-surface/40 p-12 text-center font-serif italic text-gm-muted opacity-60">
                {t('compare.needTwo')}
              </div>
            )}
          </div>

          <DialogFooter className="p-8 border-t border-gm-border-soft bg-gm-surface/40">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setCompareOpen(false)}
              className="rounded-full border-gm-border-soft px-12 h-12 hover:bg-gm-surface transition-all font-bold tracking-widest uppercase text-xs"
            >
              {t('compare.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
