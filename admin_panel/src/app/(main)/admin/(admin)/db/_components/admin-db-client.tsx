"use client";

import type React from "react";
import { Lightbulb, Database, Download, Upload, ShieldCheck, HelpCircle } from "lucide-react";

import { useAdminT } from "@/app/(main)/admin/_components/common/useAdminT";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import { FullDbHeader } from "../fullDb/full-db-header";
import { FullDbImportPanel } from "../fullDb/full-db-import-panel";
import { SnapshotsPanel } from "../fullDb/snapshots-panel";
import { ModuleTabs } from "../modules/module-tabs";
import { AdminDbAuthGate } from "./admin-db-auth-gate";

export const AdminDbClient: React.FC = () => {
  const t = useAdminT("admin.db");

  return (
    <AdminDbAuthGate>
      {({ adminSkip }) => (
        <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-gm-gold" />
                <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">Sistem & Veri</span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="font-serif text-4xl text-gm-text">{t("title")}</h1>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="size-8 rounded-full bg-gm-surface border border-gm-border-soft flex items-center justify-center text-gm-muted hover:text-gm-gold hover:border-gm-gold/50 transition-all shadow-lg">
                      <HelpCircle size={16} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-96 bg-gm-bg-deep border-gm-border-soft rounded-[24px] p-6 text-gm-text shadow-2xl backdrop-blur-md">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-gm-gold">
                        <Lightbulb size={20} />
                        <h4 className="font-serif text-lg">{t("help.dbAdmin")}</h4>
                      </div>
                      <Separator className="bg-gm-border-soft" />
                      <ul className="space-y-4 text-gm-muted text-sm font-serif italic">
                        <li>
                          <span className="text-gm-text not-italic font-bold tracking-widest uppercase text-[10px] block mb-1">Full DB</span>
                          {t("help.fullDbDesc")}
                        </li>
                        <li>
                          <span className="text-gm-text not-italic font-bold tracking-widest uppercase text-[10px] block mb-1">Snapshot</span>
                          {t("help.snapshotDesc")}
                        </li>
                        <li>
                          <span className="text-gm-text not-italic font-bold tracking-widest uppercase text-[10px] block mb-1">Module Export/Import</span>
                          {t("help.moduleDesc")}
                        </li>
                      </ul>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-gm-muted text-sm font-serif italic opacity-70">{t("description")}</p>
            </div>

            <div className="flex items-center gap-3 rounded-full bg-gm-surface/40 border border-gm-border-soft px-6 py-3 backdrop-blur-sm shadow-inner">
              <ShieldCheck className="size-4 text-gm-gold" />
              <span className="text-[10px] font-bold text-gm-text tracking-[0.2em] uppercase">Yetkili Erişim</span>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Full DB Operations */}
            <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
              <CardContent className="p-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-gm-gold/10 flex items-center justify-center text-gm-gold border border-gm-gold/20 shadow-inner">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-gm-text font-serif text-xl">Full DB Operations</h3>
                    <p className="text-[10px] font-bold text-gm-muted tracking-widest uppercase">Global Veri Yönetimi</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <FullDbHeader />
                  <Separator className="bg-gm-border-soft" />
                  <FullDbImportPanel />
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Snapshots */}
              <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
                <CardContent className="p-10 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-gm-primary/10 flex items-center justify-center text-gm-primary-light border border-gm-primary/20">
                      <Download size={20} />
                    </div>
                    <div>
                      <h3 className="text-gm-text font-serif text-lg">Snapshots</h3>
                      <p className="text-[10px] font-bold text-gm-muted tracking-widest uppercase">Yedekleme ve Geri Yükleme</p>
                    </div>
                  </div>
                  <SnapshotsPanel adminSkip={adminSkip} />
                </CardContent>
              </Card>

              {/* Module Operations */}
              <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
                <CardContent className="p-10 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-gm-primary/10 flex items-center justify-center text-gm-primary-light border border-gm-primary/20">
                      <Upload size={20} />
                    </div>
                    <div>
                      <h3 className="text-gm-text font-serif text-lg">Module Export / Import</h3>
                      <p className="text-[10px] font-bold text-gm-muted tracking-widest uppercase">Modüler Veri Transferi</p>
                    </div>
                  </div>
                  <ModuleTabs adminSkip={adminSkip} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AdminDbAuthGate>
  );
};
