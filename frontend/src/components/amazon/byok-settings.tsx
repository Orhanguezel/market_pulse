'use client';

import * as React from 'react';
import { Eye, EyeOff, Key, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useGetByokStatusQuery,
  useSaveByokKeyMutation,
  useDeleteByokKeyMutation,
} from '@/integrations/rtk/hooks';

export default function ByokSettings() {
  const { data: status, isLoading: statusLoading } = useGetByokStatusQuery();
  const [saveKey, { isLoading: saving }] = useSaveByokKeyMutation();
  const [deleteKey, { isLoading: deleting }] = useDeleteByokKeyMutation();

  const [apiKey, setApiKey] = React.useState('');
  const [showKey, setShowKey] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [msgType, setMsgType] = React.useState<'ok' | 'err'>('ok');

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    try {
      await saveKey({ api_key: apiKey.trim() }).unwrap();
      setApiKey('');
      setMsg('Keepa API anahtarınız güvenli şekilde kaydedildi.');
      setMsgType('ok');
    } catch {
      setMsg('Anahtar kaydedilemedi. Lütfen tekrar deneyin.');
      setMsgType('err');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Keepa API anahtarınızı silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteKey().unwrap();
      setMsg('Keepa API anahtarınız silindi.');
      setMsgType('ok');
    } catch {
      setMsg('Silme işlemi başarısız.');
      setMsgType('err');
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-(--gm-muted)">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-xs">Yükleniyor…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/5 p-5">
      <div className="flex items-center gap-2">
        <Key className="size-4 text-(--gm-primary)" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-muted)">Keepa API Anahtarı (BYOK)</span>
      </div>

      {status?.hasKey ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <p className="text-xs font-medium text-emerald-500">Keepa API anahtarınız kayıtlı ve aktif.</p>
            {status.tokenBudget !== null && (
              <p className="mt-1 text-[11px] text-(--gm-muted)">
                Token bütçesi: <span className="font-mono font-bold text-(--gm-text)">{status.tokenBudget.toLocaleString('tr-TR')}</span>
                {status.tokensUsed > 0 && (
                  <> · Kullanılan: <span className="font-mono">{status.tokensUsed.toLocaleString('tr-TR')}</span></>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-(--gm-muted)">Anahtarı Güncelle</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Yeni Keepa API anahtarı"
                  className="h-10 w-full rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/20 px-4 pr-10 text-sm text-(--gm-text) placeholder:text-(--gm-muted)/40 focus:border-(--gm-primary) focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--gm-muted) hover:text-(--gm-text) transition-colors"
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <button
                type="button"
                disabled={!apiKey.trim() || saving}
                onClick={handleSave}
                className={cn(
                  'h-10 rounded-2xl px-4 text-[11px] font-bold uppercase tracking-widest transition-all',
                  apiKey.trim() && !saving
                    ? 'bg-(--gm-primary) text-white hover:opacity-90'
                    : 'cursor-not-allowed bg-(--gm-surface) text-(--gm-muted)',
                )}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : 'Güncelle'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex h-10 items-center gap-1.5 rounded-2xl border border-red-500/30 px-4 text-[11px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-(--gm-muted)">
            Kendi Keepa API anahtarınızı bağlayarak tarama hızını artırın ve token bütçenizi izleyin.
            Anahtarınız AES-256 ile şifreli olarak saklanır.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                placeholder="Keepa API anahtarınız"
                className="h-10 w-full rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/20 px-4 pr-10 text-sm text-(--gm-text) placeholder:text-(--gm-muted)/40 focus:border-(--gm-primary) focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-(--gm-muted) hover:text-(--gm-text) transition-colors"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <button
              type="button"
              disabled={!apiKey.trim() || saving}
              onClick={handleSave}
              className={cn(
                'h-10 rounded-2xl px-5 text-[11px] font-bold uppercase tracking-widest transition-all',
                apiKey.trim() && !saving
                  ? 'bg-(--gm-primary) text-white hover:opacity-90'
                  : 'cursor-not-allowed bg-(--gm-surface) text-(--gm-muted)',
              )}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={cn(
          'rounded-xl border px-3 py-2 text-xs',
          msgType === 'ok'
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600'
            : 'border-red-500/20 bg-red-500/5 text-red-500',
        )}>
          {msg}
        </p>
      )}
    </div>
  );
}
