// src/layout/ScrollProgress.tsx
"use client";

import { useEffect, useState } from "react";
import { IconChevronUp } from "@/components/ui/icons";

const CIRCUMFERENCE = 308.66; // 2πr (r≈49)

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const calc = () => {
      const total = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const p = (window.scrollY / total) * 100;
      setProgress(Math.max(0, Math.min(100, p)));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(calc);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    calc(); // initial

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const onClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const dashOffset = CIRCUMFERENCE - (progress * CIRCUMFERENCE) / 100;

  return (
    <button
      className={`fixed right-5 bottom-5 z-50 grid place-items-center w-11 h-11 bg-sand-900 border border-gold-400/20 shadow-gold rounded-full transition-all duration-300 hover:scale-110 hover:border-gold-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 ${
        progress > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
      onClick={onClick}
      aria-label="Back to top"
      title="Back to top"
      type="button"
    >
      {/* Dairesel ilerleme */}
      <svg
        className="absolute inset-0 text-brand-primary"
        width="100%"
        height="100%"
        viewBox="-1 -1 102 102"
        aria-hidden="true"
      >
        <path
          d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          style={{
            strokeDasharray: `${CIRCUMFERENCE}px`,
            strokeDashoffset: `${dashOffset}px`,
            transition: "stroke-dashoffset 80ms linear",
          }}
        />
      </svg>

      {/* React Icons — Font Awesome yerine */}
      <span className="relative text-brand-primary hover:text-brand-hover transition-colors" aria-hidden="true">
        <IconChevronUp size={20} />
      </span>
    </button>
  );
}

export default ScrollProgress;
