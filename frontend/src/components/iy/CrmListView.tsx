'use client';

import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Inbox, Loader2, Search } from 'lucide-react';

export type CrmColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

export default function CrmListView<T extends { id: string }>({
  title, subtitle, columns, rows, isLoading, isError, emptyText, rowActions, toolbarActions,
}: {
  title: string;
  subtitle?: string;
  columns: CrmColumn<T>[];
  rows?: T[];
  isLoading?: boolean;
  isError?: boolean;
  emptyText?: string;
  rowActions?: (row: T) => React.ReactNode;
  toolbarActions?: React.ReactNode;
}) {
  const [query, setQuery] = React.useState('');
  const [filterColumn, setFilterColumn] = React.useState<string>('all');
  const [sortKey, setSortKey] = React.useState<string>(columns[0]?.key ?? 'id');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());

  const safeRows = React.useMemo(() => rows ?? [], [rows]);

  const visibleRows = React.useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    const keys = filterColumn === 'all' ? columns.map((c) => c.key) : [filterColumn];
    const filtered = needle
      ? safeRows.filter((row) => keys.some((key) => String((row as Record<string, unknown>)[key] ?? '').toLocaleLowerCase('tr-TR').includes(needle)))
      : safeRows;
    return [...filtered].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey];
      const bv = (b as Record<string, unknown>)[sortKey];
      const an = typeof av === 'number' ? av : Number.NaN;
      const bn = typeof bv === 'number' ? bv : Number.NaN;
      const cmp = Number.isFinite(an) && Number.isFinite(bn)
        ? an - bn
        : String(av ?? '').localeCompare(String(bv ?? ''), 'tr');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [columns, filterColumn, query, safeRows, sortDir, sortKey]);

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = visibleRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const allPageSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));

  React.useEffect(() => {
    setPage(1);
  }, [filterColumn, pageSize, query]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  const togglePageSelection = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allPageSelected) pageRows.forEach((row) => next.delete(row.id));
      else pageRows.forEach((row) => next.add(row.id));
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[13px] text-[#64748b]">{subtitle}</p>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {toolbarActions}
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ara"
              className="h-9 w-full rounded-md border border-[#cbd5e1] bg-white pl-9 pr-3 text-[13px] text-[#0f172a] outline-none focus:border-[#2563eb] sm:w-56"
            />
          </label>
          <select
            value={filterColumn}
            onChange={(event) => setFilterColumn(event.target.value)}
            className="h-9 rounded-md border border-[#cbd5e1] bg-white px-3 text-[13px] text-[#0f172a] outline-none focus:border-[#2563eb]"
          >
            <option value="all">Tüm kolonlar</option>
            {columns.map((column) => <option key={column.key} value={column.key}>{column.label}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#1e40af]" />
          </div>
        ) : isError ? (
          <div className="px-6 py-16 text-center text-[14px] text-[#64748b]">
            Veri alınamadı. Modül aktif değilse veya yetkiniz yoksa görüntülenemez.
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Inbox className="h-10 w-10 text-[#cbd5e1]" />
            <p className="text-[14px] text-[#64748b]">{emptyText || 'Henüz kayıt yok.'}</p>
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Inbox className="h-10 w-10 text-[#cbd5e1]" />
            <p className="text-[14px] text-[#64748b]">Aramanızla eşleşen kayıt bulunamadı.</p>
          </div>
        ) : (
          <div>
            <div className="flex min-h-11 items-center justify-between gap-3 border-b border-[#e2e8f0] px-4 py-2 text-[13px] text-[#64748b]">
              <span>{visibleRows.length} kayıt</span>
              <span>{selected.size ? `${selected.size} seçili` : 'Seçim yok'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-fixed text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[12px] uppercase text-[#64748b]">
                    <th className="w-11 px-4 py-3">
                      <input type="checkbox" checked={allPageSelected} onChange={togglePageSelection} aria-label="Sayfadaki kayıtları seç" />
                    </th>
                    {columns.map((c) => {
                      const active = sortKey === c.key;
                      return (
                        <th key={c.key} className={`px-4 py-3 font-semibold ${c.className ?? ''}`}>
                          <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex max-w-full items-center gap-1 text-left">
                            <span className="truncate">{c.label}</span>
                            {active ? (sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : null}
                          </button>
                        </th>
                      );
                    })}
                    {rowActions && <th className="w-28 px-4 py-3 font-semibold">İşlem</th>}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr key={row.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#eff6ff]/50">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} aria-label="Kaydı seç" />
                      </td>
                      {columns.map((c) => (
                        <td key={c.key} className={`truncate px-4 py-3 text-[#1e293b] ${c.className ?? ''}`}>
                          {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '-')}
                        </td>
                      ))}
                      {rowActions && <td className="px-4 py-3">{rowActions(row)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#e2e8f0] px-4 py-3 text-[13px] text-[#64748b] sm:flex-row sm:items-center sm:justify-between">
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-8 w-24 rounded-md border border-[#cbd5e1] bg-white px-2 text-[#0f172a] outline-none"
              >
                {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>{safePage} / {pageCount}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={safePage >= pageCount} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
