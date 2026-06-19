import type { Metadata } from 'next';
import { RootLayout } from '@payloadcms/next/layouts';
import config from '@payload-config';
import { importMap } from './admin/importMap.js';
import { serverFunction } from './server-function';

import '@payloadcms/next/css';
import './custom.scss';

// Prevent every /admin/** page from being indexed — the admin UI is
// authentication-gated and has no public-facing content. The
// X-Robots-Tag HTTP header in next.config.ts is belt-and-suspenders.
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

type Args = {
  children: React.ReactNode;
};

export default function Layout({ children }: Args) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
