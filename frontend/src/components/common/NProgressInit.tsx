'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false, trickleSpeed: 120 });

function NProgressHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
    return () => {
      // Cleanup cleanup - maybe on unmount? 
      // Actually on pathname change, we want to start? 
      // Next.js App Router doesn't have "routeChangeStart".
      // We can only simulate "finish".
      // But typically, we want to show it *during* transition.
      // Since App Router transitions are server-side, it's hard to hook "start".
      // For now, let's just ensure we clean up.
      // Some solutions use a custom Link component or useTransition.
      // I'll leave it as "done" on mount/update to ensure it doesn't get stuck.
    };
  }, [pathname, searchParams]);

  return null;
}

export default function NProgressInit() {
    return (
        <Suspense fallback={null}>
            <NProgressHandler />
        </Suspense>
    );
}
