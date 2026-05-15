// =============================================================
// FILE: src/components/admin/db/shared/errorText.ts
// =============================================================

export function errorText(input: any, fallback = "İşlem sırasında hata oluştu."): string {
  if (!input) return fallback;

  if (typeof input === "string") return input;

  if (typeof input === "number" || typeof input === "boolean") return String(input);

  // Error instance
  if (input instanceof Error) return input.message || fallback;

  // RTK / Fetch error patterns
  const msg = input?.data?.message ?? input?.data?.error ?? input?.message ?? input?.error ?? input?.statusText;

  if (typeof msg === "string" && msg.trim()) return msg;

  // object ise stringify
  try {
    return JSON.stringify(input);
  } catch {
    return fallback;
  }
}
