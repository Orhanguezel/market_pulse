'use client';

import React from 'react';
import Banner from '@/components/common/public/Banner';
import type { BannerPlacement } from '@/types/common';

type Variant = 'hero' | 'slim' | 'card';

interface Props {
  config?: {
    placement?: BannerPlacement | string;
    variant?: Variant;
    count?: number;
    dismissable?: boolean;
  } | null;
}

export default function BannerSlot({ config }: Props) {
  const placement = (config?.placement as BannerPlacement) || 'home_hero';
  const variant = config?.variant || 'hero';
  const count = config?.count ?? 1;
  const dismissable = !!config?.dismissable;

  return (
    <section className={variant === 'hero' ? 'container mx-auto px-4 -mt-10 mb-12 relative z-20' : 'container mx-auto px-4 py-6'}>
      <Banner placement={placement} variant={variant} count={count} dismissable={dismissable} />
    </section>
  );
}
