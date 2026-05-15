// src/components/ui/tabs.tsx

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "./utils";

function Tabs(
  props: React.ComponentProps<typeof TabsPrimitive.Root>,
) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      {...props}
    />
  );
}

function TabsList(
  { className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>,
) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Premium underline tabs — scroll yok, responsive flex-wrap
        "flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[var(--gm-border-soft)] text-[var(--gm-text-dim)]",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger(
  { className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>,
) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Sade underline trigger — aktif: bold text + alt çizgi (primary), hover: text rengi koyulaşır
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
        "border-b-2 border-transparent -mb-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gm-primary)]/30 focus-visible:rounded-md",
        "disabled:pointer-events-none disabled:opacity-50",
        "hover:text-[var(--gm-text)]",
        "data-[state=active]:text-[var(--gm-primary)] data-[state=active]:border-[var(--gm-primary)] data-[state=active]:font-semibold",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent(
  { className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>,
) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("mt-2", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
