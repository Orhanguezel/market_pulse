'use client';

import * as React from 'react';
import { Key } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useGetByokStatusQuery } from '@/integrations/rtk/hooks';
import { localizePath } from '@/integrations/shared';

interface Props {
  locale?: string;
}

export default function KeepaBudgetWidget({ locale = 'tr' }: Props) {
  const { data: status } = useGetByokStatusQuery();

  if (!status?.hasKey || status.tokenBudget === null) return null;

  const remaining = status.tokenBudget - status.tokensUsed;
  const pct = Math.max(0, Math.min(100, (remaining / status.tokenBudget) * 100));
  const barCls = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/10 px-4 py-3">
      <Key className="size-4 shrink-0 text-(--gm-primary)" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-(--gm-muted)">Keepa Token</span>
          <span className="font-mono text-xs text-(--gm-text)">
            {remaining.toLocaleString('tr-TR')} / {status.tokenBudget.toLocaleString('tr-TR')}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-(--gm-surface)/30 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', barCls)} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <Link
        href={localizePath(locale, '/me/settings')}
        className="text-[10px] text-(--gm-primary) hover:opacity-80 whitespace-nowrap"
      >
        Ayarlar
      </Link>
    </div>
  );
}
