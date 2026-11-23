import { describe, expect, it } from 'vitest';
import { REVIEW_TARGET_TEXT, statusSteps } from './application-status';

const states = (steps: ReturnType<typeof statusSteps>): string[] => steps.map((s) => `${s.key}:${s.state}`);
const base = { accountActive: false, declineReason: null };

describe('statusSteps', () => {
  it('highlights Under review for a new application, with the review target', () => {
    const steps = statusSteps({ ...base, status: 'new' });
    expect(states(steps)).toEqual(['received:done', 'review:now', 'decision:next', 'invite:next', 'active:next']);
    expect(steps[1]?.text).toContain(REVIEW_TARGET_TEXT);
    expect(REVIEW_TARGET_TEXT).toBe('Expect a decision within 2 business days.');
  });

  it('keeps Under review current and says so when the team asked a question', () => {
    const steps = statusSteps({ ...base, status: 'info_requested' });
    expect(states(steps)[1]).toBe('review:now');
    expect(steps[1]?.text).toContain('asked you a question');
  });

  it('highlights Account active after approval until the account exists', () => {
    expect(states(statusSteps({ ...base, status: 'approved' }))).toEqual(['received:done', 'review:done', 'decision:done', 'invite:done', 'active:now']);
    expect(states(statusSteps({ ...base, status: 'approved', accountActive: true }))).toEqual(['received:done', 'review:done', 'decision:done', 'invite:done', 'active:done']);
  });

  it('stops at Decision for a declined application and shows the typed reason', () => {
    const steps = statusSteps({ ...base, status: 'declined', declineReason: 'We have a partner in your region.' });
    expect(states(steps)).toEqual(['received:done', 'review:done', 'decision:stopped']);
    expect(steps[2]?.text).toContain('We have a partner in your region.');
  });
});
