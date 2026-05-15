// src/integrations/core/token.ts
const TOKEN_KEY = "mh_access_token";

export const tokenStore = {
  get(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(TOKEN_KEY) || "";
  },
  set(token?: string | null) {
    if (typeof window === 'undefined') return;
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  },
};
