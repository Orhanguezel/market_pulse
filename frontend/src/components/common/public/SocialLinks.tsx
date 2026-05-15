// =============================================================
// FILE: src/components/common/SocialLinks.tsx
// – Social Icons (shared)
// =============================================================
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

import { IconFacebook, IconInstagram, IconLinkedIn, IconTwitterX, IconYoutube } from '@/components/ui/icons';

export type SocialLinksMap = Record<string, string>;

type SocialItem = {
  key: string;
  label: string;
  url: string;
  Icon: React.ComponentType<{ className?: string; size?: number }>;
};

export type SocialLinksProps = {
  socials?: SocialLinksMap | null;
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  withLabels?: boolean; // default: false (icons only)
  onClickItem?: () => void;
};

const normalizeUrl = (u?: string) => {
  if (!u) return '';
  const s = String(u).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
};

export const SocialLinks: React.FC<SocialLinksProps> = ({
  socials,
  className,
  itemClassName,
  iconClassName,
  size = 'md',
  withLabels = false,
  onClickItem,
}) => {
  const items = useMemo<SocialItem[]>(() => {
    const s = (socials ?? {}) as any;

    const fb = normalizeUrl(s.facebook || s.fb);
    const tw = normalizeUrl(s.twitter || s.x);
    const yt = normalizeUrl(s.youtube || s.yt);
    const li = normalizeUrl(s.linkedin || s.in || s.li);
    const ig = normalizeUrl(s.instagram || s.ig);

    return [
      fb && { key: 'facebook', label: 'Facebook', url: fb, Icon: IconFacebook },
      tw && { key: 'twitter', label: 'X (Twitter)', url: tw, Icon: IconTwitterX },
      yt && { key: 'youtube', label: 'YouTube', url: yt, Icon: IconYoutube },
      li && { key: 'linkedin', label: 'LinkedIn', url: li, Icon: IconLinkedIn },
      ig && { key: 'instagram', label: 'Instagram', url: ig, Icon: IconInstagram },
    ].filter(Boolean) as SocialItem[];
  }, [socials]);

  if (!items.length) return null;

  const sizeClass =
    size === 'sm'
      ? 'app-social--sm'
      : size === 'lg'
      ? 'app-social--lg'
      : 'app-social--md';

  return (
    <ul className={`app-social ${sizeClass} ${className ?? ''}`}>
      {items.map(({ key, label, url, Icon }) => (
        <li key={key} className={itemClassName}>
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            onClick={onClickItem}
            className="app-social__a"
          >
            <Icon className={`app-social__icon ${iconClassName ?? ''}`} />
            {withLabels ? <span className="app-social__label">{label}</span> : null}
          </Link>
        </li>
      ))}

      <style jsx>{`
        .app-social {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .app-social__a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          border-radius: 999px;
          transition: transform 140ms ease, opacity 140ms ease;
          opacity: 0.92;
        }
        .app-social__a:hover {
          opacity: 1;
          transform: translateY(-1px);
        }

        .app-social--sm .app-social__a {
          width: 34px;
          height: 34px;
        }
        .app-social--md .app-social__a {
          width: 40px;
          height: 40px;
        }
        .app-social--lg .app-social__a {
          width: 46px;
          height: 46px;
        }

        .app-social__icon {
          width: 16px;
          height: 16px;
        }
        .app-social--sm .app-social__icon {
          width: 14px;
          height: 14px;
        }
        .app-social--lg .app-social__icon {
          width: 18px;
          height: 18px;
        }

        .app-social__label {
          margin-left: 8px;
          font-size: 13px;
          line-height: 1;
        }
      `}</style>
    </ul>
  );
};

export default SocialLinks;
