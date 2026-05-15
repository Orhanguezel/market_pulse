"use client";

import type React from "react";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { useAdminT } from "@/app/(main)/admin/_components/common/useAdminT";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLazyValidateModuleManifestQuery } from "@/integrations/hooks";

export type ModuleValidatePanelProps = {
  module: string;
  disabled: boolean;
};

export const ModuleValidatePanel: React.FC<ModuleValidatePanelProps> = ({ module, disabled }) => {
  const t = useAdminT("admin.db.modules.validate");
  const [trigger, { data, isLoading, isFetching }] = useLazyValidateModuleManifestQuery();

  const busy = isLoading || isFetching;

  const handleRun = () => {
    if (!disabled) trigger({ module: [module], includeDbTables: true });
  };

  const res = data?.results?.[0];
  const ok = res?.ok;

  return (
    <Card className="bg-muted/30">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <div className="font-semibold text-sm">{t("title")}</div>
            <div className="text-muted-foreground text-xs">{t("description")}</div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRun}
            disabled={disabled || busy}
            className="h-8 shrink-0 text-xs"
          >
            {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            {busy ? t("checking") : t("checkButton")}
          </Button>
        </div>

        <div className="mt-2">
          {!data ? (
            <div className="text-muted-foreground text-xs italic">{t("noResult")}</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant={ok ? "outline" : "destructive"}
                  className={ok ? "h-6 border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400" : "h-6"}
                >
                  {ok ? (
                    <>
                      <CheckCircle2 className="mr-1 size-3" />
                      {t("statusOk")}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-1 size-3" />
                      {t("statusError")}
                    </>
                  )}
                </Badge>
                <span className="text-xs">
                  {t("module")} <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">{module}</code>
                </span>
              </div>

              {/* Missing tables */}
              {!!res?.tables?.missing?.length && (
                <div className="space-y-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-destructive">
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <AlertCircle className="size-3.5" />
                    {t("errors")}
                  </div>
                  <ul className="ml-5 list-disc space-y-1 text-[11px]">
                    {res.tables.missing.map((tbl: string) => (
                      <li key={tbl}>
                        <code className="font-mono">{tbl}</code>
                        {res.suggestions?.[tbl]?.length ? (
                          <span className="ml-2 text-muted-foreground">
                            (did you mean: {res.suggestions[tbl].join(", ")}?)
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Present tables */}
              {!!res?.tables?.present?.length && (
                <div className="space-y-2 rounded-md border border-green-500/20 bg-green-500/10 p-3 text-green-700 dark:text-green-400">
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <CheckCircle2 className="size-3.5" />
                    Mevcut tablolar ({res.tables.present.length})
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {res.tables.present.map((tbl: string) => (
                      <code key={tbl} className="rounded bg-green-500/10 px-1.5 py-0.5 font-mono text-[11px]">
                        {tbl}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 border-t pt-2 text-[11px] text-muted-foreground">
                <div>
                  {t("declaredTables")}{" "}
                  <strong className="text-foreground">{res?.tables?.expected?.length ?? 0}</strong>
                </div>
                <div>
                  Mevcut: <strong className="text-foreground">{res?.tables?.present?.length ?? 0}</strong>
                </div>
                <div>
                  Eksik: <strong className="text-foreground">{res?.tables?.missing?.length ?? 0}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
