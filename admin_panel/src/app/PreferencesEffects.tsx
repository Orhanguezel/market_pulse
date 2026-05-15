// src/app/PreferencesEffects.tsx
'use client';

import { useEffect, useRef } from 'react';

import { useAppSelector } from '@/stores/hooks';
import { persistPreference } from '@/lib/preferences/preferences-storage';

import { applyThemeMode, applyThemePreset } from '@/lib/preferences/theme-utils';
import {
  applyContentLayout,
  applyNavbarStyle,
  applySidebarCollapsible,
  applySidebarVariant,
  applyFont,
} from '@/lib/preferences/layout-utils';

export function PreferencesEffects() {
  const prefs = useAppSelector((s) => s.preferences);
  const mounted = useRef(false);

  // İlk mount’ta DOM zaten ThemeBootScript ile setlenmiş olabilir.
  // Yine de redux state’i authoritative kabul edip apply edelim.
  useEffect(() => {
    // apply DOM
    applyThemeMode(prefs.themeMode);
    applyThemePreset(prefs.themePreset);
    applyFont(prefs.font);
    applyContentLayout(prefs.contentLayout);
    applyNavbarStyle(prefs.navbarStyle);
    applySidebarVariant(prefs.sidebarVariant);
    applySidebarCollapsible(prefs.sidebarCollapsible);

    // Persist sadece initial senkron tamamlandıktan sonra anlamlı
    // ve ilk render’da gereksiz cookie yazımını azaltmak için mounted kontrolü.
    if (!prefs.isSynced) return;

    if (!mounted.current) {
      mounted.current = true;
      // İstersen ilk senkron sonrası da yazabiliriz ama gereksiz I/O olabilir.
      return;
    }

    // persist (key names config ile uyumlu)
    void persistPreference('theme_mode', prefs.themeMode);
    void persistPreference('theme_preset', prefs.themePreset);
    void persistPreference('font', prefs.font);
    void persistPreference('content_layout', prefs.contentLayout);
    void persistPreference('navbar_style', prefs.navbarStyle);
    void persistPreference('sidebar_variant', prefs.sidebarVariant);
    void persistPreference('sidebar_collapsible', prefs.sidebarCollapsible);
  }, [
    prefs.themeMode,
    prefs.themePreset,
    prefs.font,
    prefs.contentLayout,
    prefs.navbarStyle,
    prefs.sidebarVariant,
    prefs.sidebarCollapsible,
    prefs.isSynced,
  ]);

  return null;
}
