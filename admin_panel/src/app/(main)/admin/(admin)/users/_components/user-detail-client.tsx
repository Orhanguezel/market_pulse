'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Save, 
  ShieldCheck, 
  KeyRound, 
  Trash2, 
  Mail, 
  Phone, 
  User, 
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { UserRoleName, AdminUserView } from '@/integrations/shared';
import {
  useGetUserAdminQuery,
  useUpdateUserAdminMutation,
  useSetUserActiveAdminMutation,
  useSetUserRolesAdminMutation,
  useSetUserPasswordAdminMutation,
  useRemoveUserAdminMutation,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { cn } from '@/lib/utils';

const ALL_ROLES: UserRoleName[] = ['admin', 'consultant', 'user'];

export default function UserDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useAdminT('admin.users.detail');

  const userQ = useGetUserAdminQuery({ id });
  const [updateUser, updateState] = useUpdateUserAdminMutation();
  const [setActive, setActiveState] = useSetUserActiveAdminMutation();
  const [setRoles, setRolesState] = useSetUserRolesAdminMutation();
  const [setPassword, setPasswordState] = useSetUserPasswordAdminMutation();
  const [removeUser, removeState] = useRemoveUserAdminMutation();

  const u = userQ.data;

  // Form states
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPasswordLocal] = React.useState('');
  const [active, setActiveLocal] = React.useState(true);
  const [roles, setRolesLocal] = React.useState<UserRoleName[]>([]);

  React.useEffect(() => {
    if (!u) return;
    setFullName(u.full_name ?? '');
    setPhone(u.phone ?? '');
    setEmail(u.email ?? '');
    setActiveLocal(!!u.is_active);
    setRolesLocal(u.roles.length > 0 ? u.roles : ['user']);
  }, [u, id]);

  const busy =
    userQ.isFetching ||
    updateState.isLoading ||
    setActiveState.isLoading ||
    setRolesState.isLoading ||
    setPasswordState.isLoading ||
    removeState.isLoading;

  function getErrMessage(err: unknown): string {
    const anyErr = err as any;
    return anyErr?.data?.error?.message || anyErr?.data?.message || anyErr?.error || t('errorFallback');
  }

  async function onSaveProfile() {
    try {
      await updateUser({
        id,
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || undefined,
      }).unwrap();
      toast.success(t('profile.saved'));
      userQ.refetch();
    } catch (err) {
      toast.error(getErrMessage(err));
    }
  }

  async function onToggleActive(next: boolean) {
    const prev = active;
    try {
      setActiveLocal(next);
      await setActive({ id, is_active: next }).unwrap();
      toast.success(next ? t('status.activated') : t('status.deactivated'));
      userQ.refetch();
    } catch (err) {
      setActiveLocal(prev);
      toast.error(getErrMessage(err));
    }
  }

  async function onSaveRoles() {
    try {
      await setRoles({ id, roles }).unwrap();
      toast.success(t('roles.saved'));
      userQ.refetch();
    } catch (err) {
      toast.error(getErrMessage(err));
    }
  }

  async function onSetPassword() {
    const p = password.trim();
    if (p.length < 8) {
      toast.error(t('password.minLengthError'));
      return;
    }
    try {
      await setPassword({ id, password: p }).unwrap();
      toast.success(t('password.updated'));
      setPasswordLocal('');
    } catch (err) {
      toast.error(getErrMessage(err));
    }
  }

  async function onDeleteUser() {
    if (!confirm(t('delete.confirm'))) return;
    try {
      await removeUser({ id }).unwrap();
      toast.success(t('delete.deleted'));
      router.replace('/admin/users');
      router.refresh();
    } catch (err) {
      toast.error(getErrMessage(err));
    }
  }

  if (userQ.isError) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-full hover:bg-gm-surface transition-all">
          <ArrowLeft className="mr-2 size-4" />
          {t('backButton')}
        </Button>
        <Card className="bg-gm-error/5 border-gm-error/20 rounded-[32px] p-12 text-center">
          <AlertCircle className="size-12 text-gm-error mx-auto mb-4 opacity-50" />
          <h2 className="font-serif text-2xl text-gm-error mb-2">{t('loadError')}</h2>
          <Button variant="outline" onClick={() => userQ.refetch()} className="rounded-full border-gm-error/30 text-gm-error hover:bg-gm-error/10 transition-all">
            {t('retryButton')}
          </Button>
        </Card>
      </div>
    );
  }

  if (!u) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-32 rounded-full bg-gm-surface/20" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-[32px] bg-gm-surface/20 lg:col-span-2" />
          <Skeleton className="h-64 rounded-[32px] bg-gm-surface/20" />
        </div>
      </div>
    );
  }

  const currentRole = roles[0] || 'user';

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()} 
              disabled={busy}
              className="rounded-full -ml-3 hover:bg-gm-surface group transition-all"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">{t('title')}</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-4xl text-gm-text">
              {u.full_name || t('unknownUser')}
            </h1>
            <Badge className={cn(
              "rounded-full px-4 py-1 text-[10px] font-bold tracking-widest uppercase border",
              u.is_active ? "bg-gm-success/10 text-gm-success border-gm-success/20" : "bg-gm-error/10 text-gm-error border-gm-error/20"
            )}>
              {u.is_active ? t('statusActive') : t('statusInactive')}
            </Badge>
          </div>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">ID: {u.id}</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/20 px-4 py-2 text-gm-muted text-[10px] font-bold tracking-widest uppercase">
            {t(`roles.${currentRole as any}`)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-2 bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl flex flex-col">
          <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
            <CardTitle className="font-serif text-2xl flex items-center gap-3">
              <User className="h-5 w-5 text-gm-gold" /> {t('profile.title')}
            </CardTitle>
            <CardDescription className="font-serif italic text-gm-muted opacity-70">{t('profile.description')}</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8 flex-1">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('profile.emailLabel')}</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50" />
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={busy}
                    className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="full_name" className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('profile.fullNameLabel')}</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={busy}
                  className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('profile.phoneLabel')}</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={busy}
                    className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={onSaveProfile} disabled={busy} className="rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-dim px-10 h-12 font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-gm-gold/20 transition-all active:scale-95">
                <Save className="mr-2 size-4" />
                {t('profile.saveButton')}
              </Button>
            </div>

            <Separator className="bg-gm-border-soft" />

            {/* Verification & Status Row */}
            <div className="grid gap-12 md:grid-cols-2">
              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">{t('verification.title')}</div>
                  <div className="text-xs text-gm-muted/60 italic font-serif">{t('verification.description')}</div>
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                  u.email_verified ? "bg-gm-success/5 border-gm-success/20 text-gm-success" : "bg-gm-error/5 border-gm-error/20 text-gm-error"
                )}>
                  {u.email_verified ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    {u.email_verified ? t('verification.verified') : t('verification.unverified')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">{t('status.title')}</div>
                  <div className="text-xs text-gm-muted/60 italic font-serif">{t('status.description')}</div>
                </div>
                <div className="flex items-center gap-4 bg-gm-surface/40 p-2 rounded-full border border-gm-border-soft group-hover:border-gm-gold/30 transition-all">
                  <Label className={cn(
                    "text-[10px] font-bold tracking-widest uppercase pl-2",
                    active ? "text-gm-success" : "text-gm-error"
                  )}>
                    {active ? t('status.active') : t('status.inactive')}
                  </Label>
                  <Switch 
                    checked={active} 
                    onCheckedChange={onToggleActive} 
                    disabled={busy} 
                    className="data-[state=checked]:bg-gm-success data-[state=unchecked]:bg-gm-error"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8 flex flex-col">
          {/* Roles Card */}
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl flex-1">
            <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
              <CardTitle className="font-serif text-2xl flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-gm-gold" /> {t('roles.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex flex-col gap-3">
                {ALL_ROLES.map((r) => {
                  const checked = currentRole === r;
                  return (
                    <Button
                      key={r}
                      type="button"
                      variant="outline"
                      onClick={() => setRolesLocal([r])}
                      disabled={busy}
                      className={cn(
                        "rounded-2xl h-14 justify-start px-6 font-serif text-lg transition-all border-gm-border-soft",
                        checked 
                          ? "bg-gm-gold text-gm-bg border-gm-gold shadow-lg shadow-gm-gold/20" 
                          : "bg-gm-surface/20 hover:bg-gm-surface hover:border-gm-gold/50"
                      )}
                    >
                      <ShieldCheck className={cn("mr-4 size-5", checked ? "opacity-100" : "opacity-20")} />
                      {t(`roles.${r as any}`)}
                    </Button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={onSaveRoles} disabled={busy} size="sm" className="rounded-full border border-gm-border-soft bg-gm-surface/40 hover:bg-gm-surface text-gm-text transition-all font-bold tracking-widest uppercase text-[10px] px-8 h-10">
                  <Save className="mr-2 size-4" />
                  {t('roles.saveButton')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Password Card */}
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
              <CardTitle className="font-serif text-xl flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-gm-gold" /> {t('password.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="password" className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('password.label')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('password.placeholder')}
                  value={password}
                  onChange={(e) => setPasswordLocal(e.target.value)}
                  disabled={busy}
                  className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={onSetPassword} disabled={busy} size="sm" className="rounded-full border border-gm-border-soft bg-gm-surface/40 hover:bg-gm-surface text-gm-text transition-all font-bold tracking-widest uppercase text-[10px] px-8 h-10">
                  <KeyRound className="mr-2 size-4" />
                  {t('password.updateButton')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delete Card */}
          <Card className="bg-gm-error/5 border-gm-error/20 rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardContent className="p-8 flex items-center justify-between group">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-gm-error tracking-[0.2em] uppercase">{t('delete.title')}</div>
                <div className="text-xs text-gm-error/60 italic font-serif">{t('delete.description')}</div>
              </div>
              <Button 
                variant="ghost" 
                onClick={onDeleteUser} 
                disabled={busy}
                className="rounded-full h-12 w-12 p-0 hover:bg-gm-error hover:text-gm-bg text-gm-error/40 transition-all active:scale-95 shadow-lg group-hover:shadow-gm-error/20"
              >
                <Trash2 className="size-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
