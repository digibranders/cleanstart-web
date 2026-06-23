'use client';

import Link from 'next/link';
import type { ReactElement } from 'react';

export function AnalyticsNavLink(): ReactElement {
  return (
    <Link href="/admin/analytics" className="cs-nav-analytics-link">
      Analytics
    </Link>
  );
}

export default AnalyticsNavLink;
