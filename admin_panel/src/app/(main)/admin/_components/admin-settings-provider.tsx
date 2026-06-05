'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  useGetSiteSettingAdminByKeyQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/endpoints/admin/site_settings_admin.endpoints';
import { useAppDispatch } from '@/stores/hooks';
import { preferencesActions } from '@/stores/preferencesSlice';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import type { ThemeMode, ThemePreset } from '@/lib/preferences/theme';
import type { SidebarVariant, SidebarCollapsible, NavbarStyle, ContentLayout } from '@/lib/preferences/layout';
import type { FontKey } from '@/lib/fonts/registry';
import { applyThemeMode, applyThemePreset } from '@/lib/preferences/theme-utils';
import {
  applyContentLayout,
  applyNavbarStyle,
  applySidebarCollapsible,
  applySidebarVariant,
  applyFont,
} from '@/lib/preferences/layout-utils';
import { DEFAULT_BRANDING, type AdminBrandingConfig } from '@/config/app-config';
import { getSelectedTenantKey } from '@/integrations/core/tenant';
import { useGetTenantQuery } from '@/integrations/hooks';

export type AdminPageMeta = Record<string, { title: string; description?: string; metrics?: string[] }>;

type AdminSettingsContextValue = {
  pageMeta: AdminPageMeta;
  branding: AdminBrandingConfig;
  loading: boolean;
  /** Mevcut tercihleri DB'ye kaydeder (debounced 1s) */
  saveAdminConfig: () => void;
};

const AdminSettingsContext = createContext<AdminSettingsContextValue>({
  pageMeta: {},
  branding: DEFAULT_BRANDING,
  loading: false,
  saveAdminConfig: () => {},
});

