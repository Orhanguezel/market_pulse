// src/seo/LayoutSeoBridge.tsx
'use client';

import { useEffect } from 'react';
import type { LayoutSeoOverrides } from '@/seo';
import { resetLayoutSeo, setLayoutSeo } from '@/seo';

/**
 * Page-level override setter (navigation-safe)
 * - uses global store (no Provider)
 * - auto-reset on unmount
 */
export function LayoutSeoBridge(props: LayoutSeoOverrides) {
  useEffect(() => {
    setLayoutSeo({
      title: props.title,
      description: props.description,
      ogImage: props.ogImage,
      noindex: props.noindex,
    });

    return () => {
      resetLayoutSeo();
    };
  }, [props.title, props.description, props.ogImage, props.noindex]);

  return null;
}
