'use client';

// =============================================================
// FILE: src/app/(main)/dashboard/_components/sidebar/search-dialog.tsx
// Panel – Search (şimdilik pasif / Tavvuk dışı içerikler kapalı)
// - Derlenir, modal açılır, temel kısayol gösterir
// - Projects/Servers/Jobs araması ileride Tavvuk'a göre eklenecek
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

type SearchHit = {
  group: string;
  label: string;
  href: string;
  keywords?: string;
  disabled?: boolean;
};

function norm(s: unknown) {
  return String(s ?? '')
    .toLowerCase()
    .trim();
}

export function SearchDialog() {
  const router = useRouter();
  const t = useAdminT();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // ✅ Şimdilik sadece temel sayfa kısayolları (Tavvuk dışı içerikler kapalı)
  const hits = React.useMemo<SearchHit[]>(() => {
    return [
      { group: 'Sayfalar', label: 'Dashboard', href: '/dashboard' },
      // İleride Tavvuk modülleri:
      // { group: 'Sayfalar', label: 'Siparişler', href: '/dashboard/orders' },
      // { group: 'Sayfalar', label: 'Kullanıcılar', href: '/dashboard/users' },
    ];
  }, []);

  const filtered = React.useMemo(() => {
    const nq = norm(q);
    if (!nq) return hits;

    return hits.filter((h) => {
      const hay = `${h.label} ${h.keywords ?? ''} ${h.group}`.toLowerCase();
      return hay.includes(nq);
    });
  }, [hits, q]);

  const groups = React.useMemo(() => {
    const uniq = Array.from(new Set(filtered.map((x) => x.group)));
    uniq.sort((a, b) => a.localeCompare(b));
    return uniq;
  }, [filtered]);

  function onSelect(href: string) {
    setOpen(false);
    setQ('');
    router.push(href);
  }

  return (
    <>
      <Button
        variant="link"
        className="px-0 font-normal text-muted-foreground hover:no-underline"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        {t('admin.sidebar.search')}
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t('admin.sidebar.searchPlaceholder')} value={q} onValueChange={setQ} />
        <CommandList>
          <CommandEmpty>{t('admin.sidebar.noResults')}</CommandEmpty>

          {groups.map((group, i) => (
            <React.Fragment key={group}>
              {i !== 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {filtered
                  .filter((x) => x.group === group)
                  .map((item) => (
                    <CommandItem
                      key={`${item.group}:${item.href}:${item.label}`}
                      className="py-1.5"
                      onSelect={() => onSelect(item.href)}
                      disabled={item.disabled}
                    >
                      <span className="truncate">{item.label}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
