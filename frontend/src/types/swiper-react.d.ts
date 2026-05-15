// src/types/swiper-react.d.ts
import type * as React from "react";

declare module "swiper/react" {
  export interface SwiperProps {
    children?: React.ReactNode;
    slidesPerView?: number | "auto";
    spaceBetween?: number;
    loop?: boolean;
    modules?: any[];
    navigation?: boolean | {
      nextEl?: string | HTMLElement;
      prevEl?: string | HTMLElement;
    };
    autoplay?: any;
    className?: string;
    onSlideChange?: (...args: any[]) => void;
    onSwiper?: (...args: any[]) => void;
    [key: string]: any;
  }

  export interface SwiperSlideProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }

  export const Swiper: React.FC<SwiperProps>;
  export const SwiperSlide: React.FC<SwiperSlideProps>;
}
