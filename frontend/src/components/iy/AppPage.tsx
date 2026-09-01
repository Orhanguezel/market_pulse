import type { ComponentType, ReactNode } from 'react';

type IconType = ComponentType<{ className?: string }>;

export function AppPage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-5 ${className}`.trim()}>{children}</div>;
}

export function AppPageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon?: IconType;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eff6ff] text-[#1e40af]">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#0f172a]">{title}</h1>
          {description && <p className="mt-0.5 text-[13px] text-[#64748b]">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AppCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[#e2e8f0] bg-white ${className}`.trim()}>
      {children}
    </div>
  );
}
