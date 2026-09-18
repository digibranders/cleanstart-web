import { describe, expect, it } from 'vitest';

import { summarizeSync } from './sync-summary';

describe('summarizeSync', () => {
  it('returns null when nothing ran', () => {
    expect(summarizeSync(undefined)).toBeNull();
    expect(summarizeSync(null)).toBeNull();
    expect(summarizeSync([])).toBeNull();
  });

  it('counts skipped steps as done', () => {
    const summary = summarizeSync([
      { handler: 'db-primary', status: 'synced' },
      { handler: 'company-from-domain', status: 'skipped', error: 'free-mail-or-generic' },
      { handler: 'hubspot', status: 'synced' },
      { handler: 'confirmation-email', status: 'synced' },
    ]);
    expect(summary).toMatchObject({ state: 'ok', label: '4/4 synced', done: 4, total: 4 });
  });

  it('flags failures ahead of the done count', () => {
    const summary = summarizeSync([
      { handler: 'db-primary', status: 'synced' },
      { handler: 'hubspot', status: 'failed', error: 'HTTP 500' },
      { handler: 'confirmation-email', status: 'failed' },
    ]);
    expect(summary).toMatchObject({ state: 'failed', label: '2 failed · 1/3 synced' });
  });

  it('reports pending steps when nothing failed', () => {
    const summary = summarizeSync([
      { handler: 'db-primary', status: 'synced' },
      { handler: 'hubspot', status: 'pending' },
    ]);
    expect(summary).toMatchObject({ state: 'pending', label: '1/2 synced · 1 pending' });
  });

  it('lists every step with its error in the detail text', () => {
    const summary = summarizeSync([
      { handler: 'db-primary', status: 'synced' },
      { handler: 'hubspot', status: 'failed', error: 'HTTP 500' },
    ]);
    expect(summary?.detail).toBe('db-primary: synced\nhubspot: failed (HTTP 500)');
  });

  it('treats an unknown status as pending rather than done', () => {
    const summary = summarizeSync([{ handler: 'hubspot', status: 'queued' }]);
    expect(summary).toMatchObject({ state: 'pending', label: '0/1 synced · 1 pending' });
  });
});
