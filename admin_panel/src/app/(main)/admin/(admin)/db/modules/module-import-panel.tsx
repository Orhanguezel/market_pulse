"use client";

import React, { type FormEvent, useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/useAdminT";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useImportModuleSqlMutation } from "@/integrations/hooks";

import { askConfirm } from "../shared/confirm";
import { errorText } from "../shared/errorText";

type TabKey = "text" | "file";

export type ModuleImportPanelProps = {
  module: string;
  disabled: boolean;
};

export const ModuleImportPanel: React.FC<ModuleImportPanelProps> = ({ module, disabled }) => {
  const t = useAdminT("admin.db.modules.import");
  const [tab, setTab] = useState<TabKey>("text");

  const [sqlText, setSqlText] = useState("");
  const [truncate, setTruncate] = useState(true);
  const [dryRun, setDryRun] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [importModule, { isLoading }] = useImportModuleSqlMutation();

  const busy = disabled || isLoading;

  const handleSubmitText = async (e: FormEvent) => {
    e.preventDefault();
    if (!sqlText.trim()) return toast.warning(t("text.label"));

    const msg = truncate
      ? `${module} modül tabloları TRUNCATE edilip SQL uygulanacak. Devam?`
      : `${module} modülüne SQL uygulanacak. Devam?`;
    if (!askConfirm(msg)) return;

    try {
      const res = await importModule({
        module,
        sql: sqlText,
        truncateBefore: truncate,
        dryRun,
      }).unwrap();

      if (res.dryRun) {
        toast.success("Dry run başarılı — değişiklikler geri alındı.");
      } else {
        toast.success(res.message || "Import başarılı.");
      }
      setSqlText("");
    } catch (err: unknown) {
      toast.error(errorText(err));
    }
  };

  const handleSubmitFile = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return toast.warning(t("file.label"));

    const msg = truncate
      ? `${module} modül tabloları TRUNCATE edilip dosya içeriği uygulanacak. Devam?`
      : `${module} modülüne dosya içeriği uygulanacak. Devam?`;
    if (!askConfirm(msg)) return;

    try {
      const text = await file.text();
      const res = await importModule({
        module,
        sql: text,
        truncateBefore: truncate,
        dryRun: false,
      }).unwrap();

      toast.success(res.message || "Import başarılı.");
      setFile(null);
      setFileInputKey((k) => k + 1);
    } catch (err: unknown) {
      toast.error(errorText(err));
    }
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <div className="font-semibold text-sm">{t("title")}</div>
            <div className="text-muted-foreground text-xs">{t("description", { module })}</div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="module-import-truncate"
              checked={truncate}
              onCheckedChange={(checked) => setTruncate(!!checked)}
              disabled={busy}
            />
            <Label htmlFor="module-import-truncate" className="cursor-pointer font-normal text-xs">
              {t("truncate")}
            </Label>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
          <TabsList className="mb-4 h-8">
            <TabsTrigger value="text" className="h-7 px-3 text-xs" disabled={busy}>
              {t("tabs.text")}
            </TabsTrigger>
            <TabsTrigger value="file" className="h-7 px-3 text-xs" disabled={busy}>
              {t("tabs.file")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-0 space-y-4">
            <form onSubmit={handleSubmitText} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">
                  {t("text.label")} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  className="min-h-[160px] font-mono text-xs"
                  value={sqlText}
                  onChange={(e) => setSqlText(e.target.value)}
                  placeholder={t("text.placeholder")}
                  disabled={busy}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="module-import-dryrun"
                    checked={dryRun}
                    onCheckedChange={(checked) => setDryRun(!!checked)}
                    disabled={busy}
                  />
                  <Label htmlFor="module-import-dryrun" className="cursor-pointer font-normal text-xs">
                    Dry run
                  </Label>
                </div>
                <Button type="submit" size="sm" variant="destructive" disabled={busy} className="h-8 text-xs">
                  {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  {isLoading ? t("importing") : t("applyButton")}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="file" className="mt-0 space-y-4">
            <form onSubmit={handleSubmitFile} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">
                  {t("file.label")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  key={fileInputKey}
                  type="file"
                  className="flex h-8 items-center text-xs"
                  accept=".sql,.gz,.sql.gz"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={busy}
                />
              </div>
              <Button type="submit" size="sm" variant="destructive" disabled={busy} className="h-8 text-xs">
                {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {isLoading ? t("importing") : t("importButton")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
