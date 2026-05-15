// src/store/Provider.ts
'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { makeStore } from './makeStore';

// Uygulama için tek store instance
const store = makeStore();

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
