import { readFileSync } from 'node:fs';
import type { CollectionConfig } from 'payload';
import { describe, expect, it } from 'vitest';

import { jobsCollectionOverrides, jobsEndpointAccess } from './jobs';

// Hotfix: any signed-in user could POST /api/payload-jobs with taskSlug schedulePublish and no `user`, which Payload's
// task handler runs with overrideAccess (it passes `overrideAccess: user === null`), then call GET /api/payload-jobs/run
// to execute it. That published or unpublished any document and bypassed the author rules (D-6). Payload answers a false
// access result with 403, so these tests assert false for every role but admin.
const user = (roles: string[]): { id: number; collection: 'users'; roles: string[] } => ({ id: 7, collection: 'users', roles });
const author = user(['author']);
const editor = user(['editor']);
const admin = user(['admin']);
const seo = user(['seo']);

type AccessFn = (args: { req: { user: unknown } }) => unknown;
const run = (fn: unknown, who: unknown): unknown => (fn as AccessFn)({ req: { user: who } });

describe('payload-jobs collection access', () => {
  const stockRead = () => true;
  const overridden = jobsCollectionOverrides({
    defaultJobsCollection: { slug: 'payload-jobs', fields: [], access: { read: stockRead, create: stockRead, update: stockRead, delete: stockRead } } as CollectionConfig,
  });
  const access = overridden.access as Record<string, unknown>;

  for (const operation of ['create', 'update', 'delete']) {
    it(`${operation} answers false (403) for an author, an editor, another staff role and a signed-out request`, () => {
      for (const who of [author, editor, seo, null]) expect(run(access[operation], who)).toBe(false);
    });

    it(`${operation} answers true for an admin`, () => {
      expect(run(access[operation], admin)).toBe(true);
    });
  }

  it('leaves read exactly as Payload set it, so the scheduling dialog can still list upcoming jobs', () => {
    expect(access.read).toBe(stockRead);
  });

  it('keeps the rest of the collection config', () => {
    expect(overridden.slug).toBe('payload-jobs');
  });
});

describe('jobs endpoint access (run, queue and cancel)', () => {
  it('refuses an author, an editor, another staff role and a signed-out request', () => {
    for (const who of [author, editor, seo, null, undefined]) expect(jobsEndpointAccess({ req: { user: who } })).toBe(false);
  });

  it('allows an admin', () => {
    expect(jobsEndpointAccess({ req: { user: admin } })).toBe(true);
  });

  it('refuses a user whose roles are missing', () => {
    expect(jobsEndpointAccess({ req: { user: { id: 1, collection: 'users' } } })).toBe(false);
  });
});

describe('payload.config.ts wiring', () => {
  // The whole config cannot be loaded under vitest, so the wiring is guarded as text: the jobs block must use all of it.
  const config = readFileSync(new URL('../../payload.config.ts', import.meta.url), 'utf8');
  const jobsBlock = config.slice(config.indexOf('  jobs: {'), config.indexOf('  plugins: storagePlugins'));

  it.each(['run', 'queue', 'cancel'])('sets jobs.access.%s to the admin-only function', (name) => {
    expect(jobsBlock).toMatch(new RegExp(`${name}: jobsEndpointAccess`));
  });

  it('sets the payload-jobs collection overrides', () => {
    expect(jobsBlock).toContain('jobsCollectionOverrides,');
  });
});
