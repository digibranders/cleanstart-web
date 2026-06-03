'use server';

import type { ServerFunctionClient } from 'payload';
import { handleServerFunctions } from '@payloadcms/next/layouts';

// Payload's admin server-function, isolated in its own top-of-file `'use server'`
// module so Turbopack dev gets a stable, separately-compiled server-action
// reference. `config` and `importMap` are imported lazily inside the action
// rather than at module scope: hoisting them keeps the heavy Payload config out
// of the server-action's serialized closure, which is what tripped the
// cold-compile "Functions cannot be passed directly to Client Components" 500.
export const serverFunction: ServerFunctionClient = async (args) => {
  const { default: config } = await import('@payload-config');
  const { importMap } = await import('./admin/importMap.js');

  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};
