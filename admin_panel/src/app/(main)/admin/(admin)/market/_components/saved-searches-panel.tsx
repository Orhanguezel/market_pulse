'use client';

import * as React from 'react';
import { BookmarkPlus, ChevronDown, ChevronUp, Play, RefreshCw, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useCreateSavedSearchMutation,
  useDeleteSavedSearchMutation,
  useListSavedSearchesQuery,
  useRunSavedSearchMutation,
  useUpdateSavedSearchMutation,
  type AmazonSavedSearch,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

const MARKETPLACE_FLAG: Record<string, string> = {
  com: '🇺🇸', de: '🇩🇪', co_uk: '🇬🇧', fr: '🇫🇷',
  it: '🇮🇹', es: '🇪🇸', nl: '🇳🇱', pl: '🇵🇱',
};

interface Props {
  currentKeyword: string;
  currentMarketplace: string;
  onJobStarted?: (jobId: string) => void;
}

function SavedRow({
  item,
  onRun,
  onDelete,
  onToggleWatchlist,
}: {
  item: AmazonSavedSearch;
  onRun: () => void;
  onDelete: () => void;
  onToggleWatchlist: () => void;
}) {
  const flag = MARKETPLACE_FLAG[item.marketplace] ?? '🌍';
  const lastRun = item.lastRunAt ? new Date(item.lastRunAt).toLocaleDateString('tr-TR') : null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gm-border-soft bg-gm-bg-deep/50 px-4 py-2.5">
      <span className="text-base">{flag}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-gm-text">{item.label}</div>
        {item.label !== item.keyword && (
          <div className="truncate text-[10px] text-gm-muted">{item.keyword}</div>
        )}
      </div>
      {lastRun && (
        <span className="shrink-0 font-mono text-[9px] text-gm-muted">{lastRun}</span>
      )}
      <button
        onClick={onToggleWatchlist}
        title={item.watchlistEnabled ? 'Watchlist: Açık' : 'Watchlist: Kapalı'}
        className={cn(
          'shrink-0 rounded-full p-1 transition-colors',
          item.watchlistEnabled ? 'text-gm-gold hover:text-gm-gold/70' : 'text-gm-muted/40 hover:text-gm-muted',
        )}
      >
        <Star className={cn('size-3.5', item.watchlistEnabled && 'fill-gm-gold')} />
      </button>
      <Button
        size="sm"
        onClick={onRun}
        className="h-6 rounded-full bg-gm-primary/20 px-2.5 text-[9px] font-bold text-gm-primary hover:bg-gm-primary hover:text-black"
      >
        <Play className="mr-1 size-3" />
        Tara
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="h-6 rounded-full px-1.5 text-gm-muted/50 hover:bg-gm-error/10 hover:text-gm-error"
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  );
}

export default function SavedSearchesPanel({ currentKeyword, currentMarketplace, onJobStarted }: Props) {
  const [open, setOpen] = React.useState(false);
  const { data: saved = [], isLoading } = useListSavedSearchesQuery();
  const [createSaved] = useCreateSavedSearchMutation();
  const [deleteSaved] = useDeleteSavedSearchMutation();
  const [runSaved, { isLoading: isRunning }] = useRunSavedSearchMutation();
  const [updateSaved] = useUpdateSavedSearchMutation();

  const handleSave = async () => {
    if (!currentKeyword.trim()) {
      toast.error('Önce bir keyword girin');
      return;
    }
    try {
      await createSaved({
        keyword:     currentKeyword.trim(),
        marketplace: currentMarketplace,
        label:       currentKeyword.trim(),
      }).unwrap();
      toast.success('Arama kaydedildi');
      setOpen(true);
    } catch {
      toast.error('Kaydedilemedi');
    }
  };

  const handleRun = async (item: AmazonSavedSearch) => {
    try {
      const job = await runSaved(item.id).unwrap();
      toast.success(`"${item.label}" taranıyor…`);
      onJobStarted?.(job.id);
    } catch {
      toast.error('Tarama başlatılamadı');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSaved(id).unwrap();
      toast.success('Silindi');
    } catch {
      toast.error('Silinemedi');
    }
  };

  const handleToggleWatchlist = async (item: AmazonSavedSearch) => {
    try {
      await updateSaved({ id: item.id, watchlist_enabled: !item.watchlistEnabled }).unwrap();
    } catch {
      toast.error('Güncellenemedi');
    }
  };

  const alreadySaved = saved.some(
    (s) => s.keyword.toLowerCase() === currentKeyword.trim().toLowerCase() && s.marketplace === currentMarketplace,
  );

  return (
    <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <BookmarkPlus className="size-4 text-gm-gold" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gm-muted">
            Kayıtlı Aramalar
          </span>
          {saved.length > 0 && (
            <Badge variant="outline" className="rounded-full border-gm-gold/30 bg-gm-gold/10 px-2 text-[9px] font-bold text-gm-gold">
              {saved.length}
            </Badge>
          )}
          {saved.some((s) => s.watchlistEnabled) && (
            <Badge variant="outline" className="rounded-full border-gm-warning/30 bg-gm-warning/10 px-2 text-[9px] font-bold text-gm-warning">
              <Star className="mr-1 size-2.5 fill-gm-warning text-gm-warning" />
              Watchlist
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentKeyword.trim() && !alreadySaved && (
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              className="h-6 rounded-full bg-gm-gold/20 px-3 text-[9px] font-bold text-gm-gold hover:bg-gm-gold hover:text-black"
            >
              <BookmarkPlus className="mr-1 size-3" />
              Kaydet
            </Button>
          )}
          {open ? <ChevronUp className="size-4 text-gm-muted" /> : <ChevronDown className="size-4 text-gm-muted" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gm-border-soft px-4 pb-4 pt-3 space-y-2">
          {isLoading ? (
            <div className="py-4 text-center text-[10px] text-gm-muted">Yükleniyor…</div>
          ) : saved.length === 0 ? (
            <div className="py-6 text-center text-[10px] italic text-gm-muted/50">
              Henüz kayıtlı arama yok. Keyword girin ve &quot;Kaydet&quot;e tıklayın.
            </div>
          ) : (
            <>
              <div className="mb-1 text-[9px] text-gm-muted/50">
                ⭐ Watchlist işaretliyse haftalık otomatik tarama planlanır.
              </div>
              {isRunning && (
                <div className="flex items-center gap-2 py-1 text-[10px] text-gm-primary">
                  <RefreshCw className="size-3 animate-spin" />
                  Tarama başlatılıyor…
                </div>
              )}
              {saved.map((item) => (
                <SavedRow
                  key={item.id}
                  item={item}
                  onRun={() => handleRun(item)}
                  onDelete={() => handleDelete(item.id)}
                  onToggleWatchlist={() => handleToggleWatchlist(item)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
