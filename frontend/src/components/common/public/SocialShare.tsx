// =============================================================
// FILE: src/components/common/SocialShare.tsx
// – Reusable Social Share + optional Social Profiles
// - Uses SCSS: .touch__social
// - Share URL: prefers public_base_url (site_settings) + router.asPath, fallback window.location.href
// - Optional company socials: site_settings.socials (localized) with EN fallback
// =============================================================

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { useLocaleShort } from '@/i18n';
import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import { safeStr, safeJson } from '@/integrations/shared';
import {
  IconCopy,
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconMail,
  IconTikTok,
  IconTwitterX,
  IconWhatsApp,
  IconYoutube,
} from '@/components/ui/icons';

type Socials = Partial<{
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  x: string;
  tiktok: string;
}>;

export type SocialShareProps = {
  /** Share “content” */
  title?: string;
  text?: string;

  /** If not provided, component will build from public_base_url + router.asPath (or window href) */
  url?: string;

  /** UI */
  className?: string;
  showLabel?: boolean;
  label?: string;

  /** Which share buttons to show */
  share?: Partial<{
    facebook: boolean;
    x: boolean;
    linkedin: boolean;
    whatsapp: boolean;
    email: boolean;
    copy: boolean;
  }>;

  /**
   * If true: additionally show company socials (profile links)
   * from site_settings.socials (localized + EN fallback)
   */
  showCompanySocials?: boolean;
};

function stripTrailingSlash(u: string) {
  return safeStr(u).replace(/\/+$/, '');
}

function buildShareLinks(input: { url: string; title?: string; text?: string }) {
  const url = encodeURIComponent(input.url);
  const title = encodeURIComponent(safeStr(input.title));
  const text = encodeURIComponent(safeStr(input.text));

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    x: `https://twitter.com/intent/tweet?url=${url}${title ? `&text=${title}` : ''}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    whatsapp: `https://wa.me/?text=${text ? `${text}%20${url}` : url}`,
    email: `mailto:?subject=${title}&body=${text ? `${text}%0A%0A${url}` : url}`,
  };
}

