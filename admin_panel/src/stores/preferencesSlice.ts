// src/stores/preferencesSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { FontKey } from '@/lib/fonts/registry';
import type {
  ContentLayout,
  NavbarStyle,
  SidebarCollapsible,
  SidebarVariant,
} from '@/lib/preferences/layout';
import { PREFERENCE_DEFAULTS } from '@/lib/preferences/preferences-config';
import type { ThemeMode, ThemePreset } from '@/lib/preferences/theme';

export type PreferencesState = {
  themeMode: ThemeMode;
  themePreset: ThemePreset;
  font: FontKey;
  contentLayout: ContentLayout;
  navbarStyle: NavbarStyle;
  sidebarVariant: SidebarVariant;
  sidebarCollapsible: SidebarCollapsible;
  isSynced: boolean;
};

const initialState: PreferencesState = {
  themeMode: PREFERENCE_DEFAULTS.theme_mode,
  themePreset: PREFERENCE_DEFAULTS.theme_preset,
  font: PREFERENCE_DEFAULTS.font,
  contentLayout: PREFERENCE_DEFAULTS.content_layout,
  navbarStyle: PREFERENCE_DEFAULTS.navbar_style,
  sidebarVariant: PREFERENCE_DEFAULTS.sidebar_variant,
  sidebarCollapsible: PREFERENCE_DEFAULTS.sidebar_collapsible,
  isSynced: false,
};

type SyncPayload = Partial<Omit<PreferencesState, 'isSynced'>>;

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    // DOM veya SSR defaults’tan ilk senkron
    syncFromDom(state, action: PayloadAction<SyncPayload>) {
      Object.assign(state, action.payload);
      state.isSynced = true;
    },

    // ✅ Tek seferde çoklu set (UI formlarında kullanışlı)
    setMany(state, action: PayloadAction<Partial<PreferencesState>>) {
      Object.assign(state, action.payload);
    },

    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    setThemePreset(state, action: PayloadAction<ThemePreset>) {
      state.themePreset = action.payload;
    },
    setFont(state, action: PayloadAction<FontKey>) {
      state.font = action.payload;
    },
    setContentLayout(state, action: PayloadAction<ContentLayout>) {
      state.contentLayout = action.payload;
    },
    setNavbarStyle(state, action: PayloadAction<NavbarStyle>) {
      state.navbarStyle = action.payload;
    },
    setSidebarVariant(state, action: PayloadAction<SidebarVariant>) {
      state.sidebarVariant = action.payload;
    },
    setSidebarCollapsible(state, action: PayloadAction<SidebarCollapsible>) {
      state.sidebarCollapsible = action.payload;
    },
  },
});

export const preferencesActions = preferencesSlice.actions;
export default preferencesSlice.reducer;
