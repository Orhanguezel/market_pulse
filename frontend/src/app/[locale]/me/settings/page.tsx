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
    <div className="space-y-5">
      <div className="max-w-3xl space-y-5">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Ayarlar</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">Kişisel bilgilerinizi ve tercihlerinizi yönetin.</p>
        </div>

        <div className="space-y-4">
          <section className="space-y-5 rounded-lg border border-[#e2e8f0] bg-white p-5">
            <div className="flex items-center gap-3 text-[#1d4ed8]">
              <User className="size-6" />
              <h2 className="text-[15px] font-semibold text-[#0f172a]">Kişisel Bilgiler</h2>
            </div>
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[#64748b]">Ad Soyad</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="h-10 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-[#0f172a] outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>
          </section>

          <section className="space-y-5 rounded-lg border border-[#e2e8f0] bg-white p-5">
            <div className="flex items-center gap-3 text-[#1d4ed8]">
              <Bell className="size-6" />
              <h2 className="text-[15px] font-semibold text-[#0f172a]">Bildirimler</h2>
            </div>
            <div className="space-y-6">
              {[
                { key: 'push_notifications', label: 'Anlık Bildirimler (Push)', desc: 'Randevu hatırlatmaları ve sistem duyuruları.' },
                { key: 'email_notifications', label: 'E-posta Bildirimleri', desc: 'Randevu hatırlatmaları ve önemli güncellemeler.' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-8">
                  <div className="space-y-1">
                    <div className="font-bold text-[#0f172a]">{item.label}</div>
                    <div className="text-sm text-[#64748b]">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, [item.key]: !formData[item.key as keyof typeof formData] })}
                    className={`relative h-8 w-14 rounded-full transition-colors ${formData[item.key as keyof typeof formData] ? 'bg-[#2563eb]' : 'bg-[#cbd5e1]'}`}
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

          <section className="rounded-lg border border-[#e2e8f0] bg-white p-5">
            <ByokSettings />
          </section>

          <section className="space-y-5 rounded-lg border border-rose-200 bg-rose-50 p-5">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="size-6" />
              <h2 className="text-[15px] font-semibold text-rose-700">Tehlikeli Bölge</h2>
            </div>
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="space-y-1 text-center md:text-left">
                <div className="font-bold text-[#0f172a]">Hesabı Kapat</div>
                <div className="text-sm text-[#64748b]">Tüm verileriniz 7 gün sonra kalıcı olarak silinecektir.</div>
              </div>
              <button className="flex items-center gap-2 rounded-md border border-rose-300 bg-rose-100 px-4 py-2 text-sm font-bold text-rose-700 transition-all hover:bg-rose-200">
                <Trash2 className="size-4" /> HESABI SİL
              </button>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-2 rounded-md bg-[#2563eb] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#1d4ed8]"
            >
              <Save className="size-5" /> DEĞİŞİKLİKLERİ KAYDET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
