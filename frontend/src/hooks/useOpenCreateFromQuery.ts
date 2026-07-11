'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * URL'de `?new=1` varsa sayfa açılışında create modalını bir kez açar.
 * Topbar "Hızlı Ekle" menüsü ilgili sayfaya `?new=1` ile yönlendirir; sayfa da
 * bu hook ile ekleme formunu otomatik açar. Böylece tek tıkla manuel ekleme.
 */
export function useOpenCreateFromQuery(open: () => void) {
  const params = useSearchParams();
  const fired = React.useRef(false);
  React.useEffect(() => {
    if (fired.current) return;
    if (params?.get('new') === '1') {
      fired.current = true;
      open();
    }
  }, [params, open]);
}
