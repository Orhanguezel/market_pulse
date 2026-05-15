// src/types/axios.d.ts
import "axios";

declare module "axios" {
  // İstek konfigine custom alanlar ekliyoruz
  interface AxiosRequestConfig {
    csrfDisabled?: boolean;
    __retriedOnce?: boolean;
  }
  // Interceptor içindeki tip için de aynı alanlar
  interface InternalAxiosRequestConfig {
    csrfDisabled?: boolean;
    __retriedOnce?: boolean;
  }
}
