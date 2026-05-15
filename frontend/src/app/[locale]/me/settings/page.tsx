'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, ShieldAlert, Trash2, Save } from 'lucide-react';
import {
  useGetMyProfileQuery,
  useUpsertMyProfileMutation,
} from '@/integrations/rtk/hooks';
import { toast } from 'sonner';
import ByokSettings from '@/components/amazon/byok-settings';

export default function SettingsPage() {
  const { data: profile } = useGetMyProfileQuery();
  const [upsertProfile] = useUpsertMyProfileMutation();

  const [formData, setFormData] = useState({
    full_name: '',
    push_notifications: true,
    email_notifications: true,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        push_notifications: !!profile.push_notifications,
        email_notifications: !!profile.email_notifications,
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await upsertProfile({
        profile: {
          full_name: formData.full_name,
          push_notifications: formData.push_notifications ? 1 : 0,
          email_notifications: formData.email_notifications ? 1 : 0,
        },
      }).unwrap();
      toast.success('Profil güncellendi');
    } catch {
      toast.error('Güncelleme başarısız');
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20 pt-32 px-4">
      <div className="mx-auto max-w-3xl space-y-12">
        <div className="space-y-4 text-center">
          <h1 className="font-serif text-4xl text-foreground md:text-5xl">Ayarlar</h1>
          <p className="font-serif italic text-muted-foreground">Kişisel bilgilerinizi ve tercihlerinizi yönetin.</p>
        </div>

        <div className="space-y-8">
          <section className="space-y-8 rounded-[2.5rem] border border-border/20 bg-surface/30 p-8 md:p-10">
            <div className="flex items-center gap-4 text-brand-gold">
              <User className="size-6" />
              <h2 className="font-serif text-xl tracking-wider">Kişisel Bilgiler</h2>
            </div>
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="ml-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Ad Soyad</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full rounded-2xl border border-border/20 bg-surface-high/50 px-6 py-4 text-foreground outline-none transition-all focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/20"
                />
              </div>
            </div>
          </section>

          <section className="space-y-8 rounded-[2.5rem] border border-border/20 bg-surface/30 p-8 md:p-10">
            <div className="flex items-center gap-4 text-brand-gold">
              <Bell className="size-6" />
              <h2 className="font-serif text-xl tracking-wider">Bildirimler</h2>
            </div>
            <div className="space-y-6">
              {[
                { key: 'push_notifications', label: 'Anlık Bildirimler (Push)', desc: 'Randevu hatırlatmaları ve sistem duyuruları.' },
                { key: 'email_notifications', label: 'E-posta Bildirimleri', desc: 'Randevu hatırlatmaları ve önemli güncellemeler.' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-8">
                  <div className="space-y-1">
                    <div className="font-bold text-foreground">{item.label}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, [item.key]: !formData[item.key as keyof typeof formData] })}
                    className={`relative h-8 w-14 rounded-full transition-colors ${formData[item.key as keyof typeof formData] ? 'bg-brand-gold' : 'bg-surface-high'}`}
                  >
                    <motion.div
                      animate={{ x: formData[item.key as keyof typeof formData] ? 24 : 4 }}
                      className="absolute top-1 size-6 rounded-full bg-white shadow-md"
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-border/20 bg-surface/30 p-8 md:p-10">
            <ByokSettings />
          </section>

          <section className="space-y-8 rounded-[2.5rem] border border-rose-500/10 bg-rose-500/5 p-8 md:p-10">
            <div className="flex items-center gap-4 text-rose-400">
              <ShieldAlert className="size-6" />
              <h2 className="font-serif text-xl tracking-wider">Tehlikeli Bölge</h2>
            </div>
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="space-y-1 text-center md:text-left">
                <div className="font-bold text-foreground">Hesabı Kapat</div>
                <div className="text-sm text-muted-foreground">Tüm verileriniz 7 gün sonra kalıcı olarak silinecektir.</div>
              </div>
              <button className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-3 text-sm font-bold tracking-widest text-rose-400 transition-all hover:bg-rose-500/20">
                <Trash2 className="size-4" /> HESABI SİL
              </button>
            </div>
          </section>

          <div className="flex justify-center pt-8">
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-3 rounded-2xl bg-brand-gold px-12 py-5 font-bold tracking-widest text-bg-base shadow-xl shadow-brand-gold/20 transition-all hover:scale-105 active:scale-95"
            >
              <Save className="size-5" /> DEĞİŞİKLİKLERİ KAYDET
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
