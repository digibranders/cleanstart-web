import type { ServerFunctionClient } from 'payload';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import config from '@payload-config';
import { importMap } from './admin/importMap.js';
import { fontVariables } from './fonts';

import '@payloadcms/next/css';
import './custom.scss';

// Brand fonts (Manrope/Sora/JetBrains Mono) are loaded via next/font in
// ./fonts.ts and applied to <html> through htmlProps below. They are kept in a
// separate module on purpose: co-locating next/font loaders with the
// `'use server'` serverFunction breaks the Turbopack dev server-action
// compile. See ./fonts.ts for details.

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
