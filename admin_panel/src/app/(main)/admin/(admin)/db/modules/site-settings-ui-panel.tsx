"use client";

import type React from "react";
import { useMemo, useState } from "react";

import { Download, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/useAdminT";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useBootstrapSiteSettingsUiLocaleMutation, useExportSiteSettingsUiJsonQuery } from "@/integrations/hooks";

import { askConfirm } from "../shared/confirm";
import { buildDownloadName, triggerDownload } from "../shared/download";
import { errorText } from "../shared/errorText";

const LOCALES = ["tr", "en", "de"] as const;

export type SiteSettingsUiPanelProps = {
  disabled: boolean;
};

export const SiteSettingsUiPanel: React.FC<SiteSettingsUiPanelProps> = ({ disabled }) => {
  const t = useAdminT("admin.db.modules.ui");

  const [exportLocale, setExportLocale] = useState("tr");
  const [onlyUiKeys, setOnlyUiKeys] = useState(true);

  const prefixes = useMemo(() => (onlyUiKeys ? ["ui_"] : []), [onlyUiKeys]);

  const { data, isLoading, isFetching } = useExportSiteSettingsUiJsonQuery(
    { fromLocale: exportLocale, prefix: prefixes.length ? prefixes : undefined },
    { skip: disabled },
  );

  const [targetLocale, setTargetLocale] = useState("en");
  const [sourceLocale, setSourceLocale] = useState("tr");
  const [overwrite, setOverwrite] = useState(false);

  const [bootstrap, { isLoading: isBootstrapping }] = useBootstrapSiteSettingsUiLocaleMutation();

  const busy = disabled || isLoading || isFetching || isBootstrapping;

  const handleDownloadJson = () => {
    if (!data?.items) return toast.error(t("downloadError"));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    triggerDownload(blob, buildDownloadName("site_settings_ui", "json"));
    toast.success(t("downloadSuccess"));
  };

  const handleBootstrap = async () => {
    if (sourceLocale === targetLocale) {
      return toast.warning("Kaynak ve hedef locale aynı olamaz.");
    }
    if (!askConfirm(`${sourceLocale} → ${targetLocale} locale bootstrap uygulanacak. Devam?`)) return;

    try {
      const res = await bootstrap({
        sourceLocale,
        targetLocale,
        prefixes: onlyUiKeys ? ["ui_"] : undefined,
        overwrite,
      }).unwrap();

      if (!res?.ok) return toast.error(res?.error || t("bootstrapError"));
      toast.success(`${t("bootstrapSuccess")} (${res.insertedOrUpdated} kayıt)`);
    } catch (err: unknown) {
      toast.error(errorText(err, t("bootstrapErrorGeneric")));
    }
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="space-y-4 p-4">
        {/* Header + Download */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <div className="font-semibold text-sm">{t("title")}</div>
            <div className="text-muted-foreground text-xs">{t("description")}</div>
            {data && (
              <Badge variant="outline" className="mt-1 h-5 text-[10px]">
                {data.count} key ({data.fromLocale})
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select value={exportLocale} onValueChange={setExportLocale} disabled={busy}>
              <SelectTrigger className="h-8 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((l) => (
                  <SelectItem key={l} value={l} className="text-xs">
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadJson}
              disabled={busy || !data?.items}
              className="h-8 shrink-0 text-xs"
            >
              {isLoading || isFetching ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <Download className="mr-2 size-3.5" />
              )}
              {t("downloadButton")}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Bootstrap Section */}
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-xs">{t("sourceLocale")}</Label>
            <Select value={sourceLocale} onValueChange={setSourceLocale} disabled={busy}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((l) => (
                  <SelectItem key={l} value={l} className="text-xs">
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{t("targetLocale")}</Label>
            <Select value={targetLocale} onValueChange={setTargetLocale} disabled={busy}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((l) => (
                  <SelectItem key={l} value={l} className="text-xs">
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3 pb-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ui-overwrite"
                checked={overwrite}
                onCheckedChange={(checked) => setOverwrite(!!checked)}
                disabled={busy}
              />
              <Label htmlFor="ui-overwrite" className="cursor-pointer font-normal text-xs">
                {t("overwrite")}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ui-onlyUi"
                checked={onlyUiKeys}
                onCheckedChange={(checked) => setOnlyUiKeys(!!checked)}
                disabled={busy}
              />
              <Label htmlFor="ui-onlyUi" className="cursor-pointer font-normal text-xs">
                {t("onlyUiKeys")}
              </Label>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleBootstrap}
            disabled={busy}
            className="ml-auto h-8 w-full border-none bg-yellow-500 text-black text-xs hover:bg-yellow-600 sm:w-auto"
          >
            {isBootstrapping ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <Zap className="mr-2 size-3.5" />}
            {isBootstrapping ? t("applying") : t("bootstrapButton")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
