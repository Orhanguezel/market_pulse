// src/modules/_shared/json.ts
import { z } from "zod";

const jsonLiteral = z.union([z.string(), z.number(), z.boolean(), z.null()]);

type JsonLiteral = z.infer<typeof jsonLiteral>;

export type JsonLike =
  | JsonLiteral
  | JsonLike[]
  | { [k: string]: JsonLike };

export const jsonLike: z.ZodType<JsonLike> = z.lazy(() =>
  z.union([jsonLiteral, z.array(jsonLike), z.record(jsonLike)]),
);

export const packJson = (v: unknown) => JSON.stringify(v);
export const unpackArray = (s?: string | null): string[] =>
  !s ? [] : (JSON.parse(s) as string[]);
export const parseJsonArrayString = (s?: string | null): string[] => {
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
  } catch {
    return [];
  }
};
export const extractHtmlFromJson = (s?: string | null): string => {
  if (!s) return "";
  try {
    const parsed: unknown = JSON.parse(s);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return "";
    const obj = parsed as Record<string, unknown>;
    return typeof obj.html === "string" ? obj.html : "";
  } catch { return ""; }
};
export const packContent = (htmlOrJson: string) => {
  try {
    const parsed: unknown = JSON.parse(htmlOrJson);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (typeof obj.html === "string") return JSON.stringify({ html: obj.html });
    }
  } catch {}
  return JSON.stringify({ html: htmlOrJson });
};
