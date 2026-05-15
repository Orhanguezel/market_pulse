'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Camera, Loader2, Save, User, Mail, ShieldCheck } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { useStatusQuery, useAuthUpdateMutation } from '@/integrations/hooks';
import { useGetMyProfileQuery, useUpsertMyProfileMutation } from '@/integrations/hooks';
import { useCreateAssetAdminMutation } from '@/integrations/endpoints/admin/storage_admin.endpoints';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export function ProfileForm() {
  const t = useAdminT();
  const { data: statusData } = useStatusQuery();
  const { data: profileData, isLoading: isProfileLoading } = useGetMyProfileQuery();
  const [upsertProfile, { isLoading: isUpdatingProfile }] = useUpsertMyProfileMutation();
  const [updateAuthUser, { isLoading: isUpdatingAuth }] = useAuthUpdateMutation();
  const [createAsset, { isLoading: isUploading }] = useCreateAssetAdminMutation();

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');

  React.useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name || '');
      setAvatarUrl(profileData.avatar_url || '');
    }
  }, [profileData]);

  React.useEffect(() => {
    if (statusData?.user) {
      setEmail(statusData.user.email || '');
    }
  }, [statusData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const asset = await createAsset({
        file,
        bucket: 'avatars',
        folder: 'profiles',
      }).unwrap();

      if (asset.url) {
        setAvatarUrl(asset.url);
        toast.success(t('admin.profile.avatarUploaded') || 'Profil resmi yüklendi.');
      }
    } catch (err) {
      toast.error(t('admin.profile.avatarUploadFailed') || 'Resim yüklenemedi.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await upsertProfile({
        profile: {
          full_name: fullName,
          avatar_url: avatarUrl,
        }
      }).unwrap();

      if (email !== statusData?.user?.email) {
        await updateAuthUser({
          email,
        }).unwrap();
      }

      toast.success(t('admin.profile.updated') || 'Profil başarıyla güncellendi.');
    } catch (err) {
      toast.error(t('admin.profile.updateFailed') || 'Profil güncellenemedi.');
    }
  };

  const isAnyLoading = isProfileLoading || isUpdatingProfile || isUpdatingAuth || isUploading;

  return (
    <form onSubmit={handleSubmit} className="h-full">
      <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl h-full flex flex-col">
        <CardContent className="p-10 space-y-8 flex-1">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-gm-gold/10 flex items-center justify-center text-gm-gold border border-gm-gold/20 shadow-inner">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-gm-text font-serif text-xl">{t('admin.profile.personalInfo') || 'Kişisel Bilgiler'}</h3>
              <p className="text-[10px] font-bold text-gm-muted tracking-widest uppercase">
                {t('admin.profile.personalInfoDesc') || 'Profil Kimliğinizi Yönetin'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8 sm:flex-row p-6 rounded-[24px] bg-gm-surface/40 border border-gm-border-soft shadow-inner">
            <div className="relative group">
              <div className="absolute -inset-1 bg-linear-to-tr from-gm-gold/40 to-transparent rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity" />
              <Avatar className="h-24 w-24 border-2 border-gm-border-soft relative bg-gm-bg-deep">
                <AvatarImage src={avatarUrl || undefined} alt={fullName} className="object-cover" />
                <AvatarFallback className="text-2xl font-serif text-gm-gold">
                  {getInitials(fullName || email || 'A')}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/60 text-gm-text rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all backdrop-blur-sm border border-gm-gold/30 scale-95 group-hover:scale-100",
                  isUploading && "opacity-100"
                )}
              >
                {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-gm-gold" /> : <Camera className="h-8 w-8 text-gm-gold" />}
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={isAnyLoading}
              />
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h4 className="font-serif text-2xl text-gm-text leading-none">{fullName || email || 'Admin'}</h4>
              <p className="text-xs text-gm-muted font-serif italic opacity-70">
                {avatarUrl ? (t('admin.profile.avatarSet') || 'Özel profil resmi ayarlandı') : (t('admin.profile.noAvatar') || 'Varsayılan avatar kullanılıyor')}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <Badge className="bg-gm-gold/10 text-gm-gold border-gm-gold/20 text-[9px] font-bold tracking-widest uppercase py-0.5 px-2 rounded-full">
                  Admin Yetkisi
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="space-y-3">
              <Label htmlFor="full-name" className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">
                {t('admin.profile.name') || 'Tam Ad'}
              </Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  disabled={isAnyLoading}
                  className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text transition-all"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="email" className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">
                {t('admin.profile.email') || 'E-posta Adresi'}
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  disabled={isAnyLoading}
                  className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text transition-all"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <div className="p-10 pt-0">
          <Button 
            type="submit" 
            disabled={isAnyLoading}
            className="w-full bg-gm-gold hover:bg-gm-gold-light text-black rounded-full h-14 font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-gm-gold/20 transition-all active:scale-95"
          >
            {isUpdatingProfile || isUpdatingAuth ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('admin.common.saving') || 'GÜNCELLENİYOR...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('admin.common.save') || 'PROFİLİ KAYDET'}
              </>
            )}
          </Button>
        </div>
      </Card>
    </form>
  );
}
