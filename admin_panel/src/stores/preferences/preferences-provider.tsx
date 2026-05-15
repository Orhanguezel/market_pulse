// src/stores/preferences/preferences-provider.tsx
'use client';

import * as React from 'react';
import { useStore } from 'zustand';

import type { PreferencesState } from './preferences-store';
import { createPreferencesStore } from './preferences-store';

type PreferencesStoreApi = ReturnType<typeof createPreferencesStore>;

const PreferencesStoreContext = React.createContext<PreferencesStoreApi | null>(null);

export function PreferencesStoreProvider({
  children,
  init,
}: {
  children: React.ReactNode;
  init?: Partial<PreferencesState>;
}) {
  const storeRef = React.useRef<PreferencesStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createPreferencesStore(init);
  }

  return (
    <PreferencesStoreContext.Provider value={storeRef.current}>
      {children}
    </PreferencesStoreContext.Provider>
  );
}

export function usePreferencesStore<T>(selector: (state: PreferencesState) => T): T {
  const store = React.useContext(PreferencesStoreContext);
  if (!store) {
    throw new Error('usePreferencesStore must be used within PreferencesStoreProvider');
  }
  return useStore(store, selector);
}
