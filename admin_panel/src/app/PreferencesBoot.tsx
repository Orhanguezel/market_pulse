// src/app/PreferencesBoot.tsx
'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/stores/hooks';
import { preferencesActions } from '@/stores/preferencesSlice';

import { fontRegistry, type FontKey } from '@/lib/fonts/registry';
import {
  CONTENT_LAYOUT_VALUES,
  NAVBAR_STYLE_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  SIDEBAR_VARIANT_VALUES,
} from '@/lib/preferences/layout';
import { THEME_PRESET_VALUES } from '@/lib/preferences/theme';

const FONT_VALUES = Object.keys(fontRegistry) as FontKey[];

function getSafeValue<T extends string>(raw: string | null, allowed: readonly T[]): T | undefined {
  if (!raw) return undefined;
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}

function readDomState() {
  const root = document.documentElement;
  const mode = root.classList.contains('dark') ? 'dark' : 'light';

  return {
    themeMode: mode as 'dark' | 'light',
    themePreset: getSafeValue(root.getAttribute('data-theme-preset'), THEME_PRESET_VALUES),
    font: getSafeValue(root.getAttribute('data-font'), FONT_VALUES),
    contentLayout: getSafeValue(root.getAttribute('data-content-layout'), CONTENT_LAYOUT_VALUES),
    navbarStyle: getSafeValue(root.getAttribute('data-navbar-style'), NAVBAR_STYLE_VALUES),
    sidebarVariant: getSafeValue(root.getAttribute('data-sidebar-variant'), SIDEBAR_VARIANT_VALUES),
    sidebarCollapsible: getSafeValue(
      root.getAttribute('data-sidebar-collapsible'),
      SIDEBAR_COLLAPSIBLE_VALUES,
    ),
  };
}

export function PreferencesBoot() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(preferencesActions.syncFromDom(readDomState()));
  }, [dispatch]);

  return null;
}
