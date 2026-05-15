// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/fullDb/full-db-header.tsx
// =============================================================
"use client";

import type React from "react";
import { useState } from "react";

import { Database, Download, FileJson, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/useAdminT";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  useCreateDbSnapshotMutation,
  useExportSqlMutation,
  // useExportJsonMutation, // TODO: Backend endpoint not implemented yet
} from "@/integrations/hooks";

import { buildDownloadName, triggerDownload } from "../shared/download";

export type FullDbHeaderProps = {
  onChanged?: () => void; // ✅ optional
};

export const FullDbHeader: React.FC<FullDbHeaderProps> = ({ onChanged }) => {
  const t = useAdminT("admin.db.fullDb");
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");

  const [createSnapshot, { isLoading: isCreating }] = useCreateDbSnapshotMutation();
  const [exportSql, { isLoading: isExportingSql }] = useExportSqlMutation();
  // const [exportJson, { isLoading: isExportingJson }] = useExportJsonMutation(); // TODO: Not implemented

  const busy = isCreating || isExportingSql; // || isExportingJson;

  const handleCreateSnapshot = async () => {
    try {
      const body: { label?: string; note?: string } = {};
      if (label.trim()) body.label = label.trim();
      if (note.trim()) body.note = note.trim();

      const snap = await createSnapshot(body).unwrap();
      toast.success(t("snapshotCreated", { label: snap.label || snap.filename || snap.id }));

      setLabel("");
      setNote("");

      // ✅ call only if provided
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t("snapshotError"));
    }
  };

  const handleExportSql = async () => {
    try {
      const blob = await exportSql().unwrap();
      triggerDownload(blob, buildDownloadName("db_backup", "sql"));
      toast.success(t("exportSuccess"));
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t("exportError"));
    }
  };

  const handleExportJson = async () => {
    // TODO: Backend JSON export endpoint not implemented yet
    toast.info(t("jsonNotImplemented"));
  };

  return (
    <Card className="border-none bg-muted/20 shadow-none">
      <CardContent className="p-4">
        <div className="flex flex-col justify-between gap-6 lg:flex-row">
          {/* Snapshot Creation Section */}
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="size-4 text-primary" />
                <h5 className="font-semibold text-sm">{t("title")}</h5>
              </div>
              <p className="text-muted-foreground text-xs">{t("description")}</p>
            </div>

            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-12">
              <div className="space-y-1.5 sm:col-span-5">
                <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">
                  {t("snapshotLabel")}
                </Label>
                <Input
                  type="text"
                  className="h-8 bg-background text-xs"
                  placeholder={t("snapshotPlaceholder")}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-5">
                <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">
                  {t("noteLabel")}
                </Label>
                <Input
                  type="text"
                  className="h-8 bg-background text-xs"
                  placeholder={t("notePlaceholder")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 w-full text-xs"
                  disabled={busy}
                  onClick={handleCreateSnapshot}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 size-3 animate-spin" />
                      {t("creating")}
                    </>
                  ) : (
                    t("createButton")
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="lg:hidden" />
          <div className="hidden w-px self-stretch bg-border/50 lg:block" />

          {/* Export Section */}
          <div className="space-y-4 lg:w-72">
            <div className="space-y-1">
              <h6 className="font-semibold text-xs">{t("downloadTitle")}</h6>
              <p className="text-[11px] text-muted-foreground">{t("downloadDesc")}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 min-w-[100px] flex-1 text-xs"
                disabled={busy}
                onClick={handleExportSql}
              >
                {isExportingSql ? (
                  <Loader2 className="mr-2 size-3 animate-spin" />
                ) : (
                  <Download className="mr-2 size-3" />
                )}
                {isExportingSql ? t("sqlPreparing") : t("sqlButton")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 min-w-[100px] flex-1 text-xs"
                disabled={busy}
                onClick={handleExportJson}
              >
                <FileJson className="mr-2 size-3" />
                {t("jsonButton")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
