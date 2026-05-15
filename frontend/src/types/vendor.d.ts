// src/types/vendor.d.ts
declare module "aos" {
  export interface AosOptions {
    offset?: number;
    delay?: number;
    duration?: number;
    easing?: string;
    once?: boolean;
    mirror?: boolean;
    anchorPlacement?:
      | "top-bottom"
      | "top-center"
      | "top-top"
      | "center-bottom"
      | "center-center"
      | "center-top"
      | "bottom-bottom"
      | "bottom-center"
      | "bottom-top";
    startEvent?: string;
    initClassName?: string;
    animatedClassName?: string;
    useClassNames?: boolean;
    disable?: boolean | "phone" | "tablet" | "mobile" | ((width: number) => boolean);
  }
  const AOS: {
    init(options?: AosOptions): void;
    refresh(): void;
    refreshHard(): void;
  };
  export default AOS;
}

declare module "nprogress";

declare module "*.css";
