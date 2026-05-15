'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const HOME_SECTIONS = [
  'about', 'how-it-works', 'testimonials', 'trust', 'privacy', 
  'hakkimizda', 'nasil-calisir', 'referanslar', 'gizlilik',
  'promises', 'hybrid_model', 'transparency'
];

export default function ScrollAnchorFixer() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.substring(1);
      if (hash && HOME_SECTIONS.includes(hash)) {
        // Remove the hash and redirect to the clean URL
        // e.g. /tr/referanslar#about -> /tr/about
        const langPrefix = pathname.split('/')[1] || 'tr';
        const newPath = `/${langPrefix}/${hash}`;
        
        // Use replaceState first to clean the URL bar immediately
        window.history.replaceState({}, '', newPath);
        
        // Then trigger router to handle the navigation if needed
        // (though replaceState + rewrite + HomeLayoutRenderer should already work)
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [pathname, router]);

  return null;
}
