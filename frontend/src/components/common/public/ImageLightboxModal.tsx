// src/components/common/public/ImageLightboxModal.tsx

'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';

export type LightboxImage = {
  raw: string; // full image
  thumb?: string; // optional thumbnail
  alt?: string;
};

export type ImageLightboxModalProps = {
  open: boolean;
  images: LightboxImage[];
  index: number;

  title?: string;

  onClose: () => void;
  onIndexChange: (nextIndex: number) => void;

  showThumbs?: boolean;
};

function clampIndex(i: number, len: number) {
  if (len <= 0) return 0;
  return ((i % len) + len) % len;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  open,
  images,
  index,
  title,
  onClose,
  onIndexChange,
  showThumbs = true,
}) => {
  const len = images?.length ?? 0;
  const safeIndex = useMemo(() => clampIndex(index, len), [index, len]);

  const active = images?.[safeIndex];
  const activeSrc = String(active?.raw ?? '').trim();
  const activeAlt = String(active?.alt ?? title ?? 'image').trim() || 'image';

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const goPrev = useCallback(() => {
    if (len <= 1) return;
    onIndexChange(clampIndex(safeIndex - 1, len));
  }, [len, onIndexChange, safeIndex]);

  const goNext = useCallback(() => {
    if (len <= 1) return;
    onIndexChange(clampIndex(safeIndex + 1, len));
  }, [len, onIndexChange, safeIndex]);

  // Keyboard
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, goPrev, goNext]);

  // Scroll lock + focus
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;
  if (!len || !activeSrc) return null;

  return (
    <div
      className="ens-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={title ? `${title} – Görsel görüntüleyici` : 'Görsel görüntüleyici'}
      onMouseDown={(e) => {
        // backdrop click closes
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ens-lightbox__panel" role="document">
        {/* Header */}
        <div className="ens-lightbox__head">
          <div className="ens-lightbox__meta">
            <div className="ens-lightbox__title">{title || 'Görsel'}</div>
            <div className="ens-lightbox__counter">
              {safeIndex + 1} / {len}
            </div>
          </div>

          <div className="ens-lightbox__actions">
            <a
              className="ens-lightbox__iconBtn"
              href={activeSrc}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Görseli yeni sekmede aç"
              title="Yeni sekmede aç"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M14 3h7v7h-2V6.41l-9.29 9.3l-1.42-1.42l9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"
                />
              </svg>
            </a>

            <button
              ref={closeBtnRef}
              className="ens-lightbox__iconBtn"
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              title="Kapat (Esc)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M18.3 5.71L12 12l6.3 6.29l-1.41 1.42L10.59 13.4L4.29 19.71L2.88 18.29L9.17 12L2.88 5.71L4.29 4.29l6.3 6.31l6.29-6.31l1.42 1.42Z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="ens-lightbox__body">
          <button
            type="button"
            className="ens-lightbox__nav ens-lightbox__nav--left"
            onClick={goPrev}
            disabled={len <= 1}
            aria-label="Önceki (Sol ok)"
            title="Önceki"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M15.41 7.41L14 6l-6 6l6 6l1.41-1.41L10.83 12l4.58-4.59Z"
              />
            </svg>
          </button>

          <button
            type="button"
            className="ens-lightbox__nav ens-lightbox__nav--right"
            onClick={goNext}
            disabled={len <= 1}
            aria-label="Sonraki (Sağ ok)"
            title="Sonraki"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.41Z"
              />
            </svg>
          </button>

          <div className="ens-lightbox__stage">
            <div className="ens-lightbox__imgWrap">
              <Image
                src={activeSrc}
                alt={activeAlt}
                fill
                sizes="(max-width: 768px) 100vw, 960px"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </div>

          {showThumbs && len > 1 ? (
            <div className="ens-lightbox__thumbs" aria-label="Küçük önizlemeler">
              {images.map((it, i) => {
                const src = String(it.thumb || it.raw || '').trim();
                if (!src) return null;

                const isActive = i === safeIndex;
                return (
                  <button
                    key={`${it.raw}-${i}`}
                    type="button"
                    className={`ens-lightbox__thumb ${isActive ? 'is-active' : ''}`}
                    onClick={() => onIndexChange(i)}
                    aria-label={`Görsel ${i + 1}`}
                    title={`Görsel ${i + 1}`}
                  >
                    <span className="ens-lightbox__thumbImg">
                      <Image
                        src={src}
                        alt={String(it.alt || title || 'thumbnail')}
                        fill
                        sizes="84px"
                        style={{ objectFit: 'cover' }}
                        loading="lazy"
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        .ens-lightbox {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          padding: 16px;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(6px);
        }

        .ens-lightbox__panel {
          width: min(1100px, 100%);
          max-height: min(92vh, 920px);
          display: grid;
          grid-template-rows: auto 1fr;
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.35);
        }

        .ens-lightbox__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 12px 12px 16px;
          background: linear-gradient(to bottom, rgba(248, 250, 252, 1), rgba(255, 255, 255, 1));
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
        }

        .ens-lightbox__meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .ens-lightbox__title {
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 720px;
        }

        .ens-lightbox__counter {
          font-size: 12px;
          color: #64748b;
        }

        .ens-lightbox__actions {
          display: inline-flex;
          gap: 8px;
          align-items: center;
        }

        .ens-lightbox__iconBtn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: rgba(255, 255, 255, 0.9);
          color: #0f172a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
          text-decoration: none;
        }
        .ens-lightbox__iconBtn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(2, 6, 23, 0.12);
          background: #fff;
        }
        .ens-lightbox__iconBtn:active {
          transform: translateY(0);
          box-shadow: none;
        }

        .ens-lightbox__body {
          position: relative;
          display: grid;
          grid-template-rows: 1fr auto;
          min-height: 0;
          background: radial-gradient(circle at 30% 20%, rgba(2, 6, 23, 0.04), transparent 55%),
            radial-gradient(circle at 70% 30%, rgba(2, 6, 23, 0.03), transparent 50%);
        }

        .ens-lightbox__stage {
          position: relative;
          min-height: 0;
          padding: 12px 52px 10px;
          display: grid;
          place-items: center;
        }

        .ens-lightbox__imgWrap {
          position: relative;
          width: 100%;
          height: min(62vh, 620px);
          border-radius: 16px;
          background: #0b1220;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.12);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        .ens-lightbox__nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(2, 6, 23, 0.55);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 120ms ease, background 120ms ease, opacity 120ms ease;
          z-index: 2;
        }
        .ens-lightbox__nav:hover {
          background: rgba(2, 6, 23, 0.68);
          transform: translateY(-50%) scale(1.03);
        }
        .ens-lightbox__nav:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .ens-lightbox__nav--left {
          left: 14px;
        }
        .ens-lightbox__nav--right {
          right: 14px;
        }

        .ens-lightbox__thumbs {
          display: flex;
          gap: 10px;
          padding: 12px 14px 14px;
          overflow-x: auto;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.96);
        }

        .ens-lightbox__thumb {
          flex: 0 0 auto;
          width: 84px;
          height: 60px;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
        }
        .ens-lightbox__thumb:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(2, 6, 23, 0.12);
        }
        .ens-lightbox__thumb.is-active {
          border-color: rgba(37, 99, 235, 0.6);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
        }

        .ens-lightbox__thumbImg {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
        }

        @media (max-width: 640px) {
          .ens-lightbox__panel {
            border-radius: 16px;
          }
          .ens-lightbox__stage {
            padding: 12px 44px 10px;
          }
          .ens-lightbox__imgWrap {
            height: min(58vh, 540px);
          }
          .ens-lightbox__title {
            max-width: 220px;
          }
        }
      `}</style>
    </div>
  );
};

export default ImageLightboxModal;
