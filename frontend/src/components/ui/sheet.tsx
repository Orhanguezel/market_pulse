// src/components/ui/sheet.tsx

"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "./utils";

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(
  props: React.ComponentProps<typeof SheetPrimitive.Trigger>,
) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(
  props: React.ComponentProps<typeof SheetPrimitive.Close>,
) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal(
  props: React.ComponentProps<typeof SheetPrimitive.Portal>,
) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        // Bootstrap uyumlu basit overlay
        "position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50",
        className,
      )}
      {...props}
    />
  );
}

type SheetSide = "top" | "right" | "bottom" | "left";

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: SheetSide;
}) {
  const basePos =
    side === "right"
      ? "top-0 bottom-0 end-0 h-100 border-start"
      : side === "left"
      ? "top-0 bottom-0 start-0 h-100 border-end"
      : side === "top"
      ? "top-0 start-0 end-0 border-bottom"
      : "bottom-0 start-0 end-0 border-top";

  const baseSize =
    side === "top" || side === "bottom"
      ? "w-100"
      : "w-75 w-sm-50 w-md-25"; // yan panel için

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-bg-card position-fixed z-50 d-flex flex-column shadow-medium",
          basePos,
          baseSize,
          className,
        )}
        {...props}
      >
        {children}

        {/* Kapatma butonu */}
        <SheetPrimitive.Close
          className={cn(
            "btn btn-sm btn-outline-secondary position-absolute",
            "top-0 end-0 m-3 d-inline-flex align-items-center justify-content-center",
            "opacity-75",
          )}
        >
          <XIcon style={{ width: 16, height: 16 }} />
          <span className="visually-hidden">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("p-3 border-bottom", className)}
      {...props}
    />
  );
}

function SheetFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto p-3 border-top d-flex gap-2", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("h5 mb-0", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted small mt-1", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
