import type { ServerFunctionClient } from 'payload';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import config from '@payload-config';
import { importMap } from './admin/importMap.js';

import '@payloadcms/next/css';
import './custom.scss';

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
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
