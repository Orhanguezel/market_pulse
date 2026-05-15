// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/fullDb/full-db-import-panel.tsx
// =============================================================
"use client";

import React, { type FormEvent, useState } from "react";

import { AlertCircle, FileText, Link2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/useAdminT";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useImportSqlFileMutation, useImportSqlTextMutation, useImportSqlUrlMutation } from "@/integrations/hooks";

import { askConfirm } from "../shared/confirm";
import { errorText } from "../shared/errorText";
import { HelpBlock } from "../shared/help-block";
import { HelpHint } from "../shared/help-hint";

type TabKey = "text" | "url" | "file";

export const FullDbImportPanel: React.FC = () => {
  const t = useAdminT("admin.db.import");
  const [activeTab, setActiveTab] = useState<TabKey>("text");

  const [sqlText, setSqlText] = useState("");
  const [truncateText, setTruncateText] = useState(true);
  const [dryRunText, setDryRunText] = useState(false);

  const [url, setUrl] = useState("");
  const [truncateUrl, setTruncateUrl] = useState(true);
  const [dryRunUrl, setDryRunUrl] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [truncateFile, setTruncateFile] = useState(true);

  const [fileInputKey, setFileInputKey] = useState(0);

  const [importText, { isLoading: isImportingText }] = useImportSqlTextMutation();
  const [importUrl, { isLoading: isImportingUrl }] = useImportSqlUrlMutation();
  const [importFile, { isLoading: isImportingFile }] = useImportSqlFileMutation();

  const busy = isImportingText || isImportingUrl || isImportingFile;

  const handleSubmitText = async (e: FormEvent) => {
    e.preventDefault();
    if (!sqlText.trim()) return toast.error(t("text.required"));

    if (!dryRunText) {
      const truncateLabel = truncateText ? t("confirm.truncateYes") : t("confirm.truncateNo");
      const ok = askConfirm(t("confirm.text", { truncate: truncateLabel }));
      if (!ok) return;
    }

    try {
      const res = await importText({
        sql: sqlText,
        truncateBefore: truncateText,
        dryRun: dryRunText,
      }).unwrap();

      if (!res?.ok) {
        return toast.error(errorText(res?.error || res?.message || res, t("error.text")));
      }

      if (res.dryRun) toast.success(t("success.dryRun"));
      else {
        toast.success(t("success.text"));
        setSqlText("");
      }
    } catch (err: any) {
      toast.error(errorText(err, t("error.textGeneric")));
    }
  };

  const handleSubmitUrl = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return toast.error(t("url.required"));

    if (!dryRunUrl) {
      const truncateLabel = truncateUrl ? t("confirm.truncateYes") : t("confirm.truncateNo");
      const ok = askConfirm(t("confirm.url", { url, truncate: truncateLabel }));
      if (!ok) return;
    }

    try {
      const res = await importUrl({
        url: url.trim(),
        truncateBefore: truncateUrl,
        dryRun: dryRunUrl,
      }).unwrap();

      if (!res?.ok) {
        return toast.error(errorText(res?.error || res?.message || res, t("error.url")));
      }

      if (res.dryRun) toast.success(t("success.dryRun"));
      else {
        toast.success(t("success.url"));
        setUrl("");
      }
    } catch (err: any) {
      toast.error(errorText(err, t("error.urlGeneric")));
    }
  };

  const handleSubmitFile = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error(t("file.required"));

    const truncateLabel = truncateFile ? t("confirm.truncateYes") : t("confirm.truncateNo");
    const ok = askConfirm(t("confirm.file", { file: file.name, truncate: truncateLabel }));
    if (!ok) return;

    try {
      const res = await importFile({ file, truncateBefore: truncateFile }).unwrap();

      if (!res?.ok) {
        return toast.error(errorText(res?.error || res?.message || res, t("error.file")));
      }

      toast.success(t("success.file"));
      setFile(null);
      setFileInputKey((k) => k + 1);
    } catch (err: any) {
      toast.error(errorText(err, t("error.fileGeneric")));
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/20 py-4">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-primary" />
          <CardTitle className="flex items-center gap-2 font-semibold text-sm">
            {t("title")}
            <HelpHint icon="question" title={t("helpTitle")} align="start">
              <HelpBlock headline={t("helpHeadline")}>
                <ul className="ml-4 list-disc space-y-1 text-xs">
                  <li>{t("helpDesc1")}</li>
                  <li>
                    <strong>Truncate</strong>: {t("helpDesc2")}
                  </li>
                  <li>
                    <strong>Dry run</strong>: {t("helpDesc3")}
                  </li>
                </ul>
              </HelpBlock>
            </HelpHint>
          </CardTitle>
        </div>

        {busy && (
          <Badge variant="secondary" className="h-6 animate-pulse gap-1.5 font-normal text-[10px]">
            <Loader2 className="size-3 animate-spin" />
            {t("processing")}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3 rounded-lg border border-destructive/10 bg-destructive/5 p-3 text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="text-xs leading-relaxed">
            <strong className="font-bold">{t("dangerLabel")}</strong> {t("warning")}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
          <TabsList className="mb-4 h-9">
            <TabsTrigger value="text" className="px-4 text-xs" disabled={busy}>
              <FileText className="mr-2 size-3.5" />
              {t("tabs.text")}
            </TabsTrigger>
            <TabsTrigger value="url" className="px-4 text-xs" disabled={busy}>
              <Link2 className="mr-2 size-3.5" />
              {t("tabs.url")}
            </TabsTrigger>
            <TabsTrigger value="file" className="px-4 text-xs" disabled={busy}>
              <Upload className="mr-2 size-3.5" />
              {t("tabs.file")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-0">
            <form onSubmit={handleSubmitText} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs">
                  {t("text.label")} <span className="text-destructive">*</span>
                  <HelpHint icon="question" title={t("text.helpTitle")}>
                    <HelpBlock headline={t("text.helpHeadline")}>
                      <ul className="ml-4 list-disc space-y-1 text-xs">
                        <li>{t("text.helpDesc1")}</li>
                        <li>{t("text.helpDesc2")}</li>
                        <li>{t("text.helpDesc3")}</li>
                      </ul>
                    </HelpBlock>
                  </HelpHint>
                </Label>
                <Textarea
                  className="min-h-[200px] bg-muted/10 font-mono text-xs"
                  value={sqlText}
                  onChange={(e) => setSqlText(e.target.value)}
                  placeholder={t("text.placeholder")}
                  disabled={busy}
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-text-truncate"
                    checked={truncateText}
                    onCheckedChange={(v) => setTruncateText(!!v)}
                    disabled={busy}
                  />
                  <Label
                    htmlFor="import-text-truncate"
                    className="flex cursor-pointer items-center gap-1.5 font-normal text-xs"
                  >
                    {t("truncate.label")}
                    <HelpHint icon="bulb" title={t("truncate.helpTitle")}>
                      <HelpBlock headline={t("truncate.helpHeadline")}>
                        <p className="text-xs leading-relaxed">{t("truncate.helpDesc")}</p>
                      </HelpBlock>
                    </HelpHint>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-text-dryrun"
                    checked={dryRunText}
                    onCheckedChange={(v) => setDryRunText(!!v)}
                    disabled={busy}
                  />
                  <Label
                    htmlFor="import-text-dryrun"
                    className="flex cursor-pointer items-center gap-1.5 font-normal text-xs"
                  >
                    {t("dryRun.label")}
                    <HelpHint icon="question" title={t("dryRun.helpTitle")}>
                      <HelpBlock headline={t("dryRun.helpHeadline")}>
                        <p className="text-xs leading-relaxed">{t("dryRun.helpDesc")}</p>
                      </HelpBlock>
                    </HelpHint>
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                size="sm"
                variant="destructive"
                disabled={busy}
                className="h-8 min-w-[120px] text-xs"
              >
                {isImportingText ? t("buttons.importing") : t("buttons.apply")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="url" className="mt-0">
            <form onSubmit={handleSubmitUrl} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs">
                  {t("url.label")} <span className="text-destructive">*</span>
                  <HelpHint icon="question" title={t("url.helpTitle")}>
                    <HelpBlock headline={t("url.helpHeadline")}>
                      <ul className="ml-4 list-disc space-y-1 text-xs">
                        <li>{t("url.helpDesc1")}</li>
                        <li>{t("url.helpDesc2")}</li>
                        <li>{t("url.helpDesc3")}</li>
                      </ul>
                    </HelpBlock>
                  </HelpHint>
                </Label>
                <Input
                  type="url"
                  className="h-8 bg-muted/10 text-xs"
                  placeholder={t("url.placeholder")}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={busy}
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-url-truncate"
                    checked={truncateUrl}
                    onCheckedChange={(v) => setTruncateUrl(!!v)}
                    disabled={busy}
                  />
                  <Label
                    htmlFor="import-url-truncate"
                    className="flex cursor-pointer items-center gap-1.5 font-normal text-xs"
                  >
                    {t("truncate.label")}
                    <HelpHint icon="bulb" title={t("truncate.helpTitle")}>
                      <HelpBlock headline={t("truncate.helpHeadline")}>
                        <p className="text-xs leading-relaxed">{t("truncate.helpDesc")}</p>
                      </HelpBlock>
                    </HelpHint>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-url-dryrun"
                    checked={dryRunUrl}
                    onCheckedChange={(v) => setDryRunUrl(!!v)}
                    disabled={busy}
                  />
                  <Label
                    htmlFor="import-url-dryrun"
                    className="flex cursor-pointer items-center gap-1.5 font-normal text-xs"
                  >
                    {t("dryRun.label")}
                    <HelpHint icon="question" title={t("dryRun.helpTitle")}>
                      <HelpBlock headline={t("dryRun.helpHeadline")}>
                        <p className="text-xs leading-relaxed">{t("dryRun.helpDescUrl")}</p>
                      </HelpBlock>
                    </HelpHint>
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                size="sm"
                variant="destructive"
                disabled={busy}
                className="h-8 min-w-[120px] text-xs"
              >
                {isImportingUrl ? t("buttons.importing") : t("buttons.importFromUrl")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="file" className="mt-0">
            <form onSubmit={handleSubmitFile} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs">
                  {t("file.label")} <span className="text-destructive">*</span>
                  <HelpHint icon="question" title={t("file.helpTitle")}>
                    <HelpBlock headline={t("file.helpHeadline")}>
                      <ul className="ml-4 list-disc space-y-1 text-xs">
                        <li>{t("file.helpDesc1")}</li>
                        <li>{t("file.helpDesc2")}</li>
                        <li>{t("file.helpDesc3")}</li>
                      </ul>
                    </HelpBlock>
                  </HelpHint>
                </Label>
                <div className="space-y-3">
                  <Input
                    key={fileInputKey}
                    type="file"
                    className="flex h-9 cursor-pointer items-center bg-muted/10 text-xs"
                    accept=".sql,.gz,.sql.gz"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={busy}
                  />
                  {file && (
                    <div className="fade-in slide-in-from-top-1 flex animate-in items-center gap-2 text-[10px] text-muted-foreground">
                      <FileText className="size-3" />
                      {t("file.selected")} <code className="font-bold text-primary">{file.name}</code>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 italic">
                    <strong className="mr-1 font-bold opacity-100">{t("admin.common.note")}:</strong>
                    {t("file.note")}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="import-file-truncate"
                  checked={truncateFile}
                  onCheckedChange={(v) => setTruncateFile(!!v)}
                  disabled={busy}
                />
                <Label
                  htmlFor="import-file-truncate"
                  className="flex cursor-pointer items-center gap-1.5 font-normal text-xs"
                >
                  {t("truncate.label")}
                  <HelpHint icon="bulb" title={t("truncate.helpTitle")}>
                    <HelpBlock headline={t("truncate.helpHeadline")}>
                      <p className="text-xs leading-relaxed">{t("truncate.helpDescFile")}</p>
                    </HelpBlock>
                  </HelpHint>
                </Label>
              </div>

              <Button
                type="submit"
                size="sm"
                variant="destructive"
                disabled={busy}
                className="h-8 min-w-[120px] text-xs"
              >
                {isImportingFile ? t("buttons.importing") : t("buttons.importFromFile")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
