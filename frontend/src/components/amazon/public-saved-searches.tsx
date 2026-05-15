'use client';

import * as React from 'react';
import { Bell, BellOff, Bookmark, ChevronDown, ChevronUp, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavedSearch {
  id: string;
  keyword: string;
  marketplace: string;
  watchlist: boolean;
  savedAt: string;
}

const LS_KEY = 'mp_saved_searches';

function loadSaved(): SavedSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveToDisk(items: SavedSearch[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

const MP_FLAGS: Record<string, string> = {
  com: '🇺🇸', de: '🇩🇪', 'co.uk': '🇬🇧', fr: '🇫🇷',
  it: '🇮🇹', es: '🇪🇸', nl: '🇳🇱', pl: '🇵🇱',
};

interface Props {
  currentKeyword?: string;
  currentMarketplace?: string;
  onSearch?: (keyword: string, marketplace: string) => void;
}

export default function PublicSavedSearches({ currentKeyword, currentMarketplace = 'com', onSearch }: Props) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<SavedSearch[]>([]);

  React.useEffect(() => {
    setItems(loadSaved());
  }, []);

  const persist = (next: SavedSearch[]) => {
    setItems(next);
    saveToDisk(next);
  };

  const handleSave = () => {
    if (!currentKeyword?.trim()) return;
    const exists = items.some(
      (i) => i.keyword.toLowerCase() === currentKeyword.toLowerCase() && i.marketplace === currentMarketplace,
    );
    if (exists) return;
    const next: SavedSearch = {
      id: `${Date.now()}`,
      keyword: currentKeyword.trim(),
      marketplace: currentMarketplace,
      watchlist: false,
      savedAt: new Date().toISOString(),
    };
    persist([next, ...items]);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    persist(items.filter((i) => i.id !== id));
  };

  const handleToggleWatchlist = (id: string) => {
    persist(items.map((i) => (i.id === id ? { ...i, watchlist: !i.watchlist } : i)));
  };

  const alreadySaved = currentKeyword
    ? items.some(
        (i) => i.keyword.toLowerCase() === currentKeyword.toLowerCase() && i.marketplace === currentMarketplace,
      )
    : false;

  return (
    <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/5">
      <div className="flex items-center justify-between px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left"
        >
          <Bookmark className="size-4 text-(--gm-primary)" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-(--gm-muted)">
            Kayıtlı Aramalar
          </span>
          {items.length > 0 && (
            <span className="rounded-full border border-(--gm-primary)/30 bg-(--gm-primary)/10 px-2 py-0.5 text-[9px] font-bold text-(--gm-primary)">
              {items.length}
            </span>
          )}
          {open ? <ChevronUp className="ml-1 size-4 text-(--gm-muted)" /> : <ChevronDown className="ml-1 size-4 text-(--gm-muted)" />}
        </button>

        {currentKeyword && !alreadySaved && (
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-full border border-(--gm-primary)/40 bg-(--gm-primary)/10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-(--gm-primary) hover:bg-(--gm-primary)/20 transition-colors"
          >
            <Bookmark className="size-3" />
            Kaydet
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-(--gm-border-soft) px-5 pb-4 pt-3 space-y-2">
          {items.length === 0 ? (
            <p className="py-4 text-center font-serif text-xs italic text-(--gm-muted)/60">
              Henüz kayıtlı arama yok. Bir analiz yapıp "Kaydet"e basın.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-(--gm-border-soft)/60 bg-(--gm-surface)/10 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none">{MP_FLAGS[item.marketplace] ?? '🌐'}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-(--gm-text)">{item.keyword}</p>
                    <p className="text-[10px] text-(--gm-muted)">
                      {new Date(item.savedAt).toLocaleDateString('tr-TR')} · amazon.{item.marketplace}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title={item.watchlist ? 'İzlemeyi kaldır' : 'İzlemeye al'}
                    onClick={() => handleToggleWatchlist(item.id)}
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full border transition-colors',
                      item.watchlist
                        ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500'
                        : 'border-(--gm-border-soft) text-(--gm-muted) hover:text-yellow-500',
                    )}
                  >
                    {item.watchlist ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
                  </button>

                  <button
                    type="button"
                    title="Analiz et"
                    onClick={() => onSearch?.(item.keyword, item.marketplace)}
                    className="flex size-7 items-center justify-center rounded-full border border-(--gm-border-soft) text-(--gm-muted) hover:text-(--gm-primary) hover:border-(--gm-primary)/40 transition-colors"
                  >
                    <Search className="size-3.5" />
                  </button>

                  <button
                    type="button"
                    title="Sil"
                    onClick={() => handleDelete(item.id)}
                    className="flex size-7 items-center justify-center rounded-full border border-(--gm-border-soft) text-(--gm-muted) hover:text-red-500 hover:border-red-500/40 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
