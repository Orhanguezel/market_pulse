'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useLocaleShort } from '@/i18n';
import { useListPopupsPublicQuery } from '@/integrations/rtk/hooks';
import type { PopupPublicDto } from '@/integrations/shared';
import { cn, normPath, stripLocalePrefix } from '@/integrations/shared';

type VisibilityMap = Record<string, boolean>;

const KEY_ONCE = 'km.popup.once';
const KEY_DAILY = 'km.popup.daily';
const KEY_ALWAYS_SESSION = 'km.popup.always.session';

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function readJsonMap(key: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function writeJsonMap(key: string, value: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function isDismissedAlways(id: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(`${KEY_ALWAYS_SESSION}.${id}`) === '1';
  } catch {
    return false;
  }
}

function setDismissedAlways(id: string) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(`${KEY_ALWAYS_SESSION}.${id}`, '1');
  } catch {
    // ignore
  }
}

function shouldDisplayByFrequency(p: PopupPublicDto): boolean {
  if (typeof window === 'undefined') return false;

  if (p.display_frequency === 'once') {
    const once = readJsonMap(KEY_ONCE);
    return !once[p.id];
  }

  if (p.display_frequency === 'daily') {
    const daily = readJsonMap(KEY_DAILY);
    return daily[p.id] !== todayKey();
  }

  return !isDismissedAlways(p.id);
}

function markSeen(p: PopupPublicDto) {
  if (typeof window === 'undefined') return;

  if (p.display_frequency === 'once') {
    const once = readJsonMap(KEY_ONCE);
    once[p.id] = new Date().toISOString();
    writeJsonMap(KEY_ONCE, once);
    return;
  }

  if (p.display_frequency === 'daily') {
    const daily = readJsonMap(KEY_DAILY);
    daily[p.id] = todayKey();
    writeJsonMap(KEY_DAILY, daily);
    return;
  }

  setDismissedAlways(p.id);
}

function popupLinkStyle(p: PopupPublicDto): React.CSSProperties {
  return {
    backgroundColor: p.button_color ?? '#111827',
    color: p.button_text_color ?? '#ffffff',
  };
}

function cardStyle(p: PopupPublicDto): React.CSSProperties {
  return {
    backgroundColor: p.background_color ?? '#0f172a',
    color: p.text_color ?? '#f8fafc',
  };
}

