'use client';

import { ProfileForm } from './_components/ProfileForm';
import { PasswordForm } from './_components/PasswordForm';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export default function ProfilePage() {
  const t = useAdminT();

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-8 h-px bg-gm-gold" />
          <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">Hesap Yönetimi</span>
        </div>
        <h1 className="font-serif text-4xl text-gm-text">{t('admin.sidebar.user.account')}</h1>
        <p className="text-gm-muted text-sm font-serif italic opacity-70">
          {t('admin.profile.subtitle') || 'Profil bilgilerinizi ve şifrenizi buradan güncelleyebilirsiniz.'}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 items-stretch">
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  );
}