export const useAdminSettings = () => useContext(AdminSettingsContext);

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const setAdminLocale = usePreferencesStore((s) => s.setAdminLocale);
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const [tenantKey, setTenantKey] = React.useState('');

  useEffect(() => {
    setTenantKey(getSelectedTenantKey());
  }, []);

  /* --- Zustand setters --- */
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);
  const setThemePreset = usePreferencesStore((s) => s.setThemePreset);
  const setFont = usePreferencesStore((s) => s.setFont);
  const setContentLayout = usePreferencesStore((s) => s.setContentLayout);
  const setNavbarStyle = usePreferencesStore((s) => s.setNavbarStyle);
  const setSidebarVariant = usePreferencesStore((s) => s.setSidebarVariant);
  const setSidebarCollapsible = usePreferencesStore((s) => s.setSidebarCollapsible);

  /* --- Zustand values (ref ile izle — save sırasında oku) --- */
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const themePreset = usePreferencesStore((s) => s.themePreset);
  const font = usePreferencesStore((s) => s.font);
  const contentLayout = usePreferencesStore((s) => s.contentLayout);
  const navbarStyle = usePreferencesStore((s) => s.navbarStyle);
  const sidebarVariant = usePreferencesStore((s) => s.sidebarVariant);
  const sidebarCollapsible = usePreferencesStore((s) => s.sidebarCollapsible);

  // Ref: save sırasında güncel değerleri oku (stale closure önleme)
  const prefsRef = useRef({ themeMode, themePreset, font, contentLayout, navbarStyle, sidebarVariant, sidebarCollapsible, adminLocale });
  prefsRef.current = { themeMode, themePreset, font, contentLayout, navbarStyle, sidebarVariant, sidebarCollapsible, adminLocale };

  // 1. Fetch Global Config
  const { data: configRow, isLoading: configLoading } = useGetSiteSettingAdminByKeyQuery('ui_admin_config');

  const config = useMemo(() => {
    if (!configRow?.value) return null;
    try {
      return typeof configRow.value === 'string' ? JSON.parse(configRow.value) : configRow.value;
    } catch { return null; }
  }, [configRow]);

  const configRef = useRef(config);
  configRef.current = config;

  // 2. Fetch Page Meta
  const locale = adminLocale || config?.default_locale || 'tr';
  const { data: pagesRow, isLoading: pagesLoading } = useGetSiteSettingAdminByKeyQuery({ key: 'ui_admin_pages', locale });
  const { data: activeTenant, isLoading: tenantLoading } = useGetTenantQuery(tenantKey, { skip: !tenantKey });

  const pageMeta = useMemo(() => {
    if (!pagesRow?.value) return {};
    try {
      return typeof pagesRow.value === 'string' ? JSON.parse(pagesRow.value) : pagesRow.value;
    } catch { return {}; }
  }, [pagesRow]);

  // 3. Extract branding from config
  const branding = useMemo<AdminBrandingConfig>(() => {
    const base = config?.branding
      ? {
          ...DEFAULT_BRANDING,
          ...config.branding,
          meta: { ...DEFAULT_BRANDING.meta, ...(config.branding.meta || {}) },
        }
      : DEFAULT_BRANDING;
    const tenantBranding = activeTenant?.branding;
    if (!tenantBranding) return base;
    const tenantName = String(tenantBranding.appName || tenantBranding.displayName || activeTenant.name || base.app_name);
    return {
      ...base,
      app_name: tenantName,
      app_copyright: String(tenantBranding.displayName || activeTenant.name || base.app_copyright),
      logo_url: String(tenantBranding.logoUrl || base.logo_url || ''),
      meta: {
        ...base.meta,
        title: tenantName,
        og_title: tenantName,
      },
    };
  }, [config, activeTenant]);

  /* ================================================================ */
  /*  4. DB → Redux + Zustand sync + DOM apply (ilk yükleme)           */
  /* ================================================================ */
  useEffect(() => {
    if (!config) return;

    // Redux sync
    if (config.theme) {
      if (config.theme.mode) dispatch(preferencesActions.setThemeMode(config.theme.mode as ThemeMode));
      if (config.theme.preset) dispatch(preferencesActions.setThemePreset(config.theme.preset as ThemePreset));
      if (config.theme.font) dispatch(preferencesActions.setFont(config.theme.font as FontKey));
    }
    if (config.layout) {
      if (config.layout.sidebar_variant) dispatch(preferencesActions.setSidebarVariant(config.layout.sidebar_variant as SidebarVariant));
      if (config.layout.sidebar_collapsible) dispatch(preferencesActions.setSidebarCollapsible(config.layout.sidebar_collapsible as SidebarCollapsible));
      if (config.layout.navbar_style) dispatch(preferencesActions.setNavbarStyle(config.layout.navbar_style as NavbarStyle));
      if (config.layout.content_layout) dispatch(preferencesActions.setContentLayout(config.layout.content_layout as ContentLayout));
    }
    // Mark redux as synced so PreferencesEffects knows DB data is loaded
    dispatch(preferencesActions.syncFromDom({}));

    // Zustand sync (UI kontrolleri Zustand okur)
    if (config.default_locale) {
      setAdminLocale(config.default_locale);
    }
    if (config.theme) {
      if (config.theme.mode) setThemeMode(config.theme.mode as ThemeMode);
      if (config.theme.preset) setThemePreset(config.theme.preset as ThemePreset);
      if (config.theme.font) setFont(config.theme.font as FontKey);
    }
    if (config.layout) {
      if (config.layout.sidebar_variant) setSidebarVariant(config.layout.sidebar_variant as SidebarVariant);
      if (config.layout.sidebar_collapsible) setSidebarCollapsible(config.layout.sidebar_collapsible as SidebarCollapsible);
      if (config.layout.navbar_style) setNavbarStyle(config.layout.navbar_style as NavbarStyle);
      if (config.layout.content_layout) setContentLayout(config.layout.content_layout as ContentLayout);
    }

    // ✅ DOM Apply — DB'den gelen değerleri DOM'a uygula
    if (config.theme) {
      if (config.theme.mode) applyThemeMode(config.theme.mode as 'light' | 'dark');
      if (config.theme.preset) applyThemePreset(config.theme.preset);
      if (config.theme.font) applyFont(config.theme.font);
    }
    if (config.layout) {
      if (config.layout.content_layout) applyContentLayout(config.layout.content_layout as 'centered' | 'full-width');
      if (config.layout.navbar_style) applyNavbarStyle(config.layout.navbar_style as 'sticky' | 'scroll');
      if (config.layout.sidebar_variant) applySidebarVariant(config.layout.sidebar_variant);
      if (config.layout.sidebar_collapsible) applySidebarCollapsible(config.layout.sidebar_collapsible);
    }
  }, [
    config, dispatch,
    setThemeMode, setThemePreset, setFont,
    setContentLayout, setNavbarStyle, setSidebarVariant, setSidebarCollapsible,
    setAdminLocale,
  ]);

  /* ================================================================ */
  /*  5. saveAdminConfig — child component'ler her değişiklikte çağırır */
  /*     Debounced 1s: art arda değişiklikleri birleştirir              */
  /* ================================================================ */
  const [updateSetting] = useUpdateSiteSettingAdminMutation();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveAdminConfig = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const c = configRef.current;
      const p = prefsRef.current;
      if (!c) return;

      const newValue = {
        ...c,
        default_locale: p.adminLocale || c.default_locale,
        theme: {
          mode: p.themeMode,
          preset: p.themePreset,
          font: p.font,
        },
        layout: {
          sidebar_variant: p.sidebarVariant,
          sidebar_collapsible: p.sidebarCollapsible,
          navbar_style: p.navbarStyle,
          content_layout: p.contentLayout,
        },
      };

      updateSetting({ key: 'ui_admin_config', value: newValue, locale: '*' });
    }, 1000);
  }, [updateSetting]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  const ctxValue = useMemo<AdminSettingsContextValue>(() => ({
    pageMeta: pageMeta as AdminPageMeta,
    branding,
    loading: configLoading || pagesLoading || tenantLoading,
    saveAdminConfig,
  }), [pageMeta, branding, configLoading, pagesLoading, saveAdminConfig]);

  return (
    <AdminSettingsContext.Provider value={ctxValue}>
      {children}
    </AdminSettingsContext.Provider>
  );
}
