'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { localizePath } from '@/integrations/shared';
import { normalizeError } from '@/integrations/shared';
import { useLocaleShort } from '@/i18n';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  useCancelAccountDeletionMutation,
  useExportMyDataMutation,
  useGetAccountDeletionStatusQuery,
  useRequestAccountDeletionMutation,
} from '@/integrations/rtk/hooks';
import { getDataExportFilePrefix } from '@/lib/site-config';

function formatDate(v: string | undefined, locale: string) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ProfilePrivacyPage() {
  const locale = useLocaleShort();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [reason, setReason] = useState('');

  const [getExportData, exportState] = useExportMyDataMutation();
  const [requestDeletion, requestState] = useRequestAccountDeletionMutation();
  const [cancelDeletion, cancelState] = useCancelAccountDeletionMutation();

  const {
    data: deletionStatus,
    isLoading: statusLoading,
    refetch,
  } = useGetAccountDeletionStatusQuery(undefined, {
    skip: !isAuthenticated,
  });

  const pending = deletionStatus?.status === 'pending';
  const pendingDate = formatDate(deletionStatus?.scheduled_for, locale);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(localizePath(locale, '/login'));
    }
  }, [isAuthenticated, locale, router]);

  async function onExportData() {
    try {
      const payload = await getExportData().unwrap();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const fileName = `${getDataExportFilePrefix()}-export-${Date.now()}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('Veri dosyanız indirildi.');
    } catch (err) {
      toast.error(normalizeError(err).message || 'Veri dışa aktarma başarısız.');
    }
  }

  async function onRequestDelete(e: React.FormEvent) {
    e.preventDefault();

    if (pending) {
      toast.error('Zaten aktif bir hesap silme talebiniz var.');
      return;
    }

    try {
      await requestDeletion({ reason: reason.trim() || undefined }).unwrap();
      toast.success('Hesap silme talebiniz oluşturuldu. 7 gün içinde iptal edebilirsiniz.');
      setReason('');
      await refetch();
    } catch (err) {
      toast.error(normalizeError(err).message || 'Hesap silme talebi alınamadı.');
    }
  }

  async function onCancelDelete() {
    try {
      await cancelDeletion().unwrap();
      toast.success('Hesap silme talebiniz iptal edildi.');
      await refetch();
    } catch (err) {
      toast.error(normalizeError(err).message || 'Talep iptal edilemedi.');
    }
  }

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32 pb-16 px-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl text-text font-serif mb-2">Gizlilik ve Hesap</h1>
        <p className="mb-8 text-text-muted">
          KVKK kapsamında kişisel verileriniz ve hesap güvenliği için işlemler.
        </p>

        <section className="rounded-xl border border-border bg-bg-card p-5 md:p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-text">Verilerimi İndir</h2>
          <p className="text-sm text-text-muted">
            Hesabınıza ait tüm verilerin JSON halinde hazırlanıp indirilmesini sağlayabilirsiniz.
          </p>
          <button
            onClick={onExportData}
            disabled={exportState.isLoading}
            className="rounded bg-brand-primary px-4 py-2 text-sm font-semibold text-text-on-dark disabled:opacity-60"
          >
            {exportState.isLoading ? 'Hazırlanıyor...' : 'Verilerimi İndir'}
          </button>
        </section>

        <section className="mt-8 rounded-xl border border-error/30 bg-error/5 p-5 md:p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-text">Hesabımı Sil</h2>
          <p className="text-sm text-text-muted">
            Hesap silme talebini onayladığınızda 7 gün içinde kalıcı silme gerçekleştirilecektir.
            Bu süre içinde istediğiniz zaman talebinizi iptal edebilirsiniz.
          </p>

          {statusLoading ? (
            <p className="text-sm text-text-muted">Durum kontrol ediliyor...</p>
          ) : pending ? (
            <div className="rounded bg-bg-card border border-error/30 p-4 space-y-2">
              <p className="text-sm text-error">
                <strong>Aktif hesap silme talebi</strong> bulundu.
              </p>
              <p className="text-sm text-text-muted">
                Silme tarihi: <span className="text-text">{pendingDate}</span>
              </p>
              {deletionStatus?.cooling_off_days ? (
                <p className="text-sm text-text-muted">
                  Soğuma süresi: <strong>{deletionStatus?.cooling_off_days} gün</strong>
                </p>
              ) : null}
              <button
                onClick={onCancelDelete}
                disabled={cancelState.isLoading}
                className="rounded bg-bg-surface text-sm px-4 py-2 font-semibold text-text hover:bg-bg-surface-high disabled:opacity-60"
              >
                {cancelState.isLoading ? 'İptal ediliyor...' : 'Hesap Silme Talebini İptal Et'}
              </button>
            </div>
          ) : (
            <form onSubmit={onRequestDelete} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text">Silme nedeni (opsiyonel)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full rounded border border-error/40 bg-bg-card px-3 py-2 text-sm text-text"
                  placeholder="Örn: Hizmetten memnun kalmadım, hesabımı kapatmak istiyorum..."
                  maxLength={500}
                />
              </label>
              <div className="text-xs text-text-muted">Maksimum 500 karakter.</div>

              <button
                type="submit"
                disabled={requestState.isLoading}
                className="rounded bg-error px-4 py-2 text-sm font-semibold text-text-on-dark disabled:opacity-60"
              >
                {requestState.isLoading ? 'İşleniyor...' : 'Hesabı Silme Talebi Oluştur'}
              </button>
            </form>
          )}
        </section>

        <div className="mt-8">
          <Link href={localizePath(locale, '/profile')} className="text-sm text-text-muted hover:text-brand-primary">
            Hesaba Geri Dön
          </Link>
        </div>
      </div>
    </main>
  );
}
