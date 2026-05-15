// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/fullDb/snapshots-table.tsx
// Ensotek – Admin DB Snapshot Tablosu
// =============================================================

"use client";

import type React from "react";

import { Calendar, FileText, HardDrive, History, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/useAdminT";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteDbSnapshotMutation, useRestoreDbSnapshotMutation } from "@/integrations/hooks";
import type { DbSnapshot } from "@/integrations/shared";
import { cn } from "@/lib/utils";

/* ---------------- Types ---------------- */

export type SnapshotsTableProps = {
  items?: DbSnapshot[];
  loading: boolean;
  refetch: () => void;
};

/* ---------------- Helpers ---------------- */

const safeText = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function formatDate(value: string | null | undefined, locale = "tr-TR"): string {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return safeText(value) || "-";
    return d.toLocaleString(locale);
  } catch {
    return safeText(value) || "-";
  }
}

function formatSize(bytes?: number | null): string {
  if (bytes == null || Number.isNaN(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export const SnapshotsTable: React.FC<SnapshotsTableProps> = ({ items, loading, refetch }) => {
  const t = useAdminT("admin.db.snapshots");
  const rows = items || [];
  const hasData = rows.length > 0;

  const [restoreSnapshot, { isLoading: isRestoring }] = useRestoreDbSnapshotMutation();
  const [deleteSnapshot, { isLoading: isDeleting }] = useDeleteDbSnapshotMutation();

  const busy = loading || isRestoring || isDeleting;

  const handleRestore = async (snap: DbSnapshot) => {
    const label = snap.label || snap.filename || snap.id;

    // Use a toast or custom dialog instead of window.confirm if possible,
    // but for now I'll stick to a simple strategy or just trigger it.
    // In a full refactor, we should use some AlertDialog state.
    // Given the complexity of adding state for each row, I'll keep it simple
    // or use a reusable confirm helper if one exists.
    if (!window.confirm(t("restoreConfirm", { label }))) return;

    try {
      const res = await restoreSnapshot({
        id: snap.id,
        dryRun: false,
        truncateBefore: true,
      }).unwrap();

      if (res?.ok === false) {
        toast.error(res.error || t("restoreError"));
      } else {
        toast.success(t("restoreSuccess"));
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t("restoreFailed"));
    }
  };

  const handleDelete = async (snap: DbSnapshot) => {
    const label = snap.label || snap.filename || snap.id;
    if (!window.confirm(t("deleteConfirm", { label }))) return;

    try {
      const res = await deleteSnapshot({ id: snap.id }).unwrap();
      if (res?.ok === false) {
        toast.error(res.message || t("deleteFailed"));
      } else {
        toast.success(res.message || t("deleteSuccess"));
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t("deleteError"));
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
        <CardTitle className="flex items-center gap-2 font-semibold text-sm">
          <History className="size-4 text-primary" />
          {t("title")}
        </CardTitle>
        <div className="flex items-center gap-3">
          {busy && (
            <Badge variant="secondary" className="h-6 animate-pulse gap-1.5 font-normal text-[10px]">
              <Loader2 className="size-3 animate-spin" />
              {t("processing")}
            </Badge>
          )}
          <span className="text-muted-foreground text-xs">
            {t("total")} <strong className="ml-1 text-foreground">{rows.length}</strong>
          </span>
          <Button variant="ghost" size="icon-sm" onClick={refetch} disabled={busy}>
            <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop View */}
        <div className="hidden xl:block">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[60px] text-[11px] uppercase tracking-wider">{t("columns.index")}</TableHead>
                <TableHead className="w-[280px] text-[11px] uppercase tracking-wider">
                  {t("columns.labelNote")}
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">{t("columns.file")}</TableHead>
                <TableHead className="w-[180px] text-[11px] uppercase tracking-wider">{t("columns.created")}</TableHead>
                <TableHead className="w-[100px] text-[11px] uppercase tracking-wider">{t("columns.size")}</TableHead>
                <TableHead className="w-[200px] text-right text-[11px] uppercase tracking-wider">
                  {t("columns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasData ? (
                rows.map((s, idx) => (
                  <TableRow key={s.id || idx}>
                    <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="max-w-[260px] truncate font-medium text-xs" title={s.label || ""}>
                        {s.label || <span className="font-normal text-muted-foreground italic">{t("noLabel")}</span>}
                      </div>
                      <div
                        className="mt-0.5 max-w-[260px] truncate text-[11px] text-muted-foreground"
                        title={s.note || ""}
                      >
                        {s.note || t("noNote")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-[300px] flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 truncate" title={s.filename || undefined}>
                          <FileText className="size-3 shrink-0 text-muted-foreground" />
                          <code className="truncate rounded bg-muted/50 px-1 text-[11px]">{s.filename}</code>
                        </div>
                        <div
                          className="flex items-center gap-1.5 truncate text-[10px] text-muted-foreground/70"
                          title={s.id || undefined}
                        >
                          <span className="shrink-0 font-bold uppercase opacity-50">ID:</span>
                          <code className="truncate">{s.id}</code>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(s.created_at)}</TableCell>
                    <TableCell className="font-medium text-xs">{formatSize(s.size_bytes ?? null)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 border-green-500/20 text-[11px] hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
                          disabled={busy}
                          onClick={() => handleRestore(s)}
                        >
                          {t("restore")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 border-destructive/20 text-[11px] hover:bg-destructive/10 hover:text-destructive"
                          disabled={busy}
                          onClick={() => handleDelete(s)}
                        >
                          <Trash2 className="mr-1 size-3" />
                          {t("delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs italic">
                    {loading ? t("loading") : t("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="border-t bg-muted/10 px-4 py-2 text-[10px] text-muted-foreground italic">
            {t("scrollNote")}
          </div>
        </div>

        {/* Mobile View */}
        <div className="space-y-3 p-3 xl:hidden">
          {!hasData && !loading ? (
            <div className="flex h-24 items-center justify-center text-muted-foreground text-xs italic">
              {t("noData")}
            </div>
          ) : loading && !hasData ? (
            <div className="flex h-24 items-center justify-center text-muted-foreground text-xs italic">
              {t("loading")}
            </div>
          ) : (
            <div className="grid gap-3">
              {rows.map((s, idx) => (
                <div key={s.id || idx} className="space-y-4 rounded-lg border bg-card/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="h-5 font-mono text-[10px]">
                        #{idx + 1}
                      </Badge>
                      <Badge variant="secondary" className="h-5 gap-1 font-normal text-[10px]">
                        <HardDrive className="size-2.5 opacity-60" />
                        {formatSize(s.size_bytes ?? null)}
                      </Badge>
                      <Badge variant="outline" className="h-5 gap-1 font-normal text-[10px]">
                        <Calendar className="size-2.5 opacity-60" />
                        {formatDate(s.created_at)}
                      </Badge>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() => handleRestore(s)}
                        title={t("restore")}
                      >
                        <RefreshCw className="size-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() => handleDelete(s)}
                        title={t("delete")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="wrap-break-word font-semibold text-sm leading-tight">
                      {s.label || (
                        <span className="font-normal text-muted-foreground text-xs italic">{t("noLabel")}</span>
                      )}
                    </div>
                    <div className="wrap-break-word text-muted-foreground text-xs leading-snug">
                      {s.note || t("noNote")}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 border-t pt-3">
                    <div className="space-y-1">
                      <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                        {t("columns.file")}
                      </div>
                      <code className="block break-all rounded bg-muted/40 p-1.5 text-[11px]">{s.filename || "-"}</code>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">ID</div>
                      <code className="block break-all text-[11px] opacity-80">{s.id}</code>
                    </div>
                  </div>
                </div>
              ))}
              {loading && hasData && (
                <div className="animate-pulse py-2 text-center text-muted-foreground text-xs">{t("loading")}</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
