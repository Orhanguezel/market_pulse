import { ImageResponse } from 'next/og';

import { getPublicAppName } from '@/lib/site-config';

export const ogSize = {
  width: 1200,
  height: 630,
};

export type BrandOgImageParams = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  metric?: string;
  chips?: string[];
  symbols?: string[];
};

export function createBrandOgImage({
  title,
  subtitle,
  eyebrow = getPublicAppName(),
  metric,
  chips = [],
  symbols = ['☉', '☽', '✦'],
}: BrandOgImageParams) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(135deg, #120f26 0%, #24163a 46%, #4b2b59 100%)',
          color: '#fff8e6',
          fontFamily: 'Georgia, serif',
          padding: 64,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 16% 18%, rgba(240, 207, 107, 0.28), transparent 24%), radial-gradient(circle at 86% 72%, rgba(155, 126, 200, 0.30), transparent 30%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: -90,
            top: -80,
            width: 420,
            height: 420,
            borderRadius: 420,
            border: '2px solid rgba(240, 207, 107, 0.28)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 72,
            bottom: 52,
            display: 'flex',
            gap: 18,
            color: 'rgba(240, 207, 107, 0.48)',
            fontSize: 42,
          }}
        >
          {symbols.map((symbol) => (
            <span key={symbol}>{symbol}</span>
          ))}
        </div>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 42,
                background: '#d4af37',
                boxShadow: '0 0 36px rgba(212, 175, 55, 0.42)',
              }}
            />
            <div
              style={{
                fontSize: 26,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: '#f0cf6b',
              }}
            >
              {eyebrow}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {metric ? (
              <div
                style={{
                  display: 'flex',
                  alignSelf: 'flex-start',
                  border: '1px solid rgba(240, 207, 107, 0.45)',
                  borderRadius: 999,
                  padding: '12px 24px',
                  fontSize: 30,
                  color: '#f0cf6b',
                  background: 'rgba(13, 11, 30, 0.38)',
                }}
              >
                {metric}
              </div>
            ) : null}
            <div
              style={{
                maxWidth: 920,
                fontSize: 76,
                lineHeight: 0.98,
                fontWeight: 700,
                textWrap: 'balance',
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  maxWidth: 820,
                  fontSize: 31,
                  lineHeight: 1.25,
                  color: '#e7d7ff',
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {chips.map((chip) => (
              <div
                key={chip}
                style={{
                  border: '1px solid rgba(255, 248, 230, 0.18)',
                  borderRadius: 999,
                  padding: '10px 18px',
                  fontSize: 23,
                  color: '#fff8e6',
                  background: 'rgba(255, 255, 255, 0.07)',
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    ogSize,
  );
}

