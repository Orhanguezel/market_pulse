'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Plus, 
  RefreshCcw, 
  Search, 
  Trash2, 
  Pencil, 
  CheckCheck, 
  Bell, 
  BellOff, 
  Send,
  Filter,
  History,
  Layout,
  ChevronRight
} from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { NotificationView, NotificationsListParams } from '@/integrations/shared';
import {
  useListNotificationsQuery,
  useDeleteNotificationMutation,
  useMarkAllReadMutation,
  useUpdateNotificationMutation,
} from '@/integrations/hooks';

type ReadFilter = 'all' | 'read' | 'unread';

type Filters = {
  search: string;
  readFilter: ReadFilter;
  type: string;
};

const localeMapping: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
};

function fmtDate(val: string | null | undefined, localeStr: string) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    const loc = localeMapping[localeStr] || 'tr-TR';
    return d.toLocaleString(loc, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(val);
  }
}

function truncate(text: string, max = 60) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

export default function AdminNotificationsClient() {
  const router = useRouter();
  const t = useAdminT('admin.notifications');
  const adminLocale = usePreferencesStore((s) => s.adminLocale);

  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    readFilter: 'all',
    type: 'all',
  });

  const is_read = React.useMemo(() => {
    if (filters.readFilter === 'all') return undefined;
    return filters.readFilter === 'read' ? 1 : 0;
  }, [filters.readFilter]);

  const queryParams = React.useMemo(() => {
    const qp: NotificationsListParams = {
      is_read,
      type: filters.type === 'all' ? undefined : filters.type,
      limit: 200,
      offset: 0,
    };
    return qp;
  }, [is_read, filters.type]);

  const {
    data: items = [],
    isLoading,
    isFetching,
    refetch,
  } = useListNotificationsQuery(queryParams);

  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllReadMutation();
  const [updateNotification] = useUpdateNotificationMutation();

  const busy = isLoading || isFetching || isDeleting || isMarkingAll;

  const filteredItems = React.useMemo(() => {
    if (!filters.search.trim()) return items;
    const q = filters.search.toLowerCase();
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q)
    );
  }, [items, filters.search]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      toast.success(t('messages.markAllSuccess'));
    } catch (err) {
      toast.error(t('messages.operationFailed'));
    }
  };

  const handleToggleRead = async (item: NotificationView) => {
    try {
      await updateNotification({ id: item.id, body: { is_read: !item.is_read } }).unwrap();
      toast.success(
        item.is_read
          ? t('messages.markedUnread')
          : t('messages.markedRead')
      );
    } catch (err) {
      toast.error(t('messages.operationFailed'));
    }
  };

  const handleDelete = async (item: NotificationView) => {
    if (!confirm(t('messages.deleteConfirm', { title: item.title }))) return;

    try {
      await deleteNotification({ id: item.id }).unwrap();
      toast.success(t('messages.deleteSuccess'));
    } catch (err) {
      toast.error(t('messages.operationFailed'));
    }
  };

  const handleEdit = (item: NotificationView) => {
    router.push(`/admin/notifications/${encodeURIComponent(item.id)}`);
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  const typeOptions = React.useMemo(() => {
    const types = new Set(items.map((n) => n.type));
    return Array.from(types).sort();
  }, [items]);

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              {t('header.badge')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('header.title')}</h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            {t('header.description', { count: filteredItems.length, unread: unreadCount })}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleMarkAllRead} 
            disabled={busy || unreadCount === 0} 
            variant="outline"
            className="rounded-full border-gm-border-soft px-6 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-primary/5 shadow-lg backdrop-blur-sm"
          >
            <CheckCheck className="mr-2 size-4" />
            {t('actions.markAllRead')}
          </Button>
          <Button 
            onClick={() => refetch()} 
            disabled={busy} 
            variant="outline"
            className="rounded-full border-gm-border-soft px-6 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-primary/5 shadow-lg backdrop-blur-sm"
          >
            <RefreshCcw className={cn('mr-2 size-4', busy && 'animate-spin')} />
            {t('actions.refresh')}
          </Button>
          <Button 
            onClick={() => router.push('/admin/notifications/send')} 
            variant="outline"
            className="rounded-full border-gm-gold/40 text-gm-gold px-6 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-gold/10 shadow-lg backdrop-blur-sm"
          >
            <Send className="mr-2 size-4" />
            {t('actions.sendPush')}
          </Button>
          <Button 
            onClick={() => router.push('/admin/notifications/new')} 
            className="bg-gm-gold text-gm-bg hover:bg-gm-gold-dim rounded-full px-8 h-12 font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-gm-gold/20 transition-all active:scale-95"
          >
            <Plus className="mr-2 size-4" />
            {t('actions.create')}
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardHeader className="border-b border-gm-border-soft bg-gm-surface/40 px-8 py-6">
          <div className="flex items-center gap-3">
            <Filter className="size-5 text-gm-gold" />
            <CardTitle className="font-serif text-xl text-gm-text">{t('filters.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Search */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-gm-text tracking-[0.2em] uppercase ml-1 opacity-70">{t('filters.search')}</Label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
                <Input
                  className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm transition-all"
                  placeholder={t('filters.searchPlaceholder')}
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                />
              </div>
            </div>

            {/* Read Filter */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-gm-text tracking-[0.2em] uppercase ml-1 opacity-70">{t('filters.status')}</Label>
              <Select
                value={filters.readFilter}
                onValueChange={(v) => setFilters((p) => ({ ...p, readFilter: v as ReadFilter }))}
              >
                <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 text-sm focus:ring-gm-gold/50 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl shadow-2xl">
                  <SelectItem value="all" className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">{t('filters.all')}</SelectItem>
                  <SelectItem value="read" className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">{t('filters.read')}</SelectItem>
                  <SelectItem value="unread" className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">{t('filters.unread')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-gm-text tracking-[0.2em] uppercase ml-1 opacity-70">{t('filters.type')}</Label>
              <Select
                value={filters.type}
                onValueChange={(v) => setFilters((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 text-sm focus:ring-gm-gold/50 transition-all">
                  <SelectValue placeholder={t('filters.typePlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl shadow-2xl">
                  <SelectItem value="all" className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">{t('filters.all')}</SelectItem>
                  {typeOptions.map((tVal) => (
                    <SelectItem key={tVal} value={tVal} className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">
                      {t(`types.${tVal}`, null, tVal)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List Card */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="w-16 py-6 px-8 text-center text-[10px] font-bold uppercase tracking-widest text-gm-text">{t('table.status')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-text">{t('table.title')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-text">{t('table.message')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-text">{t('table.type')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center text-gm-text">{t('table.date')}</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-text">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-gm-border-soft">
                    <TableCell className="py-6 px-8 text-center"><Skeleton className="h-6 w-6 mx-auto rounded-full bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-8 w-40 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-8 w-64 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-6 w-20 rounded-full bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-6 w-32 mx-auto bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6 px-8"><Skeleton className="h-10 w-24 ml-auto bg-gm-surface/20 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-30 animate-pulse">
                      <BellOff className="w-20 h-20 text-gm-gold/50" />
                      <span className="font-serif italic text-xl text-gm-muted">{t('table.empty')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      'border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group cursor-pointer',
                      !item.is_read && 'bg-gm-gold/[0.02]'
                    )}
                    onClick={() => handleEdit(item)}
                  >
                    <TableCell className="py-6 px-8 text-center">
                      <div className="flex justify-center">
                        {item.is_read ? (
                          <div className="p-2 rounded-full bg-gm-muted/10 text-gm-muted/40">
                            <BellOff className="size-4" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-full bg-gm-gold/10 text-gm-gold shadow-[0_0_12px_rgba(212,175,55,0.2)] animate-pulse">
                            <Bell className="size-4" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className={cn(
                        "font-serif text-lg text-gm-text transition-colors duration-500",
                        !item.is_read && "font-bold text-gm-gold"
                      )}>
                        {truncate(item.title, 40)}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="text-sm text-gm-muted font-serif italic opacity-70 leading-relaxed max-w-xs truncate">
                        {truncate(item.message, 80)}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge variant="outline" className="bg-gm-surface/40 border-gm-border-soft text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                        {t(`types.${item.type}`, null, item.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="text-[10px] text-gm-muted font-mono opacity-70">
                        {fmtDate(item.created_at, adminLocale)}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-all duration-300">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRead(item);
                          }}
                          disabled={busy}
                          className="rounded-full hover:bg-gm-gold/10 text-[10px] font-bold tracking-widest uppercase h-9"
                        >
                          {item.is_read ? t('actions.markUnread') : t('actions.markRead')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                          disabled={busy}
                          className="rounded-full hover:bg-gm-surface h-9"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <button
                          className="p-2 rounded-full hover:bg-gm-error/10 text-gm-error/40 hover:text-gm-error transition-all border border-transparent hover:border-gm-error/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                          disabled={busy}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
