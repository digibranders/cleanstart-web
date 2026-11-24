import cron from 'node-cron';
import { describe, expect, it } from 'vitest';
import { JOBS } from './index';

describe('job registry', () => {
  it('lists every job once, with a valid cron expression and a function to run', () => {
    expect(new Set(JOBS.map((j) => j.name)).size).toBe(JOBS.length);
    for (const job of JOBS) {
      expect(cron.validate(job.schedule), `${job.name}: ${job.schedule}`).toBe(true);
      expect(typeof job.run).toBe('function');
    }
  });

  it('keeps the two purge jobs at their contract times, daily, UTC', () => {
    const at = (name: string): string | undefined => JOBS.find((j) => j.name === name)?.schedule;
    expect(at('document-purge')).toBe('20 3 * * *');
    expect(at('retention')).toBe('40 3 * * *');
  });

  it('pins every schedule to contracts H.17 (cron, evaluated in UTC)', () => {
    expect(Object.fromEntries(JOBS.map((j) => [j.name, j.schedule]))).toEqual({
      'hubspot-outbox': '* * * * *',
      'hubspot-poll': '*/5 * * * *',
      'hubspot-reconcile': '30 2 * * *',
      expiry: '10 0 * * *',
      'expiry-reminders': '0 5 * * *',
      'invite-reminders': '30 5 * * *',
      'pending-digest': '30 4 * * *',
      'application-digest': '35 4 * * *',
      'chat-digest': '*/5 * * * *',
      'website-intake': '*/5 * * * *',
      'document-purge': '20 3 * * *',
      retention: '40 3 * * *',
    });
  });

  it('names the nine jobs of contracts H.17 plus the two digests, the chat digest and the invite reminder', () => {
    expect(JOBS.map((j) => j.name).sort()).toEqual(
      ['application-digest', 'chat-digest', 'document-purge', 'expiry', 'expiry-reminders', 'hubspot-outbox', 'hubspot-poll', 'hubspot-reconcile', 'invite-reminders', 'pending-digest', 'retention', 'website-intake'],
    );
  });
});
