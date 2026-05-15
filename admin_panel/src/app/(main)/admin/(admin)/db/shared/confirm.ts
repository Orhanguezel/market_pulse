// =============================================================
// FILE: src/components/admin/db/shared/confirm.ts
// =============================================================
export const askConfirm = (message: string): boolean => {
  if (typeof window === "undefined") return false;
  return window.confirm(message);
};
