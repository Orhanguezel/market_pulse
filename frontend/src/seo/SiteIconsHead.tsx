// =============================================================
// FILE: src/seo/SiteIconsHead.tsx
// – Site Icons Head (PURE)
// - NO hooks / NO data fetch (Layout fetches and passes URLs)
// =============================================================

'use client';

import React from 'react';

type Props = {
  faviconUrl: string;
  appleTouchUrl?: string;
  appIcon512Url?: string;
};

export const SiteIconsHead: React.FC<Props> = ({ faviconUrl, appleTouchUrl, appIcon512Url }) => {
  return (
    <>
      <link rel="icon" href={faviconUrl} />
      {appleTouchUrl ? <link rel="apple-touch-icon" sizes="180x180" href={appleTouchUrl} /> : null}
      {appIcon512Url ? (
        <link rel="icon" type="image/png" sizes="512x512" href={appIcon512Url} />
      ) : null}
    </>
  );
};

SiteIconsHead.displayName = 'SiteIconsHead';
