'use client';

import { AlertCircle, Loader2 } from 'lucide-react';

type Metric = {
  label: string;
  value: string | number | null | undefined;
  tone?: 'default' | 'blue' | 'green' | 'amber' | 'red';
};

const toneClass: Record<NonNullable<Metric['tone']>, string> = {
  default: 'border-[#e2e8f0] bg-white text-[#0f172a]',
  blue: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]',
  green: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]',
  amber: 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]',
  red: 'border-[#fecaca] bg-[#fef2f2] text-[#991b1b]',
};

export default function SummaryOverview({
  title,
  subtitle,
  metrics,
  isLoading,
  isError,
  children,
}: {
  title: string;
  subtitle: string;
  metrics: Metric[];
  isLoading?: boolean;
  isError?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-[#0f172a]">{title}</h1>
        <p className="mt-1 text-sm text-[#64748b]">{subtitle}</p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-[#e2e8f0] bg-white">
          <Loader2 className="h-7 w-7 animate-spin text-[#1e40af]" />
        </div>
      ) : isError ? (
        <div className="flex min-h-[180px] items-center justify-center gap-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] text-sm font-medium text-[#991b1b]">
          <AlertCircle className="h-5 w-5" />
          Veri alınamadı.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className={`rounded-lg border p-4 ${toneClass[metric.tone ?? 'default']}`}>
                <p className="text-xs font-medium uppercase tracking-normal opacity-75">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-normal">{metric.value ?? 0}</p>
              </div>
            ))}
          </div>
          {children}
        </>
      )}
    </section>
  );
}
