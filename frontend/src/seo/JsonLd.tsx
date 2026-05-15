// src/seo/JsonLd.tsx
import React from 'react';

type Props = {
  data: unknown; // Thing | Thing[] | graph object; intentionally flexible
  id?: string;
};

/**
 * Safe JSON stringify for embedding in <script type="application/ld+json">
 * Prevents breaking out of script tag and avoids HTML parsing issues.
 */
function safeJsonLdStringify(value: unknown): string {
  // Replace "<" to avoid "</script>" injection issues and HTML parsing edge-cases.
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export default function JsonLd({ data, id }: Props) {
  const scriptId = id ? `jsonld:${id}` : undefined;

  return (
    <script
      type="application/ld+json"
      {...(scriptId ? { id: scriptId } : {})}
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(data) }}
    />
  );
}
