// =============================================================
// FILE: src/i18n/HtmlLangSync.tsx
// =============================================================
"use client";
import { useEffect } from "react";

export default function HtmlLangSync({ lang, dir }: { lang: string; dir: "ltr" | "rtl" }) {
  useEffect(() => {
    const el = document.documentElement;
    if (el.lang !== lang) el.lang = lang;
    if (el.dir !== dir) el.dir = dir;
  }, [lang, dir]);

  return null;
}
