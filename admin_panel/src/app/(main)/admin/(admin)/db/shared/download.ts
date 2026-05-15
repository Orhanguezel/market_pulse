// =============================================================
// FILE: src/components/admin/db/shared/download.ts
// =============================================================
const pad = (n: number) => String(n).padStart(2, "0");

export function buildDownloadName(prefix: string, ext: string): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(
    d.getHours(),
  )}${pad(d.getMinutes())}`;
  return `${prefix}_${stamp}.${ext}`;
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
