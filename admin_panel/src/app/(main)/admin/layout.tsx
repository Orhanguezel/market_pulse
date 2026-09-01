// =============================================================
// FILE: src/app/(main)/admin/layout.tsx
// Admin shell: sidebar + header
// =============================================================

import type { ReactNode } from 'react';

import { AppSidebar } from '@/app/(main)/admin/_components/sidebar/app-sidebar';

import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

import { AccountSwitcher } from './_components/sidebar/account-switcher';
import { AdminHeaderBrand } from './_components/sidebar/admin-header-brand';
import { AdminFooter } from './_components/sidebar/admin-footer';
import { AdminSettingsDropdown } from './_components/sidebar/admin-settings-dropdown';
import { LayoutControls } from './_components/sidebar/layout-controls';
import { ThemeSwitcher } from './_components/sidebar/theme-switcher';

import AdminAuthGate from './_components/admin-auth-gate';
import { AdminSettingsProvider } from './_components/admin-settings-provider';

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AdminAuthGate>
      <AdminSettingsProvider>
        <SidebarProvider defaultOpen className="bg-gm-bg bg-sidebar">
          <AppSidebar
            variant="inset"
            collapsible="icon"
            className="border-r border-gm-border-soft print:hidden"
            me={{
              id: 'me',
              name: 'Admin',
              email: 'admin',
              role: 'admin',
              roles: ['admin'],
              avatar: '',
            }}
          />

          <SidebarInset
            className={cn(
              'flex flex-col bg-gm-bg',
              '[html[data-content-layout=centered]_&]:mx-auto! [html[data-content-layout=centered]_&]:max-w-screen-2xl!',
              'max-[113rem]:peer-data-[variant=inset]:mr-2! min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:peer-data-[state=collapsed]:mr-auto!',
            )}
          >
            <header
              className={cn(
                'flex h-16 shrink-0 items-center gap-2 border-b border-gm-border-soft transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16',
                'bg-gm-bg/80 backdrop-blur-xl sticky top-0 z-50 print:hidden',
              )}
            >
              <div className="flex w-full items-center justify-between px-4 lg:px-8">
                <div className="flex items-center gap-1 lg:gap-2">
                  <SidebarTrigger className="-ml-1 text-gm-gold hover:bg-gm-gold/10 transition-colors" />
                  <Separator
                    orientation="vertical"
                    className="mx-3 h-6 bg-gm-border-soft"
                  />
                  <AdminHeaderBrand />
                </div>

                <div className="flex items-center gap-4">
                  <LayoutControls />
                  <ThemeSwitcher />
                  <AdminSettingsDropdown />
                  <Separator orientation="vertical" className="h-6 bg-gm-border-soft" />
                  <AccountSwitcher me={{ id: 'me', email: 'admin', role: 'admin' }} />
                </div>
              </div>
            </header>

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 min-w-0 overflow-auto p-6 md:p-10 lg:p-12">
                <div className="mx-auto max-w-screen-2xl">
                  {children}
                </div>
              </div>
              <AdminFooter />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AdminSettingsProvider>
    </AdminAuthGate>
  );
}
