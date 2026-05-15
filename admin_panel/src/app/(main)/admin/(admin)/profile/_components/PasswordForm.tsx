'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Key, Loader2, Save, ShieldCheck, Lock } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { useAuthUpdateMutation } from '@/integrations/hooks';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export function PasswordForm() {
  const t = useAdminT();
  const [updateUser, { isLoading }] = useAuthUpdateMutation();

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error(t('admin.profile.passwordRequired') || 'Yeni şifre gerekli.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('admin.profile.passwordsDontMatch') || 'Şifreler uyuşmuyor.');
      return;
    }

    try {
      await updateUser({
        password,
      }).unwrap();

      setPassword('');
      setConfirmPassword('');
      toast.success(t('admin.profile.passwordUpdated') || 'Şifre başarıyla güncellendi.');
    } catch (err) {
      toast.error(t('admin.profile.passwordUpdateFailed') || 'Şifre güncellenemedi.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full">
      <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl h-full flex flex-col">
        <CardContent className="p-10 space-y-8 flex-1">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-gm-gold/10 flex items-center justify-center text-gm-gold border border-gm-gold/20 shadow-inner">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-gm-text font-serif text-xl">{t('admin.profile.security') || 'Güvenlik'}</h3>
              <p className="text-[10px] font-bold text-gm-muted tracking-widest uppercase">
                {t('admin.profile.securityDesc') || 'Hesap güvenliğinizi koruyun'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="new-password" className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">
                {t('admin.profile.newPassword') || 'Yeni Şifre'}
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text transition-all"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="confirm-password" className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">
                {t('admin.profile.confirmPassword') || 'Şifreyi Onayla'}
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text transition-all"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-gm-gold/5 border border-gm-gold/10 p-6">
            <p className="text-xs text-gm-text font-serif italic leading-relaxed opacity-70">
              Güçlü bir şifre; en az 8 karakter uzunluğunda olmalı, harf, rakam ve özel karakter içermelidir.
            </p>
          </div>
        </CardContent>
        <div className="p-10 pt-0">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gm-surface hover:bg-gm-primary/5 border border-gm-border-soft text-gm-text rounded-full h-14 font-bold tracking-widest uppercase text-[10px] shadow-lg transition-all active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-gm-gold" />
                {t('admin.common.saving') || 'GÜNCELLENİYOR...'}
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4 text-gm-gold" />
                {t('admin.profile.changePassword') || 'ŞİFREYİ GÜNCELLE'}
              </>
            )}
          </Button>
        </div>
      </Card>
    </form>
  );
}
