import cron from 'node-cron';
import { describe, expect, it } from 'vitest';
import { JOBS } from './index';

describe('JOBS', () => {
  it('lists the nine jobs of the registry with unique names', () => {
    expect(JOBS.map((job) => job.name)).toEqual([
      'hubspot-outbox', 'hubspot-poll', 'hubspot-reconcile', 'expiry', 'expiry-reminders', 'pending-digest', 'website-intake', 'document-purge', 'retention',
    ]);
    expect(new Set(JOBS.map((job) => job.name)).size).toBe(JOBS.length);
  });

  it('uses valid cron expressions and a callable run for every job', () => {
    for (const job of JOBS) {
      expect(cron.validate(job.schedule), job.name).toBe(true);
      expect(typeof job.run, job.name).toBe('function');
    }
  });
});
