'use client';

import { useState, useEffect } from 'react';

/**
 * Detects whether the PWA is running in standalone mode
 * (i.e. launched from the home screen) vs. in a regular browser tab.
 *
 * Returns `null` during SSR / before hydration, then `true` or `false`.
 */
export function useIsStandalone(): boolean | null {
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null);

  useEffect(() => {
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    // iOS Safari uses a proprietary flag
    const iosStandalone = (navigator as any).standalone === true;

    setIsStandalone(standaloneQuery.matches || iosStandalone);

    const onChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches || iosStandalone);
    };

    standaloneQuery.addEventListener('change', onChange);
    return () => standaloneQuery.removeEventListener('change', onChange);
  }, []);

  return isStandalone;
}
