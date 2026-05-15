// =============================================================
// FILE: src/components/admin/db/shared/format.ts
// =============================================================
const safeText = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export function formatDate(value: string | null | undefined, locale = "tr-TR"): string {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return safeText(value) || "-";
    return d.toLocaleString(locale);
  } catch {
    return safeText(value) || "-";
  }
}

export function formatSize(bytes?: number | null): string {
  if (bytes == null || Number.isNaN(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export const noWrapEllipsis: React.CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
