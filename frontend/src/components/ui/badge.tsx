// src/components/ui/badge.tsx

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/integrations/shared";

export const badgeVariants = cva(
  // Bootstrap base
  "badge rounded-pill fw-semibold small",
  {
    variants: {
      variant: {
        default: "text-bg-primary",
        secondary: "text-bg-secondary",
        destructive: "text-bg-danger",
        outline: "border border-secondary text-body bg-transparent",
        success: "text-bg-success",
        warning: "text-bg-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
