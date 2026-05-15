// =============================================================
// FILE: src/components/admin/db/shared/HelpBlock.tsx
// =============================================================
"use client";

import type React from "react";

export type HelpBlockProps = {
  headline?: string;
  children: React.ReactNode;
};

export const HelpBlock: React.FC<HelpBlockProps> = ({ headline, children }) => {
  return (
    <div>
      {headline ? <div className="fw-semibold small mb-1">{headline}</div> : null}
      <div className="small text-muted">{children}</div>
    </div>
  );
};
