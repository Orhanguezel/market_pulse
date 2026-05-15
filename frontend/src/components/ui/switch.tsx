// src/components/ui/switch.tsx

"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/integrations/shared";

type RootProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>;

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  RootProps
>(function Switch({ className, onCheckedChange, defaultChecked, ...props }, ref) {
  const [isChecked, setIsChecked] = React.useState(
    typeof defaultChecked === "boolean" ? defaultChecked : false,
  );

  return (
    <SwitchPrimitives.Root
      ref={ref}
      {...props}
      defaultChecked={defaultChecked}
      onCheckedChange={(value) => {
        const v = Boolean(value);
        setIsChecked(v);
        onCheckedChange?.(v as any);
      }}
      className={cn(
        "app-ui-switch d-inline-flex align-items-center position-relative rounded-pill",
        "border border-secondary bg-light",
        className,
      )}
      style={{
        width: 44,
        height: 24,
        padding: 2,
        cursor: props.disabled ? "not-allowed" : "pointer",
        backgroundColor: isChecked ? "#0d6efd" : "#e9ecef",
        transition: "background-color 0.2s ease",
      }}
    >
      <SwitchPrimitives.Thumb
        className="app-ui-switch-thumb bg-bg-card rounded-circle shadow-sm"
        style={{
          width: 18,
          height: 18,
          transform: isChecked ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.2s ease",
        }}
      />
    </SwitchPrimitives.Root>
  );
});

Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
