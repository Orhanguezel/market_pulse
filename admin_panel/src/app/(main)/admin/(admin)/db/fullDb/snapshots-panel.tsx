// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/fullDb/snapshots-panel.tsx
// =============================================================
"use client";

import type React from "react";

import { useListDbSnapshotsQuery } from "@/integrations/hooks";

import { SnapshotsTable } from "./snapshots-table";

export type SnapshotsPanelProps = {
  adminSkip: boolean;
};

export const SnapshotsPanel: React.FC<SnapshotsPanelProps> = ({ adminSkip }) => {
  const { data, isLoading, isFetching, refetch } = useListDbSnapshotsQuery(undefined, {
    skip: adminSkip,
  });

  const loading = isLoading || isFetching;

  const handleRefetch = () => {
    if (!adminSkip) refetch();
  };

  return <SnapshotsTable items={data ?? []} loading={loading} refetch={handleRefetch} />;
};
