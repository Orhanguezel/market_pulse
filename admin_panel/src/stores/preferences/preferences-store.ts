// src/stores/preferences/preferences-store.ts

import { createStore } from 'zustand/vanilla';

import type { FontKey } from '@/lib/fonts/registry';
import type {
  ContentLayout,
  NavbarStyle,
  SidebarCollapsible,
  SidebarVariant,
} from '@/lib/preferences/layout';
import { PREFERENCE_DEFAULTS } from '@/lib/preferences/preferences-config';
import type { ThemeMode, ThemePreset } from '@/lib/preferences/theme';

function readCookieValue(name: string): string {
  if (typeof document === 'undefined') return '';
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
  } catch {
    return '';
  }
}

export type PreferencesState = {
  themeMode: ThemeMode;
  themePreset: ThemePreset;
  font: FontKey;
  contentLayout: ContentLayout;
  navbarStyle: NavbarStyle;
  sidebarVariant: SidebarVariant;
  sidebarCollapsible: SidebarCollapsible;
  adminLocale: string;

  setThemeMode: (mode: ThemeMode) => void;
  setThemePreset: (preset: ThemePreset) => void;
  setFont: (font: FontKey) => void;
  setContentLayout: (layout: ContentLayout) => void;
  setNavbarStyle: (style: NavbarStyle) => void;
  setSidebarVariant: (variant: SidebarVariant) => void;
  setSidebarCollapsible: (mode: SidebarCollapsible) => void;
  setAdminLocale: (locale: string) => void;

  isSynced: boolean;
  setIsSynced: (val: boolean) => void;
};

// ✅ init sadece state alanlarını kabul etsin (action değil)
export type PreferencesInit = Partial<
  Pick<
    PreferencesState,
    | 'themeMode'
    | 'themePreset'
    | 'font'
    | 'contentLayout'
    | 'navbarStyle'
    | 'sidebarVariant'
    | 'sidebarCollapsible'
    | 'adminLocale'
    | 'isSynced'
  >
>;

export const createPreferencesStore = (init?: PreferencesInit) =>
  createStore<PreferencesState>()((set) => ({
    themeMode: (init?.themeMode ?? (readCookieValue('theme_mode') as ThemeMode)) || PREFERENCE_DEFAULTS.theme_mode,
    themePreset: (init?.themePreset ?? (readCookieValue('theme_preset') as ThemePreset)) || PREFERENCE_DEFAULTS.theme_preset,
    font: (init?.font ?? (readCookieValue('font') as FontKey)) || PREFERENCE_DEFAULTS.font,
    contentLayout: (init?.contentLayout ?? (readCookieValue('content_layout') as ContentLayout)) || PREFERENCE_DEFAULTS.content_layout,
    navbarStyle: (init?.navbarStyle ?? (readCookieValue('navbar_style') as NavbarStyle)) || PREFERENCE_DEFAULTS.navbar_style,
    sidebarVariant: (init?.sidebarVariant ?? (readCookieValue('sidebar_variant') as SidebarVariant)) || PREFERENCE_DEFAULTS.sidebar_variant,
    sidebarCollapsible: (init?.sidebarCollapsible ?? (readCookieValue('sidebar_collapsible') as SidebarCollapsible)) || PREFERENCE_DEFAULTS.sidebar_collapsible,
    adminLocale: init?.adminLocale || readCookieValue('admin_locale') || PREFERENCE_DEFAULTS.admin_locale,

    setThemeMode: (mode) => set({ themeMode: mode }),
    setThemePreset: (preset) => set({ themePreset: preset }),
    setFont: (font) => set({ font }),
    setContentLayout: (layout) => set({ contentLayout: layout }),
    setNavbarStyle: (style) => set({ navbarStyle: style }),
    setSidebarVariant: (variant) => set({ sidebarVariant: variant }),
    setSidebarCollapsible: (mode) => set({ sidebarCollapsible: mode }),
    setAdminLocale: (locale) => set({ adminLocale: locale }),

    isSynced: init?.isSynced ?? false,
    setIsSynced: (val) => set({ isSynced: val }),
  }));
