// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/modules/module-tabs.tsx
// =============================================================
"use client";

import type React from "react";
import { useMemo, useState } from "react";

import { useAdminT } from "@/app/(main)/admin/_components/common/useAdminT";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ModuleExportPanel } from "./module-export-panel";
import { ModuleImportPanel } from "./module-import-panel";
import { ModuleValidatePanel } from "./module-validate-panel";
import { SiteSettingsUiPanel } from "./site-settings-ui-panel";

type TabKey = "export" | "import" | "validate" | "ui";

const MODULE_OPTIONS = [
  "site_settings",
  "users",
  "storage",
  "support",
  "menu_items",
  "notifications",
  "market_targets",
  "market_leads",
  "market_signals",
] as const;

export type ModuleTabsProps = {
  adminSkip: boolean;
};

export const ModuleTabs: React.FC<ModuleTabsProps> = ({ adminSkip }) => {
  const t = useAdminT("admin.db.modules");
  const [moduleKey, setModuleKey] = useState<string>("site_settings");
  const [tab, setTab] = useState<TabKey>("export");

  const showUiTab = moduleKey === "site_settings";

  const headerText = useMemo(() => {
    const mod = moduleKey.replace(/_/g, " ");
    return mod.charAt(0).toUpperCase() + mod.slice(1);
  }, [moduleKey]);

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-0 pt-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="font-semibold text-sm">{t("title")}</CardTitle>
          <CardDescription className="text-xs">{t("selected", { module: headerText })}</CardDescription>
        </div>

        <Select
          value={moduleKey}
          onValueChange={(v) => {
            setModuleKey(v);
            if (v !== "site_settings" && tab === "ui") {
              setTab("export");
            }
          }}
          disabled={adminSkip}
        >
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODULE_OPTIONS.map((k) => (
              <SelectItem key={k} value={k} className="text-xs">
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="px-0">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
          <TabsList className="mb-4 h-9">
            <TabsTrigger value="export" className="px-3 text-xs" disabled={adminSkip}>
              {t("tabs.export")}
            </TabsTrigger>
            <TabsTrigger value="import" className="px-3 text-xs" disabled={adminSkip}>
              {t("tabs.import")}
            </TabsTrigger>
            <TabsTrigger value="validate" className="px-3 text-xs" disabled={adminSkip}>
              {t("tabs.validate")}
            </TabsTrigger>
            {showUiTab && (
              <TabsTrigger value="ui" className="px-3 text-xs" disabled={adminSkip}>
                {t("tabs.ui")}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="export" className="mt-0">
            <ModuleExportPanel module={moduleKey} disabled={adminSkip} />
          </TabsContent>
          <TabsContent value="import" className="mt-0">
            <ModuleImportPanel module={moduleKey} disabled={adminSkip} />
          </TabsContent>
          <TabsContent value="validate" className="mt-0">
            <ModuleValidatePanel module={moduleKey} disabled={adminSkip} />
          </TabsContent>
          {showUiTab && (
            <TabsContent value="ui" className="mt-0">
              <SiteSettingsUiPanel disabled={adminSkip} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};
