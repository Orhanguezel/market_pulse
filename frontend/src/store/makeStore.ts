// src/store/makeStore.ts
"use client";

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { baseApi } from "@/integrations/rtk/baseApi";

// RTK Query api instance tipi (reducerPath, reducer, middleware taşıyan her şey)
// Şimdilik sadece baseApi var ama ileride başka createApi instance’ları ekleyebilirsin.
type AnyApi = {
  reducerPath: string;
  reducer: any;
  middleware: any;
};

// Store’da kullanacağımız tüm createApi instance’ları
const apis: AnyApi[] = [baseApi];

export function makeStore() {
  const reducer = {
    // Tüm API’leri dinamik olarak ekle
    ...Object.fromEntries(
      apis.map((api) => [api.reducerPath, api.reducer]),
    ),
  };

  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(apis.map((api) => api.middleware)),
    devTools: process.env.NODE_ENV !== "production",
  });

  setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
