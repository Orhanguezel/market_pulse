'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  RefreshCcw, 
  Filter, 
  ShieldAlert, 
  ShieldCheck, 
  User, 
  ChevronRight,
  Search,
  Settings2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import { Card, CardContent } from '@/components/ui/card';

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';

import type { UserRoleName, UserRole, UserRolesListParams, AdminUserView } from '@/integrations/shared';

import {
  useAdminUserRolesListQuery,
  useAdminUserRoleCreateMutation,
  useAdminUserRoleDeleteMutation,
  useAdminListQuery,
  useAdminGetQuery,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Skeleton } from '@/components/ui/skeleton';

type UserOption = {
  id: string; 
  name: string; 
};

export default function UserRolesClient() {
  const t = useAdminT('admin.userRoles');

  function roleLabel(r: UserRoleName) {
    if (r === 'admin') return t('roles.admin');
    if (r === 'consultant') return t('roles.consultant');
    return t('roles.user');
  }

  function userName(u: Pick<AdminUserView, 'full_name'>): string {
    const name = String(u.full_name ?? '').trim();
    return name.length ? name : t('user.unknown');
  }

  function getErrMessage(err: unknown): string {
    const anyErr = err as any;
    return anyErr?.data?.error?.message || anyErr?.data?.message || anyErr?.error || t('errorFallback');
  }

  const usersQ = useAdminListQuery(
    { limit: 200, offset: 0, sort: 'created_at', order: 'desc' },
    { refetchOnMountOrArgChange: true },
  );

  const baseUserOptions = React.useMemo<UserOption[]>(() => {
    const items: UserOption[] = (usersQ.data ?? []).map((u) => ({
      id: u.id,
      name: userName(u),
    }));
    items.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    return items;
  }, [usersQ.data]);

  const [filterUserId, setFilterUserId] = React.useState<string>('all');
  const [role, setRole] = React.useState<UserRoleName | 'all'>('all');
  const [limit, setLimit] = React.useState(50);

  const params = React.useMemo<UserRolesListParams>(
    () => ({
      ...(filterUserId !== 'all' ? { user_id: filterUserId } : {}),
      ...(role !== 'all' ? { role: role as UserRoleName } : {}),
      order: 'created_at',
      direction: 'desc',
      limit,
      offset: 0,
    }),
    [filterUserId, role, limit],
  );

  const rolesQ = useAdminUserRolesListQuery(params);
  const [createRole, createState] = useAdminUserRoleCreateMutation();
  const [deleteRole, deleteState] = useAdminUserRoleDeleteMutation();

  const [userCache, setUserCache] = React.useState<Map<string, AdminUserView>>(() => new Map());

  React.useEffect(() => {
    if (!usersQ.data?.length) return;
    setUserCache((prev) => {
      const next = new Map(prev);
      for (const u of usersQ.data ?? []) next.set(u.id, u);
      return next;
    });
  }, [usersQ.data]);

  const missingUserIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const r of rolesQ.data ?? []) {
      if (!r?.user_id) continue;
      const id = String(r.user_id);
      if (!userCache.has(id)) ids.add(id);
    }
    return Array.from(ids);
  }, [rolesQ.data, userCache]);

  const [queue, setQueue] = React.useState<string[]>([]);
  const [queueId, setQueueId] = React.useState<string>('');

  React.useEffect(() => {
    if (!missingUserIds.length) return;
    setQueue((prev) => {
      const prevSet = new Set(prev);
      const toAdd = missingUserIds.filter((id) => !prevSet.has(id));
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });
  }, [missingUserIds]);

  React.useEffect(() => {
    if (queueId || !queue.length) return;
    setQueueId(queue[0]);
    setQueue((prev) => prev.slice(1));
  }, [queue, queueId]);

  const userGetQ = useAdminGetQuery(
    { id: queueId },
    { skip: !queueId, refetchOnMountOrArgChange: true },
  );

  React.useEffect(() => {
    if (!queueId) return;
    if (userGetQ.isError) {
      setQueueId('');
      return;
    }
    if (userGetQ.data) {
      setUserCache((prev) => {
        const next = new Map(prev);
        next.set(queueId, userGetQ.data as AdminUserView);
        return next;
      });
      setQueueId('');
    }
  }, [queueId, userGetQ.data, userGetQ.isError]);

  function userNameById(id: string): { text: string; status: 'ok' | 'loading' | 'missing' } {
    const u = userCache.get(id);
    if (u) return { text: userName(u), status: 'ok' };
    if ((queueId === id && userGetQ.isFetching) || queue.includes(id)) return { text: t('user.loading'), status: 'loading' };
    return { text: t('user.notFound'), status: 'missing' };
  }

  const [newUserId, setNewUserId] = React.useState<string>('');
  const [newRole, setNewRole] = React.useState<UserRoleName>('user');

  const busy = rolesQ.isFetching || createState.isLoading || deleteState.isLoading || usersQ.isFetching || userGetQ.isFetching;

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserId) {
      toast.error(t('create.selectUser'));
      return;
    }
    try {
      await createRole({ user_id: newUserId, role: newRole }).unwrap();
      toast.success(t('create.added'));
      setNewUserId('');
      setNewRole('user');
      rolesQ.refetch();
    } catch (err) {
      const msg = getErrMessage(err);
      toast.error(msg === 'user_role_already_exists' ? t('create.alreadyExists') : msg);
    }
  }

  async function onDelete(row: UserRole) {
    const who = userNameById(row.user_id).text;
    if (!confirm(t('table.deleteConfirm', { user: who, role: roleLabel(row.role) }))) return;
    try {
      await deleteRole({ id: row.id }).unwrap();
      toast.success(t('table.deleted'));
      rolesQ.refetch();
    } catch (err) {
      toast.error(getErrMessage(err));
    }
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">Erişim Yönetimi</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('title')}</h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            {t('description')}
          </p>
        </div>

        <Button 
          onClick={() => rolesQ.refetch()} 
          disabled={busy} 
          variant="outline"
          className="rounded-full border-gm-border-soft px-8 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-surface shadow-lg backdrop-blur-sm text-gm-text"
        >
          <RefreshCcw className={cn("mr-2 size-4 text-gm-gold", rolesQ.isFetching && "animate-spin")} />
          Yenile
        </Button>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start">
        {/* Creation Card */}
        <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
          <CardContent className="p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-gm-gold/10 flex items-center justify-center text-gm-gold border border-gm-gold/20 shadow-inner">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-gm-text font-serif text-xl">Yeni Yetki Atama</h3>
            </div>

            <form onSubmit={onCreate} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Kullanıcı Seçimi</Label>
                <Select value={newUserId} onValueChange={setNewUserId} disabled={busy}>
                  <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-14 focus:ring-gm-gold/50 text-sm text-gm-text">
                    <SelectValue placeholder={usersQ.isFetching ? t('create.usersLoading') : t('create.userPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl text-gm-text">
                    {baseUserOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Rol / Yetki</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRoleName)} disabled={busy}>
                  <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-14 focus:ring-gm-gold/50 text-sm text-gm-text">
                    <SelectValue placeholder={t('create.rolePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl text-gm-text">
                    <SelectItem value="admin" className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">{t('roles.admin')}</SelectItem>
                    <SelectItem value="consultant" className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">{t('roles.consultant')}</SelectItem>
                    <SelectItem value="user" className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">{t('roles.user')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                disabled={busy || !newUserId}
                className="w-full bg-gm-gold hover:bg-gm-gold-light text-black rounded-full h-14 font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-gm-gold/20 transition-all active:scale-95"
              >
                <Plus className="mr-2 size-4" />
                Yetkiyi Onayla
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List Card */}
        <div className="space-y-6">
          {/* Filters Bar */}
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3 text-gm-gold">
                <Filter size={16} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Filtrele</span>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <Select value={filterUserId} onValueChange={setFilterUserId} disabled={busy}>
                  <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-10 text-xs text-gm-text">
                    <SelectValue placeholder="Kullanıcı Seç" />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl text-gm-text">
                    <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                    {baseUserOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-40">
                <Select value={role} onValueChange={(v) => setRole(v as any)} disabled={busy}>
                  <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-10 text-xs text-gm-text">
                    <SelectValue placeholder="Tüm Roller" />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl text-gm-text">
                    <SelectItem value="all">Tüm Roller</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="consultant">Danışman</SelectItem>
                    <SelectItem value="user">Kullanıcı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Table Container */}
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gm-surface/40">
                  <TableRow className="border-gm-border-soft hover:bg-transparent">
                    <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kullanıcı</TableHead>
                    <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Yetki</TableHead>
                    <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Tarih</TableHead>
                    <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">Aksiyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rolesQ.isFetching && !rolesQ.data?.length ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-gm-border-soft">
                        <TableCell className="py-6 px-8"><Skeleton className="h-5 w-40 bg-gm-surface/20" /></TableCell>
                        <TableCell className="py-6"><Skeleton className="h-6 w-20 rounded-full bg-gm-surface/20" /></TableCell>
                        <TableCell className="py-6"><Skeleton className="h-5 w-32 bg-gm-surface/20" /></TableCell>
                        <TableCell className="py-6 px-8 text-right"><Skeleton className="h-10 w-10 ml-auto rounded-full bg-gm-surface/20" /></TableCell>
                      </TableRow>
                    ))
                  ) : rolesQ.data?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <ShieldCheck size={64} className="text-gm-muted" />
                          <p className="font-serif italic text-lg text-gm-muted">Kayıtlı rol bulunamadı.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rolesQ.data?.map((row) => {
                      const u = userNameById(row.user_id);
                      const isAdmin = row.role === 'admin';
                      return (
                        <TableRow key={row.id} className="border-gm-border-soft hover:bg-gm-primary/2 group transition-colors">
                          <TableCell className="py-6 px-8">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-full bg-gm-surface flex items-center justify-center text-gm-muted border border-gm-border-soft">
                                <User size={18} />
                              </div>
                              <div className="space-y-0.5">
                                <div className="text-gm-text font-serif text-lg leading-tight">{u.text}</div>
                                <div className="text-[10px] text-gm-muted font-mono uppercase tracking-tighter opacity-60">ID: {row.user_id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <Badge 
                              className={cn(
                                "text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm",
                                isAdmin 
                                  ? "bg-gm-gold/10 text-gm-gold border-gm-gold/20" 
                                  : "bg-gm-surface/60 text-gm-muted border-gm-border-soft"
                              )}
                            >
                              {roleLabel(row.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="text-[10px] text-gm-muted font-mono">
                              {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-8 text-right">
                            <button
                              onClick={() => onDelete(row)}
                              disabled={busy}
                              className="p-3 rounded-full hover:bg-gm-error/10 text-gm-error/40 hover:text-gm-error transition-all border border-transparent hover:border-gm-error/20 opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={18} />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
