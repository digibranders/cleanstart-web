import type { ServerFunctionClient } from 'payload';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import { JetBrains_Mono, Manrope, Sora } from 'next/font/google';
import config from '@payload-config';
import { importMap } from './admin/importMap.js';

import '@payloadcms/next/css';
import './custom.scss';

// CleanStart brand fonts, self-hosted via next/font so they load under the
// admin CSP (`font-src 'self'`). Matches the marketing site (apps/web):
// Manrope = display/headings, Sora = body/UI, JetBrains Mono = code. The
// previous remote Google Fonts @import was CSP-blocked and never rendered.
// Weights mirror apps/web's next/font config; the exposed CSS variables are
// consumed by the --font-* token stacks in styles/_tokens.scss.
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jbmono',
  display: 'swap',
});

const fontVariables = `${manrope.variable} ${sora.variable} ${jetbrainsMono.variable}`;

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async (args) => {
  'use server';
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout
    config={config}
    importMap={importMap}
    serverFunction={serverFunction}
    htmlProps={{ className: fontVariables }}
  >
    {children}
  </RootLayout>
);

export default Layout;
