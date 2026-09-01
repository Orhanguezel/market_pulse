'use client';

import { Bell, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useDeleteNotificationMutation,
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/integrations/rtk/public/notifications.endpoints';

export default function BildirimlerPage() {
  const { data = [], isLoading, isError } = useListNotificationsQuery({ limit: 100 });
  const [markRead, markReadState] = useMarkNotificationReadMutation();
  const [markAll, markAllState] = useMarkAllNotificationsReadMutation();
  const [deleteNotification, deleteState] = useDeleteNotificationMutation();
  const busy = markReadState.isLoading || markAllState.isLoading || deleteState.isLoading;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Bildirimler</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">Sistem ve işlem bildirimlerinizi takip edin.</p>
        </div>
        <button disabled={busy || !data.some((item) => !item.is_read)} onClick={() => markAll().unwrap().then(() => toast.success('Tüm bildirimler okundu'))} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#1e40af] px-3 text-[13px] font-semibold text-[#1e40af] disabled:opacity-50">
          <CheckCircle2 className="h-4 w-4" /> Tümünü Okundu Yap
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#1e40af]" /></div>
        ) : isError ? (
          <div className="px-6 py-16 text-center text-[14px] text-[#64748b]">Bildirimler alınamadı.</div>
        ) : !data.length ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Bell className="h-10 w-10 text-[#cbd5e1]" />
            <p className="text-[14px] text-[#64748b]">Henüz bildiriminiz yok.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {data.map((item) => (
              <article key={item.id} className={`grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center ${item.is_read ? 'bg-white' : 'bg-[#eff6ff]'}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!item.is_read && <span className="h-2 w-2 rounded-full bg-[#1e40af]" />}
                    <h2 className="truncate text-[14px] font-bold text-[#0f172a]">{item.title || 'Bildirim'}</h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#64748b] ring-1 ring-[#e2e8f0]">{item.type}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-[#475569]">{item.message}</p>
                  <p className="mt-2 text-[12px] text-[#94a3b8]">{item.created_at ? new Date(item.created_at).toLocaleString('tr-TR') : '-'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button disabled={busy || item.is_read} onClick={() => markRead({ id: item.id, is_read: true }).unwrap().then(() => toast.success('Bildirim okundu'))} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 text-emerald-700 disabled:opacity-40" title="Okundu yap">
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button disabled={busy} onClick={() => deleteNotification({ id: item.id }).unwrap().then(() => toast.success('Bildirim silindi'))} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700 disabled:opacity-40" title="Sil">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
