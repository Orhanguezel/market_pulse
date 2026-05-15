'use client';

import * as React from 'react';
import { Columns2, TableProperties } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import LeadsPanel from '../_components/leads-panel';
import PipelineKanban from '../_components/pipeline-kanban';

type ViewMode = 'table' | 'kanban';

export default function Page() {
  const [view, setView] = React.useState<ViewMode>('kanban');

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <div className="inline-flex rounded-full border border-gm-border-soft bg-gm-surface/10 p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('kanban')}
            className={cn(
              'h-8 rounded-full px-4 text-[10px] font-bold uppercase tracking-widest transition-all',
              view === 'kanban'
                ? 'bg-gm-gold text-black shadow-sm'
                : 'text-gm-muted hover:text-gm-text',
            )}
          >
            <Columns2 className="mr-1.5 size-3.5" />
            Kanban
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('table')}
            className={cn(
              'h-8 rounded-full px-4 text-[10px] font-bold uppercase tracking-widest transition-all',
              view === 'table'
                ? 'bg-gm-gold text-black shadow-sm'
                : 'text-gm-muted hover:text-gm-text',
            )}
          >
            <TableProperties className="mr-1.5 size-3.5" />
            Tablo
          </Button>
        </div>
      </div>

      {view === 'kanban' ? <PipelineKanban /> : <LeadsPanel />}
    </div>
  );
}
