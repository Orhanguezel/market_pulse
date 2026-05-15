// src/seo/layoutSeoStore.ts
'use client';

export type LayoutSeoOverrides = {
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
};

type Listener = () => void;

let current: LayoutSeoOverrides = {};
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function setLayoutSeo(next: LayoutSeoOverrides) {
  current = next || {};
  emit();
}

export function resetLayoutSeo() {
  current = {};
  emit();
}

export function getLayoutSeoSnapshot() {
  return current;
}

export function subscribeLayoutSeo(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
