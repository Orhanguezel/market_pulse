// =============================================================
// FILE: src/layout/SiteLogo.tsx
// Dynamic Site Logo (GLOBAL '*')
// - site_logo (primary) / site_logo_dark (secondary) / site_logo_light
// - SVG: plain <img> (no Next.js Image optimization)
// - Raster: Next.js <Image>
// =============================================================

'use client';

import React, { useMemo } from 'react';
import Image, { type StaticImageData } from 'next/image';

import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import type { SettingValue } from '@/integrations/shared';
import { safeStr } from '@/integrations/shared';
import { getDefaultLogoAlt } from '@/lib/site-config';

type Variant = 'default' | 'dark' | 'light';

export type SiteLogoProps = {
  variant?: Variant;
  overrideSrc?: StaticImageData | string;
  alt?: string;
  className?: string;
  priority?: boolean;
  wrapperClassName?: string;
};

const variantKeyMap: Record<Variant, string> = {
  default: 'site_logo',
  dark: 'site_logo_dark',
  light: 'site_logo_light',
};

function extractMedia(val: SettingValue | null | undefined): {
  url: string;
  width?: number;
  height?: number;
} {
  if (val === null || val === undefined) return { url: '' };

  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return { url: '' };

    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));

    if (!looksJson) return { url: s };

    try {
      const parsed = JSON.parse(s);
      const url = safeStr((parsed as any)?.url);
      const width = (parsed as any)?.width;
      const height = (parsed as any)?.height;
      return {
        url,
        width: typeof width === 'number' ? width : undefined,
        height: typeof height === 'number' ? height : undefined,
      };
    } catch {
      return { url: s };
    }
  }

  if (typeof val === 'object') {
    const obj = val as any;
    const url = safeStr(obj?.url);
    const width = obj?.width;
    const height = obj?.height;
    return {
      url,
      width: typeof width === 'number' ? width : undefined,
      height: typeof height === 'number' ? height : undefined,
    };
  }

  return { url: '' };
}

function isSvg(src: string | StaticImageData): boolean {
  if (typeof src !== 'string') return false;
  const lower = src.toLowerCase().split('?')[0].split('#')[0];
  return lower.endsWith('.svg') || lower.includes('f_svg') || lower.includes('format=svg');
}

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(' ');
}

export const SiteLogo: React.FC<SiteLogoProps> = ({
  variant = 'default',
  overrideSrc,
  alt = getDefaultLogoAlt(),
  className,
  wrapperClassName,
  priority = true,
}) => {
  const key = variantKeyMap[variant];

  const { data: setting } = useGetSiteSettingByKeyQuery({
    key,
    locale: '*',
  });

  const { url, width: mediaWidth, height: mediaHeight } = useMemo(
    () => extractMedia((setting?.value as SettingValue) ?? null),
    [setting?.value],
  );

  const finalSrc: StaticImageData | string = overrideSrc || safeStr(url);

  const frameClass = cx(
    'inline-flex items-center justify-start select-none transition-opacity hover:opacity-90',
    'w-40 sm:w-48 max-w-full',
    wrapperClassName,
  );

  if (!finalSrc) {
    return (
      <span className={frameClass} aria-hidden="true">
        <span
          className="w-full h-10 bg-bg-card-hover border border-border-light animate-pulse"
          aria-hidden="true"
        />
      </span>
    );
  }

  // SVG → plain <img> (no Next.js optimization needed, preserves viewBox scaling)
  if (typeof finalSrc === 'string' && isSvg(finalSrc)) {
    return (
      <span className={frameClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={finalSrc}
          alt={alt}
          className={cx('w-full h-auto', className)}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
        />
      </span>
    );
  }

  // Raster URL -> use native img so aspect ratio is preserved from the actual file.
  if (typeof finalSrc === 'string') {
    return (
      <span className={frameClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={finalSrc}
          alt={alt}
          className={cx('w-full h-auto object-contain', className)}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
        />
      </span>
    );
  }

  // Raster → Next.js <Image>
  const w = typeof finalSrc === 'object' ? (finalSrc.width ?? mediaWidth ?? 500) : 500;
  const h = typeof finalSrc === 'object' ? (finalSrc.height ?? mediaHeight ?? 160) : 160;

  return (
    <span className={frameClass} aria-label={alt}>
      <Image
        key={typeof finalSrc === 'string' ? finalSrc : 'settings-logo'}
        src={finalSrc}
        alt={alt}
        width={w}
        height={h}
        className={cx('w-full h-auto', className)}
        sizes="(max-width: 576px) 160px, (max-width: 992px) 208px, 256px"
        priority={priority}
      />
    </span>
  );
};

SiteLogo.displayName = 'SiteLogo';
