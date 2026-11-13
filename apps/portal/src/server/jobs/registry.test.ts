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

  it('names the eight jobs of contracts H.17', () => {
    expect(JOBS.map((j) => j.name).sort()).toEqual(
      ['document-purge', 'expiry', 'expiry-reminders', 'hubspot-outbox', 'hubspot-poll', 'hubspot-reconcile', 'retention', 'website-intake'],
    );
  });
});
