'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { getPublicAppName } from '@/lib/site-config';

/**
 * Premium SplashScreen (marka adı site-config / env).
 * Restored to a clean, editorial-style loader (vistainsaat style).
 * Features:
 * 1. Minimalist layout with a simple brand loader.
 * 2. Theme-aware colors (Gold/Cream/Ink).
 * 3. Smooth exit transitions to prevent layout shifts.
 */
export function SplashScreen({
  companyName,
  tagline,
}: {
  companyName?: string;
  tagline?: string;
}) {
  const resolvedCompany = companyName ?? getPublicAppName();
  const [phase, setPhase] = useState<'loading' | 'exit' | 'done'>('loading');
  const [mounted, setMounted] = useState(false);

  const handleFinish = useCallback(() => {
    setPhase('exit');
    setTimeout(() => {
      setPhase('done');
      // Set session flag to skip splash on soft reloads
      try { sessionStorage.setItem('gm_splash_seen', 'true'); } catch(e) {}
    }, 800); // Exit animation duration
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Check if already seen
    try {
      if (sessionStorage.getItem('gm_splash_seen')) {
        setPhase('done');
        return;
      }
    } catch(e) {}

    const timer = setTimeout(handleFinish, 2400); // Loading duration
    return () => clearTimeout(timer);
  }, [handleFinish]);

  // Hide SSR overlay once mounted
  useEffect(() => {
    if (mounted) {
      const ssrEl = document.getElementById('gm-splash-ssr');
      if (ssrEl) {
        ssrEl.style.opacity = '0';
        setTimeout(() => { ssrEl.style.display = 'none'; }, 400);
      }
    }
  }, [mounted]);

  if (phase === 'done') return null;

  return (
    <div 
      className={`
        fixed inset-0 z-[99999] flex flex-col items-center justify-center
        transition-all duration-700 ease-in-out
        ${phase === 'exit' ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}
      `}
      style={{ 
        background: 'var(--gm-bg, #FAF6EF)',
        color: 'var(--gm-text, #2A2620)'
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* The Premium Loader Mark */}
        <div className="mb-12 flex justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-[var(--gm-gold)]" strokeWidth={1.15} aria-hidden />
        </div>

        {/* Brand Identity */}
        <div className="text-center space-y-3 px-6 animate-[fadeIn_1s_ease-out_forwards]">
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl tracking-[0.1em] font-display uppercase"
            style={{ 
              color: 'var(--gm-gold, #C9A961)',
              textShadow: '0 0 40px rgba(201, 169, 97, 0.15)'
            }}
          >
            {resolvedCompany}
          </h1>
          
          <div 
            className="h-px w-24 mx-auto" 
            style={{ background: 'linear-gradient(90deg, transparent, var(--gm-gold, #C9A961), transparent)' }} 
          />
          
          {tagline && (
            <p className="text-sm md:text-base font-serif italic tracking-widest opacity-60 uppercase">
              {tagline}
            </p>
          )}
        </div>
      </div>


      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .font-display { font-family: var(--font-display), Cinzel, serif; }
        .font-serif { font-family: var(--font-serif), Fraunces, serif; }
      `}</style>
    </div>
  );
}
