import { RootLayout } from '@payloadcms/next/layouts';
import config from '@payload-config';
import { importMap } from './admin/importMap.js';
import { serverFunction } from './server-function';

import '@payloadcms/next/css';
import './custom.scss';

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
