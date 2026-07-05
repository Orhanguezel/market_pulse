'use client';

import { Loader2 } from 'lucide-react';

export type CrmDetailField = {
  label: string;
  value: unknown;
};

export function CrmDetailView({
  title,
  subtitle,
  fields,
  isLoading,
  isError,
}: {
  title: string;
  subtitle?: string | null;
  fields: CrmDetailField[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0f172a]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-[#64748b]">{subtitle}</p>}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#1e40af]" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-[#e2e8f0] bg-white px-6 py-12 text-center text-[14px] text-[#64748b]">
          Kayıt alınamadı.
        </div>
      ) : (
        <div className="rounded-lg border border-[#e2e8f0] bg-white">
          <div className="flex border-b border-[#e2e8f0] px-4 pt-3 text-[13px] font-semibold text-[#475569]">
            <span className="border-b-2 border-[#2563eb] px-3 pb-3 text-[#1d4ed8]">Özet</span>
            <span className="px-3 pb-3 text-[#94a3b8]">Aktiviteler</span>
            <span className="px-3 pb-3 text-[#94a3b8]">Notlar</span>
          </div>
          <dl className="grid gap-0 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.label} className="border-b border-[#f1f5f9] px-5 py-4">
                <dt className="text-[12px] font-semibold uppercase text-[#64748b]">{field.label}</dt>
                <dd className="mt-1 truncate text-[14px] text-[#0f172a]">{String(field.value ?? '-')}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
