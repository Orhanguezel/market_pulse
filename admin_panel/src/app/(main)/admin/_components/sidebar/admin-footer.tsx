'use client';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';

export function AdminFooter() {
  const { copy } = useAdminUiCopy();

  return (
    <footer className="mt-auto border-t py-4 px-6 bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{copy.app_name || 'Admin Panel'}</span>
          <span className="text-border">|</span>
          <span className="font-mono">{copy.app_version || 'v1.4.2'}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <span>Designed & Developed by</span>
          <a 
            href={copy.developer_branding?.url || process.env.NEXT_PUBLIC_DEVELOPER_URL || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:text-primary transition-colors underline underline-offset-2"
            title={copy.developer_branding?.full_name || process.env.NEXT_PUBLIC_DEVELOPER_NAME || ''}
          >
            {copy.developer_branding?.name || 'GWD'}
          </a>
        </div>
      </div>
    </footer>
  );
}