export default function SocialShare(props: SocialShareProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocaleShort();

  const showLabel = props.showLabel ?? true;
  const label = safeStr(props.label) || 'Share';

  const shareFlags = useMemo(
    () => ({
      facebook: props.share?.facebook ?? true,
      x: props.share?.x ?? true,
      linkedin: props.share?.linkedin ?? true,
      whatsapp: props.share?.whatsapp ?? true,
      email: props.share?.email ?? true,
      copy: props.share?.copy ?? true,
    }),
    [props.share],
  );

  // --- public_base_url (for stable absolute links)
  const { data: basePrimary } = useGetSiteSettingByKeyQuery(
    { key: 'public_base_url', locale: '*' } as any,
    { skip: false },
  );

  const baseUrl = useMemo(() => {
    const v = safeStr((basePrimary as any)?.value ?? basePrimary);
    return stripTrailingSlash(v);
  }, [basePrimary]);

  // --- socials (company profile links): localized + EN fallback
  const { data: socialsTrg } = useGetSiteSettingByKeyQuery({ key: 'socials', locale } as any, {
    skip: !props.showCompanySocials || !locale,
  });

  const { data: socialsEn } = useGetSiteSettingByKeyQuery({ key: 'socials', locale: 'de' } as any, {
    skip: !props.showCompanySocials || !locale || locale === 'de',
  });

  const companySocials = useMemo<Socials>(() => {
    if (!props.showCompanySocials) return {};
    const primary = safeJson<Socials | null>((socialsTrg as any)?.value ?? socialsTrg, null);
    const fallback = safeJson<Socials | null>((socialsEn as any)?.value ?? socialsEn, null);
    const pick = primary && Object.values(primary).some(Boolean) ? primary : fallback;
    return (pick ?? {}) as Socials;
  }, [props.showCompanySocials, socialsTrg, socialsEn]);

  const asPath = useMemo(() => {
    const p = safeStr(pathname);
    const qs = safeStr(searchParams?.toString());
    if (!p) return '';
    return qs ? `${p}?${qs}` : p;
  }, [pathname, searchParams]);

  // --- share url (prefer baseUrl + asPath, fallback window)
  const shareUrl = useMemo(() => {
    if (safeStr(props.url)) return safeStr(props.url);

    const path = safeStr(asPath);
    if (baseUrl && path) return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

    if (typeof window !== 'undefined') return window.location.href;
    return '';
  }, [props.url, asPath, baseUrl]);

  const links = useMemo(
    () => buildShareLinks({ url: shareUrl, title: props.title, text: props.text }),
    [shareUrl, props.title, props.text],
  );

  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    const u = safeStr(shareUrl);
    if (!u) return;

    try {
      await navigator.clipboard.writeText(u);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = u;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }
  }, [shareUrl]);

  const hasAnyShare =
    !!shareUrl &&
    (shareFlags.facebook ||
      shareFlags.x ||
      shareFlags.linkedin ||
      shareFlags.whatsapp ||
      shareFlags.email ||
      shareFlags.copy);

  const hasCompanySocials = props.showCompanySocials
    ? Object.values(companySocials).some((x) => !!safeStr(x))
    : false;

  if (!hasAnyShare && !hasCompanySocials) return null;

  return (
    <div className={props.className}>
      {showLabel && (
        <div className="mb-15">
          <strong>{label}</strong>
        </div>
      )}

      {/* Share buttons (content share) */}
      {hasAnyShare && (
        <div className="touch__social">
          {shareFlags.facebook && (
            <a
              href={links.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on Facebook"
              title="Facebook"
            >
              <IconFacebook />
            </a>
          )}

          {shareFlags.x && (
            <a href={links.x} target="_blank" rel="noreferrer" aria-label="Share on X" title="X">
              <IconTwitterX />
            </a>
          )}

          {shareFlags.linkedin && (
            <a
              href={links.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on LinkedIn"
              title="LinkedIn"
            >
              <IconLinkedIn />
            </a>
          )}

          {shareFlags.whatsapp && (
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on WhatsApp"
              title="WhatsApp"
            >
              <IconWhatsApp />
            </a>
          )}

          {shareFlags.email && (
            <a href={links.email} aria-label="Share via Email" title="Email">
              <IconMail />
            </a>
          )}

          {shareFlags.copy && (
            <a
              role="button"
              tabIndex={0}
              onClick={onCopy}
              onKeyDown={(e) => (e.key === 'Enter' ? onCopy() : null)}
              aria-label="Copy link"
              title={copied ? 'Copied' : 'Copy link'}
            >
              <IconCopy />
            </a>
          )}
        </div>
      )}

      {/* Company socials (profile links) */}
      {hasCompanySocials && (
        <div className="touch__social mt-20">
          {safeStr(companySocials.instagram) && (
            <a
              href={safeStr(companySocials.instagram)}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              title="Instagram"
            >
              <IconInstagram />
            </a>
          )}
          {safeStr(companySocials.facebook) && (
            <a
              href={safeStr(companySocials.facebook)}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              title="Facebook"
            >
              <IconFacebook />
            </a>
          )}
          {safeStr(companySocials.youtube) && (
            <a
              href={safeStr(companySocials.youtube)}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              title="YouTube"
            >
              <IconYoutube />
            </a>
          )}
          {safeStr(companySocials.linkedin) && (
            <a
              href={safeStr(companySocials.linkedin)}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <IconLinkedIn />
            </a>
          )}
          {safeStr(companySocials.x) && (
            <a
              href={safeStr(companySocials.x)}
              target="_blank"
              rel="noreferrer"
              aria-label="X"
              title="X"
            >
              <IconTwitterX />
            </a>
          )}
          {safeStr(companySocials.tiktok) && (
            <a
              href={safeStr(companySocials.tiktok)}
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              title="TikTok"
            >
              <IconTikTok />
            </a>
          )}
        </div>
      )}

      <style jsx>{`
        .touch__social {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .touch__social a {
          display: inline-flex;
        }

        .touch__social :global(svg) {
          width: 16px;
          height: 16px;
          display: block;
        }
      `}</style>
    </div>
  );
}
