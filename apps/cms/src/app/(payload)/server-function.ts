'use server';

import type { ServerFunctionClient } from 'payload';
import { handleServerFunctions } from '@payloadcms/next/layouts';
import config from '@payload-config';

import { importMap } from './admin/importMap.js';

// Payload's admin server-function, isolated in its own top-of-file `'use server'`
// module. Keeping it here (rather than inline in layout.tsx) gives Turbopack dev
// a stable, separately-compiled server-action reference, avoiding the
// cold-compile "Functions cannot be passed directly to Client Components" 500
// that the inline form intermittently throws on a route's first request.
export const serverFunction: ServerFunctionClient = async (args) => {
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};
