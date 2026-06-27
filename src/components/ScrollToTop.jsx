'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Resets scroll to the top on every route change. Next's App Router does not
 * reliably scroll to top when navigating between two pages on the same dynamic
 * route (e.g. /product/[slug] -> /product/[slug] from related products), which
 * left new pages opening mid-scroll.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