function SidebarPopupCard({
  popup,
  onClose,
}: {
  popup: PopupPublicDto;
  onClose: (id: string) => void;
}) {
  const positionClass =
    popup.type === 'sidebar_top'
      ? 'top-24'
      : popup.type === 'sidebar_center'
      ? 'top-1/2 -translate-y-1/2'
      : 'bottom-20';

  return (
    <aside
      className={cn(
        'fixed right-4 z-[70] w-[min(92vw,360px)] shadow-medium ring-1 ring-black/10 overflow-hidden',
        positionClass,
      )}
      style={cardStyle(popup)}
      role="dialog"
      aria-label={popup.title || 'popup'}
    >
      {popup.image ? (
        <img
          src={popup.image}
          alt={popup.alt || popup.title || 'popup'}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      ) : null}

      <div className="p-4 space-y-3">
        {popup.title ? <h3 className="text-base font-semibold leading-tight" style={{ color: 'inherit' }}>{popup.title}</h3> : null}
        {popup.content ? <p className="text-sm whitespace-pre-wrap opacity-95">{popup.content}</p> : null}

        <div className="flex items-center gap-2">
          {popup.link_url && popup.button_text ? (
            <a
              href={popup.link_url}
              target={popup.link_target}
              rel={popup.link_target === '_blank' ? 'noreferrer noopener' : undefined}
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={popupLinkStyle(popup)}
            >
              {popup.button_text}
            </a>
          ) : null}

          {popup.closeable ? (
            <button
              type="button"
              className="ml-auto inline-flex h-8 w-8 items-center justify-center bg-bg-card/20 hover:bg-bg-card/30"
              onClick={() => onClose(popup.id)}
              aria-label="close popup"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function TopbarPopup({
  popup,
  onClose,
}: {
  popup: PopupPublicDto;
  onClose: (id: string) => void;
}) {
  return (
    <div style={cardStyle(popup)} className="relative border-b border-white/10">
      <div className="mx-auto flex min-h-11 max-w-screen-2xl items-center gap-3 px-4 py-2">
        <div className="min-w-0 flex-1">
          {popup.text_behavior === 'marquee' ? (
            <div className="overflow-hidden whitespace-nowrap">
              <div
                className="inline-block km-popup-marquee"
                style={{ animationDuration: `${Math.max(10, popup.scroll_speed)}s` }}
              >
                <span className="mr-10 text-sm font-medium">{popup.title}</span>
                {popup.content ? <span className="opacity-90 text-sm">{popup.content}</span> : null}
              </div>
            </div>
          ) : (
            <div className="truncate text-sm">
              <span className="font-semibold">{popup.title}</span>
              {popup.content ? <span className="ml-2 opacity-90">{popup.content}</span> : null}
            </div>
          )}
        </div>

        {popup.link_url && popup.button_text ? (
          <a
            href={popup.link_url}
            target={popup.link_target}
            rel={popup.link_target === '_blank' ? 'noreferrer noopener' : undefined}
            className="shrink-0 rounded px-2.5 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
            style={popupLinkStyle(popup)}
          >
            {popup.button_text}
          </a>
        ) : null}

        {popup.closeable ? (
          <button
            type="button"
            className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded bg-bg-card/20 hover:bg-bg-card/30"
            onClick={() => onClose(popup.id)}
            aria-label="close popup"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function BottombarPopup({
  popup,
  onClose,
}: {
  popup: PopupPublicDto;
  onClose: (id: string) => void;
}) {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50"
      style={cardStyle(popup)}
      role="banner"
    >
      <div className="mx-auto flex min-h-10 max-w-screen-2xl items-center gap-3 px-4 py-2">
        <div className="min-w-0 flex-1">
          {popup.text_behavior === 'marquee' ? (
            <div className="overflow-hidden whitespace-nowrap">
              <div
                className="inline-block km-popup-marquee"
                style={{ animationDuration: `${Math.max(10, popup.scroll_speed)}s` }}
              >
                <span className="mr-10 text-sm font-medium">{popup.title}</span>
                {popup.content ? <span className="opacity-90 text-sm">{popup.content}</span> : null}
              </div>
            </div>
          ) : (
            <div className="truncate text-sm text-center">
              <span className="font-semibold">{popup.title}</span>
              {popup.content ? <span className="ml-2 opacity-90">{popup.content}</span> : null}
            </div>
          )}
        </div>

        {popup.link_url && popup.button_text ? (
          <a
            href={popup.link_url}
            target={popup.link_target}
            rel={popup.link_target === '_blank' ? 'noreferrer noopener' : undefined}
            className="shrink-0 rounded px-2.5 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
            style={popupLinkStyle(popup)}
          >
            {popup.button_text}
          </a>
        ) : null}

        {popup.closeable ? (
          <button
            type="button"
            className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded bg-bg-card/20 hover:bg-bg-card/30"
            onClick={() => onClose(popup.id)}
            aria-label="close popup"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function SitePopups() {
  const locale = useLocaleShort();
  const pathname = usePathname();
  const cleanPath = React.useMemo(() => normPath(stripLocalePrefix(pathname || '/')), [pathname]);

  const canRenderOnPage = React.useMemo(() => {
    return (
      cleanPath === '/' ||
      cleanPath === '/register' ||
      cleanPath === '/pricing'
    );
  }, [cleanPath]);

  const { data } = useListPopupsPublicQuery({
    locale,
    default_locale: locale,
    current_path: cleanPath,
    sort: 'display_order',
    order: 'asc',
    limit: 50,
    offset: 0,
  }, {
    skip: !canRenderOnPage,
  });

  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState<VisibilityMap>({});

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    if (!data || !data.length) {
      setVisible({});
      return;
    }

    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const next: VisibilityMap = {};

    data.forEach((popup) => {
      if (!shouldDisplayByFrequency(popup)) return;

      const delayMs = Math.max(0, popup.delay_seconds) * 1000;
      const timer = setTimeout(() => {
        setVisible((prev) => ({ ...prev, [popup.id]: true }));
      }, delayMs);
      timers.push(timer);

      // once/daily popuplar tekrar schedule edilmesin diye gösterim anında işaretle
      if (popup.display_frequency !== 'always') {
        next[popup.id] = true;
      }
    });

    if (Object.keys(next).length) {
      const source = data.filter((p) => next[p.id]);
      source.forEach(markSeen);
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [mounted, data]);

  const visiblePopups = React.useMemo(() => {
    if (!data?.length) return [];
    return data.filter((p) => visible[p.id]);
  }, [data, visible]);

  const topbars = visiblePopups.filter((p) => p.type === 'topbar');
  const bottombars = visiblePopups.filter((p) => p.type === 'bottombar');
  const sidebars = visiblePopups.filter((p) => p.type !== 'topbar' && p.type !== 'bottombar');

  const closePopup = (id: string) => {
    const popup = visiblePopups.find((p) => p.id === id);
    if (popup) markSeen(popup);
    setVisible((prev) => ({ ...prev, [id]: false }));
  };

  if (!mounted) return null;
  if (!canRenderOnPage) return null;
  if (!visiblePopups.length) return null;

  return (
    <>
      {topbars.length ? (
        <div className="relative z-40">
          {topbars.map((popup) => (
            <TopbarPopup key={popup.id} popup={popup} onClose={closePopup} />
          ))}
        </div>
      ) : null}

      {bottombars.map((popup) => (
        <BottombarPopup key={popup.id} popup={popup} onClose={closePopup} />
      ))}

      {sidebars.map((popup) => (
        <SidebarPopupCard key={popup.id} popup={popup} onClose={closePopup} />
      ))}

      <style jsx>{`
        .km-popup-marquee {
          animation-name: kmPopupMarquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          padding-left: 100%;
        }

        @keyframes kmPopupMarquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </>
  );
}
