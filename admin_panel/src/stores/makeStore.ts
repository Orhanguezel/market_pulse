// src/store/makeStore.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { baseApi } from '@/integrations/baseApi';
import preferencesReducer from './preferencesSlice';

type AnyApi = {
  reducerPath: string;
  reducer: any;
  middleware: any;
};

const apis: AnyApi[] = [baseApi];

export function makeStore() {
  const reducer = {
    // ✅ Preferences (zustand yerine)
    preferences: preferencesReducer,

    // ✅ RTK Query API reducers
    ...Object.fromEntries(apis.map((api) => [api.reducerPath, api.reducer])),
  };

  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(apis.map((api) => api.middleware)),
    devTools: process.env.NODE_ENV !== 'production',
  });

  setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
