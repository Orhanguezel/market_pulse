'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, ShieldAlert, Trash2, Save, Mail } from 'lucide-react';
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
    sender_enabled: false,
    sender_name: '',
    sender_email: '',
    sender_smtp_host: '',
    sender_smtp_port: 587,
    sender_smtp_username: '',
    sender_smtp_password: '',
    sender_smtp_secure: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        push_notifications: !!profile.push_notifications,
        email_notifications: !!profile.email_notifications,
        sender_enabled: !!profile.sender_enabled,
        sender_name: profile.sender_name || '',
        sender_email: profile.sender_email || '',
        sender_smtp_host: profile.sender_smtp_host || '',
        sender_smtp_port: profile.sender_smtp_port || 587,
        sender_smtp_username: profile.sender_smtp_username || '',
        sender_smtp_password: '',
        sender_smtp_secure: !!profile.sender_smtp_secure,
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
          sender_enabled: formData.sender_enabled ? 1 : 0,
          sender_name: formData.sender_name || null,
          sender_email: formData.sender_email || null,
          sender_smtp_host: formData.sender_smtp_host || null,
          sender_smtp_port: formData.sender_smtp_port || null,
          sender_smtp_username: formData.sender_smtp_username || null,
          sender_smtp_password: formData.sender_smtp_password || undefined,
          sender_smtp_secure: formData.sender_smtp_secure ? 1 : 0,
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

          <section className="space-y-5 rounded-lg border border-[#e2e8f0] bg-white p-5">
            <div className="flex items-center gap-3 text-[#1d4ed8]">
              <Mail className="size-6" />
              <h2 className="text-[15px] font-semibold text-[#0f172a]">Gönderici Ayarları</h2>
            </div>
            <div className="flex items-center justify-between gap-8 rounded-md bg-[#f8fafc] p-3">
              <div>
                <div className="text-[13px] font-bold text-[#0f172a]">Kendi SMTP hesabımı kullan</div>
                <div className="text-[12px] text-[#64748b]">Outreach ve toplu mailler bu kimlikle gönderilir.</div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, sender_enabled: !formData.sender_enabled })}
                className={`relative h-8 w-14 rounded-full transition-colors ${formData.sender_enabled ? 'bg-[#2563eb]' : 'bg-[#cbd5e1]'}`}
              >
                <motion.div animate={{ x: formData.sender_enabled ? 24 : 4 }} className="absolute top-1 size-6 rounded-full bg-white shadow-md" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase text-[#64748b]">Gönderen adı</span>
                <input value={formData.sender_name} onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })} className="h-10 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-[#0f172a] outline-none focus:border-[#2563eb]" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase text-[#64748b]">Gönderen e-posta</span>
                <input type="email" value={formData.sender_email} onChange={(e) => setFormData({ ...formData, sender_email: e.target.value })} className="h-10 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-[#0f172a] outline-none focus:border-[#2563eb]" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase text-[#64748b]">SMTP host</span>
                <input value={formData.sender_smtp_host} onChange={(e) => setFormData({ ...formData, sender_smtp_host: e.target.value })} className="h-10 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-[#0f172a] outline-none focus:border-[#2563eb]" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase text-[#64748b]">SMTP port</span>
                <input type="number" min={1} max={65535} value={formData.sender_smtp_port} onChange={(e) => setFormData({ ...formData, sender_smtp_port: Number(e.target.value || 587) })} className="h-10 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-[#0f172a] outline-none focus:border-[#2563eb]" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase text-[#64748b]">SMTP kullanıcı</span>
                <input value={formData.sender_smtp_username} onChange={(e) => setFormData({ ...formData, sender_smtp_username: e.target.value })} className="h-10 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-[#0f172a] outline-none focus:border-[#2563eb]" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase text-[#64748b]">SMTP parola</span>
                <input type="password" value={formData.sender_smtp_password} placeholder={profile?.sender_smtp_configured ? 'Kayıtlı, değiştirmek için yazın' : ''} onChange={(e) => setFormData({ ...formData, sender_smtp_password: e.target.value })} className="h-10 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-[#0f172a] outline-none focus:border-[#2563eb]" />
              </label>
            </div>
            <div className="flex items-center justify-between gap-8 rounded-md bg-[#f8fafc] p-3">
              <div>
                <div className="text-[13px] font-bold text-[#0f172a]">TLS / SSL</div>
                <div className="text-[12px] text-[#64748b]">465 gibi güvenli portlar için açık bırakın.</div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, sender_smtp_secure: !formData.sender_smtp_secure })}
                className={`relative h-8 w-14 rounded-full transition-colors ${formData.sender_smtp_secure ? 'bg-[#2563eb]' : 'bg-[#cbd5e1]'}`}
              >
                <motion.div animate={{ x: formData.sender_smtp_secure ? 24 : 4 }} className="absolute top-1 size-6 rounded-full bg-white shadow-md" />
              </button>
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
