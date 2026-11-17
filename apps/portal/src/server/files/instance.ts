import { createHmac } from 'node:crypto';
import { pool } from '@/db/client';
import { env } from '@/env';
import { isDemoMode } from '@/server/demo';
import { NotFoundError } from '@/server/errors';
import { DemoFileStorage } from './demo';
import { createDatabaseDemoStore } from './demo-store';
import { createFileStorage } from './r2';
import type { FileStorage } from './storage';

let cached: FileStorage | null = null;
let demo: DemoFileStorage | null = null;

/** The demo storage, for the /api/demo-files routes. Outside demo mode those routes do not exist (404). */
export function getDemoFileStorage(): DemoFileStorage {
  if (!isDemoMode()) throw new NotFoundError('demo file');
  // A separate key from the session secret: a file token can never be a session token. Relative URLs: the demo works on any host name.
  demo ??= new DemoFileStorage({ secret: createHmac('sha256', env.AUTH_SECRET).update('demo-files').digest('hex'), baseUrl: '', store: createDatabaseDemoStore(pool) });
  return demo;
}

/** The process wide file storage: R2, or the generated placeholders in demo mode. Throws IntegrationError('r2') when R2_* is unset, which actions and routes turn into a safe message. */
export function getFileStorage(): FileStorage {
  cached ??= isDemoMode() ? getDemoFileStorage() : createFileStorage();
  return cached;
}
