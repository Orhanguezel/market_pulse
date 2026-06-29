'use client';

import { Loader2, Inbox } from 'lucide-react';

export type CrmColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

export default function CrmListView<T extends { id: string }>({
  title, subtitle, columns, rows, isLoading, isError, emptyText,
}: {
  title: string;
  subtitle?: string;
  columns: CrmColumn<T>[];
  rows?: T[];
  isLoading?: boolean;
  isError?: boolean;
  emptyText?: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0f172a]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-[#64748b]">{subtitle}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[12px] uppercase tracking-wide text-[#64748b]">
                  {columns.map((c) => (
                    <th key={c.key} className={`px-4 py-3 font-semibold ${c.className ?? ''}`}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#eff6ff]/50">
                    {columns.map((c) => (
                      <td key={c.key} className={`px-4 py-3 text-[#1e293b] ${c.className ?? ''}`}>
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
