declare module 'swiper' {
  import type { SwiperModule } from 'swiper/types';

  // Swiper v9 exports EffectFade at runtime, but its public TS "types" entry
  // doesn't re-export it under moduleResolution="bundler".
  export const EffectFade: SwiperModule;
}

